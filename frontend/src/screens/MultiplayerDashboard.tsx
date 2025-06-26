import { UserButton } from "@clerk/clerk-react";
import { Button } from "../components/Button";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSocketContext } from "../context/SocketProvider";

// Message Types
const CREATE_GAME = "create_game";
const JOIN_GAME = "join_game";
const GAME_CREATED = "game_created";
const INIT_GAME = "init_game";

export const MultiplayerDashboard = () => {
    const { latestMessage, sendMessage } = useSocketContext();
    const navigate = useNavigate();
    const [gameIdToJoin, setGameIdToJoin] = useState("");

    useEffect(() => {
        // This effect runs whenever a new message is received from the WebSocket.
        if (latestMessage) {
            console.log("Dashboard: Processing message", latestMessage);
            
            switch (latestMessage.type) {
                case GAME_CREATED:
                    // The backend has created a game for us. Navigate to the game page.
                    const gameId = latestMessage.payload.gameId;
                    console.log(`Dashboard: Game created with ID: ${gameId}. Navigating to game.`);
                    navigate(`/game/${gameId}`);
                    break;
                case INIT_GAME:
                    // This happens if we join a game that is already waiting.
                    // The backend sends INIT_GAME to both players.
                    const joinedGameId = latestMessage.payload.gameId;
                    console.log(`Dashboard: Joined game with ID: ${joinedGameId}. Navigating to game.`);
                    navigate(`/game/${joinedGameId}`);
                    break;
                case 'error':
                    // The backend sent an error (e.g., game not found).
                    console.error("Dashboard: Received error from backend:", latestMessage.payload.message);
                    alert(`Error: ${latestMessage.payload.message}`);
                    break;
            }
        }
    }, [latestMessage, navigate]);

    const handleCreateGame = () => {
        console.log("Dashboard: Sending CREATE_GAME message.");
        sendMessage(JSON.stringify({ type: CREATE_GAME }));
    };

    const handleJoinGame = () => {
        if (gameIdToJoin) {
            console.log(`Dashboard: Sending JOIN_GAME message with ID: ${gameIdToJoin}`);
            sendMessage(JSON.stringify({ type: JOIN_GAME, payload: { gameId: gameIdToJoin } }));
        } else {
            console.error("Dashboard: Cannot join game, game ID is empty.");
        }
    };

    return (
        <div>
            <div className="flex justify-end p-4">
                <UserButton />
            </div>
            <div className="flex justify-center pt-8">
                <div className="flex flex-col">
                    <h1 className="text-4xl font-bold text-white text-center mb-8">Multiplayer Dashboard</h1>
                    <div className="flex justify-center">
                        <Button onClick={handleCreateGame}>Create Game</Button>
                    </div>
                    <div className="mt-4">
                        <div className="flex justify-center">
                            <input 
                                type="text" 
                                placeholder="Enter Game ID" 
                                className="bg-slate-800 text-white p-2 rounded-md focus:outline-none"
                                value={gameIdToJoin}
                                onChange={(e) => setGameIdToJoin(e.target.value)}
                            />
                            <Button onClick={handleJoinGame} className="ml-2">Join Game</Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}; 