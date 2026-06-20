import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '../../layouts/AppLayout';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/ui/Toast';
import { supabase } from '../../lib/supabase';
import { store } from '../../utils/storage';
import { groupService } from '../../lib/groupService';

const TABS = [
  { id: 'pending', label: 'Pending' },
  { id: 'accepted', label: 'Accepted' },
  { id: 'rejected', label: 'Rejected' },
];

export default function Notifications() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [tab, setTab] = useState('pending');
  const [invitations, setInvitations] = useState([]);
  const [profiles, setProfiles] = useState({});
  const [groups, setGroups] = useState({});
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(null);

  const fetchProfiles = useCallback(async (ids) => {
    const uniqueIds = [...new Set(ids.filter(Boolean))];
    if (uniqueIds.length === 0) return;
    const { data } = await supabase
      .from('profiles')
      .select('id, display_name, splitmate_id')
      .in('id', uniqueIds);
    if (data) {
      const map = {};
      data.forEach((p) => { map[p.id] = p; });
      setProfiles((prev) => ({ ...prev, ...map }));
    }
  }, []);

  const fetchGroupNames = useCallback(async (groupIds) => {
    const uniqueIds = [...new Set(groupIds.filter(Boolean))];
    if (uniqueIds.length === 0) return;

    const supabaseGroups = await groupService.getGroupsByIds(uniqueIds);
    const map = {};
    const foundInSupabase = new Set();
    supabaseGroups.forEach((g) => {
      map[g.id] = g.name;
      foundInSupabase.add(g.id);
    });

    uniqueIds.forEach((id) => {
      if (!foundInSupabase.has(id)) {
        const localGroup = store.get('groups', id);
        map[id] = localGroup?.name || 'Unknown Group';
      }
    });

    setGroups((prev) => ({ ...prev, ...map }));
  }, []);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    supabase
      .from('group_invitations')
      .select('*')
      .or(`receiver_id.eq.${user.id},sender_id.eq.${user.id}`)
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (!error && data) {
          setInvitations(data);
          const profileIds = data.flatMap((inv) => [inv.sender_id, inv.receiver_id]);
          fetchProfiles(profileIds);
          const groupIds = data.map((inv) => inv.group_id);
          fetchGroupNames(groupIds);
        }
        setLoading(false);
      });
  }, [user, fetchProfiles, fetchGroupNames]);

  const getProfileName = (id) => {
    if (id === user?.id) return 'You';
    return profiles[id]?.display_name || 'Unknown User';
  };

  const getProfileSplitmateId = (id) => {
    return profiles[id]?.splitmate_id || '';
  };

  const getGroupName = (groupId) => {
    return groups[groupId] || 'Unknown Group';
  };

  const handleAccept = async (inv) => {
    setProcessing(inv.id);
    try {
      const { error } = await supabase
        .from('group_invitations')
        .update({ status: 'accepted', updated_at: new Date().toISOString() })
        .eq('id', inv.id)
        .eq('receiver_id', user.id);

      if (error) throw error;

      try {
        await groupService.addMember({
          groupId: inv.group_id,
          userId: user.id,
          displayName: user.displayName,
          role: 'member',
          isRegistered: true,
        });
      } catch {
        store.add('members', {
          groupId: inv.group_id,
          userId: user.id,
          displayName: user.displayName,
          role: 'member',
          isRegistered: true,
        });
      }

      setInvitations((prev) => prev.map((i) => i.id === inv.id ? { ...i, status: 'accepted' } : i));
      showToast('Invitation accepted! You are now a member.', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (inv) => {
    setProcessing(inv.id);
    try {
      const { error } = await supabase
        .from('group_invitations')
        .update({ status: 'rejected', updated_at: new Date().toISOString() })
        .eq('id', inv.id)
        .eq('receiver_id', user.id);

      if (error) throw error;

      setInvitations((prev) => prev.map((i) => i.id === inv.id ? { ...i, status: 'rejected' } : i));
      showToast('Invitation rejected', 'info');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setProcessing(null);
    }
  };

  const filtered = invitations.filter((inv) => {
    if (tab === 'pending') return inv.status === 'pending' && inv.receiver_id === user?.id;
    if (tab === 'accepted') return inv.status === 'accepted' && inv.receiver_id === user?.id;
    if (tab === 'rejected') return inv.status === 'rejected' && inv.receiver_id === user?.id;
    return false;
  });

  const sentInvitations = invitations.filter((inv) => inv.sender_id === user?.id);

  return (
    <AppLayout userName={user?.displayName || 'User'}>
      <div className="pt-1">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-700 dark:text-gray-200">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Notifications</h1>
        </div>

        <div className="flex gap-2 mb-4 overflow-x-auto no-scrollbar">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
                tab === t.id
                  ? 'bg-primary-600 text-white shadow-sm'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-16">
            <div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) : filtered.length === 0 && tab === 'pending' ? (
          <div className="text-center py-16">
            <p className="text-4xl mb-3">🔔</p>
            <p className="text-gray-600 dark:text-gray-300 font-medium">No pending invitations</p>
          </div>
        ) : filtered.length === 0 && tab !== 'pending' ? (
          <div className="text-center py-16">
            <p className="text-4xl mb-3">📭</p>
            <p className="text-gray-600 dark:text-gray-300 font-medium">No {tab} invitations</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((inv) => {
              const senderName = getProfileName(inv.sender_id);
              const groupName = getGroupName(inv.group_id);
              return (
                <Card key={inv.id} padding="p-4">
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg flex-shrink-0 ${
                      inv.status === 'pending' ? 'bg-yellow-100' : inv.status === 'accepted' ? 'bg-green-100' : 'bg-red-100'
                    }`}>
                      {inv.status === 'pending' ? '⏳' : inv.status === 'accepted' ? '✅' : '❌'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {senderName} invited you to join {groupName}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-300 mt-0.5">
                        {new Date(inv.created_at).toLocaleDateString()}
                      </p>
                      {inv.status === 'pending' && (
                        <div className="flex items-center gap-2 mt-3">
                          <Button
                            size="sm"
                            onClick={() => handleAccept(inv)}
                            loading={processing === inv.id}
                          >
                            Accept
                          </Button>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => handleReject(inv)}
                            disabled={processing === inv.id}
                          >
                            Reject
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {sentInvitations.length > 0 && (
          <div className="mt-6">
            <h2 className="text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wide mb-3">Sent Invitations</h2>
            <div className="space-y-2">
              {sentInvitations.map((inv) => {
                const groupName = getGroupName(inv.group_id);
                const receiverName = getProfileName(inv.receiver_id);
                const receiverId = getProfileSplitmateId(inv.receiver_id);
                return (
                  <Card key={inv.id} padding="p-3">
                    <div className="text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-700 dark:text-gray-200 font-medium">{groupName}</span>
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                          inv.status === 'accepted' ? 'bg-green-100 text-green-600' :
                          inv.status === 'rejected' ? 'bg-red-100 text-red-600' :
                          'bg-yellow-100 text-yellow-600'
                        }`}>{inv.status}</span>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-300 mt-1">
                        To: {receiverName} {receiverId ? `(${receiverId})` : ''}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-300">{new Date(inv.created_at).toLocaleDateString()}</p>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
