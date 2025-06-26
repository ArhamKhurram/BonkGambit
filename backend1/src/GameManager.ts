import { WebSocket } from "ws";
import { kv } from '@vercel/kv';
import { Chess } from "chess.js";
import { CREATE_GAME, INIT_GAME, JOIN_GAME, MOVE, GAME_OVER } from "./messages";
import { GameState } from "./types";

/**
 * Manages game state and player connections in a stateless way using Vercel KV.
 * This class does not hold any game state in memory. Instead, it fetches
 * and persists the state for each action.
 */
export class GameManager {
    // Maps a temporary, connection-specific playerId to a live WebSocket connection.
    // This is necessary to send messages to the correct players.
    private sockets: Map<string, WebSocket>;

    // Maps a live WebSocket connection to its temporary playerId.
    // This is used for quick lookups on disconnect.
    private players: Map<WebSocket, string>;

    constructor() {
        this.sockets = new Map<string, WebSocket>();
        this.players = new Map<WebSocket, string>();
        console.log("GameManager initialized in stateless mode.");
    }

    /**
     * Registers a new user connection.
     * A temporary playerId is created for the duration of the WebSocket connection.
     * @param socket - The WebSocket connection for the new user.
     */
    addUser(socket: WebSocket) {
        const playerId = this.generatePlayerId();
        this.sockets.set(playerId, socket);
        this.players.set(socket, playerId);
        this.addHandler(socket, playerId);
        console.log(`User connected with temporary playerId: ${playerId}. Total connections: ${this.sockets.size}`);
    }

    /**
     * Unregisters a user connection.
     * @param socket - The WebSocket connection of the user to remove.
     */
    removeUser(socket: WebSocket) {
        const playerId = this.players.get(socket);
        if (playerId) {
            this.players.delete(socket);
            this.sockets.delete(playerId);
            console.log(`User disconnected with playerId: ${playerId}. Total connections: ${this.sockets.size}`);
        }
        // NOTE: Game cleanup on disconnect is not handled here.
        // A robust implementation would involve a timeout or a "reconnect" feature.
        // For now, if a player disconnects, the game state remains in KV but the player can't rejoin.
    }

    /**
     * Sets up the message handler for a given user's WebSocket connection.
     * All game logic is orchestrated from here, interacting with the KV store.
     * @param socket - The WebSocket connection to handle messages for.
     * @param playerId - The temporary ID assigned to this connection.
     */
    private addHandler(socket: WebSocket, playerId: string) {
        socket.on("message", async (data) => {
            const message = JSON.parse(data.toString());
            console.log(`[Player ${playerId}] Received message of type ${message.type}`);

            switch (message.type) {
                case CREATE_GAME:
                    await this.handleCreateGame(playerId);
                    break;
                
                case JOIN_GAME:
                    await this.handleJoinGame(playerId, message.payload.gameId);
                    break;

                case MOVE:
                    await this.handleMove(playerId, message.payload.gameId, message.payload.move);
                    break;

                default:
                    console.warn(`[Player ${playerId}] Unknown message type received: ${message.type}`);
            }
        });
    }

    /**
     * Handles a user's request to create a new game.
     * It creates a new game state and saves it to Vercel KV.
     */
    private async handleCreateGame(playerId: string) {
        const gameId = this.generateGameId();
        const initialBoard = new Chess();

        const newGame: GameState = {
            gameId,
            player1Id: playerId,
            player2Id: null,
            fen: initialBoard.fen(),
            moves: [],
            status: 'waiting',
            winner: null,
            createdAt: Date.now()
        };

        await kv.set(`game:${gameId}`, newGame);
        console.log(`[Game ${gameId}] Created by Player ${playerId}. State saved to KV.`);

        const socket = this.sockets.get(playerId);
        socket?.send(JSON.stringify({ type: 'game_created', payload: { gameId } }));
    }

