import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { adminService } from '../../lib/adminService';
import { isAdmin } from '../../utils/admin';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

function StatCard({ icon, label, value, accent }) {
  return (
    <Card padding="p-4" elevated>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide">{label}</p>
          <p className={`text-2xl font-bold mt-1 ${accent || 'text-gray-900 dark:text-white'}`}>{value}</p>
        </div>
        <span className="text-3xl">{icon}</span>
      </div>
    </Card>
  );
}

function SectionHeader({ title }) {
  return (
    <h2 className="text-sm font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wide mt-6 mb-3">{title}</h2>
  );
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  const authorized = isAdmin(user?.email);
  console.log('[AdminDashboard] user.email:', user?.email);
  console.log('[AdminDashboard] isAdmin():', authorized);

  useEffect(() => {
    if (!authorized) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const results = await Promise.all([
          adminService.getTotalUsers(),
          adminService.getTotalGroups(),
          adminService.getTotalExpenses(),
          adminService.getTotalSettlements(),
          adminService.getSubscriptionCounts(),
          adminService.getUsersJoinedThisWeek(),
          adminService.getGroupsCreatedThisWeek(),
          adminService.getExpensesAddedThisWeek(),
          adminService.getRecentActivity(),
        ]);

        if (!cancelled) {
          setData({
            totalUsers: results[0],
            totalGroups: results[1],
            totalExpenses: results[2],
            totalSettlements: results[3],
            subscriptionCounts: results[4],
            usersThisWeek: results[5],
            groupsThisWeek: results[6],
            expensesThisWeek: results[7],
            recentActivity: results[8],
          });
        }
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [authorized]);

  if (loading) {
    if (!authorized) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
          <div className="text-center max-w-sm">
            <p className="text-5xl mb-4">🔒</p>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Access Denied</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">You do not have permission to access this page.</p>
            <button
              onClick={() => navigate('/dashboard')}
              className="px-5 py-2.5 bg-primary-600 text-white rounded-xl text-sm font-medium"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      );
    }
    return <LoadingSpinner overlay />;
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
        <div className="text-center max-w-sm">
          <p className="text-5xl mb-4">⚠️</p>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Error Loading Data</h1>
          <p className="text-sm text-red-500 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-5 py-2.5 bg-primary-600 text-white rounded-xl text-sm font-medium"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const { totalUsers, totalGroups, totalExpenses, totalSettlements, subscriptionCounts, usersThisWeek, groupsThisWeek, expensesThisWeek, recentActivity } = data;

  function timeAgo(dateStr) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-700 dark:text-gray-200 flex-shrink-0">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Admin Dashboard</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Founder analytics overview</p>
          </div>
        </div>

        <SectionHeader title="Overview" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard icon="👤" label="Total Users" value={totalUsers.toLocaleString()} />
          <StatCard icon="👥" label="Total Groups" value={totalGroups.toLocaleString()} />
          <StatCard icon="💰" label="Total Expenses" value={totalExpenses.toLocaleString()} />
          <StatCard icon="🤝" label="Total Settlements" value={totalSettlements.toLocaleString()} />
        </div>

        <SectionHeader title="Subscriptions" />
        <div className="grid grid-cols-3 gap-3">
          <StatCard icon="🎁" label="Free Users" value={subscriptionCounts.free.toLocaleString()} accent="text-gray-700 dark:text-gray-200" />
          <StatCard icon="🚀" label="Starter Users" value={subscriptionCounts.starter.toLocaleString()} accent="text-primary-600" />
          <StatCard icon="👑" label="Premium Users" value={subscriptionCounts.premium.toLocaleString()} accent="text-amber-600" />
        </div>

        <SectionHeader title="This Week" />
        <div className="grid grid-cols-3 gap-3">
          <StatCard icon="📈" label="Users Joined" value={usersThisWeek.toLocaleString()} />
          <StatCard icon="📁" label="Groups Created" value={groupsThisWeek.toLocaleString()} />
          <StatCard icon="🧾" label="Expenses Added" value={expensesThisWeek.toLocaleString()} />
        </div>

        <SectionHeader title="Recent Activity" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Card padding="p-4" elevated>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">👤</span>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Latest Users</h3>
            </div>
            <div className="space-y-2.5">
              {recentActivity.users.map((u) => (
                <div key={u.id} className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-gray-900 dark:text-white truncate">{u.display_name || 'Unknown'}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{u.email || ''}</p>
                  </div>
                  <Badge size="sm">{timeAgo(u.created_at)}</Badge>
                </div>
              ))}
              {recentActivity.users.length === 0 && (
                <p className="text-sm text-gray-400 dark:text-gray-500">No users yet</p>
              )}
            </div>
          </Card>

          <Card padding="p-4" elevated>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">👥</span>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Latest Groups</h3>
            </div>
            <div className="space-y-2.5">
              {recentActivity.groups.map((g) => (
                <div key={g.id} className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-gray-900 dark:text-white truncate">{g.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">Created by {g.created_by?.slice(0, 8)}</p>
                  </div>
                  <Badge size="sm">{timeAgo(g.created_at)}</Badge>
                </div>
              ))}
              {recentActivity.groups.length === 0 && (
                <p className="text-sm text-gray-400 dark:text-gray-500">No groups yet</p>
              )}
            </div>
          </Card>

          <Card padding="p-4" elevated>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">🧾</span>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Latest Expenses</h3>
            </div>
            <div className="space-y-2.5">
              {recentActivity.expenses.map((e) => (
                <div key={e.id} className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-gray-900 dark:text-white truncate">{e.description}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">₹{Number(e.amount).toLocaleString()}</p>
                  </div>
                  <Badge size="sm">{timeAgo(e.created_at)}</Badge>
                </div>
              ))}
              {recentActivity.expenses.length === 0 && (
                <p className="text-sm text-gray-400 dark:text-gray-500">No expenses yet</p>
              )}
            </div>
          </Card>
        </div>

        <div className="h-12" />
      </div>
    </div>
  );
}
