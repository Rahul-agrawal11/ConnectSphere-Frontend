import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/common/ProtectedRoute';
import { ToastProvider } from './components/common/Toast';
import useAuth from './hooks/useAuth';

// Layouts
import MainLayout from './components/layout/MainLayout';
import GuestLayout from './components/layout/GuestLayout';

// Auth pages
import Login      from './pages/Login';
import Register   from './pages/Register';
import VerifyOtp  from './pages/VerifyOtp';
import OAuthCallback from './pages/OAuthCallback';

// App pages
import Feed          from './pages/Feed';
import Profile       from './pages/Profile';
import EditProfile   from './pages/EditProfile';
import Notifications from './pages/Notifications';
import Search        from './pages/Search';

// Admin pages
import AdminPanel from './pages/AdminPanel';

import './App.css';

// Admin Route Component
const AdminRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) return null;
  
  if (!user || user.role !== 'ADMIN') {
    return <Navigate to="/" replace />;
  }

  return children;
};

// Guest Route Component
const GuestRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) return null;

  // If user is logged in, redirect to main app
  if (user) {
    return <Navigate to="/" replace />;
  }

  return children;
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            {/* Public auth routes */}
            <Route path="/login"           element={<Login />} />
            <Route path="/register"        element={<Register />} />
            <Route path="/verify-otp"      element={<VerifyOtp />} />
            <Route path="/oauth2/redirect" element={<OAuthCallback />} />

            {/* Guest routes — public feed, public profile, public search */}
            <Route
              path="/guest"
              element={
                <GuestRoute>
                  <GuestLayout />
                </GuestRoute>
              }
            >
              <Route index element={<Feed />} />
              <Route path="profile/:userId" element={<Profile />} />
              <Route path="search"          element={<Search />} />
            </Route>

            {/* Admin routes */}
            <Route
              path="/admin"
              element={
                <AdminRoute>
                  <AdminPanel />
                </AdminRoute>
              }
            />

            {/* Protected app routes — wrapped in MainLayout */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <MainLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Feed />} />
              <Route path="profile/:userId" element={<Profile />} />
              <Route path="profile/edit"    element={<EditProfile />} />
              <Route path="notifications"   element={<Notifications />} />
              <Route path="search"          element={<Search />} />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;