    /**
     * Handles a user's request to join an existing game.
     * It fetches the game state, adds the player, and starts the game.
     */
    private async handleJoinGame(playerId: string, gameId: string) {
        const game = await kv.get<GameState>(`game:${gameId}`);

        if (!game) {
            console.error(`[Player ${playerId}] Attempted to join non-existent game: ${gameId}`);
            this.sockets.get(playerId)?.send(JSON.stringify({ type: 'error', payload: { message: 'Game not found.' } }));
            return;
        }

        if (game.player2Id || game.status !== 'waiting') {
            console.error(`[Player ${playerId}] Attempted to join a full or finished game: ${gameId}`);
            this.sockets.get(playerId)?.send(JSON.stringify({ type: 'error', payload: { message: 'Game is not available to join.' } }));
            return;
        }

        // Update game state
        game.player2Id = playerId;
        game.status = 'inprogress';
        await kv.set(`game:${gameId}`, game);
        console.log(`[Game ${gameId}] Player ${playerId} joined. State updated in KV.`);

        // Notify both players to start the game
        const player1Socket = this.sockets.get(game.player1Id);
        const player2Socket = this.sockets.get(game.player2Id);

        player1Socket?.send(JSON.stringify({ type: INIT_GAME, payload: { color: "white", gameId } }));
        player2Socket?.send(JSON.stringify({ type: INIT_GAME, payload: { color: "black", gameId } }));
    }

    /**
     * Handles a move made by a player.
     * It validates the move, updates the game state, and notifies the opponent.
     */
    private async handleMove(playerId: string, gameId: string, move: { from: string, to: string }) {
        const game = await kv.get<GameState>(`game:${gameId}`);

        if (!game) {
            console.error(`[Player ${playerId}] Sent move for non-existent game: ${gameId}`);
            return;
        }

        // 1. Validate game status
        if (game.status !== 'inprogress' || !game.player2Id) {
            console.error(`[Game ${gameId}] Move received but game is not in progress.`);
            return;
        }

        // 2. Determine whose turn it is
        const board = new Chess(game.fen);
        const turn = board.turn() === 'w' ? game.player1Id : game.player2Id;
        if (playerId !== turn) {
            console.error(`[Game ${gameId}] Player ${playerId} moved out of turn.`);
            return;
        }

        // 3. Attempt the move
        const moveResult = board.move(move);
        if (!moveResult) {
            console.error(`[Game ${gameId}] Invalid move: ${JSON.stringify(move)} by Player ${playerId}`);
            return;
        }

        // 4. Update game state
        game.fen = board.fen();
        game.moves.push(moveResult.san); // Store Standard Algebraic Notation
        
        // 5. Check for game over
        if (board.isGameOver()) {
            game.status = 'complete';
            if (board.isCheckmate()) {
                game.winner = board.turn() === 'w' ? 'black' : 'white';
            } else {
                game.winner = 'draw';
            }
            console.log(`[Game ${gameId}] Game over. Winner: ${game.winner}`);
        }

        // 6. Persist the new state
        await kv.set(`game:${gameId}`, game);

        // 7. Notify players
        const player1Socket = this.sockets.get(game.player1Id);
        const player2Socket = this.sockets.get(game.player2Id);
        const opponentSocket = playerId === game.player1Id ? player2Socket : player1Socket;

        if (game.status === 'complete') {
            const gameOverPayload = { winner: game.winner };
            player1Socket?.send(JSON.stringify({ type: GAME_OVER, payload: gameOverPayload }));
            player2Socket?.send(JSON.stringify({ type: GAME_OVER, payload: gameOverPayload }));
        } else {
            // Forward the valid move to the opponent
            opponentSocket?.send(JSON.stringify({ type: MOVE, payload: move }));
        }
    }

    /** Generates a random 6-character string for a unique game ID. */
    private generateGameId() {
        return Math.random().toString(36).substring(2, 8).toUpperCase();
    }

    /** Generates a random 8-character string for a temporary player ID. */
    private generatePlayerId() {
        return Math.random().toString(36).substring(2, 10);
    }
}