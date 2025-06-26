import { Square, PieceSymbol } from "chess.js";
import { useState } from "react";

// Mapping from chess.js piece type ('p', 'n', etc.) to the full name used in image files.
const pieceImageNames: { [key in PieceSymbol]: string } = {
    p: 'pawn',
    r: 'rook',
    n: 'knight',
    b: 'bishop',
    q: 'queen',
    k: 'king'
};

// The props for the ChessBoard component.
interface ChessBoardProps {
    board: ({
        square: Square;
        type: PieceSymbol;
        color: 'b' | 'w';
    } | null)[][];
    myColor: 'w' | 'b';
    onMove: (move: { from: Square, to: Square }) => void;
}

export const ChessBoard = ({ board, myColor, onMove }: ChessBoardProps) => {
    const [from, setFrom] = useState<Square | null>(null);

    // Flips the board if the player is black.
    const finalBoard = myColor === 'b' ? [...board].reverse().map(row => [...row].reverse()) : board;

    // Helper to get the piece at a given square
    const getPieceAt = (square: Square) => {
        for (let i = 0; i < board.length; i++) {
            for (let j = 0; j < board[i].length; j++) {
                if (board[i][j] && board[i][j]!.square === square) {
                    return board[i][j];
                }
            }
        }
        return null;
    };

    const handleSquareClick = (square: Square) => {
        const piece = getPieceAt(square);
        if (!from) {
            // First click: only allow selecting your own piece
            if (piece && piece.color === myColor) {
                setFrom(square);
                console.log(`ChessBoard: Selected starting square: ${square}`);
            } else {
                // Not your piece or empty square: do nothing
                return;
            }
        } else {
            if (from === square) {
                // Clicking the same square again: deselect
                setFrom(null);
                console.log(`ChessBoard: Deselected square: ${square}`);
                return;
            }
            // If clicking another of your own pieces: switch selection
            if (piece && piece.color === myColor) {
                setFrom(square);
                console.log(`ChessBoard: Switched selection to: ${square}`);
                return;
            }
            // Otherwise, attempt to make a move
            console.log(`ChessBoard: Selected destination square: ${square}. Attempting move from ${from} to ${square}.`);
            onMove({ from, to: square });
            setFrom(null); // Always reset selection after attempting a move
        }
    };

    return (
        <div className="text-white-200">
            {finalBoard.map((row, i) => (
                <div key={i} className="flex">
                    {row.map((square, j) => {
                        const squareId = String.fromCharCode(97 + j) + (8 - i) as Square;
                        // Flip coordinates for black
                        const finalSquareId = myColor === 'b' ? String.fromCharCode(97 + (7 - j)) + (i + 1) as Square : squareId;

                        return (
                            <div
                                key={j}
                                onClick={() => handleSquareClick(finalSquareId)}
                                className={`w-16 h-16 md:w-20 md:h-20 flex justify-center items-center ${
                                    (i + j) % 2 === 0 ? 'bg-green-600' : 'bg-green-200'
                                } ${from === finalSquareId ? 'border-4 border-yellow-500' : ''}`}
                            >
                                {square && (
                                    <img
                                        className="w-12 h-12 md:w-16 md:h-16"
                                        src={`/${square.color === 'b' ? 'black' : 'white'}_${pieceImageNames[square.type]}.svg`}
                                        alt={`${square.color} ${square.type}`}
                                    />
                                )}
                            </div>
                        );
                    })}
                </div>
            ))}
        </div>
    );
};