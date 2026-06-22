import { supabase } from './supabase';

export const groupService = {
  async createGroup({ name, category, description, createdBy, currency }) {
    const payload = {
      name,
      category: category || 'other',
      description: description || '',
      created_by: createdBy,
      currency: currency || 'INR',
      invite_code: Math.random().toString(36).substring(2, 8).toUpperCase(),
    };

    const { data: group, error: groupError } = await supabase
      .from('splitmate_groups')
      .insert(payload)
      .select()
      .single();

    if (groupError) throw groupError;

    const { data: profile } = await supabase
      .from('profiles')
      .select('display_name')
      .eq('id', createdBy)
      .single();

    const displayName = profile?.display_name || createdBy;

    const memberPayload = {
      group_id: group.id,
      user_id: createdBy,
      display_name: displayName,
      role: 'admin',
      is_registered: true,
    };

    const { error: memberError } = await supabase
      .from('group_members')
      .insert(memberPayload);

    if (memberError) throw memberError;

    return group;
  },

  async getUserGroups(userId) {
    const { data: createdGroups } = await supabase
      .from('splitmate_groups')
      .select('*')
      .eq('created_by', userId);

    const { data: memberRows } = await supabase
      .from('group_members')
      .select('group_id')
      .eq('user_id', userId);

    const memberGroupIds = [...new Set((memberRows || []).map(r => r.group_id))];

    let memberGroups = [];
    if (memberGroupIds.length > 0) {
      const { data } = await supabase
        .from('splitmate_groups')
        .select('*')
        .in('id', memberGroupIds);
      memberGroups = data || [];
    }

    const groupMap = new Map();
    [...(createdGroups || []), ...memberGroups].forEach(g => groupMap.set(g.id, g));
    return Array.from(groupMap.values());
  },

  async getGroupById(groupId) {
    const { data, error } = await supabase
      .from('splitmate_groups')
      .select('*')
      .eq('id', groupId)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async getGroupsByIds(groupIds) {
    const valid = (groupIds || []).filter(Boolean);
    if (valid.length === 0) return [];
    console.log('[DIAG] getGroupsByIds query:', { table: 'splitmate_groups', ids: valid });
    const { data, error } = await supabase
      .from('splitmate_groups')
      .select('id, name')
      .in('id', valid);
    console.log('[DIAG] getGroupsByIds response:', { data, error });
    if (error) throw error;
    return data || [];
  },

  async getGroupMembers(groupId) {
    const { data, error } = await supabase
      .from('group_members')
      .select('*')
      .eq('group_id', groupId);

    if (error) throw error;
    return data || [];
  },

  async addMember({ groupId, userId, displayName, role = 'member', isRegistered = true }) {
    console.log('[DIAG] addMember raw payload:', { group_id: groupId, user_id: userId, display_name: displayName, role, is_registered: isRegistered });
    const { data, error } = await supabase
      .from('group_members')
      .insert({
        group_id: groupId,
        user_id: userId,
        display_name: displayName,
        role,
        is_registered: isRegistered,
      })
      .select()
      .single();

    console.log('[DIAG] addMember raw response:', { data, error, errorJson: error ? JSON.stringify(error) : null });
    if (error) throw error;
    return data;
  },

  async removeMember(memberId) {
    const { error } = await supabase
      .from('group_members')
      .delete()
      .eq('id', memberId);

    if (error) throw error;
  },

  async isGroupMember(groupId, userId) {
    const { data, error } = await supabase
      .from('group_members')
      .select('id')
      .eq('group_id', groupId)
      .eq('user_id', userId)
      .maybeSingle();

    if (error) throw error;
    return !!data;
  },

  async deleteGroup(groupId) {
    const { error } = await supabase
      .from('splitmate_groups')
      .delete()
      .eq('id', groupId);

    if (error) throw error;
  },

  // ──────────────────────────────────────────────
  // Expense CRUD
  // ──────────────────────────────────────────────

  async createExpense(groupId, data, userId) {
    const { data: expense, error } = await supabase
      .from('expenses')
      .insert({
        group_id: groupId,
        description: data.description,
        category: data.category,
        amount: data.amount,
        paid_by_member_id: data.paid_by_member_id,
        created_by: userId,
        split_type: 'equal',
        date: data.date || new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    const splitRows = data.splits.map(s => ({
      expense_id: expense.id,
      member_id: s.member_id,
      share_amount: s.share_amount,
    }));

    const { error: splitsError } = await supabase
      .from('expense_splits')
      .insert(splitRows);

    if (splitsError) {
      await supabase.from('expenses').delete().eq('id', expense.id);
      throw splitsError;
    }

    const { data: splits } = await supabase
      .from('expense_splits')
      .select('*')
      .eq('expense_id', expense.id);

    return { ...expense, splits: splits || [] };
  },

  async getGroupExpenses(groupId) {
    const { data: expenses, error } = await supabase
      .from('expenses')
      .select('*')
      .eq('group_id', groupId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    if (!expenses || expenses.length === 0) return [];

    const expenseIds = expenses.map(e => e.id);

    const { data: splits, error: splitsError } = await supabase
      .from('expense_splits')
      .select('*')
      .in('expense_id', expenseIds);

    if (splitsError) throw splitsError;

    const splitMap = {};
    (splits || []).forEach(s => {
      if (!splitMap[s.expense_id]) splitMap[s.expense_id] = [];
      splitMap[s.expense_id].push(s);
    });

    return expenses.map(e => ({
      ...e,
      splits: splitMap[e.id] || [],
    }));
  },

  async getExpenseById(id) {
    const { data: expense, error } = await supabase
      .from('expenses')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    if (!expense) return null;

    const { data: splits, error: splitsError } = await supabase
      .from('expense_splits')
      .select('*')
      .eq('expense_id', id);

    if (splitsError) throw splitsError;

    return { ...expense, splits: splits || [] };
  },

  async updateExpense(id, data) {
    const { error } = await supabase
      .from('expenses')
      .update({
        description: data.description,
        category: data.category,
        amount: data.amount,
        paid_by_member_id: data.paid_by_member_id,
        split_type: data.split_type,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) throw error;

    if (data.splits) {
      const { error: deleteError } = await supabase
        .from('expense_splits')
        .delete()
        .eq('expense_id', id);

      if (deleteError) throw deleteError;

      const splitRows = data.splits.map(s => ({
        expense_id: id,
        member_id: s.member_id,
        share_amount: s.share_amount,
      }));

      const { error: insertError } = await supabase
        .from('expense_splits')
        .insert(splitRows);

      if (insertError) throw insertError;
    }

    return this.getExpenseById(id);
  },

  async deleteExpense(id) {
    const { error } = await supabase
      .from('expenses')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // ──────────────────────────────────────────────
  // Settlement CRUD
  // ──────────────────────────────────────────────

  async createSettlement(groupId, data, userId) {
    const { data: settlement, error } = await supabase
      .from('settlements')
      .insert({
        group_id: groupId,
        from_member_id: data.from_member_id,
        to_member_id: data.to_member_id,
        amount: data.amount,
        note: data.note || '',
        status: data.status || 'completed',
        created_by: userId,
      })
      .select()
      .single();

    if (error) throw error;
    return settlement;
  },

  async getGroupSettlements(groupId) {
    const { data, error } = await supabase
      .from('settlements')
      .select('*')
      .eq('group_id', groupId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getSettlementById(id) {
    const { data, error } = await supabase
      .from('settlements')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async updateSettlement(id, data) {
    const payload = { ...data, updated_at: new Date().toISOString() };
    const { error } = await supabase
      .from('settlements')
      .update(payload)
      .eq('id', id);

    if (error) throw error;
    return this.getSettlementById(id);
  },

  async deleteSettlement(id) {
    const { error } = await supabase
      .from('settlements')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },
};
