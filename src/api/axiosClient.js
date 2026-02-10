import axios from 'axios';

const axiosClient = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://172.16.15.117:3000',
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add a request interceptor
axiosClient.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        // Exclude token for login and register endpoints to avoid issues with stale tokens
        if (token && !config.url.includes('/auth/login') && !config.url.includes('/auth/register')) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        
        // If FormData is being sent, remove Content-Type header to let browser set it with boundary
        if (config.data instanceof FormData) {
            delete config.headers['Content-Type'];
        }
        
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Add a response interceptor
axiosClient.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        // Handle 401 Unauthorized - token is invalid or expired
        if (error.response && error.response.status === 401) {
            // Clear invalid token and user data
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            
            // Only redirect if not already on login/register page
            // This prevents redirect loops
            const currentPath = window.location.pathname;
            if (currentPath !== '/login' && currentPath !== '/register') {
                // Use window.location to force a full page reload and reset state
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

export default axiosClient;
