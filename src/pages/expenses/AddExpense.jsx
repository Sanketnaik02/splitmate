import React, { useState } from 'react';
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
import { validateExpenseAmount, validateExpenseDescription } from '../../utils/validators';
import { calcEqualSplit, calcSharesSplit } from '../../utils/calculators';

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
  const [paidBy, setPaidBy] = useState(user?.id || '');
  const [splitType, setSplitType] = useState('equal');
  const [splitAmong, setSplitAmong] = useState(groupMembers.map((m) => m.userId));
  const [errors, setErrors] = useState({});
  const [validationPopup, setValidationPopup] = useState({ isOpen: false, title: '', message: '' });
  const [submitting, setSubmitting] = useState(false);

  const showValidationPopup = (title, message) => {
    setValidationPopup({ isOpen: true, title, message });
  };

  const closeValidationPopup = () => {
    setValidationPopup({ isOpen: false, title: '', message: '' });
  };

  const validate = () => {
    const errs = {};
    const descErr = validateExpenseDescription(description);
    if (descErr) {
      showValidationPopup('Description Required', 'Please enter a description before adding an expense.');
      return false;
    }
    const amtErr = validateExpenseAmount(amount);
    if (amtErr) {
      showValidationPopup('Invalid Amount', amtErr);
      return false;
    }
    if (splitAmong.length === 0) errs.splitAmong = 'Select at least one person';
    if (!paidBy) errs.paidBy = 'Select who paid';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate() || !groupId) return;
    setSubmitting(true);

    const amt = parseFloat(amount);
    let splitDetails;

    if (splitType === 'equal') {
      splitDetails = calcEqualSplit(amt, splitAmong);
    } else if (splitType === 'shares') {
      const shares = {};
      splitAmong.forEach((uid) => { shares[uid] = 1; });
      splitDetails = calcSharesSplit(amt, shares);
    } else {
      splitDetails = {};
      splitAmong.forEach((uid) => { splitDetails[uid] = amt / splitAmong.length; });
    }

    addExpense(groupId, {
      description: description.trim(),
      category,
      amount: amt,
      paidBy,
      date: new Date().toISOString(),
      splitType,
      splitDetails,
    });

    showToast('Expense added!', 'success');
    setSubmitting(false);
    navigate(`/groups/${groupId}`);
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
              value={paidBy}
              onChange={(e) => setPaidBy(e.target.value)}
              className="w-full px-4 py-2.5 text-sm bg-white dark:bg-gray-100 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:border-primary-500"
            >
              {groupMembers.map((m) => (
                <option key={m.userId} value={m.userId}>{m.userId === user?.id ? `You (${user.displayName})` : m.displayName}</option>
              ))}
            </select>
            {errors.paidBy && <p className="text-xs text-red-500">{errors.paidBy}</p>}
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
