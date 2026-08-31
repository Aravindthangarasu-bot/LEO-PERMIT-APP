import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FileText, Clock, CheckCircle2, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useAppStore } from '../../context/AppStoreContext';
import { STATUS_CONFIG } from '../Customer/statusConfig';
import { PERMIT_TYPES } from '../../data/mockData';
import AnimateIn from '../../components/AnimateIn';
import PaginationControls from '../../components/PaginationControls';
import styles from './Staff.module.css';

export default function StaffDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { getAppsForUser, getMyStaffProfile } = useAppStore();
  // Security: getAppsForUser for staff role returns only apps where
  //   assignedProviderId === staff.providerId AND assignedStaffId === staff.id
  const me     = user ? getMyStaffProfile(user) : null;
  const myApps = user ? getAppsForUser(user) : [];

  const active   = myApps.filter(a => !['approved','panchayat_approved','rejected','terminated'].includes(a.status));
  const approved = myApps.filter(a => ['approved','panchayat_approved'].includes(a.status));

  const [page, setPage] = useState(1);
  const itemsPerPage = 5;
  const paginatedActive = active.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  // Security: block inactive staff from accessing portal
  if (me?.status === 'inactive') {
    return (
      <div style={{ textAlign: 'center', padding: 80 }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🔒</div>
        <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Account Inactive</h2>
        <p style={{ color: 'var(--text-muted)' }}>Your staff account has been deactivated. Please contact your manager.</p>
      </div>
    );
  }

  return (
    <AnimateIn animationClass="fade-in">
      <div className={`page-enter ${styles.page}`}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Welcome, {user?.name} 👋</h1>
          <p className={styles.pageSub}>{me?.role === 'manager' ? 'Manager' : 'Associate'} · Staff Portal</p>
        </div>
      </div>

      <div className={styles.statsGrid}>
        {[
          { icon: <FileText size={22} />,    label: 'Assigned to Me',  value: myApps.length, color: '#6366f1', bg: '#eef2ff', filter: '' },
          { icon: <Clock size={22} />,        label: 'Active',          value: active.length, color: '#f59e0b', bg: '#fef3c7', filter: '?status=in_progress' },
          { icon: <CheckCircle2 size={22} />, label: 'Completed',       value: approved.length, color: '#16a34a', bg: '#dcfce7', filter: '?status=approved_all' },
        ].map(s => (
          <button 
            key={s.label} 
            className={`card ${styles.statCard}`}
            onClick={() => navigate(`/staff/applications${s.filter}`)}
            style={{ cursor: 'pointer', textAlign: 'left', border: 'none', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}
          >
            <div className={styles.statIcon} style={{ background: s.bg, color: s.color }}>{s.icon}</div>
            <div className={styles.statValue}>{s.value}</div>
            <div className={styles.statLabel}>{s.label}</div>
          </button>
        ))}
      </div>

      <div className={`card ${styles.appCard}`}>
        <div className={styles.cardHeader}>
          <h2>My Active Assignments</h2>
          <Link to="/staff/applications" className={styles.viewAll}>View all <ArrowRight size={14} /></Link>
        </div>
        {active.length === 0 ? (
          <div className={styles.emptyState}><FileText size={36} /><p>No active assignments</p></div>
        ) : (
          <div className={styles.appList}>
            {paginatedActive.map(app => {
              const sc = STATUS_CONFIG[app.status];
              return (
                <div key={app.id} className={styles.appItem}>
                  <div>
                    <div className={styles.appId}>{app.id}</div>
                    <div className={styles.appType}>{PERMIT_TYPES.find(p => p.value === app.type)?.label}</div>
                    <div className={styles.appCustomer}>👤 {app.customerName} · {app.customerPhone}</div>
                  </div>
                  <span className={styles.appBadge} style={{ background: sc.bg, color: sc.color }}>
                    <span className={`status-dot ${sc.dot}`} /> {sc.label}
                  </span>
                </div>
              );
            })}
          </div>
        )}
        {active.length > itemsPerPage && (
          <div style={{ marginTop: 24, padding: '0 24px 24px', display: 'flex', justifyContent: 'center' }}>
            <PaginationControls page={page} pageCount={Math.ceil(active.length / itemsPerPage)} total={active.length} onPageChange={setPage} />
          </div>
        )}
      </div>
      </div>
    </AnimateIn>
  );
}
