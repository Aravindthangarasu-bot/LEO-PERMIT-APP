import { Link } from 'react-router-dom';
import { FileText, Clock, CheckCircle2, XCircle, ArrowRight, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useAppStore } from '../../context/AppStoreContext';
import { PERMIT_TYPES } from '../../data/mockData';
import { STATUS_CONFIG } from './statusConfig';
import styles from './Customer.module.css';

const SERVICE_TILES = PERMIT_TYPES.map(p => ({ ...p }));

export default function CustomerDashboard() {
  const { user } = useAuth();
  const { getAppsForUser } = useAppStore();
  const apps = user ? getAppsForUser(user) : [];

  const stats = {
    total:       apps.length,
    pending:     apps.filter(a => ['pending','under_review','site_visit_scheduled','plan_uploaded','client_review','panchayat_review'].includes(a.status)).length,
    approved:    apps.filter(a => ['panchayat_approved','approved'].includes(a.status)).length,
    rejected:    apps.filter(a => ['rejected','terminated','panchayat_rejected'].includes(a.status)).length,
    action:      apps.filter(a => ['documents_required','client_review','plan_revision_requested'].includes(a.status)).length,
  };

  const recentApps = apps.slice(0, 3);

  return (
    <div className={`page-enter ${styles.page}`}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Welcome, {user?.name?.split(' ')[0]} 👋</h1>
          <p className={styles.pageSub}>Kerala Building Permit Services</p>
        </div>
        <Link to="/customer/new" className="btn btn-primary">+ New Application</Link>
      </div>

      {/* Stats */}
      <div className={styles.statsGrid}>
        {[
          { icon: <FileText size={22} />,     label: 'Total Applications', value: stats.total,    color: '#6366f1', bg: '#eef2ff' },
          { icon: <Clock size={22} />,         label: 'In Progress',        value: stats.pending,  color: '#3b82f6', bg: '#dbeafe' },
          { icon: <AlertCircle size={22} />,   label: 'Action Required',    value: stats.action,   color: '#f59e0b', bg: '#fef3c7' },
          { icon: <CheckCircle2 size={22} />,  label: 'Approved',           value: stats.approved, color: '#16a34a', bg: '#dcfce7' },
          { icon: <XCircle size={22} />,       label: 'Rejected',           value: stats.rejected, color: '#dc2626', bg: '#fee2e2' },
        ].map(s => (
          <div key={s.label} className={`card ${styles.statCard}`}>
            <div className={styles.statIcon} style={{ background: s.bg, color: s.color }}>{s.icon}</div>
            <div className={styles.statValue}>{s.value}</div>
            <div className={styles.statLabel}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* 12 Service Tiles */}
      <div className={`card ${styles.servicesCard}`}>
        <h2 className={styles.sectionTitle}>Our Services</h2>
        <div className={styles.serviceTiles}>
          {SERVICE_TILES.map(s => (
            <Link key={s.value} to={`/customer/new?type=${s.value}`} className={styles.serviceTile}>
              <span className={styles.tileEmoji}>{s.icon}</span>
              <span className={styles.tileLabel}>{s.label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Applications */}
      <div className={`card ${styles.recentCard}`}>
        <div className={styles.cardHeader}>
          <h2>Recent Applications</h2>
          <Link to="/customer/applications" className={styles.viewAll}>View all <ArrowRight size={14} /></Link>
        </div>
        {recentApps.length === 0 ? (
          <div className={styles.emptyState}><FileText size={40} /><p>No applications yet</p><Link to="/customer/new" className="btn btn-primary">Apply Now</Link></div>
        ) : (
          <div className={styles.appList}>
            {recentApps.map(app => {
              const sc = STATUS_CONFIG[app.status];
              const needsAction = ['documents_required','client_review','plan_revision_requested'].includes(app.status);
              return (
                <Link key={app.id} to={`/customer/application/${app.id}`} className={styles.appItem}>
                  <div className={styles.appLeft}>
                    <div className={styles.appId}>{app.id}</div>
                    <div className={styles.appType}>{PERMIT_TYPES.find(p => p.value === app.type)?.label}</div>
                    <div className={styles.appAddr}>{app.address}</div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                    <span className={styles.appBadge} style={{ background: sc.bg, color: sc.color }}>
                      <span className={`status-dot ${sc.dot}`} /> {sc.label}
                    </span>
                    {needsAction && <span className={styles.actionTag}>Action Required</span>}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

