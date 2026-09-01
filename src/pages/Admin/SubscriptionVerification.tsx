import { useState } from 'react';
import { CheckCircle2, XCircle, FileImage, Clock, CreditCard, TrendingUp, Users } from 'lucide-react';
import { useAppStore } from '../../context/AppStoreContext';
import { useAuth } from '../../context/AuthContext';
import type { Subscription } from '../../types';
import { PLAN_CONFIG } from '../GetStarted/SubscriptionPlanStep';
import styles from './SubscriptionVerification.module.css';
import { sortByNewest } from '../../utils/sorting';

type TabFilter = 'pending' | 'all' | 'active' | 'rejected';

function getPlanBadgeClass(plan: Subscription['plan']) {
  if (plan === 'free') return styles.planBadgeFree;
  if (plan === 'pro') return styles.planBadgePro;
  return styles.planBadgeProPlus;
}

function getStatusBadgeClass(status: Subscription['status']) {
  if (status === 'active') return styles.planBadgeActive;
  if (status === 'pending_payment') return styles.planBadgePending;
  if (status === 'rejected') return styles.planBadgeRejected;
  return styles.planBadgeExpired;
}

function formatStatus(s: Subscription['status']) {
  if (s === 'pending_payment') return 'Pending';
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export default function SubscriptionVerification() {
  const { user } = useAuth();
  const { subscriptions, providers, updateSubscription, addNotification } = useAppStore();
  const [tab, setTab] = useState<TabFilter>('pending');
  const [selected, setSelected] = useState<string | null>(null);
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [actionMsg, setActionMsg] = useState('');
  const [acting, setActing] = useState(false);

  const filtered = sortByNewest(
    subscriptions.filter(s => {
      if (tab === 'all') return true;
      if (tab === 'pending') return s.status === 'pending_payment';
      if (tab === 'active') return s.status === 'active';
      if (tab === 'rejected') return s.status === 'rejected';
      return true;
    }),
    s => s.requestedAt
  );

  const detail = subscriptions.find(s => s.id === selected);
  const detailProvider = detail ? providers.find(p => p.id === detail.providerId) : null;

  const pendingCount = subscriptions.filter(s => s.status === 'pending_payment').length;
  const activeCount = subscriptions.filter(s => s.status === 'active').length;

  const showMsg = (msg: string) => {
    setActionMsg(msg);
    setTimeout(() => setActionMsg(''), 3000);
  };

  const handleApprove = async () => {
    if (!detail) return;
    setActing(true);
    const now = new Date();
    const durationDays = PLAN_CONFIG[detail.plan].durationDays;
    const endDate = new Date(now.getTime() + durationDays * 86400_000).toISOString();
    
    const ok = await updateSubscription(detail.id, {
      status: 'active',
      startDate: now.toISOString(),
      endDate,
      verifiedAt: now.toISOString(),
      verifiedBy: user?.id,
    });

    if (ok) {
      // Notify provider
      await addNotification({
        id: `notif_sub_approved_${Date.now()}`,
        subscriptionId: detail.id,
        userId: detail.providerId,
        type: 'subscription_activated',
        title: '🎉 Subscription Activated!',
        message: `Your ${PLAN_CONFIG[detail.plan].label} plan has been activated. Valid until ${new Date(endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}.`,
        timestamp: now.toISOString(),
        read: false,
      });
      showMsg('✅ Subscription activated and provider notified');
      setShowRejectForm(false);
    }
    setActing(false);
  };

  const handleReject = async () => {
    if (!detail || !rejectReason.trim()) return;
    setActing(true);
    const ok = await updateSubscription(detail.id, {
      status: 'rejected',
      rejectionReason: rejectReason,
      verifiedAt: new Date().toISOString(),
      verifiedBy: user?.id,
    });
    if (ok) {
      await addNotification({
        id: `notif_sub_rejected_${Date.now()}`,
        subscriptionId: detail.id,
        userId: detail.providerId,
        type: 'subscription_rejected',
        title: 'Subscription Payment Rejected',
        message: `Your ${PLAN_CONFIG[detail.plan].label} plan payment could not be verified. Reason: ${rejectReason}. Please re-submit with correct payment proof.`,
        timestamp: new Date().toISOString(),
        read: false,
      });
      showMsg('Payment rejected. Provider has been notified.');
      setShowRejectForm(false);
      setRejectReason('');
    }
    setActing(false);
  };

  return (
    <div className={`page-enter ${styles.page}`}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Subscriptions</h1>
          <p className={styles.pageSub}>Manage and verify provider subscription payments</p>
        </div>
      </div>

      {/* Stats */}
      <div className={styles.statsRow}>
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: '#fef9c3' }}>⏳</div>
          <div className={styles.statInfo}>
            <div className={styles.statValue}>{pendingCount}</div>
            <div className={styles.statLabel}>Pending Verification</div>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: '#dcfce7' }}>✅</div>
          <div className={styles.statInfo}>
            <div className={styles.statValue}>{activeCount}</div>
            <div className={styles.statLabel}>Active Subscriptions</div>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: '#ede9fe' }}>💰</div>
          <div className={styles.statInfo}>
            <div className={styles.statValue}>
              ₹{subscriptions.filter(s => s.status === 'active').reduce((sum, s) => sum + s.amount, 0).toLocaleString('en-IN')}
            </div>
            <div className={styles.statLabel}>Revenue (Active)</div>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: '#f0f9ff' }}>📊</div>
          <div className={styles.statInfo}>
            <div className={styles.statValue}>{subscriptions.length}</div>
            <div className={styles.statLabel}>Total Subscriptions</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className={styles.tabs}>
        {([
          { key: 'pending', label: `Pending (${pendingCount})` },
          { key: 'active', label: 'Active' },
          { key: 'rejected', label: 'Rejected' },
          { key: 'all', label: 'All' },
        ] as { key: TabFilter; label: string }[]).map(t => (
          <button
            key={t.key}
            className={`${styles.tab} ${tab === t.key ? styles.tabActive : ''}`}
            onClick={() => { setTab(t.key); setSelected(null); }}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className={styles.mainGrid}>
        {/* Subscription List */}
        <div className={styles.listCard}>
          <div className={styles.listHeader}>
            <h3>
              {tab === 'pending' ? 'Awaiting Payment Verification' :
               tab === 'active' ? 'Active Subscriptions' :
               tab === 'rejected' ? 'Rejected Payments' : 'All Subscriptions'}
            </h3>
          </div>

          {filtered.length === 0 ? (
            <div className={styles.emptyState}>
              <div>🎉</div>
              <div>No {tab === 'pending' ? 'pending payments' : 'records'} found</div>
            </div>
          ) : (
            filtered.map(s => {
              const prov = providers.find(p => p.id === s.providerId);
              return (
                <button
                  key={s.id}
                  className={`${styles.subRow} ${selected === s.id ? styles.subRowActive : ''}`}
                  onClick={() => { setSelected(s.id); setShowRejectForm(false); setActionMsg(''); }}
                >
                  <div className={styles.subAvatar}>
                    {(prov?.officeName ?? 'P')[0]}
                  </div>
                  <div className={styles.subInfo}>
                    <div className={styles.subProviderName}>
                      {prov?.officeName ?? `Provider ${s.providerId.slice(0, 6)}`}
                    </div>
                    <div className={styles.subMeta}>
                      {prov?.ownerName} · {prov?.phone}
                    </div>
                    <div className={styles.subMeta}>
                      Requested {new Date(s.requestedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </div>
                  </div>
                  <div className={styles.subRight}>
                    <span className={`badge ${getPlanBadgeClass(s.plan)}`}>
                      {PLAN_CONFIG[s.plan].label}
                    </span>
                    <span className={`badge ${getStatusBadgeClass(s.status)}`}>
                      {formatStatus(s.status)}
                    </span>
                    {s.amount > 0 && (
                      <span style={{ fontSize: 12, fontWeight: 700, color: '#059669' }}>
                        ₹{s.amount.toLocaleString('en-IN')}
                      </span>
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Detail Panel */}
        {detail && detailProvider && (
          <div className={styles.detailCard}>
            {actionMsg && (
              <div className={styles.actionSuccess} style={{ margin: '16px 16px 0' }}>
                {actionMsg}
              </div>
            )}

            <div className={styles.detailHero}>
              <div className={styles.detailAvatar}>{detailProvider.officeName[0]}</div>
              <div className={styles.detailName}>{detailProvider.officeName}</div>
              <div className={styles.detailMeta}>{detailProvider.ownerName} · {detailProvider.phone}</div>
              <div className={styles.detailMeta}>{detailProvider.email}</div>
            </div>

            <div className={styles.detailBody}>
              {/* Plan Details */}
              <div className={styles.detailSection}>
                <h4>Subscription Details</h4>
                <div className={styles.detailRows}>
                  <div className={styles.detailRow}>
                    <span>Plan</span>
                    <span className={`badge ${getPlanBadgeClass(detail.plan)}`}>
                      {PLAN_CONFIG[detail.plan].icon} {PLAN_CONFIG[detail.plan].label}
                    </span>
                  </div>
                  <div className={styles.detailRow}>
                    <span>Duration</span>
                    <span>{PLAN_CONFIG[detail.plan].duration}</span>
                  </div>
                  <div className={styles.detailRow}>
                    <span>Amount</span>
                    <span style={{ color: '#059669', fontWeight: 800 }}>
                      {detail.amount === 0 ? 'Free' : `₹${detail.amount.toLocaleString('en-IN')}`}
                    </span>
                  </div>
                  <div className={styles.detailRow}>
                    <span>Status</span>
                    <span className={`badge ${getStatusBadgeClass(detail.status)}`}>
                      {formatStatus(detail.status)}
                    </span>
                  </div>
                  <div className={styles.detailRow}>
                    <span>Requested</span>
                    <span>{new Date(detail.requestedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  {detail.startDate && (
                    <div className={styles.detailRow}>
                      <span>Valid From</span>
                      <span>{new Date(detail.startDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                    </div>
                  )}
                  {detail.endDate && (
                    <div className={styles.detailRow}>
                      <span>Expires</span>
                      <span>{new Date(detail.endDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                    </div>
                  )}
                  {detail.rejectionReason && (
                    <div className={styles.detailRow}>
                      <span>Rejection Reason</span>
                      <span style={{ color: '#dc2626', fontSize: 12 }}>{detail.rejectionReason}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Payment Screenshot */}
              {detail.status === 'pending_payment' && (
                <div className={styles.detailSection}>
                  <h4>Payment Proof</h4>
                  <div className={styles.screenshotBox}>
                    <div className={styles.screenshotHeader}>
                      <FileImage size={14} /> Payment Screenshot
                    </div>
                    {detail.paymentScreenshotName ? (
                      <div className={styles.screenshotFilename}>
                        <FileImage size={16} style={{ color: '#7c3aed' }} />
                        {detail.paymentScreenshotName}
                        <span style={{ fontSize: 10, color: '#94a3b8' }}>(uploaded by provider)</span>
                      </div>
                    ) : (
                      <div className={styles.screenshotPlaceholder}>
                        No screenshot uploaded yet
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              {detail.status === 'pending_payment' && (
                <>
                  <div className={styles.actionRow}>
                    <button
                      className={styles.approveBtn}
                      onClick={handleApprove}
                      disabled={acting}
                    >
                      <CheckCircle2 size={16} />
                      {acting ? 'Activating...' : 'Approve & Activate'}
                    </button>
                    <button
                      className={styles.rejectBtn}
                      onClick={() => setShowRejectForm(v => !v)}
                      disabled={acting}
                    >
                      <XCircle size={16} />
                      Reject
                    </button>
                  </div>

                  {showRejectForm && (
                    <div className={styles.rejectForm}>
                      <label>Rejection Reason *</label>
                      <textarea
                        rows={3}
                        placeholder="e.g. Payment screenshot unclear, wrong amount, duplicate..."
                        value={rejectReason}
                        onChange={e => setRejectReason(e.target.value)}
                      />
                      <button
                        className={styles.confirmRejectBtn}
                        onClick={handleReject}
                        disabled={!rejectReason.trim() || acting}
                      >
                        {acting ? 'Processing...' : 'Confirm Rejection'}
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {!detail && (
          <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--text-muted)', background: 'white', borderRadius: 14, border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>👈</div>
            <div style={{ fontSize: 14, fontWeight: 600 }}>Select a subscription to review</div>
          </div>
        )}
      </div>
    </div>
  );
}
