import { Route, Routes, useParams } from 'react-router-dom';
import ProtectedRoute from '@/components/ProtectedRoute';
import AdminRoute from '@/components/AdminRoute';
import PsyRoute from '@/components/PsyRoute';
import DashboardLayout from '@/layouts/DashboardLayout';
import AdminLayout from '@/layouts/AdminLayout';
import PsyLayout from '@/layouts/PsyLayout';
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
import AdminNotFoundPage from './pages/admin/AdminNotFoundPage';
import PsyDashboardPage from './pages/psy/PsyDashboardPage';
import { PsyTodaySessionsPage, PsyUpcomingSessionsPage } from './pages/psy/SessionPages';
import PsyPatientsPage from './pages/psy/PsyPatientsPage';
import PsyPatientDetailPage from './pages/psy/PsyPatientDetailPage';
import PsyWorkshopsPage from './pages/psy/PsyWorkshopsPage';
import PsyWorkshopDetailPage, { PsyWorkshopAttendeesPage } from './pages/psy/PsyWorkshopDetailPage';
import PsyResourcesPage from './pages/psy/PsyResourcesPage';
import PsyResourceDetailPage from './pages/psy/PsyResourceDetailPage';
import PsySettingsPage from './pages/psy/PsySettingsPage';
import PsyPublicProfilePage from './pages/psy/PsyPublicProfilePage';
import PsyNotificationsPage from './pages/psy/PsyNotificationsPage';
import PsyNotificationPreferencesPage from './pages/psy/PsyNotificationPreferencesPage';
import PsyReferralsPage from './pages/psy/PsyReferralsPage';
import { PsyChatDetailPage, PsyChatsPage } from './pages/psy/PsyChatsPage';

function PsyChatDetailRoute() {
  const { conversationId = '' } = useParams();
  return <PsyChatDetailPage conversationId={conversationId} />;
}

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
        path="/psy"
        element={
          <PsyRoute>
            {(session) => <PsyLayout session={session} />}
          </PsyRoute>
        }
      >
        <Route index element={<PsyDashboardPage />} />
        <Route path="sesiones" element={<PsyUpcomingSessionsPage />} />
        <Route path="sesiones/hoy" element={<PsyTodaySessionsPage />} />
        <Route path="pacientes" element={<PsyPatientsPage />} />
        <Route path="pacientes/:userId" element={<PsyPatientDetailPage />} />
        <Route path="talleres" element={<PsyWorkshopsPage />} />
        <Route path="talleres/:id" element={<PsyWorkshopDetailPage />} />
        <Route path="talleres/:id/inscriptos" element={<PsyWorkshopAttendeesPage />} />
        <Route path="recursos" element={<PsyResourcesPage />} />
        <Route path="recursos/:id" element={<PsyResourceDetailPage />} />
        <Route path="mensajes" element={<PsyChatsPage />} />
        <Route path="mensajes/:conversationId" element={<PsyChatDetailRoute />} />
        <Route path="notificaciones" element={<PsyNotificationsPage />} />
        <Route path="derivaciones" element={<PsyReferralsPage />} />
        <Route path="perfil" element={<PsyPublicProfilePage />} />
        <Route path="configuracion" element={<PsySettingsPage />} />
        <Route path="configuracion/notificaciones" element={<PsyNotificationPreferencesPage />} />
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
        <Route path="*" element={<AdminNotFoundPage />} />
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
