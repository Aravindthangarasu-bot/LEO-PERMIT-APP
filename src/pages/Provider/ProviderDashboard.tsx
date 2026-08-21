import { Link } from 'react-router-dom';
import { FileText, Clock, CheckCircle2, Star, ArrowRight, TrendingUp, Bell } from 'lucide-react';
import { mockApplications, mockProviders } from '../../data/mockData';
import { STATUS_CONFIG } from '../Customer/statusConfig';
import { useAuth } from '../../context/AuthContext';
import { getLicenceById, getExpiryNotification } from '../../data/licenceData';
import styles from './Provider.module.css';

export default function ProviderDashboard() {
  const { user } = useAuth();
  const providerData = mockProviders.find(p => p.phone === user?.phone) ?? mockProviders[0];
  const assigned = mockApplications.filter(a => a.assignedProviderId === providerData?.id);
  const licence = getLicenceById(providerData?.licenceCategory ?? '');
  const expiryNotif = getExpiryNotification(providerData?.licenceExpiry ?? '9999-12-31');

  const stats = {
    assigned: assigned.length,
    pending:  assigned.filter(a => a.status === 'under_review' || a.status === 'pending').length,
    approved: assigned.filter(a => a.status === 'approved').length,
    docsReq:  assigned.filter(a => a.status === 'documents_required').length,
  };

  return (
    <div className={`page-enter ${styles.page}`}>
      {/* Header */}
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Welcome, {user?.name} 👋</h1>
          <p className={styles.pageSub}>Licensed Permit Approver · {providerData?.area}</p>
        </div>
        <div className={styles.ratingBadge}>
          <Star size={16} style={{ fill: '#f59e0b', color: '#f59e0b' }} />
          <span>{providerData?.rating}</span>
          <span className={styles.ratingLabel}>Rating</span>
        </div>
      </div>

      {/* Stats */}
      <div className={styles.statsGrid}>
        {[
          { icon: <FileText size={22} />,     label: 'Total Assigned',  value: stats.assigned, color: '#6366f1', bg: '#eef2ff' },
          { icon: <Clock size={22} />,         label: 'Pending Review',  value: stats.pending,  color: '#f59e0b', bg: '#fef3c7' },
          { icon: <CheckCircle2 size={22} />,  label: 'Approved',        value: stats.approved, color: '#16a34a', bg: '#dcfce7' },
          { icon: <TrendingUp size={22} />,    label: 'Total Approvals', value: providerData?.totalApprovals ?? 0, color: '#c0522a', bg: '#fff7ed' },
        ].map(s => (
          <div key={s.label} className={`card ${styles.statCard}`}>
            <div className={styles.statIcon} style={{ background: s.bg, color: s.color }}>{s.icon}</div>
            <div className={styles.statValue}>{s.value}</div>
            <div className={styles.statLabel}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Licence Expiry Notification Banner */}
      {expiryNotif && (
        <div className={`${styles.expiryBanner} ${
          expiryNotif.urgency === 'daily' || expiryNotif.urgency === 'critical' ? styles.expiryBannerRed
          : expiryNotif.urgency === 'warning' ? styles.expiryBannerOrange
          : styles.expiryBannerBlue}`}>
          <Bell size={18} />
          <div>
            <strong>Licence Expiry Reminder</strong>
            <p>{expiryNotif.message}</p>
          </div>
          {expiryNotif.daysLeft <= 10 && expiryNotif.daysLeft > 0 && (
            <span className={styles.dailyBadge}>DAILY REMINDER</span>
          )}
        </div>
      )}

      <div className={styles.twoCol}>
        {/* Recent Assigned */}
        <div className={`card ${styles.card}`}>
          <div className={styles.cardHeader}>
            <h2>Assigned Applications</h2>
            <Link to="/provider/applications" className={styles.viewAll}>View all <ArrowRight size={14} /></Link>
          </div>
          {assigned.length === 0 ? (
            <div className={styles.emptyState}><FileText size={40} /><p>No applications assigned yet</p></div>
          ) : (
            <div className={styles.appList}>
              {assigned.map(app => {
                const sc = STATUS_CONFIG[app.status];
                return (
                  <div key={app.id} className={styles.appItem}>
                    <div>
                      <div className={styles.appId}>{app.id}</div>
                      <div className={styles.appType}>{app.type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</div>
                      <div className={styles.appCustomer}>👤 {app.customerName}</div>
                    </div>
                    <span className={styles.appBadge} style={{ background: sc.bg, color: sc.color }}>
                      <span className={`status-dot ${sc.dot}`} /> {sc.label}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Provider Profile Summary */}
        <div className={`card ${styles.card}`}>
          <h2 className={styles.cardTitle}>Licence Profile</h2>
          <div className={styles.profileRows}>
            <div className={styles.profileRow}><span>Category</span><strong>{licence?.label ?? '-'}</strong></div>
            <div className={styles.profileRow}><span>Licence No.</span><strong>{providerData?.licenceNumber}</strong></div>
            <div className={styles.profileRow}><span>Expiry</span><strong>{providerData ? new Date(providerData.licenceExpiry).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}</strong></div>
            <div className={styles.profileRow}><span>Max Area</span><strong>{licence?.unlimited ? 'Unlimited' : `${licence?.maxArea} m²`}</strong></div>
            <div className={styles.profileRow}><span>Max Floors</span><strong>{licence?.unlimited ? 'Unlimited' : licence?.maxFloors}</strong></div>
            <div className={styles.profileRow}><span>Service Area</span><strong>{providerData?.area}</strong></div>
            <div className={styles.profileRow}><span>Status</span>
              <span className={`badge ${providerData?.status === 'active' ? 'badge-success' : 'badge-warning'}`}>
                {providerData?.status}
              </span>
            </div>
          </div>

          <div className={styles.specializations}>
            <h4>Specializations</h4>
            <div className={styles.specTags}>
              {providerData?.specializations.map(s => (
                <span key={s} className={styles.specTag}>
                  {s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                </span>
              ))}
            </div>
          </div>

          <div className={styles.docsSection}>
            <h4>Verified Documents</h4>
            {providerData?.documents.map(d => (
              <div key={d.id} className={styles.docItem}>
                <FileText size={14} />
                <span>{d.name}</span>
                <span className={`badge ${d.status === 'verified' ? 'badge-success' : 'badge-warning'}`}>{d.status}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
