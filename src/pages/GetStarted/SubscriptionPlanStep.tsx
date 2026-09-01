import { useState } from 'react';
import { CheckCircle2, Clock, Upload, AlertCircle } from 'lucide-react';
import type { SubscriptionPlan, Subscription } from '../../types';
import DocumentUpload from '../../components/DocumentUpload/DocumentUpload';
import type { UploadedFile } from '../../components/DocumentUpload/DocumentUpload';
import styles from './SubscriptionPlanStep.module.css';

// ── QR Code Pattern (deterministic visual placeholder) ──────────────────────
// Generates a simple QR-like grid pattern using a seed
const QR_PATTERN = [
  1,1,1,1,1,1,1,
  1,0,0,0,0,0,1,
  1,0,1,0,1,0,1,
  1,0,0,1,0,0,1,
  1,0,1,0,1,0,1,
  1,0,0,0,0,0,1,
  1,1,1,1,1,1,1,
  0,1,0,1,0,1,0,
  1,0,1,0,0,1,1,
  0,1,1,0,1,0,1,
  1,1,0,1,1,0,0,
  0,0,1,0,0,1,1,
  1,0,0,1,0,0,1,
];

// ── Plan Definitions ─────────────────────────────────────────────────────────
export const PLAN_CONFIG = {
  free: {
    label: 'Free',
    duration: '7 days',
    durationDays: 7,
    price: 0,
    icon: '🌱',
    iconClass: styles.iconFree,
    features: ['Basic access', '1 service area', 'Up to 5 applications'],
    popular: false,
  },
  pro: {
    label: 'Pro',
    duration: '1 month',
    durationDays: 30,
    price: 2000,
    icon: '⚡',
    iconClass: styles.iconPro,
    features: ['Unlimited applications', '5 service areas', 'Staff management', 'Priority support'],
    popular: false,
  },
  pro_plus: {
    label: 'Pro+',
    duration: '6 months',
    durationDays: 180,
    price: 10000,
    icon: '👑',
    iconClass: styles.iconProPlus,
    features: ['Everything in Pro', '3 months free', 'Dedicated manager', 'Analytics dashboard'],
    popular: true,
  },
} as const;

const UPI_ID = 'payments@permitapp';

interface Props {
  providerId: string;
  providerName: string;
  providerPhone: string;
  onSubmit: (subscription: Subscription) => Promise<void>;
  submitting: boolean;
}

function QRCode() {
  return (
    <div className={styles.qrBox}>
      <div className={styles.qrPlaceholder}>
        {QR_PATTERN.map((cell, i) => (
          <div
            key={i}
            className={styles.qrCell}
            style={{
              opacity: cell ? 1 : 0,
              animationDelay: `${i * 10}ms`,
            }}
          />
        ))}
      </div>
      <div className={styles.qrLabel}>Scan to pay</div>
    </div>
  );
}

