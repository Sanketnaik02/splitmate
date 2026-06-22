import { supabase } from './supabase';

export const adminService = {
  async getTotalUsers() {
    const { count, error } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });
    if (error) throw error;
    return count || 0;
  },

  async getTotalGroups() {
    const { count, error } = await supabase
      .from('splitmate_groups')
      .select('*', { count: 'exact', head: true });
    if (error) throw error;
    return count || 0;
  },

  async getTotalExpenses() {
    const { count, error } = await supabase
      .from('expenses')
      .select('*', { count: 'exact', head: true });
    if (error) throw error;
    return count || 0;
  },

  async getTotalSettlements() {
    const { count, error } = await supabase
      .from('settlements')
      .select('*', { count: 'exact', head: true });
    if (error) throw error;
    return count || 0;
  },

  async getSubscriptionCounts() {
    const { data, error } = await supabase
      .from('user_subscriptions')
      .select('plan_id');
    if (error) throw error;

    const counts = { free: 0, starter: 0, premium: 0 };
    (data || []).forEach((row) => {
      if (counts.hasOwnProperty(row.plan_id)) {
        counts[row.plan_id] += 1;
      }
    });
    return counts;
  },

  async getUsersJoinedThisWeek() {
    const { count, error } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());
    if (error) throw error;
    return count || 0;
  },

  async getGroupsCreatedThisWeek() {
    const { count, error } = await supabase
      .from('splitmate_groups')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());
    if (error) throw error;
    return count || 0;
  },

  async getExpensesAddedThisWeek() {
    const { count, error } = await supabase
      .from('expenses')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());
    if (error) throw error;
    return count || 0;
  },

  async getAllUsers() {
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('id, email, display_name, splitmate_id, created_at')
      .order('created_at', { ascending: false });

    if (error) throw error;

    const { data: subscriptions, error: subError } = await supabase
      .from('user_subscriptions')
      .select('user_id, plan_id, updated_at');

    if (subError) throw subError;

    const subMap = {};
    (subscriptions || []).forEach(s => { subMap[s.user_id] = s; });

    return (profiles || []).map(p => ({
      id: p.id,
      email: p.email,
      display_name: p.display_name,
      splitmate_id: p.splitmate_id,
      created_at: p.created_at,
      plan_id: subMap[p.id]?.plan_id || 'free',
      subscription_updated_at: subMap[p.id]?.updated_at || null,
    }));
  },

  async updateUserPlan(adminId, targetUserId, oldPlanId, newPlanId) {
    const { data, error } = await supabase
      .from('user_subscriptions')
      .upsert({
        user_id: targetUserId,
        plan_id: newPlanId,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' })
      .select()
      .single();

    if (error) throw error;

    const { error: auditError } = await supabase
      .from('admin_actions')
      .insert({
        admin_id: adminId,
        target_user_id: targetUserId,
        action: 'plan_change',
        old_value: oldPlanId,
        new_value: newPlanId,
      });

    if (auditError) {
      console.warn('[AdminService] Failed to log audit action:', auditError.message);
    }

    return data;
  },

  async getRecentActivity() {
    const [users, groups, expenses] = await Promise.all([
      supabase
        .from('profiles')
        .select('id, email, display_name, created_at')
        .order('created_at', { ascending: false })
        .limit(5),
      supabase
        .from('splitmate_groups')
        .select('id, name, created_by, created_at')
        .order('created_at', { ascending: false })
        .limit(5),
      supabase
        .from('expenses')
        .select('id, description, amount, group_id, created_at')
        .order('created_at', { ascending: false })
        .limit(5),
    ]);

    return {
      users: users.data || [],
      groups: groups.data || [],
      expenses: expenses.data || [],
    };
  },
};
