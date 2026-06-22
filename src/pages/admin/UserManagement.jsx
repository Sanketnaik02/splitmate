import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { adminService } from '../../lib/adminService';
import { isFounder } from '../../utils/admin';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Badge from '../../components/ui/Badge';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { useToast } from '../../components/ui/Toast';

const PLAN_OPTIONS = [
  { id: 'free', label: 'Free', icon: '🎁', color: 'text-gray-600' },
  { id: 'starter', label: 'Starter', icon: '🚀', color: 'text-primary-600' },
  { id: 'premium', label: 'Premium', icon: '👑', color: 'text-amber-600' },
];

function PlanBadge({ planId }) {
  const plan = PLAN_OPTIONS.find(p => p.id === planId) || PLAN_OPTIONS[0];
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold ${plan.color}`}>
      <span>{plan.icon}</span>
      <span>{plan.label}</span>
    </span>
  );
}

export default function UserManagement() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [newPlanId, setNewPlanId] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [updating, setUpdating] = useState(false);

  const authorized = isFounder(user);

  useEffect(() => {
    if (!authorized) { setLoading(false); return; }
    let cancelled = false;
    (async () => {
      try {
        const all = await adminService.getAllUsers();
        if (!cancelled) setUsers(all);
      } catch (err) {
        console.error('[UserManagement] load error:', err);
        showToast('Failed to load users', 'error');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [authorized, showToast]);

  const filtered = useMemo(() => {
    if (!search.trim()) return users;
    const q = search.toLowerCase();
    return users.filter(u =>
      (u.display_name || '').toLowerCase().includes(q) ||
      (u.email || '').toLowerCase().includes(q) ||
      (u.splitmate_id || '').toLowerCase().includes(q)
    );
  }, [users, search]);

  const openChangePlan = (u) => {
    setSelectedUser(u);
    setNewPlanId(u.plan_id);
    setConfirmOpen(true);
  };

  const handleConfirmUpdate = async () => {
    if (!selectedUser || !newPlanId || newPlanId === selectedUser.plan_id) {
      setConfirmOpen(false);
      return;
    }
    setUpdating(true);
    try {
      await adminService.updateUserPlan(user.id, selectedUser.id, selectedUser.plan_id, newPlanId);
      showToast(`${selectedUser.display_name || selectedUser.email} → ${newPlanId.charAt(0).toUpperCase() + newPlanId.slice(1)}`, 'success');
      setUsers(prev => prev.map(u =>
        u.id === selectedUser.id ? { ...u, plan_id: newPlanId } : u
      ));
      setConfirmOpen(false);
    } catch (err) {
      showToast(err.message || 'Failed to update plan', 'error');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    if (!authorized) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
          <div className="text-center max-w-sm">
            <p className="text-5xl mb-4">🔒</p>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Access Denied</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Only the founder can access user management.</p>
            <Button onClick={() => navigate('/admin')}>Back to Admin</Button>
          </div>
        </div>
      );
    }
    return <LoadingSpinner overlay />;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate('/admin')} className="w-9 h-9 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-700 dark:text-gray-200 flex-shrink-0">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">User Management</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{users.length} users</p>
          </div>
        </div>

        <div className="relative mb-4">
          <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, or SplitMate ID"
            className="w-full pl-10 pr-4 py-2.5 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:border-primary-500 text-gray-900 dark:text-white placeholder-gray-400"
          />
        </div>

        <div className="space-y-2">
          {filtered.length === 0 && (
            <div className="text-center py-12">
              <p className="text-4xl mb-3">🔍</p>
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                {search ? 'No users match your search' : 'No users found'}
              </p>
            </div>
          )}

          {filtered.map((u) => (
            <Card key={u.id} padding="p-4" elevated>
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                      {u.display_name || 'Unknown'}
                    </p>
                    <PlanBadge planId={u.plan_id} />
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">{u.email}</p>
                  {u.splitmate_id && (
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 font-mono">{u.splitmate_id}</p>
                  )}
                </div>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => openChangePlan(u)}
                >
                  Change Plan
                </Button>
              </div>
            </Card>
          ))}
        </div>

        <div className="h-12" />
      </div>

      <Modal
        isOpen={confirmOpen}
        onClose={() => !updating && setConfirmOpen(false)}
        title={`Change Plan — ${selectedUser?.display_name || selectedUser?.email || ''}`}
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setConfirmOpen(false)} disabled={updating}>Cancel</Button>
            <Button size="sm" onClick={handleConfirmUpdate} loading={updating} disabled={!newPlanId || newPlanId === selectedUser?.plan_id}>
              Confirm Change
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-3 space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500 dark:text-gray-400">Current Plan</span>
              <span className="font-semibold text-gray-900 dark:text-white">
                {selectedUser && <PlanBadge planId={selectedUser.plan_id} />}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500 dark:text-gray-400">SplitMate ID</span>
              <span className="font-mono text-xs text-gray-700 dark:text-gray-200">{selectedUser?.splitmate_id || '—'}</span>
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">New Plan</label>
            <div className="grid grid-cols-3 gap-2">
              {PLAN_OPTIONS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setNewPlanId(p.id)}
                  className={`flex flex-col items-center gap-1 p-3 rounded-xl border transition-all ${
                    newPlanId === p.id
                      ? 'border-primary-500 bg-primary-50 ring-1 ring-primary-500'
                      : 'border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  <span className="text-xl">{p.icon}</span>
                  <span className={`text-xs font-medium ${
                    newPlanId === p.id ? 'text-primary-700' : 'text-gray-900 dark:text-white'
                  }`}>{p.label}</span>
                </button>
              ))}
            </div>
          </div>

          {newPlanId && newPlanId !== selectedUser?.plan_id && (
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl px-3 py-2">
              <p className="text-xs text-amber-700 dark:text-amber-300">
                This will change <strong>{selectedUser?.display_name || selectedUser?.email}</strong>'s plan from <strong>{selectedUser?.plan_id}</strong> to <strong>{newPlanId}</strong>. This action is logged.
              </p>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
