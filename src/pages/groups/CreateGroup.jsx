import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '../../layouts/AppLayout';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import Select from '../../components/form/Select';
import Card from '../../components/ui/Card';
import UpgradeModal from '../../components/subscription/UpgradeModal';
import { GROUP_CATEGORIES } from '../../config/constants';
import { useGroup } from '../../context/GroupContext';
import { createGroupSchema, validate } from '../../validators';
import { captureError } from '../../lib/sentry';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/ui/Toast';
import { useSubscription } from '../../context/SubscriptionContext';

export default function CreateGroup() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { createGroup } = useGroup();
  const { showToast } = useToast();
  const { plan, planTier, createdGroupCount, canCreateGroup, remainingGroups } = useSubscription();
  const [name, setName] = useState('');
  const [category, setCategory] = useState('other');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const doCreateGroup = async () => {
    try {
      const newGroup = await createGroup({ name: name.trim(), category, description });
      showToast('Group created! Add members to start splitting.', 'success');
      navigate(`/groups/${newGroup.id}`);
    } catch (err) {
      const hint = err.hint || err.message || '';
      if (hint.includes('upgrade_required')) {
        setShowUpgradeModal(true);
        return;
      }
      captureError(err, { tag: 'group.create', extra: { name: name.trim(), category } });
      showToast('Failed to create group: ' + err.message, 'error');
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    const result = validate(createGroupSchema, { name });
    if (!result.success) {
      const firstError = Object.values(result.errors)[0];
      setError(firstError || 'Invalid group name');
      return;
    }
    if (!canCreateGroup) {
      setShowUpgradeModal(true);
      return;
    }
    doCreateGroup();
  };

  return (
    <AppLayout userName={user?.displayName || 'User'}>
      <div className="pt-1">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-700 dark:text-gray-200">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Create Group</h1>
        </div>

        <Card padding="p-3" className="mb-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <p className="text-xs text-gray-600 dark:text-gray-300">Your Plan: <span className="font-semibold text-gray-700 dark:text-gray-200">{plan.icon} {plan.name}</span></p>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-300 mt-0.5">
                Groups created: {createdGroupCount}
                {plan.maxGroups === -1
                  ? ' / Unlimited'
                  : ` / ${plan.maxGroups}`}
              </p>
            </div>
            <Button size="sm" variant="ghost" onClick={() => navigate('/subscription')}>Upgrade</Button>
          </div>
        </Card>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
          <Input label="Group Name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Goa Trip" icon="👥" />
          <Select label="Category" value={category} onChange={(e) => setCategory(e.target.value)}
            options={GROUP_CATEGORIES.map((c) => ({ value: c.id, label: `${c.icon}  ${c.label}` }))} />
          <Input label="Description (optional)" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="A short note" />
          <div className="pt-4 space-y-3">
            <Button type="submit" fullWidth disabled={!canCreateGroup && createdGroupCount >= plan.maxGroups && plan.maxGroups !== -1}>
              {canCreateGroup ? 'Create Group' : 'Upgrade to Create'}
            </Button>
            <Button type="button" variant="secondary" fullWidth onClick={() => navigate(-1)}>Cancel</Button>
          </div>
        </form>

        <UpgradeModal isOpen={showUpgradeModal} onClose={() => setShowUpgradeModal(false)} />
      </div>
    </AppLayout>
  );
}
