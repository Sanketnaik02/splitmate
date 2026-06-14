import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../ui/LoadingSpinner';

export default function ProtectedRoute() {
  const { user, loading } = useAuth();

  if (loading) return <LoadingSpinner overlay />;
  if (!user) {
    return <Navigate to="/signin" replace />;
  }
  return <Outlet />;
}
