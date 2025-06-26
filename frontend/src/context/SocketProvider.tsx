import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { ClerkProvider } from '@clerk/clerk-react';

const WS_URL = "wss://bonk-gambit-backend-production.up.railway.app";

/**
 * Defines the shape of the data provided by the SocketContext.
 * @property socket - The WebSocket instance.
 * @property latestMessage - The most recent message received from the socket.
 * @property sendMessage - A function to send a message through the socket.
 */
interface SocketContextType {
    socket: WebSocket | null;
    latestMessage: any | null;
    sendMessage: (message: string) => void;
}

// Create the context with a null default value.
const SocketContext = createContext<SocketContextType | null>(null);

/**
 * Custom hook to easily access the SocketContext.
 * Throws an error if used outside of a SocketProvider.
 */
export const useSocketContext = () => {
    const context = useContext(SocketContext);
    if (!context) {
        throw new Error('useSocketContext must be used within a SocketProvider');
    }
    return context;
};

/**
 * The provider component that manages the WebSocket connection and state.
 * It establishes a single connection and makes the socket instance, the latest message,
 * and a sendMessage function available to all descendant components.
 * @param {object} props - The component props.
 * @param {ReactNode} props.children - The child components to render.
 */
export const SocketProvider = ({ children }: { children: ReactNode }) => {
    const [socket, setSocket] = useState<WebSocket | null>(null);
    const [latestMessage, setLatestMessage] = useState<any | null>(null);

    useEffect(() => {
        console.log("SocketProvider: Establishing WebSocket connection.");
        const ws = new WebSocket(WS_URL);

        ws.onopen = () => {
            console.log("SocketProvider: WebSocket connection established.");
            setSocket(ws);
        };

        ws.onmessage = (event) => {
            const message = JSON.parse(event.data);
            console.log("SocketProvider: Received message:", message);
            setLatestMessage(message); // Update state with the latest message
        };

        ws.onclose = () => {
            console.log("SocketProvider: WebSocket connection closed.");
            setSocket(null);
        };

        ws.onerror = (error) => {
            console.error("SocketProvider: WebSocket error:", error);
        };

        // Cleanup function to close the socket when the provider unmounts
        return () => {
            console.log("SocketProvider: Closing WebSocket connection.");
            ws.close();
        };
    }, []); // The empty dependency array ensures this effect runs only once.

    /**
     * Sends a message through the WebSocket if the connection is open.
     * @param {string} message - The message to send.
     */
    const sendMessage = (message: string) => {
        if (socket && socket.readyState === WebSocket.OPEN) {
            console.log("SocketProvider: Sending message:", message);
            socket.send(message);
        } else {
            console.error("SocketProvider: Cannot send message, socket is not open.");
        }
    };
    
    const value = {
        socket,
        latestMessage,
        sendMessage
    };

    return (
        <SocketContext.Provider value={value}>
            {children}
        </SocketContext.Provider>
    );
}; 