export default function SubscriptionPlanStep({ providerId, providerName, providerPhone, onSubmit, submitting }: Props) {
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [screenshotFile, setScreenshotFile] = useState<UploadedFile | null>(null);
  const [error, setError] = useState('');

  const plan = selectedPlan ? PLAN_CONFIG[selectedPlan] : null;

  const handleSubmit = async () => {
    if (!selectedPlan) { setError('Please select a plan.'); return; }
    if (selectedPlan !== 'free' && !screenshotFile) {
      setError('Please upload your payment screenshot.'); return;
    }
    setError('');

    const now = new Date();
    const isImmediate = selectedPlan === 'free';
    const startDate = isImmediate ? now.toISOString() : undefined;
    const endDate = isImmediate
      ? new Date(now.getTime() + PLAN_CONFIG.free.durationDays * 86400_000).toISOString()
      : undefined;

    const subscription: Subscription = {
      id: crypto.randomUUID(),
      providerId,
      plan: selectedPlan,
      status: isImmediate ? 'active' : 'pending_payment',
      amount: PLAN_CONFIG[selectedPlan].price,
      paymentScreenshotName: screenshotFile?.name,
      startDate,
      endDate,
      requestedAt: now.toISOString(),
    };

    await onSubmit(subscription);
  };

  return (
    <div className={styles.planStep}>
      <h1 className={styles.planTitle}>Choose Your Plan</h1>
      <p className={styles.planSub}>
        Select a subscription plan to unlock your provider portal
      </p>

      {/* Plan Cards */}
      <div className={styles.plansGrid}>
        {(Object.entries(PLAN_CONFIG) as [SubscriptionPlan, typeof PLAN_CONFIG[SubscriptionPlan]][]).map(([key, cfg]) => (
          <button
            key={key}
            className={`${styles.planCard} ${selectedPlan === key ? styles.selected : ''} ${cfg.popular ? styles.popular : ''}`}
            onClick={() => { setSelectedPlan(key); setError(''); setScreenshotFile(null); }}
            type="button"
          >
            {cfg.popular && <span className={styles.popularBadge}>🏆 MOST POPULAR</span>}

            <div className={styles.radioCircle}>
              {selectedPlan === key && <div className={styles.radioDot} />}
            </div>

            <div className={styles.planIcon}>{cfg.icon}</div>

            <div className={styles.planInfo}>
              <div className={styles.planName}>{cfg.label}</div>
              <div className={styles.planDuration}>
                <Clock size={11} style={{ display: 'inline', marginRight: 3 }} />
                {cfg.duration}
              </div>
              <div className={styles.planFeatures}>
                {cfg.features.slice(0, 2).map(f => (
                  <span key={f} className={styles.feature}>
                    <CheckCircle2 size={10} /> {f}
                  </span>
                ))}
              </div>
            </div>

            <div className={styles.planPrice}>
              <div className={styles.priceAmount}>
                {cfg.price === 0 ? 'Free' : `₹${cfg.price.toLocaleString('en-IN')}`}
              </div>
              {cfg.price > 0 && <div className={styles.pricePeriod}>one-time</div>}
            </div>
          </button>
        ))}
      </div>

      {/* Free Plan – instant confirmation */}
      {selectedPlan === 'free' && (
        <div className={styles.freeConfirmBox}>
          <h4>🎉 Great choice! Free trial starts immediately.</h4>
          <p>Your account will be active for 7 days. You can upgrade anytime from the provider portal.</p>
        </div>
      )}

      {/* Paid plans – payment section */}
      {selectedPlan && selectedPlan !== 'free' && plan && (
        <div className={styles.paymentSection}>
          <div className={styles.paymentHeader}>
            <div>
              <h4>💳 Complete Payment</h4>
              <p>Scan QR or transfer to UPI ID, then upload screenshot</p>
            </div>
          </div>

          <div className={styles.paymentBody}>
            {/* QR Code */}
            <div className={styles.qrSection}>
              <QRCode />
              <div className={styles.qrUpiId}>{UPI_ID}</div>
            </div>

            {/* Payment Details */}
            <div className={styles.paymentDetails}>
              <div className={styles.paymentRow}>
                <span>Plan</span>
                <span>{plan.label} ({plan.duration})</span>
              </div>
              <div className={styles.paymentRow}>
                <span>UPI ID</span>
                <span style={{ fontSize: 12 }}>{UPI_ID}</span>
              </div>
              <div className={`${styles.paymentRow} ${styles.amountRow}`}>
                <span>Amount</span>
                <span>₹{(plan as any).price.toLocaleString('en-IN')}</span>
              </div>
              <div className={styles.separator} />
              <div className={styles.uploadHint}>
                <Upload size={12} />
                After paying, upload the screenshot below
              </div>
              <DocumentUpload
                label="Payment Screenshot *"
                accept=".jpg,.jpeg,.png,.pdf"
                value={screenshotFile}
                onChange={(f: UploadedFile | null) => {
                  setScreenshotFile(f);
                  setError('');
                }}
                hint="Upload proof of payment (screenshot or bank receipt)"
              />
            </div>
          </div>

          <div className={styles.pendingBanner} style={{ margin: '0 20px 20px' }}>
            <AlertCircle size={18} style={{ color: '#b45309', flexShrink: 0, marginTop: 1 }} />
            <div>
              <h5>Awaiting Verification</h5>
              <p>Our admin team will verify your payment and activate your plan within 24 hours.</p>
            </div>
          </div>
        </div>
      )}

      {error && (
        <p style={{ fontSize: 13, color: '#ef4444', marginTop: 12, display: 'flex', alignItems: 'center', gap: 5 }}>
          <AlertCircle size={14} /> {error}
        </p>
      )}

      {/* Hidden trigger button – parent wizard calls click() on this */}
      <button
        id="sub-step-internal-submit"
        type="button"
        style={{ display: 'none' }}
        onClick={handleSubmit}
      />
    </div>
  );
}
