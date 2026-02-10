import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    isConnected: false,
    isConnecting: false,
    error: null,
    lastEvent: null,
    eventHistory: [],
    // Real-time auction updates
    auctionUpdates: {},
    // Real-time bid updates
    bidUpdates: {},
};

const websocketSlice = createSlice({
    name: 'websocket',
    initialState,
    reducers: {
        connectionOpened: (state) => {
            state.isConnected = true;
            state.isConnecting = false;
            state.error = null;
        },
        connectionClosed: (state, action) => {
            state.isConnected = false;
            state.isConnecting = false;
            state.error = action.payload?.reason || 'Connection closed';
        },
        connectionError: (state, action) => {
            state.isConnected = false;
            state.isConnecting = false;
            state.error = action.payload || 'Connection error';
        },
        connectionConnecting: (state) => {
            state.isConnecting = true;
            state.error = null;
        },
        // Handle incoming WebSocket events
        bidPlaced: (state, action) => {
            const { auctionId, bid } = action.payload;
            state.lastEvent = { type: 'bidPlaced', payload: action.payload };
            
            // Update bid history for specific auction
            if (!state.bidUpdates[auctionId]) {
                state.bidUpdates[auctionId] = [];
            }
            state.bidUpdates[auctionId].push(bid);
            
            // Add to event history (keep last 50 events)
            state.eventHistory.unshift({
                type: 'bidPlaced',
                timestamp: new Date().toISOString(),
                payload: action.payload,
            });
            if (state.eventHistory.length > 50) {
                state.eventHistory.pop();
            }
        },
        auctionUpdated: (state, action) => {
            const { auctionId, auction } = action.payload;
            state.lastEvent = { type: 'auctionUpdated', payload: action.payload };
            
            // Update auction data
            state.auctionUpdates[auctionId] = {
                ...auction,
                updatedAt: new Date().toISOString(),
            };
            
            // Add to event history
            state.eventHistory.unshift({
                type: 'auctionUpdated',
                timestamp: new Date().toISOString(),
                payload: action.payload,
            });
            if (state.eventHistory.length > 50) {
                state.eventHistory.pop();
            }
        },
        auctionCreated: (state, action) => {
            state.lastEvent = { type: 'auctionCreated', payload: action.payload };
            
            // Add to event history
            state.eventHistory.unshift({
                type: 'auctionCreated',
                timestamp: new Date().toISOString(),
                payload: action.payload,
            });
            if (state.eventHistory.length > 50) {
                state.eventHistory.pop();
            }
        },
        auctionEnded: (state, action) => {
            const { auctionId } = action.payload;
            state.lastEvent = { type: 'auctionEnded', payload: action.payload };
            
            // Update auction status
            if (state.auctionUpdates[auctionId]) {
                state.auctionUpdates[auctionId].status = 'ended';
            }
            
            // Add to event history
            state.eventHistory.unshift({
                type: 'auctionEnded',
                timestamp: new Date().toISOString(),
                payload: action.payload,
            });
            if (state.eventHistory.length > 50) {
                state.eventHistory.pop();
            }
        },
        bidHistory: (state, action) => {
            const { auctionId, bids } = action.payload;
            state.lastEvent = { type: 'bidHistory', payload: action.payload };
            
            // Store complete bid history for the auction
            if (auctionId && Array.isArray(bids)) {
                state.bidUpdates[auctionId] = bids;
            }
            
            // Add to event history
            state.eventHistory.unshift({
                type: 'bidHistory',
                timestamp: new Date().toISOString(),
                payload: action.payload,
            });
            if (state.eventHistory.length > 50) {
                state.eventHistory.pop();
            }
        },
        auctionEndingSoon: (state, action) => {
            const { auctionId, auction, hoursRemaining } = action.payload;
            state.lastEvent = { type: 'auctionEndingSoon', payload: action.payload };
            
            // Update auction data with ending soon flag
            if (auctionId) {
                state.auctionUpdates[auctionId] = {
                    ...auction,
                    endingSoon: true,
                    hoursRemaining: hoursRemaining,
                    updatedAt: new Date().toISOString(),
                };
            }
            
            // Add to event history
            state.eventHistory.unshift({
                type: 'auctionEndingSoon',
                timestamp: new Date().toISOString(),
                payload: action.payload,
            });
            if (state.eventHistory.length > 50) {
                state.eventHistory.pop();
            }
        },
        // Generic event handler for any WebSocket event
        eventReceived: (state, action) => {
            state.lastEvent = action.payload;
            
            // Add to event history
            state.eventHistory.unshift({
                type: action.payload.type || 'unknown',
                timestamp: new Date().toISOString(),
                payload: action.payload,
            });
            if (state.eventHistory.length > 50) {
                state.eventHistory.pop();
            }
        },
        // Clear event history
        clearEventHistory: (state) => {
            state.eventHistory = [];
        },
        // Clear specific auction updates
        clearAuctionUpdates: (state, action) => {
            const auctionId = action.payload;
            delete state.auctionUpdates[auctionId];
            delete state.bidUpdates[auctionId];
        },
    },
});

export const {
    connectionOpened,
    connectionClosed,
    connectionError,
    connectionConnecting,
    bidPlaced,
    auctionUpdated,
    auctionCreated,
    auctionEnded,
    auctionEndingSoon,
    bidHistory,
    eventReceived,
    clearEventHistory,
    clearAuctionUpdates,
} = websocketSlice.actions;

export default websocketSlice.reducer;

