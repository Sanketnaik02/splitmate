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
};
