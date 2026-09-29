import { Route, Routes } from 'react-router-dom';
import ProtectedRoute from '@/components/ProtectedRoute';
import AdminRoute from '@/components/AdminRoute';
import DashboardLayout from '@/layouts/DashboardLayout';
import AdminLayout from '@/layouts/AdminLayout';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import MfaVerifyPage from './pages/MfaVerifyPage';
import DashboardHomePage from './pages/dashboard/DashboardHomePage';
import AppointmentsPage from './pages/dashboard/AppointmentsPage';
import ChatsPage from './pages/dashboard/ChatsPage';
import HabitsPage from './pages/dashboard/HabitsPage';
import PsychologistsPage from './pages/dashboard/PsychologistsPage';
import MfaEnrollPage from './pages/MfaEnrollPage';
import MfaSettingsPage from './pages/MfaSettingsPage';
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import AdminUserPage from './pages/admin/AdminUserPage';
import AdminPsychologistsPage from './pages/admin/AdminPsychologistsPage';

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/mfa/verify" element={<MfaVerifyPage />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            {(session) => <DashboardLayout session={session} />}
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardHomePage />} />
        <Route path="habitos" element={<HabitsPage />} />
        <Route path="chats" element={<ChatsPage />} />
        <Route path="citas" element={<AppointmentsPage />} />
        <Route path="psicologos" element={<PsychologistsPage />} />
       </Route>
      <Route
        path="/admin"
        element={
          <AdminRoute>
            {(session) => <AdminLayout session={session} />}
          </AdminRoute>
        }
      >
        <Route index element={<AdminDashboardPage />} />
        <Route path="users" element={<AdminUserPage />} />
        <Route path="psychologists" element={<AdminPsychologistsPage />} />
      </Route>
      <Route
        path="/mfa/enroll"
        element={
          <ProtectedRoute>
            <MfaEnrollPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/mfa/settings"
        element={
          <ProtectedRoute>
            <MfaSettingsPage />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default App;
