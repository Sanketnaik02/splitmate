import React, { createContext, useContext, useState, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { store } from '../utils/storage';
import { SUBSCRIPTION_PLANS } from '../config/constants';

const SubscriptionContext = createContext();

function getPlanId(user) {
  if (!user) return 'free';
  const subs = store.where('subscriptions', 'userId', user.id);
  return subs.length > 0 ? subs[0].planId : 'free';
}

export function SubscriptionProvider({ children }) {
  const { user } = useAuth();
  const [planId, setPlanId] = useState(() => getPlanId(user));

  const groupCount = (() => {
    if (!user) return 0;
    const all = store.getAll('groups');
    return all.filter((g) => {
      const members = store.where('members', 'groupId', g.id);
      return members.some((m) => m.userId === user.id);
    }).length;
  })();

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
