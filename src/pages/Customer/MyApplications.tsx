import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, FileText, ChevronRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useAppStore } from '../../context/AppStoreContext';
import { PERMIT_TYPES } from '../../data/mockData';
import { STATUS_CONFIG } from './statusConfig';
import { sortByNewest } from '../../utils/sorting';
import styles from './Customer.module.css';
import PaginationControls from '../../components/PaginationControls';

export default function MyApplications() {
  const { user } = useAuth();
  const { getAppsForUser } = useAppStore();
  const apps = sortByNewest(user ? getAppsForUser(user) : [], app => app.submittedAt);
  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [filter, setFilter] = useState(searchParams.get('status') || 'all');
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (searchParams.get('search')) setSearch(searchParams.get('search') || '');
    if (searchParams.get('status')) setFilter(searchParams.get('status') || 'all');
  }, [searchParams]);

  const filtered = apps.filter(a => {
    const s = search.toLowerCase();
    const matchS = a.id.toLowerCase().includes(s) || 
                   a.address.toLowerCase().includes(s) || 
                   a.type.replace(/_/g, ' ').includes(s);
    
    let matchF = false;
    if (filter === 'all') matchF = true;
    else if (filter === 'in_progress') {
      matchF = !['pending', 'approved', 'panchayat_approved', 'terminated', 'rejected', 'panchayat_rejected'].includes(a.status);
    } else if (filter === 'approved_all') {
      matchF = ['approved', 'panchayat_approved'].includes(a.status);
    } else if (filter === 'rejected_all') {
      matchF = ['rejected', 'panchayat_rejected'].includes(a.status);
    } else {
      matchF = a.status === filter;
    }

    return matchS && matchF;
  });
  const pageCount = Math.max(1, Math.ceil(filtered.length / 10));
  const visibleApps = filtered.slice((page - 1) * 10, page * 10);

  return (
    <div className={`page-enter ${styles.page}`}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>My Applications</h1>
          <p className={styles.pageSub}>{apps.length} total applications</p>
        </div>
        <Link to="/customer/new" className="btn btn-primary">+ New Application</Link>
      </div>

      <div className={styles.filterRow}>
        <div className={styles.searchBox}>
          <Search size={16} />
          <input 
            type="text" 
            placeholder="Search by ID or address…" 
            value={search} 
            onChange={e => { setSearch(e.target.value); setPage(1); }} 
            className={styles.searchInput} 
          />
        </div>
        <div className={styles.filterBtns}>
          {['all', 'pending', 'under_review', 'documents_required', 'site_visit_scheduled',
            'client_review', 'panchayat_review', 'approved_all', 'rejected_all', 'terminated'].map(f => (
            <button key={f} className={`${styles.filterBtn} ${filter === f ? styles.filterActive : ''}`} onClick={() => { setFilter(f); setPage(1); }}>
              {f === 'all' ? 'All' 
                : f === 'approved_all' ? 'Approved' 
                : f === 'rejected_all' ? 'Rejected' 
                : STATUS_CONFIG[f as keyof typeof STATUS_CONFIG]?.label ?? f}
            </button>
          ))}
        </div>
      </div>

      <div className={`card ${styles.appListCard}`}>
        {filtered.length === 0 ? (
          <div className={styles.emptyState}><FileText size={40} /><p>No applications found</p></div>
        ) : (
          visibleApps.map(app => {
            const sc = STATUS_CONFIG[app.status];
            const needsAction = ['documents_required','client_review','plan_revision_requested'].includes(app.status);
            return (
              <Link key={app.id} to={`/customer/application/${app.id}`} className={styles.appRow}>
                <div className={styles.appRowLeft}>
                  <div className={styles.appId}>{app.id}</div>
                  <div className={styles.appType}>{PERMIT_TYPES.find(p => p.value === app.type)?.label}</div>
                  <div className={styles.appAddr}>{app.address}</div>
                  <div className={styles.appDate}>{new Date(app.submittedAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
                </div>
                <div className={styles.appRowRight}>
                  <span className={styles.appBadge} style={{ background: sc.bg, color: sc.color }}>
                    <span className={`status-dot ${sc.dot}`} /> {sc.label}
                  </span>
                  {needsAction && <span className={styles.actionTag}>Action Required</span>}
                  <ChevronRight size={16} style={{ color: 'var(--text-muted)', marginTop: 4 }} />
                </div>
              </Link>
            );
          })
        )}
        <PaginationControls page={page} pageCount={pageCount} total={filtered.length} onPageChange={setPage} />
      </div>
    </div>
  );
}
