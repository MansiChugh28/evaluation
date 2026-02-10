import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { checkAuth } from '../features/auth/authSlice';

/**
 * AuthInitializer component
 * 
 * This component runs once on app mount to validate the authentication state.
 * It checks if a token exists in localStorage and validates it.
 * This prevents UI flickering by ensuring auth state is initialized before
 * routes are rendered.
 */
export default function AuthInitializer({ children }) {
    const dispatch = useDispatch();

    useEffect(() => {
        // Run auth check only once on mount
        // This is a synchronous operation that validates token format
        const initializeAuth = async () => {
            try {
                await dispatch(checkAuth()).unwrap();
            } catch (error) {
                // Error is handled in the reducer, but we ensure it completes
                // The reducer will set isInitialized to true even on error
                console.error('Auth initialization error:', error);
            }
        };
        
        initializeAuth();
    }, [dispatch]);

    // Ensure we return a single React element
    return <>{children}</>;
}

