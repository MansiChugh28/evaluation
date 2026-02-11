import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useStore } from 'react-redux';
import websocketService from '../services/websocketService';
import { connectionConnecting } from '../features/websocket/websocketSlice';


export default function WebSocketProvider({ children }) {
    const dispatch = useDispatch();
    const store = useStore();
    const { user, token } = useSelector((state) => state.auth);
    const { isConnected } = useSelector((state) => state.websocket);

    useEffect(() => {
        // Only connect if user is authenticated
        if (!user || !token) {
            // Disconnect if user logs out
            if (websocketService.isConnected()) {
                websocketService.disconnect();
            }
            return;
        }

        // Get WebSocket URL from environment or use default
        const apiUrl = import.meta.env.VITE_API_URL || 'https://eddy-sane-senatorially.ngrok-free.dev';
        const wsUrl = import.meta.env.VITE_WS_URL || 
                     apiUrl.replace(/^http/, 'ws');

        // Connect if not already connected
        if (!websocketService.isConnected() && !isConnected) {
            dispatch(connectionConnecting());
            websocketService.connect(wsUrl, store);
        }

        // Cleanup: disconnect when user logs out
        return () => {
            if (!user || !token) {
                websocketService.disconnect();
            }
        };
    }, [user, token, dispatch, store, isConnected]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            // Only disconnect on full app unmount, not on route changes
            // This allows WebSocket to persist across navigation
        };
    }, []);

    return <>{children}</>;
}

