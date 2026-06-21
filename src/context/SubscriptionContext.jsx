import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { subscriptionService } from '../lib/subscriptionService';
import { SUBSCRIPTION_PLANS } from '../config/constants';

const SubscriptionContext = createContext();

export function SubscriptionProvider({ children }) {
  const { user } = useAuth();
  const [plan, setPlan] = useState(() => SUBSCRIPTION_PLANS[0]);
  const [createdGroupCount, setCreatedGroupCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState(false);

  const refresh = useCallback(async (userId) => {
    if (!userId) {
      setPlan(SUBSCRIPTION_PLANS[0]);
      setCreatedGroupCount(0);
      setLoading(false);
      return;
    }
    try {
      const [planData, count] = await Promise.all([
        subscriptionService.getUserPlan(userId),
        subscriptionService.getCreatedGroupCount(userId),
      ]);
      if (planData) {
        setPlan({
          id: planData.plan_id,
          name: planData.plan_name,
          icon: planData.plan_icon,
          maxGroups: planData.max_groups,
          pricePaise: planData.price_paise,
          features: planData.features || [],
          popular: planData.is_popular,
        });
      }
      setCreatedGroupCount(count);
    } catch {
      setPlan(SUBSCRIPTION_PLANS[0]);
      setCreatedGroupCount(0);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    refresh(user?.id);
  }, [user, refresh]);

  const planTier = plan?.id || 'free';
  const canCreateGroup = plan?.maxGroups === -1 || createdGroupCount < (plan?.maxGroups || 0);
  const remainingGroups = plan?.maxGroups === -1 ? Infinity : Math.max(0, (plan?.maxGroups || 0) - createdGroupCount);

  const upgrade = useCallback(async (newPlanId) => {
    if (!user) throw new Error('Not authenticated');
    setUpgrading(true);
    try {
      const targetPlan = SUBSCRIPTION_PLANS.find(p => p.id === newPlanId);
      if (!targetPlan) throw new Error('Invalid plan');

      if (newPlanId === 'free') {
        await subscriptionService.upgradePlan(user.id, 'free', null);
      } else {
        const amountPaise = targetPlan.price * 100;
        const payment = await subscriptionService.createPayment({
          userId: user.id,
          planId: newPlanId,
          amountPaise,
        });

        const result = await subscriptionService.processPayment({
          planId: newPlanId,
          amountPaise,
        });

        await subscriptionService.updatePaymentStatus(payment.id, result.status, result.gateway_ref);

        if (result.status !== 'completed') {
          throw new Error('Payment was not completed');
        }

        await subscriptionService.upgradePlan(user.id, newPlanId, payment.id);
      }

      await refresh(user.id);
    } finally {
      setUpgrading(false);
    }
  }, [user, refresh]);

  return (
    <SubscriptionContext.Provider value={{
      plan,
      planTier,
      createdGroupCount,
      canCreateGroup,
      remainingGroups,
      loading,
      upgrading,
      upgrade,
    }}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const ctx = useContext(SubscriptionContext);
  if (!ctx) throw new Error('useSubscription must be used within SubscriptionProvider');
  return ctx;
}
