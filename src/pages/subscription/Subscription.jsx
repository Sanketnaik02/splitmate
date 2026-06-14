import React from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '../../layouts/AppLayout';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { useAuth } from '../../context/AuthContext';
import { useSubscription } from '../../context/SubscriptionContext';
import { SUBSCRIPTION_PLANS } from '../../config/constants';
import { useToast } from '../../components/ui/Toast';

export default function Subscription() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { planId, upgrade } = useSubscription();
  const { showToast } = useToast();

  const handleUpgrade = (plan) => {
    if (plan.id === planId) { showToast('Already on this plan', 'info'); return; }
    if (plan.price === 0) {
      upgrade(plan.id);
      showToast(`Downgraded to ${plan.name} plan`, 'success');
      return;
    }
    upgrade(plan.id);
    showToast(`Upgraded to ${plan.name} plan! ₹${plan.price} charged.`, 'success');
  };

  return (
    <AppLayout userName={user?.displayName || 'User'}>
      <div className="pt-1 space-y-4">
        <div className="flex items-center gap-3 mb-2">
          <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-600">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <h1 className="text-xl font-bold text-gray-900">Subscription Plans</h1>
        </div>

        <p className="text-sm text-gray-500">Choose a plan that works for you. Upgrade anytime.</p>

        <div className="space-y-3">
          {SUBSCRIPTION_PLANS.map((plan) => {
            const isActive = plan.id === planId;
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
                      <h3 className="text-lg font-bold text-gray-900">{plan.name}</h3>
                      <p className="text-xs text-gray-500 mt-0.5">{plan.maxGroups} groups max</p>
                    </div>
                  </div>
                  <div className="text-right">
                    {plan.price === 0 ? (
                      <span className="text-lg font-bold text-gray-900">Free</span>
                    ) : (
                      <>
                        <span className="text-lg font-bold text-gray-900">₹{plan.price}</span>
                        <span className="text-xs text-gray-400 ml-0.5">/mo</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="space-y-1.5 mb-4">
                  {plan.features.map((f, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm">
                      <span className="text-green-500 mt-0.5">✓</span>
                      <span className="text-gray-600">{f}</span>
                    </div>
                  ))}
                </div>

                <Button
                  fullWidth
                  variant={isActive ? 'secondary' : plan.price === 0 ? 'secondary' : 'primary'}
                  onClick={() => handleUpgrade(plan)}
                >
                  {isActive ? 'Current Plan' : plan.price === 0 ? 'Downgrade to Free' : `Upgrade to ${plan.name}`}
                </Button>
              </Card>
            );
          })}
        </div>

        <Card padding="p-5" className="bg-gradient-to-br from-primary-50 to-primary-100 border border-primary-200">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-2xl">💎</span>
            <h3 className="text-base font-bold text-gray-900">Need more groups?</h3>
          </div>
          <p className="text-sm text-gray-600 leading-relaxed mb-3">
            Upgrade your plan and continue managing unlimited trips, events and expenses.
          </p>
          <p className="text-xs text-gray-500 mb-4">Plans starting from only ₹20.</p>
          <Button fullWidth size="sm" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            Upgrade Now
          </Button>
        </Card>
      </div>
    </AppLayout>
  );
}
