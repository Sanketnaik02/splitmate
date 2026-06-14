import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { GroupProvider } from './context/GroupContext';
import { ToastProvider } from './components/ui/Toast';
import { ThemeProvider } from './context/ThemeContext';
import { SubscriptionProvider } from './context/SubscriptionContext';
import ProtectedRoute from './components/navigation/ProtectedRoute';

import SignIn from './pages/auth/SignIn';
import SignUp from './pages/auth/SignUp';
import ForgotPassword from './pages/auth/ForgotPassword';
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
import ApplicationGuide from './pages/guide/ApplicationGuide';
import NotFound from './pages/NotFound';

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
              <Route path="/guide" element={<ApplicationGuide />} />
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
