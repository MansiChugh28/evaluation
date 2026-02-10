import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Loader } from './ui/loader';

/**
 * PublicRoute component
 * 
 * For public routes (login, register) that should redirect to dashboard
 * if user is already authenticated.
 * 
 * Behavior:
 * 1. Waits for auth initialization to complete
 * 2. Shows loader while checking auth state
 * 3. Redirects to dashboard if already authenticated
 * 4. Renders children if not authenticated
 */
export default function PublicRoute({ children }) {
    const { user, token, isInitialized } = useSelector((state) => state.auth);

    // Wait for auth initialization to complete
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

    // If already authenticated, redirect to dashboard
    if (user && token) {
        return <Navigate to="/dashboard" replace />;
    }

    // User is not authenticated, render public content
    return children;
}