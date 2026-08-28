import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { AppStoreProvider } from './context/AppStoreContext';
import { LanguageProvider } from './context/LanguageContext';
import { ThemeProvider } from './context/ThemeContext';
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
import PageTransition from './components/PageTransition';
import BuildingRulesPage from './pages/Resources/BuildingRulesPage';
import GovtOrdersPage from './pages/Resources/GovtOrdersPage';
import FeeCalculatorPage from './pages/Resources/FeeCalculatorPage';
import UserManualsPage from './pages/Resources/UserManualsPage';

import ErrorBoundary from './components/ErrorBoundary';

// Removed Bootstrap CSS import from here, moved to main.tsx

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <BrowserRouter>
          <AuthProvider>
            <LanguageProvider>
              <AppStoreProvider>
                <ApplicationNotificationToast />
                <PageTransition>
                  <Routes>
                    {/* Public */}
                  <Route path="/" element={<LandingPage />} />
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/signup" element={<SignupPage />} />
                  <Route path="/get-started" element={<GetStartedPage />} />
                  <Route path="/provider-register" element={<ProviderRegisterPage />} />

                  {/* Resource pages */}
                  <Route path="/building-rules" element={<BuildingRulesPage />} />
                  <Route path="/govt-orders" element={<GovtOrdersPage />} />
                  <Route path="/fee-calculator" element={<FeeCalculatorPage />} />
                  <Route path="/user-manuals" element={<UserManualsPage />} />

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
              </PageTransition>
            </AppStoreProvider>
          </LanguageProvider>
        </AuthProvider>
        </BrowserRouter>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
