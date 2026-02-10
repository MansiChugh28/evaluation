import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Loader } from './ui/loader';

/**
 * ProtectedRoute component
 * 
 * Protects routes that require authentication.
 * 
 * Behavior:
 * 1. Waits for auth initialization to complete (prevents flickering)
 * 2. Shows loader while checking auth state
 * 3. Redirects to login if not authenticated
 * 4. Renders children if authenticated
 */
export default function ProtectedRoute({ children }) {
    const { user, token, isInitialized } = useSelector((state) => state.auth);

    // Wait for auth initialization to complete
    // This prevents flickering by not rendering anything until we know the auth state
    if (!isInitialized) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-background">
                <div className="flex flex-col items-center gap-4">
                    <Loader size="lg" />
                    <p className="text-sm text-muted-foreground">Loading...</p>
                </div>
            </div>
        );
    }

    if (!user || !token) {
        return <Navigate to="/login" replace />;
    }

    // User is authenticated, render protected content
    return children;
}

