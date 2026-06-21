import { supabase } from './supabase';

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export const subscriptionService = {
  async getPlans() {
    const { data, error } = await supabase
      .from('plans')
      .select('*')
      .order('price_paise', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  async getUserPlan(userId) {
    const { data, error } = await supabase
      .rpc('get_user_plan', { p_user_id: userId })
      .single();

    if (error) {
      if (error.message?.includes('function "get_user_plan" does not exist')) {
        return null;
      }
      throw error;
    }
    return data;
  },

  async getCreatedGroupCount(userId) {
    const { count, error } = await supabase
      .from('splitmate_groups')
      .select('*', { count: 'exact', head: true })
      .eq('created_by', userId);

    if (error) throw error;
    return count || 0;
  },

  async createPayment({ userId, planId, amountPaise }) {
    const { data, error } = await supabase
      .from('payments')
      .insert({
        user_id: userId,
        plan_id: planId,
        amount_paise: amountPaise,
        status: 'pending',
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updatePaymentStatus(paymentId, status, gatewayRef) {
    const payload = { status };
    if (gatewayRef) payload.gateway_ref = gatewayRef;

    const { data, error } = await supabase
      .from('payments')
      .update(payload)
      .eq('id', paymentId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async upgradePlan(userId, planId, paymentId) {
    const payload = {
      user_id: userId,
      plan_id: planId,
      payment_id: paymentId || null,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('user_subscriptions')
      .upsert(payload, { onConflict: 'user_id' })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async processPayment({ planId, amountPaise }) {
    // Simulated payment flow — replace with real gateway integration
    await delay(1500);

    const success = Math.random() > 0.1;
    if (!success) {
      throw new Error('Payment failed. Please try again.');
    }

    return {
      status: 'completed',
      gateway_ref: 'sim_' + Date.now().toString(36),
    };
  },
};
