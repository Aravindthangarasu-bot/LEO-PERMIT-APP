import { useState, useMemo, useEffect, Fragment } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, FileText, CheckCircle2, XCircle, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useAppStore } from '../../context/AppStoreContext';
import ActivityThread from '../../components/ActivityThread';
import ActionConsole from '../../components/ActionConsole';
import { STATUS_CONFIG, COMMON_STATUS_FILTERS } from '../Customer/statusConfig';
import { PERMIT_TYPES } from '../../data/mockData';
import type { PermitApplication } from '../../types';
import styles from './Staff.module.css';
import PaginationControls from '../../components/PaginationControls';
import { DocumentViewer } from '../../components/DocumentViewer/DocumentViewer';

export default function StaffApplications() {
  const { user } = useAuth();
  const { updateApplication, publishApplicationUpdate, getAppsForUser } = useAppStore();
  const myApps = user ? getAppsForUser(user) : [];

  const [searchParams] = useSearchParams();
  const statusFilter = searchParams.get('status');

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [selected, setSelected] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [viewingDoc, setViewingDoc] = useState<{ url: string; name: string } | null>(null);
  
  const [actionDone, setActionDone] = useState('');

  useEffect(() => {
    const applicationId = searchParams.get('application');
    if (applicationId) {
      setSearch(applicationId);
      setFilter('all');
      setSelected(applicationId);
    }
  }, [searchParams]);

  // Security: find the app only within the staff's allowed apps (already filtered by getAppsForUser)
  const app = myApps.find(a => a.id === selected) ?? null;

  const filtered = useMemo(() => {
    let result = myApps;
    
    // Status Filter
    if (filter !== 'all') {
      result = result.filter(a => a.status === filter);
    } else if (statusFilter === 'in_progress') {
      const notInProgress = ['pending', 'approved', 'panchayat_approved', 'terminated', 'rejected', 'panchayat_rejected'];
      result = result.filter(a => !notInProgress.includes(a.status));
    } else if (statusFilter === 'approved_all') {
      result = result.filter(a => ['approved', 'panchayat_approved'].includes(a.status));
    } else if (statusFilter === 'rejected_all') {
      result = result.filter(a => ['rejected', 'panchayat_rejected'].includes(a.status));
    } else if (statusFilter) {
      result = result.filter(a => a.status === statusFilter);
    }
    
    // Search Filter
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(a =>
        a.id.toLowerCase().includes(q) ||
        a.customerName.toLowerCase().includes(q)
      );
    }
    
    return result;
  }, [myApps, statusFilter, filter, search]);

  const handleActionConsoleUpdate = async (appId: string, updates: Partial<PermitApplication>, msg: string, notifyType?: 'status_change', notifyMsg?: string) => {
    if (!await updateApplication(appId, updates)) return;
    setActionDone(msg);
    setTimeout(() => setActionDone(''), 3000);

    if (notifyType && notifyMsg) {
      publishApplicationUpdate({ applicationId: appId, actor: user!, title: 'Application status updated', summary: notifyMsg, type: notifyType });
    }
  };


  return (
    <div className={`page-enter ${styles.page}`}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>My Assignments</h1>
          <p className={styles.pageSub}>{myApps.length} applications assigned to me</p>
        </div>
      </div>

      <div className={styles.filterRow}>
        <div className={styles.searchBox}>
          <Search size={16} />
          <input type="text" placeholder="Search by ID or customer…" value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }} className={styles.searchInput} />
        </div>
        <div className={styles.filterBtns}>
          <button className={`${styles.filterBtn} ${filter === 'all' ? styles.filterActive : ''}`} onClick={() => { setFilter('all'); setPage(1); }}>All</button>
          {COMMON_STATUS_FILTERS.map(f => (
            <button key={f} className={`${styles.filterBtn} ${filter === f ? styles.filterActive : ''}`} onClick={() => { setFilter(f); setPage(1); }}>
              {STATUS_CONFIG[f as keyof typeof STATUS_CONFIG]?.label ?? f}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.appGrid}>
        <div className={`card ${styles.appListCard}`} style={{ gridColumn: '1 / -1', width: '100%' }}>
          {filtered.length === 0
            ? <div className={styles.emptyState}><FileText size={36} /><p>No assignments yet</p></div>
            : filtered.slice((page - 1) * 10, page * 10).map(a => {
                const sc = STATUS_CONFIG[a.status];
                return (
                  <Fragment key={a.id}>
                    <button className={`${styles.appRow} ${selected === a.id ? styles.appRowActive : ''}`}
                      onClick={() => { setSelected(a.id); setActionDone(''); }}>
                      <div className={styles.appRowLeft}>
                        <div className={styles.appId}>{a.id}</div>
                        <div className={styles.appType}>{PERMIT_TYPES.find(p => p.value === a.type)?.label}</div>
                        <div className={styles.appCustomer}>👤 {a.customerName} · {a.customerPhone}</div>
                        <div className={styles.appDate}>{new Date(a.submittedAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
                      </div>
                      <span className={styles.appBadge} style={{ background: sc.bg, color: sc.color }}>
                        <span className={`status-dot ${sc.dot}`} /> {sc.label}
                      </span>
                    </button>
                    {selected === a.id && (
                      <div className={styles.inlineCustomerExpansion}>
                        <div><span>Customer</span><strong>{a.customerName} · {a.customerPhone}</strong></div>
                        <div><span>Property</span><strong>{a.city || a.address}</strong></div>
                        <div><span>Location</span><strong>{a.taluk || '-'} · {a.district || a.pincode || '-'}</strong></div>
                        <div><span>Submitted</span><strong>{new Date(a.submittedAt).toLocaleString('en-IN')}</strong></div>
                      </div>
                    )}
                  </Fragment>
                );
              })
          }
          <PaginationControls page={page} pageCount={Math.max(1, Math.ceil(filtered.length / 10))} total={filtered.length} onPageChange={setPage} />
        </div>

        {app && (
          <div className={`card ${styles.reviewCard}`} style={{ gridColumn: '1 / -1', width: '100%' }}>
            {actionDone && <div className={styles.actionSuccess}><CheckCircle2 size={16} /> {actionDone}</div>}

            <div className={styles.detailHeader}>
              <div>
                <div className={styles.appId}>{app.id}</div>
                <div className={styles.detailType}>{PERMIT_TYPES.find(p => p.value === app.type)?.label}</div>
              </div>
              <div className={styles.detailHeaderActions}>
                <span className={styles.appBadge} style={{ background: STATUS_CONFIG[app.status].bg, color: STATUS_CONFIG[app.status].color }}>
                  {STATUS_CONFIG[app.status].label}
                </span>
                <button type="button" className={styles.closeDetailBtn} onClick={() => setSelected(null)} aria-label="Close details" title="Close application details">
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className={styles.detailSection}>
              <h4>Customer Details</h4>
              <div className={styles.detailGrid}>
                <div className={styles.detailGridItem}>
                  <div className={styles.detailGridLabel}>Name</div>
                  <div className={styles.detailGridValue}>{app.customerName}</div>
                </div>
                <div className={styles.detailGridItem}>
                  <div className={styles.detailGridLabel}>Phone</div>
                  <div className={styles.detailGridValue}>{app.customerPhone}</div>
                </div>
                <div className={`${styles.detailGridItem} ${styles.detailGridValueFull}`}>
                  <div className={styles.detailGridLabel}>Address</div>
                  <div className={styles.detailGridValue}>{app.address}</div>
                </div>
                <div className={`${styles.detailGridItem} ${styles.detailGridValueFull}`}>
                  <div className={styles.detailGridLabel}>Description</div>
                  <div className={styles.detailGridValue}>{app.description}</div>
                </div>
              </div>
            </div>

            <div className={styles.detailSection}>
              <h4>Documents ({app.documents.length})</h4>
              {app.documents.map(doc => (
                <div key={doc.id} className={styles.docRow}>
                  <FileText size={14} />
                  <span className={styles.docName}>{doc.name}</span>
                  <span className={`badge ${doc.status === 'verified' ? 'badge-success' : doc.status === 'rejected' ? 'badge-error' : 'badge-warning'}`}>{doc.status}</span>
                  {doc.url && (
                    <button type="button" onClick={() => setViewingDoc({ url: doc.url!, name: doc.name })} style={{ marginLeft: 'auto', fontSize: 12, color: '#1d4ed8', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                      View
                    </button>
                  )}
                </div>
              ))}
            </div>

            {!['terminated','rejected','approved','panchayat_approved'].includes(app.status) && (
              <div className={styles.actionPanel} style={{ borderTop: '1px solid #fca5a5', paddingTop: 16 }}>
                <button className={styles.rejectBtn} onClick={async () => {
                  if (!await updateApplication(app.id, { status: 'terminated', terminatedBy: 'provider', terminationReason: 'Declined by staff' })) return;
                  publishApplicationUpdate({ applicationId: app.id, actor: user!, title: 'Application terminated', summary: 'The assigned staff member terminated this application.', type: 'status_change' });
                  setActionDone('Project declined and terminated.');
                  setTimeout(() => setActionDone(''), 3000);
                }}>
                  <XCircle size={16} /> Decline / Terminate Project
                </button>
              </div>
            )}
            
            <div style={{ marginTop: 24 }}>
              <ActivityThread appId={app.id} activities={app.activityLog} />
            </div>

            <ActionConsole 
              app={app}
              uploaderRole="staff"
              onUpdate={(updates, msg, notifyType, notifyMsg) => handleActionConsoleUpdate(app.id, updates, msg, notifyType, notifyMsg)}
            />
          </div>
        )}
      </div>

      {viewingDoc && (
        <DocumentViewer
          url={viewingDoc.url}
          title={viewingDoc.name}
          onClose={() => setViewingDoc(null)}
        />
      )}
    </div>
  );
}
