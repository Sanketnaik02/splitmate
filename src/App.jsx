import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { GroupProvider } from './context/GroupContext';
import { ToastProvider } from './components/ui/Toast';
import { ThemeProvider } from './context/ThemeContext';
import { SubscriptionProvider } from './context/SubscriptionContext';
import ProtectedRoute from './components/navigation/ProtectedRoute';
import { isAdmin } from './utils/admin';

import SignIn from './pages/auth/SignIn';
import SignUp from './pages/auth/SignUp';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';
import Dashboard from './pages/dashboard/Dashboard';
import GroupList from './pages/groups/GroupList';
import CreateGroup from './pages/groups/CreateGroup';
import GroupDetail from './pages/groups/GroupDetail';
import AddExpense from './pages/expenses/AddExpense';
import ExpenseDetail from './pages/expenses/ExpenseDetail';
import EditExpense from './pages/expenses/EditExpense';
import SettleUp from './pages/settlements/SettleUp';
import SettlementHistory from './pages/settlements/SettlementHistory';
import Subscription from './pages/subscription/Subscription';
import Profile from './pages/profile/Profile';
import EditProfile from './pages/profile/EditProfile';
import ProfileCompletion from './pages/profile/ProfileCompletion';
import Notifications from './pages/notifications/Notifications';
import AdminDashboard from './pages/admin/AdminDashboard';
import UserManagement from './pages/admin/UserManagement';
import ApplicationGuide from './pages/guide/ApplicationGuide';
import NotFound from './pages/NotFound';

function RequireAdmin({ children }) {
  const { user } = useAuth();
  console.log('[RequireAdmin] user.email:', user?.email);
  console.log('[RequireAdmin] isAdmin():', isAdmin(user?.email));
  if (!isAdmin(user?.email)) return <Navigate to="/dashboard" replace />;
  return children;
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ToastProvider>
          <GroupProvider>
            <SubscriptionProvider>
          <Routes>
            <Route path="/signin" element={<SignIn />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />

            <Route element={<ProtectedRoute />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/groups" element={<GroupList />} />
              <Route path="/groups/new" element={<CreateGroup />} />
              <Route path="/groups/:groupId" element={<GroupDetail />} />
              <Route path="/groups/:groupId/settle" element={<SettleUp />} />
              <Route path="/groups/:groupId/settlements" element={<SettlementHistory />} />
              <Route path="/expenses/new" element={<AddExpense />} />
              <Route path="/expenses/:id" element={<ExpenseDetail />} />
              <Route path="/expenses/:id/edit" element={<EditExpense />} />
              <Route path="/subscription" element={<Subscription />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/profile/edit" element={<EditProfile />} />
              <Route path="/complete-profile" element={<ProfileCompletion />} />
              <Route path="/notifications" element={<Notifications />} />
              <Route path="/guide" element={<ApplicationGuide />} />
              <Route path="/admin" element={<RequireAdmin><AdminDashboard /></RequireAdmin>} />
              <Route path="/admin/users" element={<RequireAdmin><UserManagement /></RequireAdmin>} />
            </Route>

            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
            </SubscriptionProvider>
          </GroupProvider>
        </ToastProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
