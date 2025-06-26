import { useEffect, useState } from "react";
import { Chess, Square } from 'chess.js';
import { ChessBoard } from "../components/ChessBoard";
import { useSocketContext } from "../context/SocketProvider";
import { useParams } from "react-router-dom";

// Message Types
export const INIT_GAME = "init_game";
export const MOVE = "move";
export const GAME_OVER = "game_over";

export function Game() {
    const { gameId } = useParams();
    const { latestMessage, sendMessage } = useSocketContext();
    const [chess, setChess] = useState(new Chess());
    const [board, setBoard] = useState(chess.board());
    const [status, setStatus] = useState("Waiting for opponent...");
    const [playerColor, setPlayerColor] = useState<'w' | 'b' | null>(null);

    useEffect(() => {
        // This effect runs whenever a new message is received from the WebSocket.
        if (latestMessage) {
            console.log(`Game (${gameId}): Processing message`, latestMessage);

            switch (latestMessage.type) {
                case INIT_GAME:
                    // This is the signal that the game should start.
                    // It's sent to both players when the second player joins.
                    const newChessInstance = new Chess();
                    setChess(newChessInstance);
                    setBoard(newChessInstance.board());
                    setPlayerColor(latestMessage.payload.color === "white" ? 'w' : 'b');
                    setStatus(`Game started. You are ${latestMessage.payload.color}.`);
                    console.log(`Game (${gameId}): Initialized. Player color: ${latestMessage.payload.color}`);
                    break;
                case MOVE:
                    // The other player made a move.
                    const { from, to } = latestMessage.payload;
                    console.log(`Game (${gameId}): Received move from opponent:`, { from, to });
                    setChess(prevChess => {
                        const newChess = new Chess(prevChess.fen());
                        newChess.move({ from, to });
                        return newChess;
                    });
                    break;
                case GAME_OVER:
                    // The game has ended.
                    console.log(`Game (${gameId}): Game over.`);
                    setStatus(`Game Over: ${latestMessage.payload.winner} wins!`);
                    break;
                default:
                    console.warn(`Game (${gameId}): Received unhandled message type: ${latestMessage.type}`);
            }
        }
    }, [latestMessage, gameId]);

    // This effect updates the visual board state whenever the chess logic state changes.
    useEffect(() => {
        setBoard(chess.board());
    }, [chess]);

    const handleMove = (move: { from: Square, to: Square }) => {
        console.log(`Game (${gameId}): Attempting to make a move:`, move);
        // Check if it is the player's turn
        if (chess.turn() !== playerColor) {
            console.warn(`Game (${gameId}): Not your turn to move. It's ${chess.turn()}'s turn.`);
            return;
        }

        // Try to make the move
        const result = chess.move(move);
        if (result) {
            // Move was valid, send it to the backend.
            setBoard(chess.board());
            console.log(`Game (${gameId}): Move successful. Sending to backend.`);
            sendMessage(JSON.stringify({
                type: MOVE,
                payload: {
                    gameId: gameId,
                    move: result
                }
            }));
        } else {
            console.error(`Game (${gameId}): Invalid move attempted:`, move);
        }
    };
    
    return (
        <div className="flex justify-center w-full min-h-screen bg-slate-900">
            <div className="pt-8 max-w-screen-lg w-full flex flex-col md:flex-row items-center md:items-start gap-8">
                {/* Chessboard Area */}
                <div className="flex justify-center items-center w-full md:w-auto">
                    <div className="aspect-square w-[90vw] max-w-[min(90vw,80vh)] min-w-[320px] bg-slate-800 rounded-lg flex items-center justify-center">
                        <ChessBoard 
                            board={board} 
                            onMove={handleMove} 
                            myColor={playerColor || 'w'} // Default to 'w' to avoid errors, but it will be updated
                        />
                    </div>
                </div>
                {/* Game Info Panel */}
                <div className="bg-slate-800 p-6 rounded-lg text-white w-full md:w-80 max-w-full overflow-auto">
                    <h2 className="text-2xl font-bold mb-4">Game Info</h2>
                    <p className="mb-2"><span className="font-semibold">Status:</span> {status}</p>
                    <p className="mb-2"><span className="font-semibold">Your Color:</span> {playerColor === 'w' ? 'White' : playerColor === 'b' ? 'Black' : 'N/A'}</p>
                    <hr className="my-4 border-slate-600"/>
                    <p className="font-semibold">Game ID:</p>
                    <p className="text-lg font-mono bg-slate-900 px-2 py-1 rounded break-all">{gameId}</p>
                    <p className="text-sm text-slate-400 mt-2">(Share this ID with a friend to play)</p>
                </div>
            </div>
        </div>
    );
}