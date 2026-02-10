import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import auctionApi from '../../api/auctionApi';
import { extractErrorMessage } from '../../utils/errorHandler';

const initialState = {
    auctions: [],
    currentAuction: null,
    isLoading: false,
    isError: false,
    isSuccess: false,
    message: '',
};

// Create auction
export const createAuction = createAsyncThunk(
    'auctions/create',
    async (auctionData, thunkAPI) => {
        try {
            return await auctionApi.create(auctionData);
        } catch (error) {
            const errorMessage = extractErrorMessage(error);
            return thunkAPI.rejectWithValue(errorMessage);
        }
    }
);

// Get all auctions
export const getAllAuctions = createAsyncThunk(
    'auctions/getAll',
    async (_, thunkAPI) => {
        try {
            return await auctionApi.getAll();
        } catch (error) {
            const errorMessage = extractErrorMessage(error);
            return thunkAPI.rejectWithValue(errorMessage);
        }
    }
);

// Get auction by ID
export const getAuctionById = createAsyncThunk(
    'auctions/getById',
    async (id, thunkAPI) => {
        try {
            return await auctionApi.getById(id);
        } catch (error) {
            const errorMessage = extractErrorMessage(error);
            return thunkAPI.rejectWithValue(errorMessage);
        }
    }
);

// Update auction
export const updateAuction = createAsyncThunk(
    'auctions/update',
    async ({ id, auctionData }, thunkAPI) => {
        try {
            return await auctionApi.update(id, auctionData);
        } catch (error) {
            const errorMessage = extractErrorMessage(error);
            return thunkAPI.rejectWithValue(errorMessage);
        }
    }
);

// Delete auction
export const deleteAuction = createAsyncThunk(
    'auctions/delete',
    async (id, thunkAPI) => {
        try {
            return await auctionApi.delete(id);
        } catch (error) {
            const errorMessage = extractErrorMessage(error);
            return thunkAPI.rejectWithValue(errorMessage);
        }
    }
);

