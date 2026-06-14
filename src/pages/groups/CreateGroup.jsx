import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '../../layouts/AppLayout';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import Select from '../../components/form/Select';
import Card from '../../components/ui/Card';
import Modal from '../../components/ui/Modal';
import { GROUP_CATEGORIES } from '../../config/constants';
import { validateGroupName } from '../../utils/validators';
import { useGroup } from '../../context/GroupContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/ui/Toast';
import { useSubscription } from '../../context/SubscriptionContext';

export default function CreateGroup() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { createGroup } = useGroup();
  const { showToast } = useToast();
  const { plan, planId, groupCount, atLimit } = useSubscription();
  const [name, setName] = useState('');
  const [category, setCategory] = useState('other');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [showLimitPopup, setShowLimitPopup] = useState(false);
  const [showLastWarning, setShowLastWarning] = useState(false);

  const isLastFreeGroup = planId === 'free' && groupCount === 4;

  const doCreateGroup = () => {
    const newGroup = createGroup({ name: name.trim(), category, description });
    showToast('Group created! Add members to start splitting.', 'success');
    navigate(`/groups/${newGroup.id}`);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    const nameErr = validateGroupName(name);
    if (nameErr) { setError(nameErr); return; }
    if (atLimit) {
      setShowLimitPopup(true);
      return;
    }
    if (isLastFreeGroup) {
      setShowLastWarning(true);
      return;
    }
    doCreateGroup();
  };

  return (
    <AppLayout userName={user?.displayName || 'User'}>
      <div className="pt-1">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-600">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <h1 className="text-xl font-bold text-gray-900">Create Group</h1>
        </div>

        <Card padding="p-3" className={`mb-4 flex items-center justify-between ${isLastFreeGroup ? 'border-amber-200 ring-1 ring-amber-200 dark:border-amber-700 dark:ring-amber-700' : ''}`}>
          <div>
            <div className="flex items-center gap-2">
              <p className="text-xs text-gray-500">Your Plan: <span className="font-semibold text-gray-700">{plan.icon} {plan.name}</span></p>
              {isLastFreeGroup && <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-medium">1 left</span>}
            </div>
            <p className="text-xs text-gray-400 mt-0.5">Groups: {groupCount} / {plan.maxGroups}</p>
          </div>
          <Button size="sm" variant="ghost" onClick={() => navigate('/subscription')}>Upgrade</Button>
        </Card>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
          <Input label="Group Name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Goa Trip" icon="👥" />
          <Select label="Category" value={category} onChange={(e) => setCategory(e.target.value)}
            options={GROUP_CATEGORIES.map((c) => ({ value: c.id, label: `${c.icon}  ${c.label}` }))} />
          <Input label="Description (optional)" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="A short note" />
          <div className="pt-4 space-y-3">
            <Button type="submit" fullWidth disabled={atLimit && groupCount >= plan.maxGroups}>Create Group</Button>
            <Button type="button" variant="secondary" fullWidth onClick={() => navigate(-1)}>Cancel</Button>
          </div>
        </form>

        <Modal isOpen={showLastWarning} onClose={() => setShowLastWarning(false)}
          title="⚠️ Last Free Group"
          footer={
            <>
              <Button variant="secondary" size="sm" onClick={() => { setShowLastWarning(false); navigate('/subscription'); }}>View Plans</Button>
              <Button size="sm" onClick={() => { setShowLastWarning(false); doCreateGroup(); }}>Continue Creating Group</Button>
            </>
          }
        >
          <div className="space-y-3">
            <p className="text-sm text-gray-700">You are about to use your final available group under the <strong>Free Plan</strong>.</p>
            <p className="text-sm text-gray-600">After this group, you will need to upgrade to continue creating new groups.</p>
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5">
              <p className="text-xs text-amber-800 font-medium">Our plans start from only ₹20.</p>
            </div>
          </div>
        </Modal>

        <Modal isOpen={showLimitPopup} onClose={() => setShowLimitPopup(false)}
          title="Group Limit Reached"
          footer={
            <>
              <Button variant="secondary" size="sm" onClick={() => setShowLimitPopup(false)}>Cancel</Button>
              <Button size="sm" onClick={() => { setShowLimitPopup(false); navigate('/subscription'); }}>View Plans</Button>
            </>
          }
        >
          <div className="space-y-3">
            <p className="text-sm text-gray-700">
              You have reached your <strong>{plan.name}</strong> plan limit of <strong>{plan.maxGroups} groups</strong>.
            </p>
            <p className="text-sm text-gray-600">Upgrade your plan to create additional groups.</p>
          </div>
        </Modal>
      </div>
    </AppLayout>
  );
}
