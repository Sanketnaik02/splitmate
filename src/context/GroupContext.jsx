import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { store } from '../utils/storage';
import { useAuth } from './AuthContext';

const GroupContext = createContext();

export function GroupProvider({ children }) {
  const { user } = useAuth();
  const [groups, setGroups] = useState([]);
  const [activeGroup, setActiveGroupState] = useState(null);
  const [members, setMembers] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [settlements, setSettlements] = useState([]);

  const loadGroups = useCallback(() => {
    try {
      if (!user) { setGroups([]); return; }
      const memberEntries = store.where('members', 'userId', user.id);
      const groupIds = [...new Set(memberEntries.map((m) => m.groupId))];
      const all = store.getAll('groups');
      const myGroups = all.filter((g) => groupIds.includes(g.id)).map((g) => {
        const gMembers = store.where('members', 'groupId', g.id);
        const gExpenses = store.where('expenses', 'groupId', g.id);
        const gSettlements = store.where('settlements', 'groupId', g.id);
        const balances = {};
        gMembers.forEach((m) => { balances[m.userId] = 0; });
        gExpenses.forEach((e) => {
          if (balances[e.paidBy] !== undefined) balances[e.paidBy] += e.amount;
          if (e.splitDetails) {
            Object.entries(e.splitDetails).forEach(([uid, share]) => {
              if (balances[uid] !== undefined) balances[uid] -= share;
            });
          }
        });
        gSettlements.filter((s) => s.status === 'completed').forEach((s) => {
          if (balances[s.fromUserId] !== undefined) balances[s.fromUserId] += s.amount;
          if (balances[s.toUserId] !== undefined) balances[s.toUserId] -= s.amount;
        });
        return {
          ...g,
          members: gMembers,
          memberCount: gMembers.length,
          totalExpenses: gExpenses.reduce((sum, e) => sum + e.amount, 0),
          balance: Math.round((balances[user.id] || 0) * 100) / 100,
        };
      });
      setGroups(myGroups);
    } catch (err) {
      console.error('[GroupContext] loadGroups error:', err);
      setGroups([]);
    }
  }, [user]);

  useEffect(() => { loadGroups(); }, [loadGroups]);

  const setActiveGroup = useCallback((groupId) => {
    const group = store.get('groups', groupId);
    setActiveGroupState(group || null);
    if (group) {
      setMembers(store.where('members', 'groupId', groupId));
      setExpenses(store.where('expenses', 'groupId', groupId));
      setSettlements(store.where('settlements', 'groupId', groupId));
    } else {
      setMembers([]);
      setExpenses([]);
      setSettlements([]);
    }
  }, []);

  const createGroup = useCallback((data) => {
    if (!user) return null;
    const newGroup = store.add('groups', {
      name: data.name,
      category: data.category || 'other',
      description: data.description || '',
      createdBy: user.id,
      currency: 'INR',
      inviteCode: Math.random().toString(36).substring(2, 8).toUpperCase(),
    });
    store.add('members', {
      groupId: newGroup.id,
      userId: user.id,
      displayName: user.displayName,
      role: 'admin',
    });
    loadGroups();
    return newGroup;
  }, [user, loadGroups]);

  const addMember = useCallback((groupId, userId, displayName) => {
    const exists = store.where('members', 'groupId', groupId).find((m) => m.userId === userId);
    if (exists) return null;
    const member = store.add('members', { groupId, userId, displayName, role: 'member' });
    if (activeGroup?.id === groupId) setMembers((prev) => [...prev, member]);
    loadGroups();
    return member;
  }, [activeGroup, loadGroups]);

  const removeMember = useCallback((groupId, userId) => {
    const entry = store.where('members', 'groupId', groupId).find((m) => m.userId === userId);
    if (entry) store.remove('members', entry.id);
    if (activeGroup?.id === groupId) setMembers((prev) => prev.filter((m) => m.userId !== userId));
    loadGroups();
  }, [activeGroup, loadGroups]);

  const addExpense = useCallback((groupId, expenseData) => {
    const exp = store.add('expenses', { ...expenseData, groupId });
    if (activeGroup?.id === groupId) setExpenses((prev) => [...prev, exp]);
    loadGroups();
    return exp;
  }, [activeGroup, loadGroups]);

  const updateExpense = useCallback((expenseId, updates) => {
    const updated = store.update('expenses', expenseId, updates);
    if (updated && activeGroup) {
      setExpenses((prev) => prev.map((e) => e.id === expenseId ? { ...e, ...updated } : e));
    }
    loadGroups();
    return updated;
  }, [activeGroup, loadGroups]);

  const deleteExpense = useCallback((expenseId) => {
    store.remove('expenses', expenseId);
    if (activeGroup) setExpenses((prev) => prev.filter((e) => e.id !== expenseId));
    loadGroups();
  }, [activeGroup, loadGroups]);

  const addSettlement = useCallback((groupId, settlementData) => {
    const s = store.add('settlements', { ...settlementData, groupId });
    if (activeGroup?.id === groupId) setSettlements((prev) => [...prev, s]);
    loadGroups();
    return s;
  }, [activeGroup, loadGroups]);

  const updateSettlement = useCallback((settlementId, updates) => {
    const updated = store.update('settlements', settlementId, updates);
    if (updated && activeGroup) {
      setSettlements((prev) => prev.map((s) => s.id === settlementId ? { ...s, ...updated } : s));
    }
    loadGroups();
    return updated;
  }, [activeGroup, loadGroups]);

  return (
    <GroupContext.Provider value={{
      groups, activeGroup, setActiveGroup, members, expenses, settlements,
      createGroup, addMember, removeMember,
      addExpense, updateExpense, deleteExpense,
      addSettlement, updateSettlement, loadGroups,
    }}>
      {children}
    </GroupContext.Provider>
  );
}

export function useGroup() {
  const ctx = useContext(GroupContext);
  if (!ctx) throw new Error('useGroup must be used within GroupProvider');
  return ctx;
}
