import { useState } from 'react';
import { CheckCircle2, ArrowRight, Clock, AlertCircle, Zap } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useAppStore } from '../../context/AppStoreContext';
import AnimateIn from '../../components/AnimateIn';
import SubscriptionPlanStep, { PLAN_CONFIG } from '../GetStarted/SubscriptionPlanStep';
import type { Subscription } from '../../types';
import { supabase } from '../../supabaseClient';

export default function SubscriptionUpgrade() {
  const { user } = useAuth();
  const { getMyProviderProfile, getProviderSubscription, addSubscription, addNotification, subscriptions } = useAppStore();
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [lastSub, setLastSub] = useState<Subscription | null>(null);

  const providerProfile = user ? getMyProviderProfile(user) : null;
  const currentSubscription = user ? getProviderSubscription(user.id) : null;

  const handleSubmit = async (subscription: Subscription) => {
    setSubmitting(true);
    const ok = await addSubscription(subscription);
    if (ok) {
      if (subscription.plan !== 'free') {
        // Notify admins
        const { data: admins } = await supabase.from('users').select('id').eq('role', 'admin');
        await Promise.all((admins ?? []).map((admin: { id: string }) =>
          addNotification({
            id: `notif_sub_${Date.now()}_${admin.id}`,
            subscriptionId: subscription.id,
            userId: admin.id,
            type: 'subscription_request',
            title: 'Payment verification required',
            message: `${providerProfile?.officeName ?? 'A provider'} submitted a ${PLAN_CONFIG[subscription.plan].label} plan payment (₹${subscription.amount.toLocaleString('en-IN')}). Please verify the screenshot and activate.`,
            contactName: providerProfile?.ownerName,
            contactPhone: providerProfile?.phone,
            timestamp: new Date().toISOString(),
            read: false,
          })
        ));
      }
      setLastSub(subscription);
      setSubmitted(true);
    }
    setSubmitting(false);
  };

  if (!user || !providerProfile) {
    return (
      <div style={{ padding: '60px 24px', textAlign: 'center', color: 'var(--text-muted)' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🔒</div>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>Provider profile not found</h2>
        <p>Please complete your provider registration first.</p>
      </div>
    );
  }

  if (submitted && lastSub) {
    const isImmediate = lastSub.plan === 'free';
    return (
      <AnimateIn animationClass="fade-in">
        <div style={{ padding: '60px 24px', textAlign: 'center', maxWidth: 480, margin: '0 auto' }}>
          <div style={{ width: 80, height: 80, background: isImmediate ? 'linear-gradient(135deg, #059669, #10b981)' : 'linear-gradient(135deg, #d97706, #f59e0b)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', fontSize: 36 }}>
            {isImmediate ? <CheckCircle2 size={40} color="white" /> : '⏳'}
          </div>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)', marginBottom: 8 }}>
            {isImmediate ? 'Plan Activated!' : 'Payment Submitted!'}
          </h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: 24, lineHeight: 1.6 }}>
            {isImmediate
              ? `Your Free trial is now active for 7 days. Explore all available features.`
              : `Your ${PLAN_CONFIG[lastSub.plan].label} plan payment has been submitted. Our admin team will verify your payment and activate your plan within 24 hours.`}
          </p>
          <div style={{ background: isImmediate ? '#f0fdf4' : '#fffbeb', border: `1px solid ${isImmediate ? '#bbf7d0' : '#fde68a'}`, borderRadius: 10, padding: '14px 20px', fontSize: 13, color: isImmediate ? '#065f46' : '#92400e', marginBottom: 24 }}>
            <strong>Plan:</strong> {PLAN_CONFIG[lastSub.plan].label} · {PLAN_CONFIG[lastSub.plan].duration}
            {lastSub.amount > 0 && <> · ₹{lastSub.amount.toLocaleString('en-IN')}</>}
          </div>
        </div>
      </AnimateIn>
    );
  }

  return (
    <AnimateIn animationClass="fade-in">
      <div style={{ padding: '24px', maxWidth: 640, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: 'var(--text)', margin: '0 0 4px' }}>
            {currentSubscription ? 'Manage Subscription' : 'Choose Your Plan'}
          </h1>
          <p style={{ fontSize: 14, color: 'var(--text-muted)', margin: 0 }}>
            {providerProfile.officeName} · {providerProfile.ownerName}
          </p>
        </div>

        {/* Current plan info */}
        {currentSubscription && (
          <div style={{
            background: 'linear-gradient(135deg, #1e293b, #334155)',
            borderRadius: 12,
            padding: '16px 20px',
            color: 'white',
            marginBottom: 24,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}>
            <div style={{ fontSize: 28 }}>{PLAN_CONFIG[currentSubscription.plan].icon}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, marginBottom: 2 }}>
                Current: {PLAN_CONFIG[currentSubscription.plan].label} Plan
              </div>
              <div style={{ fontSize: 12, opacity: 0.7, display: 'flex', alignItems: 'center', gap: 5 }}>
                <Clock size={11} />
                {currentSubscription.status === 'pending_payment' && 'Awaiting admin verification'}
                {currentSubscription.status === 'active' && currentSubscription.endDate && (
                  `Expires ${new Date(currentSubscription.endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}`
                )}
                {currentSubscription.status === 'expired' && 'Expired — please renew'}
              </div>
            </div>
            <span style={{
              fontSize: 10,
              padding: '3px 10px',
              borderRadius: 20,
              fontWeight: 700,
              background: currentSubscription.status === 'active' ? '#059669' : currentSubscription.status === 'pending_payment' ? '#d97706' : '#dc2626',
            }}>
              {currentSubscription.status === 'pending_payment' ? 'PENDING' : currentSubscription.status.toUpperCase()}
            </span>
          </div>
        )}

        {/* Subscription Plan Step */}
        <div style={{ background: 'white', borderRadius: 14, boxShadow: '0 4px 20px rgba(0,0,0,0.06)', border: '1px solid #e2e8f0', padding: '28px 24px' }}>
          <SubscriptionPlanStep
            providerId={user.id}
            providerName={providerProfile.officeName}
            providerPhone={providerProfile.phone}
            onSubmit={handleSubmit}
            submitting={submitting}
          />

          <div style={{ marginTop: 20 }}>
            <button
              onClick={() => {
                const btn = document.getElementById('sub-step-internal-submit') as HTMLButtonElement | null;
                btn?.click();
              }}
              disabled={submitting}
              style={{
                width: '100%',
                padding: '14px',
                background: 'var(--primary)',
                color: 'white',
                border: 'none',
                borderRadius: 10,
                fontSize: 15,
                fontWeight: 700,
                cursor: submitting ? 'not-allowed' : 'pointer',
                opacity: submitting ? 0.6 : 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                transition: 'opacity 0.2s',
              }}
            >
              <Zap size={18} />
              {submitting ? 'Processing...' : 'Submit Plan'}
            </button>
          </div>
        </div>
      </div>
    </AnimateIn>
  );
}
