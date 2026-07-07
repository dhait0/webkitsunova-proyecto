import { Route, Routes } from 'react-router-dom';
import ProtectedRoute from '@/components/ProtectedRoute';
import DashboardLayout from '@/layouts/DashboardLayout';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import DashboardHomePage from './pages/dashboard/DashboardHomePage';
import AppointmentsPage from './pages/dashboard/AppointmentsPage';
import ChatsPage from './pages/dashboard/ChatsPage';
import HabitsPage from './pages/dashboard/HabitsPage';
import PsychologistsPage from './pages/dashboard/PsychologistsPage';

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />
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
    </Routes>
  );
}

export default App;
