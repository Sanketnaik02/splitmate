import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { store } from '../utils/storage';

export default function useInvitations(groupId) {
  const { user } = useAuth();
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const listenerRef = useRef(null);

  const fetchInvitations = useCallback(async () => {
    if (!user) {
      setInvitations([]);
      setPendingCount(0);
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('group_invitations')
        .select('*')
        .or(`receiver_id.eq.${user.id},sender_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setInvitations(data || []);

      const count = (data || []).filter((inv) => inv.receiver_id === user.id && inv.status === 'pending').length;
      setPendingCount(count);
    } catch (err) {
      console.error('[Invitations] fetch error:', err.message);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchInvitations();

    if (!user) return;
    const channel = supabase
      .channel('invitations-changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'group_invitations', filter: `receiver_id=eq.${user.id}` },
        () => { fetchInvitations(); }
      )
      .subscribe();

    listenerRef.current = channel;

    return () => {
      if (listenerRef.current) {
        supabase.removeChannel(listenerRef.current);
      }
    };
  }, [user, fetchInvitations]);

  const sendInvitation = useCallback(async (receiverSplitmateId) => {
    if (!user || !groupId) throw new Error('Missing user or group');

    const { data: receiver, error: receiverError } = await supabase
      .from('profiles')
      .select('id, display_name, splitmate_id')
      .eq('splitmate_id', receiverSplitmateId.toUpperCase())
      .maybeSingle();

    if (receiverError) throw receiverError;
    if (!receiver) throw new Error('User not found');
    if (receiver.id === user.id) throw new Error('Cannot invite yourself');

    const existingMember = store.where('members', 'groupId', groupId).find((m) => m.userId === receiver.id);
    if (existingMember) throw new Error('Already a member');

    const { data: existingInvite, error: inviteCheckError } = await supabase
      .from('group_invitations')
      .select('id, status')
      .eq('group_id', groupId)
      .eq('sender_id', user.id)
      .eq('receiver_id', receiver.id)
      .eq('status', 'pending')
      .maybeSingle();

    if (inviteCheckError) throw inviteCheckError;
    if (existingInvite) throw new Error('Invitation already pending');

    const { error: insertError } = await supabase
      .from('group_invitations')
      .insert({
        group_id: groupId,
        sender_id: user.id,
        receiver_id: receiver.id,
        status: 'pending',
      });

    if (insertError) throw insertError;

    await fetchInvitations();
    return receiver;
  }, [user, groupId, fetchInvitations]);

  const acceptInvitation = useCallback(async (invitationId) => {
    const invitation = invitations.find((inv) => inv.id === invitationId);
    if (!invitation) throw new Error('Invitation not found');
    if (invitation.receiver_id !== user?.id) throw new Error('Unauthorized');
    if (invitation.status !== 'pending') throw new Error('Invitation is no longer pending');

    const { error } = await supabase
      .from('group_invitations')
      .update({ status: 'accepted', updated_at: new Date().toISOString() })
      .eq('id', invitationId)
      .eq('receiver_id', user.id);

    if (error) throw error;

    const senderProfile = await supabase
      .from('profiles')
      .select('display_name')
      .eq('id', invitation.sender_id)
      .maybeSingle();

    const displayName = senderProfile?.data?.display_name || 'User';
    store.add('members', {
      groupId: invitation.group_id,
      userId: user.id,
      displayName: user.displayName || displayName,
      role: 'member',
      isRegistered: true,
    });

    await fetchInvitations();
  }, [invitations, user, fetchInvitations]);

  const rejectInvitation = useCallback(async (invitationId) => {
    const invitation = invitations.find((inv) => inv.id === invitationId);
    if (!invitation) throw new Error('Invitation not found');
    if (invitation.receiver_id !== user?.id) throw new Error('Unauthorized');
    if (invitation.status !== 'pending') throw new Error('Invitation is no longer pending');

    const { error } = await supabase
      .from('group_invitations')
      .update({ status: 'rejected', updated_at: new Date().toISOString() })
      .eq('id', invitationId)
      .eq('receiver_id', user.id);

    if (error) throw error;
    await fetchInvitations();
  }, [invitations, user, fetchInvitations]);

  const cancelInvitation = useCallback(async (invitationId) => {
    const invitation = invitations.find((inv) => inv.id === invitationId);
    if (!invitation) throw new Error('Invitation not found');
    if (invitation.sender_id !== user?.id) throw new Error('Unauthorized');

    const { error } = await supabase
      .from('group_invitations')
      .update({ status: 'cancelled', updated_at: new Date().toISOString() })
      .eq('id', invitationId)
      .eq('sender_id', user.id);

    if (error) throw error;
    await fetchInvitations();
  }, [invitations, user, fetchInvitations]);

  return {
    invitations,
    loading,
    pendingCount,
    sendInvitation,
    acceptInvitation,
    rejectInvitation,
    cancelInvitation,
    refresh: fetchInvitations,
  };
}
