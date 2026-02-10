import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import authApi from '../../api/authApi';
import { extractErrorMessage } from '../../utils/errorHandler';

// Get token from localStorage if exists
const token = localStorage.getItem('token');
const userStr = localStorage.getItem('user');
const user = userStr ? JSON.parse(userStr) : null;

const initialState = {
    user: user ? user : null,
    token: token ? token : null,
    isError: false,
    isSuccess: false,
    isLoading: false,
    isInitialized: false, // Track if initial auth check is complete
    message: '',
};

// Register user
export const register = createAsyncThunk(
    'auth/register',
    async (user, thunkAPI) => {
        try {
            return await authApi.register(user);
        } catch (error) {
            const errorMessage = extractErrorMessage(error);
            return thunkAPI.rejectWithValue(errorMessage);
        }
    }
);

// Login user
export const login = createAsyncThunk('auth/login', async (user, thunkAPI) => {
    try {
        return await authApi.login(user);
    } catch (error) {
        const errorMessage = extractErrorMessage(error);
        return thunkAPI.rejectWithValue(errorMessage);
    }
});

// Check auth - validate token on app initialization
export const checkAuth = createAsyncThunk('auth/checkAuth', async (_, thunkAPI) => {
    try {
        const token = localStorage.getItem('token');
        const userStr = localStorage.getItem('user');
        
        // If no token, mark as initialized with no user
        if (!token || !userStr) {
            return { user: null, token: null };
        }

        const user = JSON.parse(userStr);
        
        // Basic token validation - check if it's a JWT-like string
        if (token && token.split('.').length === 3) {
            return { user, token };
        } else {
            // Invalid token format, clear it
            localStorage.removeItem('user');
            localStorage.removeItem('token');
            return { user: null, token: null };
        }
    } catch (error) {
        // If parsing fails or any error, clear auth
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        return { user: null, token: null };
    }
});

// Logout user
export const logout = createAsyncThunk('auth/logout', async () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    return null;
});

export const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        reset: (state) => {
            state.isLoading = false;
            state.isSuccess = false;
            state.isError = false;
            state.message = '';
        },
        clearAuth: (state) => {
            state.user = null;
            state.token = null;
            state.isError = false;
            state.isSuccess = false;
            state.message = '';
            localStorage.removeItem('user');
            localStorage.removeItem('token');
        },
        updateUser: (state, action) => {
            if (state.user) {
                state.user = {
                    ...state.user,
                    ...action.payload,
                };
                localStorage.setItem('user', JSON.stringify(state.user));
            }
        },
    },
    extraReducers: (builder) => {
        builder
            // Check auth on initialization
            .addCase(checkAuth.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(checkAuth.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isInitialized = true;
                state.user = action.payload.user;
                state.token = action.payload.token;
            })
            .addCase(checkAuth.rejected, (state) => {
                state.isLoading = false;
                state.isInitialized = true;
                state.user = null;
                state.token = null;
                localStorage.removeItem('user');
                localStorage.removeItem('token');
            })
            // Register
            .addCase(register.pending, (state) => {
                state.isLoading = true;
                state.isError = false;
                state.isSuccess = false;
            })
            .addCase(register.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isSuccess = true;
                state.isError = false;
                state.user = action.payload.user;
                state.token = action.payload.token;
                localStorage.setItem('user', JSON.stringify(action.payload.user));
                localStorage.setItem('token', action.payload.token);
            })
            .addCase(register.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.isSuccess = false;
                state.message = action.payload;
                state.user = null;
                state.token = null;
            })
            // Login
            .addCase(login.pending, (state) => {
                state.isLoading = true;
                state.isError = false;
                state.isSuccess = false;
            })
            .addCase(login.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isSuccess = true;
                state.isError = false;
                state.user = action.payload.user;
                state.token = action.payload.token;
                localStorage.setItem('user', JSON.stringify(action.payload.user));
                localStorage.setItem('token', action.payload.token);
            })
            .addCase(login.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.isSuccess = false;
                state.message = action.payload;
                state.user = null;
                state.token = null;
            })
            // Logout
            .addCase(logout.fulfilled, (state) => {
                state.user = null;
                state.token = null;
                state.isSuccess = false;
            });
    },
});

export const { reset, clearAuth, updateUser } = authSlice.actions;
export default authSlice.reducer;
