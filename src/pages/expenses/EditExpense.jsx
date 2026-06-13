import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AppLayout from '../../layouts/AppLayout';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import AmountInput from '../../components/form/AmountInput';
import CategoryPicker from '../../components/form/CategoryPicker';
import { useGroup } from '../../context/GroupContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/ui/Toast';
import { store } from '../../utils/storage';

export default function EditExpense() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { updateExpense } = useGroup();
  const { showToast } = useToast();

  const original = store.get('expenses', id);
  const [description, setDescription] = useState(original?.description || '');
  const [amount, setAmount] = useState(original ? String(original.amount) : '');
  const [category, setCategory] = useState(original?.category || 'food');

  if (!original) {
    return (
      <AppLayout userName={user?.displayName || 'User'}>
        <div className="text-center py-16"><p className="text-4xl mb-3">🔍</p><p className="text-gray-500">Expense not found</p></div>
      </AppLayout>
    );
  }

  const handleSubmit = (e) => {
    e.preventDefault();
    const amt = parseFloat(amount);
    if (!description.trim() || isNaN(amt) || amt <= 0) {
      showToast('Please fill in all fields', 'error');
      return;
    }

    const oldAmt = original.amount;
    const ratio = amt / oldAmt;
    const newSplit = {};
    Object.entries(original.splitDetails || {}).forEach(([uid, share]) => {
      newSplit[uid] = Math.round(share * ratio * 100) / 100;
    });

    updateExpense(id, {
      description: description.trim(),
      amount: amt,
      category,
      splitDetails: newSplit,
    });

    showToast('Expense updated!', 'success');
    navigate(`/expenses/${id}`);
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
          <h1 className="text-xl font-bold text-gray-900">Edit Expense</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <AmountInput label="Amount" value={amount} onChange={setAmount} />
          <Input label="Description" value={description} onChange={(e) => setDescription(e.target.value)} icon="📝" />
          <CategoryPicker value={category} onChange={setCategory} />
          <div className="pt-4 space-y-3">
            <Button type="submit" fullWidth>Save Changes</Button>
            <Button type="button" variant="secondary" fullWidth onClick={() => navigate(-1)}>Cancel</Button>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}
