import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '../../layouts/AppLayout';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { useAuth } from '../../context/AuthContext';
import { useSubscription } from '../../context/SubscriptionContext';
import { useToast } from '../../components/ui/Toast';
import { SUBSCRIPTION_PLANS } from '../../config/constants';
import { track } from '../../lib/analytics';

export default function Subscription() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { planTier, upgrading, upgrade } = useSubscription();
  const { showToast } = useToast();
  const [upgradingId, setUpgradingId] = useState(null);

  useEffect(() => {
    track('subscription_viewed', { current_plan: planTier });
  }, [planTier]);

  useEffect(() => {
    if (!upgrading) setUpgradingId(null);
  }, [upgrading]);

  const handleUpgrade = async (plan) => {
    if (plan.id === planTier) {
      showToast('Already on this plan', 'info');
      return;
    }
    setUpgradingId(plan.id);
    try {
      await upgrade(plan.id);
      showToast(`Upgraded to ${plan.name} plan!`, 'success');
    } catch (err) {
      showToast(err.message || 'Upgrade failed', 'error');
    }
  };

  return (
    <AppLayout userName={user?.displayName || 'User'}>
      <div className="pt-1 space-y-4">
        <div className="flex items-center gap-3 mb-2">
          <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-700 dark:text-gray-200">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Subscription Plans</h1>
        </div>

        <p className="text-sm text-gray-600 dark:text-gray-300">
          Lifetime plans — pay once, use forever. Upgrade anytime.
        </p>

        <div className="space-y-3">
          {SUBSCRIPTION_PLANS.map((plan) => {
            const isActive = plan.id === planTier;
            const isFree = plan.id === 'free';
            return (
              <Card
                key={plan.id}
                padding="p-4"
                className={`relative ${isActive ? 'ring-2 ring-primary-500' : ''} ${plan.popular ? 'border-primary-200' : ''}`}
              >
                {plan.popular && (
                  <div className="absolute -top-2.5 right-4">
                    <Badge variant="primary" size="sm">Popular</Badge>
                  </div>
                )}

                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{plan.icon}</span>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white">{plan.name}</h3>
                      <p className="text-xs text-gray-600 dark:text-gray-300 mt-0.5">{plan.maxGroupsLabel}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    {isFree ? (
                      <span className="text-lg font-bold text-gray-900 dark:text-white">Free</span>
                    ) : (
                      <span className="text-lg font-bold text-gray-900 dark:text-white">{plan.priceLabel}</span>
                    )}
                  </div>
                </div>

                <div className="space-y-1.5 mb-4">
                  {plan.features.map((f, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm">
                      <span className="text-green-500 mt-0.5">✓</span>
                      <span className="text-gray-700 dark:text-gray-200">{f}</span>
                    </div>
                  ))}
                </div>

                <Button
                  fullWidth
                  variant={isActive ? 'secondary' : isFree ? 'secondary' : 'primary'}
                  loading={upgradingId === plan.id}
                  disabled={isActive || upgradingId !== null}
                  onClick={() => handleUpgrade(plan)}
                >
                  {isActive ? 'Current Plan' : isFree ? 'Downgrade to Free' : `Upgrade to ${plan.name}`}
                </Button>
              </Card>
            );
          })}
        </div>

        <Card padding="p-5" className="bg-gradient-to-br from-primary-50 to-primary-100 border border-primary-200">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-2xl">💎</span>
            <h3 className="text-base font-bold text-gray-900 dark:text-white">Lifetime Access</h3>
          </div>
          <p className="text-sm text-gray-700 dark:text-gray-200 leading-relaxed mb-3">
            All plans are one-time payments — no monthly subscriptions. Pay once and enjoy features forever.
          </p>
          <p className="text-xs text-gray-600 dark:text-gray-300 mb-4">Plans starting from only ₹49.</p>
          <Button fullWidth size="sm" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            Upgrade Now
          </Button>
        </Card>
      </div>
    </AppLayout>
  );
}
