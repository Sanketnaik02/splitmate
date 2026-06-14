import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../ui/LoadingSpinner';

export default function ProtectedRoute() {
  const { user, loading } = useAuth();

  console.log('[ProtectedRoute] DEBUG loading:', loading, 'user:', user?.id || null);

  if (loading) return <LoadingSpinner overlay />;
  if (!user) {
    console.log('[ProtectedRoute] DEBUG redirecting to /signin — no user');
    return <Navigate to="/signin" replace />;
  }
  return <Outlet />;
}
