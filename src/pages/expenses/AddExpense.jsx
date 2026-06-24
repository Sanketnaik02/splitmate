import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import AppLayout from '../../layouts/AppLayout';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import AmountInput from '../../components/form/AmountInput';
import CategoryPicker from '../../components/form/CategoryPicker';
import SplitTypeSelector from '../../components/form/SplitTypeSelector';
import MemberPicker from '../../components/form/MemberPicker';
import ValidationPopup from '../../components/ui/ValidationPopup';
import { useGroup } from '../../context/GroupContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/ui/Toast';
import { calcEqualSplit } from '../../utils/calculators';
import { addExpenseSchema, validate } from '../../validators';
import { captureError } from '../../lib/sentry';

export default function AddExpense() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const groupId = searchParams.get('group');
  const { user } = useAuth();
  const { groups, setActiveGroup, addExpense, members } = useGroup();
  const { showToast } = useToast();

  const group = groups.find((g) => g.id === groupId);
  const groupMembers = group ? group.members || [] : members;

  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('food');
  const [paidByMemberId, setPaidByMemberId] = useState('');

  useEffect(() => {
    const userMemberId = groupMembers.find(m => m.userId === user?.id)?.id || '';
    if (userMemberId) {
      setPaidByMemberId(prev => prev || userMemberId);
    }
  }, [groupMembers, user]);
  const [splitType, setSplitType] = useState('equal');
  const [splitAmong, setSplitAmong] = useState(groupMembers.map((m) => m.id));
  const [errors, setErrors] = useState({});
  const [validationPopup, setValidationPopup] = useState({ isOpen: false, title: '', message: '' });
  const [submitting, setSubmitting] = useState(false);

  const showValidationPopup = (title, message) => {
    setValidationPopup({ isOpen: true, title, message });
  };

  const closeValidationPopup = () => {
    setValidationPopup({ isOpen: false, title: '', message: '' });
  };

  const validateForm = () => {
    const parsedAmount = amount === '' ? NaN : parseFloat(amount);
    const result = validate(addExpenseSchema, {
      description,
      amount: parsedAmount,
      category,
      paid_by_member_id: paidByMemberId,
    });

    const errs = {};
    if (!result.success) {
      if (result.errors.description) {
        showValidationPopup('Description Required', result.errors.description);
        return false;
      }
      if (result.errors.amount) {
        showValidationPopup('Invalid Amount', result.errors.amount);
        return false;
      }
      if (result.errors.paid_by_member_id) {
        errs.paidByMemberId = result.errors.paid_by_member_id;
      }
    }

    if (splitAmong.length === 0) errs.splitAmong = 'Select at least one person';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm() || !groupId) return;
    setSubmitting(true);

    const amt = parseFloat(amount);
    const splitDetails = calcEqualSplit(amt, splitAmong);

    const splits = Object.entries(splitDetails).map(([memberId, shareAmount]) => ({
      member_id: memberId,
      share_amount: shareAmount,
    }));

    try {
      await addExpense(groupId, {
        description: description.trim(),
        category,
        amount: amt,
        paid_by_member_id: paidByMemberId,
        date: new Date().toISOString(),
        split_type: splitType,
        splits,
      });

      showToast('Expense added!', 'success');
      navigate(`/groups/${groupId}`);
    } catch (err) {
      captureError(err, { tag: 'expense.create', extra: { groupId, description: description.trim(), category, amount: parseFloat(amount) } });
      showToast(err.message || 'Failed to add expense', 'error');
    } finally {
      setSubmitting(false);
    }
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
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Add Expense</h1>
            {group && <span className="text-xs bg-gray-100 px-2.5 py-1 rounded-full text-gray-600 dark:text-gray-300">{group.name}</span>}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <AmountInput label="Amount" value={amount} onChange={setAmount} error={errors.amount} />
          <Input label="Description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What's this for?" icon="📝" error={errors.description} />
          <CategoryPicker value={category} onChange={setCategory} />

            <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">Paid by</label>
            <select
              value={paidByMemberId}
              onChange={(e) => setPaidByMemberId(e.target.value)}
              className="w-full px-4 py-2.5 text-sm bg-white dark:bg-gray-100 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:border-primary-500"
            >
              {groupMembers.length === 0 && (
                <option value="">No members available</option>
              )}
              {groupMembers.map((m) => (
                <option key={m.id} value={m.id}>{m.userId === user?.id ? `You (${user.displayName})` : m.displayName}</option>
              ))}
            </select>
            {errors.paidByMemberId && <p className="text-xs text-red-500">{errors.paidByMemberId}</p>}
          </div>

          <SplitTypeSelector value={splitType} onChange={setSplitType} />

          <MemberPicker label="Split among" members={groupMembers} selectedIds={splitAmong} onChange={setSplitAmong} />
          {errors.splitAmong && <p className="text-xs text-red-500">{errors.splitAmong}</p>}

          <div className="pt-4 space-y-3">
            <Button type="submit" fullWidth loading={submitting}>Add Expense</Button>
            <Button type="button" variant="secondary" fullWidth onClick={() => navigate(-1)}>Cancel</Button>
          </div>
        </form>
      </div>

      <ValidationPopup
        isOpen={validationPopup.isOpen}
        onClose={closeValidationPopup}
        title={validationPopup.title}
        message={validationPopup.message}
      />
    </AppLayout>
  );
}
