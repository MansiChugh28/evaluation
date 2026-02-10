import axiosClient from './axiosClient';

const auctionApi = {
    create: async (auctionData) => {
        // axiosClient interceptor handles FormData Content-Type automatically
        const response = await axiosClient.post('/auctions', auctionData);
        return response.data;
    },
    // Get auctions for the currently authenticated user
    getMyAuctions: async () => {
        const response = await axiosClient.get('/users/me/auctions');
        return response.data;
    },
    getAll: async () => {
        const response = await axiosClient.get('/auctions');
        return response.data;
    },
    // Get auctions with query parameters (status, page, per_page)
    getAuctions: async (params = {}) => {
        const { status, page = 1, per_page = 20 } = params;
        const requestParams = {
            page,
            per_page,
        };
        
        // Only include status if it's provided and not 'all'
        if (status && status !== 'all') {
            requestParams.status = status;
        }
        
        const response = await axiosClient.get('/auctions', {
            params: requestParams,
        });
        return response.data;
    },
    getById: async (id) => {
        const response = await axiosClient.get(`/auctions/${id}`);
        return response.data;
    },
    update: async (id, auctionData) => {
        const response = await axiosClient.put(`/auctions/${id}`, auctionData);
        return response.data;
    },
    delete: async (id) => {
        const response = await axiosClient.delete(`/auctions/${id}`);
        return response.data;
    },
    // Get statistics (default 1-hour window, or custom ending_soon_hours)
    getStatistics: async (ending_soon_hours = null) => {
        const params = {};
        if (ending_soon_hours !== null) {
            params.ending_soon_hours = ending_soon_hours;
        }
        const response = await axiosClient.get('/statistics', { params });
        return response.data;
    },
    // Place a bid on an auction
    placeBid: async (auctionId, bidData) => {
        const response = await axiosClient.post(`/auctions/${auctionId}/bid`, bidData);
        return response.data;
    },
    getBidHistory: async (auctionId) => {
        const response = await axiosClient.get(`/auctions/${auctionId}/bid_history`);
        return response.data;
    },
};

export default auctionApi;

