/**
 * Represents the state of a single chess game stored in the database.
 * This object is serialized to JSON and stored in Vercel KV.
 */
export interface GameState {
    /** A unique identifier for the game. */
    gameId: string;

    /**
     * The unique identifier for player 1 (white).
     * NOTE: In a production app, this should be a persistent user ID from your auth provider (e.g., Clerk User ID).
     * For now, we will use a temporary ID assigned to the WebSocket connection.
     */
    player1Id: string;

    /**
     * The unique identifier for player 2 (black). Null if waiting for an opponent.
     * NOTE: See player1Id note.
     */
    player2Id: string | null;

    /**
     * The Forsyth-Edwards Notation (FEN) string representing the current state of the chessboard.
     * This is the single source of truth for the board position.
     */
    fen: string;

    /** A log of all moves made in the game, for history and replay. */
    moves: string[];

    /** The current status of the game. */
    status: 'waiting' | 'inprogress' | 'complete';

    /** The winner of the game, if it is complete. */
    winner: 'white' | 'black' | 'draw' | null;

    /** The timestamp when the game was created. */
    createdAt: number;
} 