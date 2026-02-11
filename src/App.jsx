import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthLayout } from './components/layout/AuthLayout';
import { MainLayout } from './components/layout/MainLayout';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import LandingPage from './pages/LandingPage.jsx';
import AuctionsListingPage from './pages/AuctionsListingPage';
import AuctionDetailsPage from './pages/AuctionDetailsPage';
import CreateAuctionPage from './pages/CreateAuctionPage';
import MyAuctionsPage from './pages/MyAuctionsPage';
import ProfilePage from './pages/ProfilePage';
import ProtectedRoute from './components/ProtectedRoute';
import PublicRoute from './components/PublicRoute';
import AuthInitializer from './components/AuthInitializer';
import WebSocketProvider from './components/WebSocketProvider';
import AuctionNotifications from './components/AuctionNotifications';
import { Toaster } from './components/ui/sonner';
import './App.css';

function App() {
  return (
    <ThemeProvider>
      <AuthInitializer>
        <WebSocketProvider>
    <Router>
          <AuctionNotifications />
        <Routes>
            {/* Public routes */}
            <Route
              path="/"
              element={
                <LandingPage />
              }
            />
            <Route
              path="/login"
              element={
                <PublicRoute>
                  <AuthLayout>
                    <LoginPage />
                  </AuthLayout>
                </PublicRoute>
              }
            />
            <Route
              path="/register"
              element={
                <PublicRoute>
                  <AuthLayout>
                    <RegisterPage />
                  </AuthLayout>
                </PublicRoute>
              }
            />
            
            {/* Protected routes with MainLayout */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <DashboardPage />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/auctions"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <AuctionsListingPage />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/auctions/:id"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <AuctionDetailsPage />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/create-auction"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <CreateAuctionPage />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/my-auctions"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <MyAuctionsPage />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <ProfilePage />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            
            {/* Default redirect to home */}
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    </Router>
        <Toaster />
        </WebSocketProvider>
      </AuthInitializer>
    </ThemeProvider>
  );
}

export default App;