const auctionSlice = createSlice({
    name: 'auctions',
    initialState,
    reducers: {
        reset: (state) => {
            state.isError = false;
            state.isSuccess = false;
            state.message = '';
        },
        clearCurrentAuction: (state) => {
            state.currentAuction = null;
        },
    },
    extraReducers: (builder) => {
        builder
            // Create auction
            .addCase(createAuction.pending, (state) => {
                state.isLoading = true;
                state.isError = false;
                state.isSuccess = false;
                state.message = '';
            })
            .addCase(createAuction.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isSuccess = true;
                state.message = 'Auction created successfully';
                if (action.payload?.auction) {
                    state.auctions.push(action.payload.auction);
                }
            })
            .addCase(createAuction.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload || 'Failed to create auction';
            })
            // Get all auctions
            .addCase(getAllAuctions.pending, (state) => {
                state.isLoading = true;
                state.isError = false;
            })
            .addCase(getAllAuctions.fulfilled, (state, action) => {
                state.isLoading = false;
                state.auctions = action.payload?.auctions || action.payload || [];
            })
            .addCase(getAllAuctions.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload || 'Failed to fetch auctions';
            })
            // Get auction by ID
            .addCase(getAuctionById.pending, (state) => {
                state.isLoading = true;
                state.isError = false;
            })
            .addCase(getAuctionById.fulfilled, (state, action) => {
                state.isLoading = false;
                state.currentAuction = action.payload?.auction || action.payload;
            })
            .addCase(getAuctionById.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload || 'Failed to fetch auction';
            })
            // Update auction
            .addCase(updateAuction.pending, (state) => {
                state.isLoading = true;
                state.isError = false;
                state.isSuccess = false;
            })
            .addCase(updateAuction.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isSuccess = true;
                state.message = 'Auction updated successfully';
                const updatedAuction = action.payload?.auction || action.payload;
                if (updatedAuction) {
                    const index = state.auctions.findIndex(a => a.id === updatedAuction.id);
                    if (index !== -1) {
                        state.auctions[index] = updatedAuction;
                    }
                    if (state.currentAuction?.id === updatedAuction.id) {
                        state.currentAuction = updatedAuction;
                    }
                }
            })
            .addCase(updateAuction.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload || 'Failed to update auction';
            })
            // Delete auction
            .addCase(deleteAuction.pending, (state) => {
                state.isLoading = true;
                state.isError = false;
            })
            .addCase(deleteAuction.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isSuccess = true;
                state.message = 'Auction deleted successfully';
                const deletedId = action.payload?.id || action.meta.arg;
                state.auctions = state.auctions.filter(a => a.id !== deletedId);
                if (state.currentAuction?.id === deletedId) {
                    state.currentAuction = null;
                }
            })
            .addCase(deleteAuction.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload || 'Failed to delete auction';
            })
            // Handle WebSocket events
            .addCase('websocket/bidPlaced', (state, action) => {
                const { auctionId, bid } = action.payload;
                const auctionIdToUpdate = auctionId || action.payload.auction_id;
                
                // Update current auction if it matches
                if (state.currentAuction && state.currentAuction.id === auctionIdToUpdate) {
                    if (bid && bid.amount > (state.currentAuction.current_price || 0)) {
                        state.currentAuction.current_price = bid.amount;
                        state.currentAuction.total_bids = (state.currentAuction.total_bids || 0) + 1;
                    }
                }
                
                // Update in auctions list
                const auctionIndex = state.auctions.findIndex(a => a.id === auctionIdToUpdate);
                if (auctionIndex !== -1 && bid && bid.amount > (state.auctions[auctionIndex].current_price || 0)) {
                    state.auctions[auctionIndex].current_price = bid.amount;
                    state.auctions[auctionIndex].total_bids = (state.auctions[auctionIndex].total_bids || 0) + 1;
                }
            })
            .addCase('websocket/auctionUpdated', (state, action) => {
                const { auctionId, auction } = action.payload;
                const auctionIdToUpdate = auctionId || action.payload.auction_id || auction?.id;
                const updatedAuction = auction || action.payload;
                
                // Update current auction if it matches
                if (state.currentAuction && state.currentAuction.id === auctionIdToUpdate) {
                    state.currentAuction = {
                        ...state.currentAuction,
                        ...updatedAuction,
                    };
                }
                
                // Update in auctions list
                const auctionIndex = state.auctions.findIndex(a => a.id === auctionIdToUpdate);
                if (auctionIndex !== -1) {
                    state.auctions[auctionIndex] = {
                        ...state.auctions[auctionIndex],
                        ...updatedAuction,
                    };
                } else if (updatedAuction.id) {
                    // Add new auction if not in list
                    state.auctions.push(updatedAuction);
                }
            })
            .addCase('websocket/auctionCreated', (state, action) => {
                const newAuction = action.payload.auction || action.payload;
                if (newAuction && newAuction.id) {
                    // Add to auctions list if not already present
                    const exists = state.auctions.some(a => a.id === newAuction.id);
                    if (!exists) {
                        state.auctions.push(newAuction);
                    }
                }
            })
            .addCase('websocket/auctionEnded', (state, action) => {
                const { auctionId } = action.payload;
                const auctionIdToUpdate = auctionId || action.payload.auction_id;
                
                // Update current auction if it matches
                if (state.currentAuction && state.currentAuction.id === auctionIdToUpdate) {
                    state.currentAuction.status = 'ended';
                }
                
                // Update in auctions list
                const auctionIndex = state.auctions.findIndex(a => a.id === auctionIdToUpdate);
                if (auctionIndex !== -1) {
                    state.auctions[auctionIndex].status = 'ended';
                }
            });
    },
});

export const { reset, clearCurrentAuction } = auctionSlice.actions;
export default auctionSlice.reducer;

