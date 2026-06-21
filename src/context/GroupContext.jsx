import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { store } from '../utils/storage';
import { useAuth } from './AuthContext';
import { groupService } from '../lib/groupService';

const GroupContext = createContext();

function normalizeMember(m) {
  return {
    ...m,
    userId: m.user_id ?? m.userId ?? null,
    displayName: m.display_name || m.displayName,
  };
}

export function GroupProvider({ children }) {
  const { user } = useAuth();
  const [groups, setGroups] = useState([]);
  const [activeGroup, setActiveGroupState] = useState(null);
  const [members, setMembers] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [settlements, setSettlements] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadGroups = useCallback(async () => {
    if (!user) { setGroups([]); return; }
    setLoading(true);
    try {
      const supabaseGroups = await groupService.getUserGroups(user.id);

      const localMemberEntries = store.where('members', 'userId', user.id);
      const localGroupIds = [...new Set(localMemberEntries.map(m => m.groupId))];
      const localGroups = store.getAll('groups').filter(g => localGroupIds.includes(g.id));

      const seen = new Set();
      const merged = [];

      const enrich = (g, gExpenses, gMembers, gSettlements) => {
        if (seen.has(g.id)) return null;
        seen.add(g.id);

        const balances = {};
        gMembers.forEach(m => { balances[m.userId] = 0; });
        gExpenses.forEach(e => {
          if (e.paid_by_member_id !== undefined && e.splits) {
            const payerMember = gMembers.find(m => m.id === e.paid_by_member_id);
            if (payerMember && balances[payerMember.userId] !== undefined)
              balances[payerMember.userId] += Number(e.amount);
            (e.splits || []).forEach(s => {
              const splitMember = gMembers.find(m => m.id === s.member_id);
              if (splitMember && balances[splitMember.userId] !== undefined)
                balances[splitMember.userId] -= Number(s.share_amount);
            });
          } else {
            if (balances[e.paidBy] !== undefined) balances[e.paidBy] += e.amount;
            if (e.splitDetails) {
              Object.entries(e.splitDetails).forEach(([uid, share]) => {
                if (balances[uid] !== undefined) balances[uid] -= share;
              });
            }
          }
        });
        (gSettlements || [])
          .filter(s => s.status === 'completed')
          .forEach(s => {
            if (s.from_member_id !== undefined) {
              const fromMember = gMembers.find(m => m.id === s.from_member_id);
              const toMember = gMembers.find(m => m.id === s.to_member_id);
              if (fromMember && balances[fromMember.userId] !== undefined)
                balances[fromMember.userId] += Number(s.amount);
              if (toMember && balances[toMember.userId] !== undefined)
                balances[toMember.userId] -= Number(s.amount);
            } else {
              if (balances[s.fromUserId] !== undefined) balances[s.fromUserId] += s.amount;
              if (balances[s.toUserId] !== undefined) balances[s.toUserId] -= s.amount;
            }
          });

        return {
          ...g,
          members: gMembers,
          memberCount: gMembers.length,
          totalExpenses: gExpenses.reduce((sum, e) => sum + (e.amount || 0), 0),
          balance: Math.round((balances[user.id] || 0) * 100) / 100,
        };
      };

      for (const g of supabaseGroups) {
        const gMembers = (await groupService.getGroupMembers(g.id)).map(normalizeMember);
        let gExpenses = [];
        try {
          gExpenses = await groupService.getGroupExpenses(g.id);
        } catch (e) { console.error('[GroupContext] loadGroups getGroupExpenses error:', e?.message || e); }
        if (!gExpenses.length) {
          gExpenses = store.where('expenses', 'groupId', g.id);
        }
        let gSettlements = [];
        try {
          gSettlements = await groupService.getGroupSettlements(g.id);
        } catch (e) { console.error('[GroupContext] loadGroups getGroupSettlements error:', e?.message || e); }
        if (!gSettlements.length) {
          gSettlements = store.where('settlements', 'groupId', g.id);
        }
        const enriched = enrich(g, gExpenses, gMembers, gSettlements);
        if (enriched) merged.push(enriched);
      }

      for (const g of localGroups) {
        const gMembers = store.where('members', 'groupId', g.id).map(normalizeMember);
        const gExpenses = store.where('expenses', 'groupId', g.id);
        const gSettlements = store.where('settlements', 'groupId', g.id);
        const enriched = enrich(g, gExpenses, gMembers, gSettlements);
        if (enriched) merged.push(enriched);
      }

      setGroups(merged);
    } catch (err) {
      console.error('[GroupContext] loadGroups error:', err);
      setGroups([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { loadGroups(); }, [loadGroups]);

  const setActiveGroup = useCallback(async (groupId) => {
    let group = groups.find(g => g.id === groupId);
    if (!group) group = store.get('groups', groupId);
    if (!group) {
      try {
        group = await groupService.getGroupById(groupId);
      } catch { /* ignore */ }
    }

    setActiveGroupState(group || null);

    if (group) {
      let gMembers = group.members || [];
      if (!gMembers.length) {
        try {
          gMembers = (await groupService.getGroupMembers(groupId)).map(normalizeMember);
        } catch {
          gMembers = store.where('members', 'groupId', groupId).map(normalizeMember);
        }
      }
      setMembers(gMembers);
      let gExpenses = [];
      try {
        gExpenses = await groupService.getGroupExpenses(groupId);
      } catch (e) { console.error('[GroupContext] setActiveGroup getGroupExpenses error:', e?.message || e); }
      if (!gExpenses.length) {
        gExpenses = store.where('expenses', 'groupId', groupId);
        // fell back to localStorage
      }
      setExpenses(gExpenses);
      let gSettlements = [];
      try {
        gSettlements = await groupService.getGroupSettlements(groupId);
      } catch (e) { console.error('[GroupContext] setActiveGroup getGroupSettlements error:', e?.message || e); }
      if (!gSettlements.length) {
        gSettlements = store.where('settlements', 'groupId', groupId);
      }
      setSettlements(gSettlements);
    } else {
      setMembers([]);
      setExpenses([]);
      setSettlements([]);
    }
  }, [groups]);

  const createGroup = useCallback(async (data) => {
    if (!user) throw new Error('Not authenticated');
    const newGroup = await groupService.createGroup({
      name: data.name,
      category: data.category || 'other',
      description: data.description || '',
      createdBy: user.id,
      currency: 'INR',
    });
    await loadGroups();
    return newGroup;
  }, [user, loadGroups]);

  const addMember = useCallback(async (groupId, userId, displayName) => {
    try {
      const member = await groupService.addMember({
        groupId, userId, displayName, role: 'member', isRegistered: true,
      });
      if (activeGroup?.id === groupId) {
        setMembers(prev => [...prev, normalizeMember(member)]);
      }
      await loadGroups();
      return member;
    } catch {
      const exists = store.where('members', 'groupId', groupId).find(m => m.userId === userId);
      if (exists) return null;
      const member = store.add('members', { groupId, userId, displayName, role: 'member' });
      if (activeGroup?.id === groupId) {
        setMembers(prev => [...prev, normalizeMember(member)]);
      }
      await loadGroups();
      return member;
    }
  }, [activeGroup, loadGroups]);

  const addGuestMember = useCallback(async (groupId, displayName) => {
    try {
      const member = await groupService.addMember({
        groupId, userId: null, displayName, role: 'member', isRegistered: false,
      });
      if (activeGroup?.id === groupId) {
        setMembers(prev => [...prev, normalizeMember(member)]);
      }
      await loadGroups();
      return member;
    } catch {
      const member = store.add('members', { groupId, userId: null, displayName, role: 'member', is_registered: false });
      if (activeGroup?.id === groupId) {
        setMembers(prev => [...prev, normalizeMember(member)]);
      }
      await loadGroups();
      return member;
    }
  }, [activeGroup, loadGroups]);

  const removeMember = useCallback(async (groupId, userId) => {
    try {
      const gMembers = await groupService.getGroupMembers(groupId);
      const member = gMembers.find(m => m.user_id === userId);
      if (member) {
        await groupService.removeMember(member.id);
      }
    } catch { /* ignore */ }
    const localEntry = store.where('members', 'groupId', groupId).find(m => m.userId === userId);
    if (localEntry) store.remove('members', localEntry.id);
    if (activeGroup?.id === groupId) {
      setMembers(prev => prev.filter(m => m.userId !== userId));
    }
    await loadGroups();
  }, [activeGroup, loadGroups]);

  const addExpense = useCallback(async (groupId, expenseData) => {
    if (!user) throw new Error('Not authenticated');
    const exp = await groupService.createExpense(groupId, expenseData, user.id);
    if (activeGroup?.id === groupId) setExpenses(prev => [...prev, exp]);
    await loadGroups();
    return exp;
  }, [activeGroup, loadGroups, user]);

  const updateExpense = useCallback(async (expenseId, updates) => {
    const updated = await groupService.updateExpense(expenseId, updates);
    if (updated && activeGroup) {
      setExpenses(prev => prev.map(e => e.id === expenseId ? { ...e, ...updated } : e));
    }
    await loadGroups();
    return updated;
  }, [activeGroup, loadGroups]);

  const deleteExpense = useCallback(async (expenseId) => {
    await groupService.deleteExpense(expenseId);
    if (activeGroup) setExpenses(prev => prev.filter(e => e.id !== expenseId));
    await loadGroups();
  }, [activeGroup, loadGroups]);

  const addSettlement = useCallback(async (groupId, settlementData) => {
    if (!user) throw new Error('Not authenticated');
    const s = await groupService.createSettlement(groupId, settlementData, user.id);
    if (activeGroup?.id === groupId) setSettlements(prev => [...prev, s]);
    await loadGroups();
    return s;
  }, [activeGroup, loadGroups, user]);

  const updateSettlement = useCallback(async (settlementId, updates) => {
    const updated = await groupService.updateSettlement(settlementId, updates);
    if (updated && activeGroup) {
      setSettlements(prev => prev.map(s => s.id === settlementId ? { ...s, ...updated } : s));
    }
    await loadGroups();
    return updated;
  }, [activeGroup, loadGroups]);

  return (
    <GroupContext.Provider value={{
      groups, activeGroup, setActiveGroup, members, expenses, settlements, loading,
      createGroup, addMember, addGuestMember, removeMember,
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
