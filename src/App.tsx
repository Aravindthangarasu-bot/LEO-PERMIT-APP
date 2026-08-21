import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { AppStoreProvider } from './context/AppStoreContext';
import ProtectedRoute from './components/ProtectedRoute';
import LandingPage from './pages/Landing/LandingPage';
import LoginPage from './pages/Login/LoginPage';
import SignupPage from './pages/Signup/SignupPage';
import GetStartedPage from './pages/GetStarted/GetStartedPage';
import ProviderRegisterPage from './pages/GetStarted/ProviderRegisterPage';
import CustomerPortal from './pages/Customer/CustomerPortal';
import ProviderPortal from './pages/Provider/ProviderPortal';
import AdminPortal from './pages/Admin/AdminPortal';
import StaffPortal from './pages/Staff/StaffPortal';

import ErrorBoundary from './components/ErrorBoundary';

export default function App() {
  // Read the secret admin keyword from the environment variables (e.g. 'portal-qa-secret')
  const adminKeyword = import.meta.env.VITE_ADMIN_DOMAIN_KEYWORD || 'admin-local';
  const isAdminDomain = window.location.hostname.includes(adminKeyword);

  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <AppStoreProvider>
            {isAdminDomain ? <AdminRoutes /> : <PublicRoutes />}
          </AppStoreProvider>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

// ------------------------------------------------------------------
// ADMIN ROUTER: Exclusively available on the obscured admin domain
// ------------------------------------------------------------------
function AdminRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/admin/*"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminPortal />
          </ProtectedRoute>
        }
      />
      {/* If an admin hits the root of the admin domain, redirect to login or dashboard */}
      <Route path="/" element={<Navigate to="/admin" replace />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

// ------------------------------------------------------------------
// PUBLIC ROUTER: Standard application. The /admin route DOES NOT EXIST here.
// ------------------------------------------------------------------
function PublicRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/get-started" element={<GetStartedPage />} />
      <Route path="/provider-register" element={<ProviderRegisterPage />} />

      {/* Customer Portal */}
      <Route
        path="/customer/*"
        element={
          <ProtectedRoute allowedRoles={['customer']}>
            <CustomerPortal />
          </ProtectedRoute>
        }
      />

      {/* Provider Portal */}
      <Route
        path="/provider/*"
        element={
          <ProtectedRoute allowedRoles={['provider']}>
            <ProviderPortal />
          </ProtectedRoute>
        }
      />

      {/* Staff Portal */}
      <Route
        path="/staff/*"
        element={
          <ProtectedRoute allowedRoles={['staff']}>
            <StaffPortal />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

