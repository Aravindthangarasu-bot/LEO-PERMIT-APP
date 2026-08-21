import { Link } from 'react-router-dom';
import {
  Users, FileText, CheckCircle2, Clock, TrendingUp,
  ArrowRight, UserPlus, AlertCircle, Bell,
} from 'lucide-react';
import { STATUS_CONFIG } from '../Customer/statusConfig';
import { useAppStore, isLicenceExpired } from '../../context/AppStoreContext';
import styles from './Admin.module.css';

export default function AdminDashboard() {
  const { applications, providers, updateProviderStatus } = useAppStore();
  const stats = {
    totalApps:        applications.length,
    pending:          applications.filter(a => a.status === 'pending').length,
    approved:         applications.filter(a => a.status === 'approved').length,
    providers:        providers.length,
    activeProviders:  providers.filter(p => p.status === 'active' && !isLicenceExpired(p)).length,
    pendingProviders: providers.filter(p => p.status === 'pending').length,
    expiredProviders: providers.filter(p => isLicenceExpired(p)).length,
  };

  const recentApps = applications.slice(0, 4);
  const pendingProviders = providers.filter(p => p.status === 'pending');

  return (
    <div className={`page-enter ${styles.page}`}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Admin Dashboard</h1>
          <p className={styles.pageSub}>System-wide overview and management</p>
        </div>
        <Link to="/admin/add-provider" className={`btn btn-primary`}>
          <UserPlus size={16} /> Add Provider
        </Link>
      </div>

      {/* Pending provider request alert */}
      {stats.pendingProviders > 0 && (
        <div className={styles.pendingAlert}>
          <Bell size={18} />
          <div>
            <strong>{stats.pendingProviders} new provider registration request{stats.pendingProviders > 1 ? 's' : ''} awaiting approval</strong>
            <p>Review and activate provider accounts to make them visible to customers.</p>
          </div>
          <Link to="/admin/providers" className={styles.pendingAlertBtn}>Review Now →</Link>
        </div>
      )}

      {/* Expired licence alert */}
      {stats.expiredProviders > 0 && (
        <div className={`${styles.pendingAlert} ${styles.pendingAlertOrange}`}>
          <AlertCircle size={18} />
          <div>
            <strong>{stats.expiredProviders} provider{stats.expiredProviders > 1 ? 's have' : ' has'} an expired licence</strong>
            <p>These providers are hidden from customers. Ask them to renew.</p>
          </div>
          <Link to="/admin/providers" className={styles.pendingAlertBtn}>View →</Link>
        </div>
      )}

      {/* Stats row 1 */}
      <div className={styles.statsGrid}>
        {[
          { icon: <FileText size={22} />,      label: 'Total Applications', value: stats.totalApps,        color: '#6366f1', bg: '#eef2ff' },
          { icon: <Clock size={22} />,          label: 'Pending Review',     value: stats.pending,          color: '#f59e0b', bg: '#fef3c7' },
          { icon: <CheckCircle2 size={22} />,   label: 'Approved',           value: stats.approved,         color: '#16a34a', bg: '#dcfce7' },
          { icon: <Users size={22} />,          label: 'Total Providers',    value: stats.providers,        color: '#c0522a', bg: '#fff7ed' },
          { icon: <TrendingUp size={22} />,     label: 'Active Providers',   value: stats.activeProviders,  color: '#15803d', bg: '#dcfce7' },
          { icon: <AlertCircle size={22} />,    label: 'Pending Approval',   value: stats.pendingProviders, color: '#dc2626', bg: '#fee2e2' },
        ].map(s => (
          <div key={s.label} className={`card ${styles.statCard}`}>
            <div className={styles.statIcon} style={{ background: s.bg, color: s.color }}>{s.icon}</div>
            <div className={styles.statValue}>{s.value}</div>
            <div className={styles.statLabel}>{s.label}</div>
          </div>
        ))}
      </div>

      <div className={styles.twoCol}>
        {/* Recent applications */}
        <div className={`card ${styles.card}`}>
          <div className={styles.cardHeader}>
            <h2>Recent Applications</h2>
            <Link to="/admin/applications" className={styles.viewAll}>View all <ArrowRight size={14} /></Link>
          </div>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>ID</th><th>Customer</th><th>Type</th><th>Provider</th><th>Status</th>
              </tr>
            </thead>
            <tbody>
              {recentApps.map(app => {
                const sc = STATUS_CONFIG[app.status];
                return (
                  <tr key={app.id}>
                    <td className={styles.appId}>{app.id}</td>
                    <td>{app.customerName}</td>
                  <td>{app.type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</td>
                    <td>{app.assignedProviderName ?? <span style={{ color: 'var(--text-muted)' }}>Unassigned</span>}</td>
                    <td>
                      <span className={styles.statusBadge} style={{ background: sc.bg, color: sc.color }}>
                        {sc.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Providers needing approval */}
        <div className={`card ${styles.card}`}>
          <div className={styles.cardHeader}>
            <h2>Providers Awaiting Approval</h2>
            <Link to="/admin/providers" className={styles.viewAll}>View all <ArrowRight size={14} /></Link>
          </div>
          {pendingProviders.length === 0 ? (
            <div className={styles.emptyState}>
              <CheckCircle2 size={36} style={{ color: 'var(--success)' }} />
              <p>All providers are verified!</p>
            </div>
          ) : (
            pendingProviders.map(p => (
              <div key={p.id} className={styles.providerItem}>
                <div className={styles.providerAvatar}>{p.officeName[0]}</div>
                <div className={styles.providerInfo}>
                  <div className={styles.providerName}>{p.officeName}</div>
                  <div className={styles.providerMeta}>{p.area} · {p.phone}</div>
                </div>
                <button
                  className={`btn btn-primary`}
                  style={{ padding: '7px 14px', fontSize: '12px' }}
                  onClick={() => updateProviderStatus(p.id, 'active')}
                >
                  Approve
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
