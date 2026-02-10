/**
 * WebSocket Service
 * Manages WebSocket connection and handles real-time events
 */

class WebSocketService {
    constructor() {
        this.socket = null;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectDelay = 3000; // 3 seconds
        this.listeners = new Map();
        this.isConnecting = false;
        this.store = null; // Redux store reference
    }

    /**
     * Initialize WebSocket connection
     * @param {string} url - WebSocket server URL
     * @param {Object} store - Redux store instance
     */
    connect(url, store) {
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            console.log('WebSocket already connected');
            return;
        }

        if (this.isConnecting) {
            console.log('WebSocket connection already in progress');
            return;
        }

        this.store = store;
        this.isConnecting = true;

        try {
            // Get token from localStorage
            const token = localStorage.getItem('token');
            
            // Append token to URL if available
            const wsUrl = token ? `${url}/cable?token=${token}` : url;

            console.log('wsUrl', wsUrl);
            this.socket = new WebSocket(wsUrl);

            this.socket.onopen = () => {
                console.log('WebSocket connected');
                this.isConnecting = false;
                this.reconnectAttempts = 0;
                
                // Dispatch connection success action
                if (this.store) {
                    this.store.dispatch({
                        type: 'websocket/connectionOpened',
                    });
                }
            };

            this.socket.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    this.handleMessage(data);
                } catch (error) {
                    console.error('Error parsing WebSocket message:', error);
                }
            };

            this.socket.onerror = (error) => {
                console.error('WebSocket error:', error);
                this.isConnecting = false;
                
                // Dispatch connection error action
                if (this.store) {
                    this.store.dispatch({
                        type: 'websocket/connectionError',
                        payload: 'WebSocket connection error',
                    });
                }
            };

            this.socket.onclose = (event) => {
                console.log('WebSocket closed', event.code, event.reason);
                this.isConnecting = false;
                
                // Dispatch connection closed action
                if (this.store) {
                    this.store.dispatch({
                        type: 'websocket/connectionClosed',
                        payload: { code: event.code, reason: event.reason },
                    });
                }

                // Attempt to reconnect if not a normal closure
                if (event.code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts) {
                    this.attemptReconnect(url);
                }
            };
        } catch (error) {
            console.error('Error creating WebSocket connection:', error);
            this.isConnecting = false;
            
            if (this.store) {
                this.store.dispatch({
                    type: 'websocket/connectionError',
                    payload: error.message,
                });
            }
        }
    }

    /**
     * Attempt to reconnect to WebSocket
     */
    attemptReconnect(url) {
        this.reconnectAttempts++;
        console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
        
        setTimeout(() => {
            this.connect(url, this.store);
        }, this.reconnectDelay);
    }

    handleMessage(data) {
        console.log('WebSocket message received:', data);
        
        // Extract event type and payload
        const eventType = data.type || data.event || 'eventReceived';
        const payload = data.payload || data.data || data;
        
        // Dispatch Redux action based on event type
        if (this.store) {
            // Map common event types to Redux actions
            const actionMap = {
                'bid_placed': 'bidPlaced',
                'bidPlaced': 'bidPlaced',
                'bid_history': 'bidHistory',
                'bidHistory': 'bidHistory',
                'auction_updated': 'auctionUpdated',
                'auctionUpdated': 'auctionUpdated',
                'auction_created': 'auctionCreated',
                'auctionCreated': 'auctionCreated',
                'auction_ended': 'auctionEnded',
                'auctionEnded': 'auctionEnded',
                'auction_ending_soon': 'auctionEndingSoon',
                'auctionEndingSoon': 'auctionEndingSoon',
            };
            
            const reduxActionType = actionMap[eventType] || 'eventReceived';
            
            this.store.dispatch({
                type: `websocket/${reduxActionType}`,
                payload: payload,
            });
        }

        // Call registered listeners
        if (this.listeners.has(eventType)) {
            const callbacks = this.listeners.get(eventType);
            callbacks.forEach(callback => callback(payload));
        }
        
        // Also call listeners for mapped action types
        const actionMap = {
            'bid_placed': 'bidPlaced',
            'bidPlaced': 'bidPlaced',
            'bid_history': 'bidHistory',
            'bidHistory': 'bidHistory',
            'auction_updated': 'auctionUpdated',
            'auctionUpdated': 'auctionUpdated',
            'auction_ending_soon': 'auctionEndingSoon',
            'auctionEndingSoon': 'auctionEndingSoon',
        };
        
        const mappedType = actionMap[eventType];
        if (mappedType && this.listeners.has(mappedType)) {
            const callbacks = this.listeners.get(mappedType);
            callbacks.forEach(callback => callback(payload));
        }
    }

    /**
     * Send message through WebSocket
     */
    send(message) {
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            const data = typeof message === 'string' ? message : JSON.stringify(message);
            this.socket.send(data);
        } else {
            console.warn('WebSocket is not connected. Cannot send message.');
        }
    }

    /**
     * Subscribe to specific event type
     */
    subscribe(eventType, callback) {
        if (!this.listeners.has(eventType)) {
            this.listeners.set(eventType, []);
        }
        this.listeners.get(eventType).push(callback);

        // Return unsubscribe function
        return () => {
            const callbacks = this.listeners.get(eventType);
            if (!callbacks || callbacks.length === 0) {
                return;
            }
            const index = callbacks.indexOf(callback);
            if (index > -1) {
                callbacks.splice(index, 1);
            }
            // If no callbacks left, clean up the key
            if (callbacks.length === 0) {
                this.listeners.delete(eventType);
            }
        };
    }

    /**
     * Disconnect WebSocket
     */
    disconnect() {
        if (this.socket) {
            this.socket.close(1000, 'Client disconnect');
            this.socket = null;
        }
        this.listeners.clear();
        this.isConnecting = false;
        this.reconnectAttempts = 0;
    }

    /**
     * Get connection status
     */
    isConnected() {
        return this.socket && this.socket.readyState === WebSocket.OPEN;
    }
}

// Export singleton instance
export default new WebSocketService();

