import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../ui/LoadingSpinner';

const PUBLIC_PATHS = ['/complete-profile'];

export default function ProtectedRoute() {
  const { user, loading } = useAuth();
  const { pathname } = useLocation();

  if (loading) return <LoadingSpinner overlay />;
  if (!user) {
    return <Navigate to="/signin" replace />;
  }

  if (!user.profileCompleted && !PUBLIC_PATHS.includes(pathname)) {
    return <Navigate to="/complete-profile" replace />;
  }

  return <Outlet />;
}
