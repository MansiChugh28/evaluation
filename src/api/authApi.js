import axiosClient from './axiosClient';

const authApi = {
    login: async (credentials) => {
        const response = await axiosClient.post('/auth/login', credentials);
        return response.data;
    },
    register: async (userData) => {
     
        const response = await axiosClient.post('/auth/register', userData);
        return response.data;
    },
    // Get current user profile
    getMe: async () => {
        const response = await axiosClient.get('/users/me');
        return response.data;
    },
    // Update current user profile
    updateMe: async (userData) => {
        const response = await axiosClient.put('/users/me', userData);
        return response.data;
    },
    // Get user balance
    getBalance: async () => {
        const response = await axiosClient.get('/users/me/balance');
        return response.data;
    },
    // Update user balance
    updateBalance: async (balanceData) => {
        const response = await axiosClient.put('/users/me/balance', balanceData);
        return response.data;
    },
};

export default authApi;
