import React from 'react';
import { useNavigate } from 'react-router-dom';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { SUBSCRIPTION_PLANS } from '../../config/constants';

export default function UpgradeModal({ isOpen, onClose }) {
  const navigate = useNavigate();
  const paidPlans = SUBSCRIPTION_PLANS.filter(p => p.id !== 'free');

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="🚀 Upgrade Required"
      footer={
        <>
          <Button variant="secondary" size="sm" onClick={onClose}>Maybe Later</Button>
          <Button size="sm" onClick={() => { onClose(); navigate('/subscription'); }}>View Plans</Button>
        </>
      }
    >
      <div className="space-y-4">
        <p className="text-sm text-gray-700 dark:text-gray-200">
          You've reached the group creation limit for your current plan. Upgrade to unlock more groups.
        </p>
        <div className="space-y-2">
          {paidPlans.map((p) => (
            <div
              key={p.id}
              className="flex items-center justify-between bg-gray-50 dark:bg-gray-700/50 rounded-xl px-3 py-2.5"
            >
              <div className="flex items-center gap-2">
                <span className="text-lg">{p.icon}</span>
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{p.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-300">{p.maxGroupsLabel}</p>
                </div>
              </div>
              <span className="text-sm font-bold text-primary-600 dark:text-primary-400">{p.priceLabel}</span>
            </div>
          ))}
        </div>
      </div>
    </Modal>
  );
}
