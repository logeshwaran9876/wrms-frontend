import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@/context/ThemeContext';
import { ToastProvider } from '@/components/ui/Toast';
import { AuthProvider } from '@/context/AuthContext';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import AdminLayout from '@/components/layout/AdminLayout';
import LoginPage from '@/pages/LoginPage';
import DashboardPage from '@/pages/admin/DashboardPage';
import EmployeesPage from '@/pages/admin/EmployeesPage';
import DevicesPage from '@/pages/admin/DevicesPage';
import WebsiteControlPage from '@/pages/admin/WebsiteControlPage';
import ApplicationControlPage from '@/pages/admin/ApplicationControlPage';
import BrowserControlPage from '@/pages/admin/BrowserControlPage';
import UsbControlPage from '@/pages/admin/UsbControlPage';
import PoliciesPage from '@/pages/admin/PoliciesPage';
import ReportsPage from '@/pages/admin/ReportsPage';
import AuditLogsPage from '@/pages/admin/AuditLogsPage';
import SettingsPage from '@/pages/admin/SettingsPage';
import EmployeePortalPage from '@/pages/EmployeePortalPage';
import AccessDeniedPage from '@/pages/AccessDeniedPage';

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              {/* Public Authentication Route */}
              <Route path="/login" element={<LoginPage />} />

              {/* Protected Super Admin & Admin Console Routes */}
              <Route element={<ProtectedRoute allowedRoles={['super_admin', 'admin']} />}>
                <Route element={<AdminLayout />}>
                  <Route path="/" element={<DashboardPage />} />
                  <Route path="/employees" element={<EmployeesPage />} />
                  <Route path="/devices" element={<DevicesPage />} />
                  <Route path="/website-control" element={<WebsiteControlPage />} />
                  <Route path="/application-control" element={<ApplicationControlPage />} />
                  <Route path="/browser-control" element={<BrowserControlPage />} />
                  <Route path="/usb-control" element={<UsbControlPage />} />
                  <Route path="/policies" element={<PoliciesPage />} />
                  <Route path="/reports" element={<ReportsPage />} />
                  <Route path="/audit-logs" element={<AuditLogsPage />} />
                  <Route path="/settings" element={<SettingsPage />} />
                </Route>
              </Route>

              {/* Protected Employee Portal Route */}
              <Route element={<ProtectedRoute />}>
                <Route path="/employee-portal" element={<EmployeePortalPage />} />
              </Route>

              {/* Access Denied Route */}
              <Route path="/access-denied" element={<AccessDeniedPage />} />

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
