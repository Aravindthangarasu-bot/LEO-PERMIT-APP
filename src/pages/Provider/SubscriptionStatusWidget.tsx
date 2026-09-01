import { Link } from 'react-router-dom';
import { CreditCard, Clock, ArrowRight, AlertTriangle, CheckCircle2 } from 'lucide-react';
import type { Subscription } from '../../types';
import { PLAN_CONFIG } from '../GetStarted/SubscriptionPlanStep';

interface Props {
  subscription: Subscription | null;
}

function getDaysRemaining(endDate?: string): number | null {
  if (!endDate) return null;
  const diff = new Date(endDate).getTime() - Date.now();
  return Math.max(0, Math.floor(diff / 86400_000));
}

function getStatusColor(status: Subscription['status']) {
  if (status === 'active') return '#059669';
  if (status === 'pending_payment') return '#d97706';
  if (status === 'expired') return '#dc2626';
  return '#6b7280';
}

export default function SubscriptionStatusWidget({ subscription }: Props) {
  if (!subscription) {
    return (
      <div style={{
        background: 'linear-gradient(135deg, #1e293b, #334155)',
        borderRadius: 14,
        padding: '18px 20px',
        color: 'white',
        marginBottom: 20,
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
      }}>
        <div style={{ width: 44, height: 44, background: 'rgba(255,255,255,0.1)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <CreditCard size={22} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 2 }}>No Active Subscription</div>
          <div style={{ fontSize: 12, opacity: 0.7 }}>Choose a plan to unlock all features</div>
        </div>
        <Link to="/provider/subscription" style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--primary)', color: 'white', padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 700, textDecoration: 'none', flexShrink: 0 }}>
          Choose Plan <ArrowRight size={14} />
        </Link>
      </div>
    );
  }

  const plan = PLAN_CONFIG[subscription.plan];
  const daysRemaining = getDaysRemaining(subscription.endDate);
  const isExpiringSoon = daysRemaining !== null && daysRemaining <= 7 && subscription.status === 'active';
  const isPending = subscription.status === 'pending_payment';
  const isExpired = subscription.status === 'expired' || (daysRemaining !== null && daysRemaining === 0 && subscription.status === 'active');

  const bgGradient = isPending
    ? 'linear-gradient(135deg, #78350f, #92400e)'
    : isExpired
    ? 'linear-gradient(135deg, #7f1d1d, #991b1b)'
    : isExpiringSoon
    ? 'linear-gradient(135deg, #78350f, #b45309)'
    : 'linear-gradient(135deg, #064e3b, #065f46)';

  return (
    <div style={{
      background: bgGradient,
      borderRadius: 14,
      padding: '18px 20px',
      color: 'white',
      marginBottom: 20,
      boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
        {/* Icon */}
        <div style={{ width: 44, height: 44, background: 'rgba(255,255,255,0.15)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 22 }}>
          {plan.icon}
        </div>

        {/* Info */}
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
            <span style={{ fontSize: 16, fontWeight: 800 }}>{plan.label} Plan</span>
            <span style={{ fontSize: 10, background: 'rgba(255,255,255,0.2)', padding: '2px 8px', borderRadius: 20, fontWeight: 700 }}>
              {isPending ? '⏳ PENDING' : isExpired ? '❌ EXPIRED' : '✅ ACTIVE'}
            </span>
          </div>
          <div style={{ fontSize: 12, opacity: 0.8, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Clock size={11} />
            {isPending && 'Awaiting admin verification of payment'}
            {!isPending && subscription.endDate && (
              <>
                {isExpired ? 'Expired' : `${daysRemaining} days remaining`}
                {' · '}
                Expires {new Date(subscription.endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
              </>
            )}
            {!isPending && !subscription.endDate && 'Active'}
          </div>

          {/* Expiry progress bar */}
          {subscription.status === 'active' && subscription.startDate && subscription.endDate && daysRemaining !== null && (
            <div style={{ marginTop: 10 }}>
              {(() => {
                const total = PLAN_CONFIG[subscription.plan].durationDays;
                const used = total - daysRemaining;
                const pct = Math.min(100, Math.round((used / total) * 100));
                return (
                  <>
                    <div style={{ height: 4, background: 'rgba(255,255,255,0.2)', borderRadius: 2, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: isExpiringSoon ? '#fbbf24' : 'rgba(255,255,255,0.7)', borderRadius: 2, transition: 'width 0.3s' }} />
                    </div>
                    <div style={{ fontSize: 10, opacity: 0.6, marginTop: 3 }}>
                      {pct}% of {plan.duration} used
                    </div>
                  </>
                );
              })()}
            </div>
          )}
        </div>

        {/* CTA */}
        {(isExpiringSoon || isExpired || isPending) && (
          <Link
            to="/provider/subscription"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              background: isExpiringSoon || isExpired ? 'var(--primary)' : 'rgba(255,255,255,0.15)',
              color: 'white',
              padding: '8px 14px',
              borderRadius: 8,
              fontSize: 12,
              fontWeight: 700,
              textDecoration: 'none',
              flexShrink: 0,
              border: '1px solid rgba(255,255,255,0.3)',
            }}
          >
            {isExpired ? 'Renew' : isPending ? 'View Status' : 'Upgrade'}
            <ArrowRight size={13} />
          </Link>
        )}
      </div>

      {/* Warnings */}
      {isExpiringSoon && !isExpired && (
        <div style={{ marginTop: 12, background: 'rgba(251,191,36,0.2)', border: '1px solid rgba(251,191,36,0.4)', borderRadius: 8, padding: '8px 12px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
          <AlertTriangle size={13} style={{ color: '#fbbf24', flexShrink: 0 }} />
          Your plan expires in {daysRemaining} day{daysRemaining !== 1 ? 's' : ''}. Renew now to avoid interruption.
        </div>
      )}
    </div>
  );
}
