import { useNavigate } from 'react-router-dom';
import Button from '../components/ui/Button';

export default function NotFound() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-surface-secondary flex items-center justify-center p-5">
      <div className="text-center">
        <p className="text-6xl mb-4">🔍</p>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Page not found</h1>
        <p className="text-sm text-gray-500 mb-6">The page you're looking for doesn't exist.</p>
        <Button onClick={() => navigate('/dashboard')}>Go Home</Button>
      </div>
    </div>
  );
}
