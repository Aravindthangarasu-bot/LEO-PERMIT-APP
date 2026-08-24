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
import ApplicationNotificationToast from './components/ApplicationNotificationToast';

import ErrorBoundary from './components/ErrorBoundary';

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <AppStoreProvider>
            <ApplicationNotificationToast />
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

              {/* Admin Portal */}
              <Route
                path="/admin/*"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminPortal />
                  </ProtectedRoute>
                }
              />

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </AppStoreProvider>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

