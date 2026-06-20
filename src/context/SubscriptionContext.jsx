import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { store } from '../utils/storage';
import { groupService } from '../lib/groupService';
import { SUBSCRIPTION_PLANS } from '../config/constants';

const SubscriptionContext = createContext();

function getPlanId(user) {
  if (!user) return 'free';
  const subs = store.where('subscriptions', 'userId', user.id);
  return subs.length > 0 ? subs[0].planId : 'free';
}

function getInitialGroupCount(user) {
  if (!user) return 0;
  const all = store.getAll('groups');
  const memberEntries = store.where('members', 'userId', user.id);
  const groupIds = [...new Set(memberEntries.map(m => m.groupId))];
  return all.filter(g => groupIds.includes(g.id)).length;
}

export function SubscriptionProvider({ children }) {
  const { user } = useAuth();
  const [planId, setPlanId] = useState(() => getPlanId(user));
  const [groupCount, setGroupCount] = useState(() => getInitialGroupCount(user));

  useEffect(() => {
    if (!user) { setGroupCount(0); return; }

    let cancelled = false;

    const fetchCount = async () => {
      try {
        const supabaseGroups = await groupService.getUserGroups(user.id);

        const localMemberEntries = store.where('members', 'userId', user.id);
        const localGroupIds = [...new Set(localMemberEntries.map(m => m.groupId))];
        const localGroups = store.getAll('groups').filter(g => localGroupIds.includes(g.id));

        const seen = new Set();
        supabaseGroups.forEach(g => seen.add(g.id));
        localGroups.forEach(g => {
          if (!seen.has(g.id)) seen.add(g.id);
        });

        if (!cancelled) setGroupCount(seen.size);
      } catch {
        if (!cancelled) setGroupCount(0);
      }
    };

    fetchCount();

    return () => { cancelled = true; };
  }, [user]);

  const plan = SUBSCRIPTION_PLANS.find((p) => p.id === planId) || SUBSCRIPTION_PLANS[0];
  const remaining = plan.maxGroups - groupCount;
  const atLimit = groupCount >= plan.maxGroups;

  const upgrade = useCallback((newPlanId) => {
    if (!user) return;
    const subs = store.where('subscriptions', 'userId', user.id);
    if (subs.length > 0) {
      store.update('subscriptions', subs[0].id, { planId: newPlanId, updatedAt: new Date().toISOString() });
    } else {
      store.add('subscriptions', { userId: user.id, planId: newPlanId, activatedAt: new Date().toISOString() });
    }
    setPlanId(newPlanId);
  }, [user]);

  return (
    <SubscriptionContext.Provider value={{ planId, plan, groupCount, remaining, atLimit, upgrade }}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const ctx = useContext(SubscriptionContext);
  if (!ctx) throw new Error('useSubscription must be used within SubscriptionProvider');
  return ctx;
}
