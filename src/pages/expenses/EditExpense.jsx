import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
import { calcEqualSplit, calcSharesSplit } from '../../utils/calculators';

export default function EditExpense() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { groups, expenses, updateExpense } = useGroup();
  const { showToast } = useToast();

  const original = expenses.find(e => e.id === id);
  const group = groups.find((g) => g.id === (original?.group_id || original?.groupId));
  const groupMembers = group ? (group.members || []) : [];

  const [description, setDescription] = useState(original?.description || '');
  const [amount, setAmount] = useState(original ? String(original.amount) : '');
  const [category, setCategory] = useState(original?.category || 'food');
  const [paidByMemberId, setPaidByMemberId] = useState(original?.paid_by_member_id || '');
  const [splitType, setSplitType] = useState(original?.split_type || 'equal');
  const [splitAmong, setSplitAmong] = useState(
    original?.splits ? original.splits.map(s => s.member_id) : groupMembers.map((m) => m.id)
  );
  const [validationPopup, setValidationPopup] = useState({ isOpen: false, title: '', message: '' });

  if (!original) {
    return (
      <AppLayout userName={user?.displayName || 'User'}>
        <div className="text-center py-16"><p className="text-4xl mb-3">🔍</p><p className="text-gray-600 dark:text-gray-300">Expense not found</p></div>
      </AppLayout>
    );
  }

  const showValidationPopup = (title, message) => {
    setValidationPopup({ isOpen: true, title, message });
  };

  const closeValidationPopup = () => {
    setValidationPopup({ isOpen: false, title: '', message: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const amt = parseFloat(amount);
    if (!description.trim()) {
      showValidationPopup('Description Required', 'Please enter a description before editing this expense.');
      return;
    }
    if (isNaN(amt) || amt <= 0) {
      showValidationPopup('Invalid Amount', 'Amount must be greater than 0.');
      return;
    }
    if (splitAmong.length === 0) {
      showToast('Select at least one person to split with', 'error');
      return;
    }

    let splitDetails;
    if (splitType === 'equal') {
      splitDetails = calcEqualSplit(amt, splitAmong);
    } else if (splitType === 'shares') {
      const shares = {};
      splitAmong.forEach((mid) => { shares[mid] = 1; });
      splitDetails = calcSharesSplit(amt, shares);
    } else {
      const ratio = amt / original.amount;
      splitDetails = {};
      (original.splits ? original.splits.map(s => s.member_id) : splitAmong).forEach((mid) => {
        if (splitAmong.includes(mid)) {
          const origShare = original.splits?.find(s => s.member_id === mid)?.share_amount;
          splitDetails[mid] = Math.round((origShare || amt / splitAmong.length) * ratio * 100) / 100;
        }
      });
    }

    const splits = Object.entries(splitDetails).map(([memberId, shareAmount]) => ({
      member_id: memberId,
      share_amount: shareAmount,
    }));

    try {
      await updateExpense(id, {
        description: description.trim(),
        amount: amt,
        category,
        paid_by_member_id: paidByMemberId,
        split_type: splitType,
        splits,
      });

      showToast('Expense updated!', 'success');
      navigate(`/expenses/${id}`);
    } catch (err) {
      showToast(err.message || 'Failed to update expense', 'error');
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
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Edit Expense</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <AmountInput label="Amount" value={amount} onChange={setAmount} />
          <Input label="Description" value={description} onChange={(e) => setDescription(e.target.value)} icon="📝" />
          <CategoryPicker value={category} onChange={setCategory} />

          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">Paid by</label>
            <select
              value={paidByMemberId}
              onChange={(e) => setPaidByMemberId(e.target.value)}
              className="w-full px-4 py-2.5 text-sm bg-white dark:bg-gray-100 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:border-primary-500"
            >
              {groupMembers.map((m) => (
                <option key={m.id} value={m.id}>{m.userId === user?.id ? `You (${user.displayName})` : m.displayName}</option>
              ))}
            </select>
          </div>

          <SplitTypeSelector value={splitType} onChange={setSplitType} />
          <MemberPicker label="Split among" members={groupMembers} selectedIds={splitAmong} onChange={setSplitAmong} />

          <div className="pt-4 space-y-3">
            <Button type="submit" fullWidth>Save Changes</Button>
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
