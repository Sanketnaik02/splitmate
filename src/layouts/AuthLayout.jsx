import { Link } from 'react-router-dom';

export default function AuthLayout({ children, title, subtitle, alternate }) {
  return (
    <div className="min-h-screen bg-surface-secondary flex items-center justify-center p-5">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-primary-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary-600/30">
            <span className="text-2xl font-bold text-white">S</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">SplitMate</h1>
          <p className="text-sm text-gray-500 mt-1">Split expenses, not friendships</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-6">
          {title && <h2 className="text-lg font-semibold text-gray-900 mb-1">{title}</h2>}
          {subtitle && <p className="text-sm text-gray-500 mb-5">{subtitle}</p>}
          {children}
        </div>

        {alternate && (
          <p className="text-center text-sm text-gray-500 mt-5">
            {alternate.text} <Link to={alternate.to} className="text-primary-600 font-medium hover:text-primary-700">{alternate.link}</Link>
          </p>
        )}
      </div>
    </div>
  );
}
