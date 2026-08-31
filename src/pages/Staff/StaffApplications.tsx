import { useState, useMemo, useEffect, Fragment } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, FileText, CheckCircle2, XCircle, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useAppStore } from '../../context/AppStoreContext';
import ActivityThread from '../../components/ActivityThread';
import ActionConsole from '../../components/ActionConsole';
import { STATUS_CONFIG, COMMON_STATUS_FILTERS } from '../Customer/statusConfig';
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
        <div className={`card ${styles.card}`} style={{ padding: 0, overflow: 'hidden', gridColumn: '1 / -1', width: '100%' }}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>App ID</th>
                <th>Customer</th>
                <th>Permit Type</th>
                <th>Submitted</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)' }}>
                    <div className={styles.emptyState}><FileText size={36} /><p>No assignments yet</p></div>
                  </td>
                </tr>
              ) : filtered.slice((page - 1) * 10, page * 10).map(a => {
                  const sc = STATUS_CONFIG[a.status];
                  return (
                    <Fragment key={a.id}>
                      <tr
                        className={selected === a.id ? styles.tableRowActive : ''}
                        onClick={() => { setSelected(a.id); setActionDone(''); }}
                        style={{ cursor: 'pointer' }}
                      >
                        <td className={styles.appId}>{a.id}</td>
                        <td>
                          <div style={{ fontWeight: 600 }}>{a.customerName}</div>
                          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{a.customerPhone}</div>
                        </td>
                        <td>{a.type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</td>
                        <td style={{ fontSize: 12 }}>{new Date(a.submittedAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
                        <td>
                          <span className={styles.appBadge} style={{ background: sc.bg, color: sc.color }}>
                            {sc.label}
                          </span>
                        </td>
                      </tr>
                      {selected === a.id && (
                        <tr className={styles.inlineExpansionRow}>
                          <td colSpan={5}>
                            <div className={styles.inlineExpansion} style={{ margin: '16px 24px', position: 'relative' }}>
                              <button 
                                onClick={() => setSelected(null)}
                                style={{
                                  position: 'absolute', top: '8px', right: '8px',
                                  background: 'none', border: 'none', cursor: 'pointer',
                                  color: 'var(--text-muted)', padding: '8px',
                                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                                }}
                                aria-label="Close details"
                              >
                                <X size={20} />
                              </button>
                              
                              <div style={{ padding: '24px 32px' }}>
                                {actionDone && <div className={styles.actionSuccess}><CheckCircle2 size={16} /> {actionDone}</div>}
                                
                                <div className={styles.detailSection}>
                                  <h4>Customer Details</h4>
                                  <div className={styles.detailGrid}>
                                    <div className={styles.detailGridItem}>
                                      <div className={styles.detailGridLabel}>Name</div>
                                      <div className={styles.detailGridValue}>{a.customerName}</div>
                                    </div>
                                    <div className={styles.detailGridItem}>
                                      <div className={styles.detailGridLabel}>Phone</div>
                                      <div className={styles.detailGridValue}>{a.customerPhone}</div>
                                    </div>
                                    <div className={`${styles.detailGridItem} ${styles.detailGridValueFull}`}>
                                      <div className={styles.detailGridLabel}>Address</div>
                                      <div className={styles.detailGridValue}>{a.address}</div>
                                    </div>
                                    <div className={`${styles.detailGridItem} ${styles.detailGridValueFull}`}>
                                      <div className={styles.detailGridLabel}>Description</div>
                                      <div className={styles.detailGridValue}>{a.description}</div>
                                    </div>
                                  </div>
                                </div>

                                <div className={styles.detailSection}>
                                  <h4>Documents ({a.documents.length})</h4>
                                  {a.documents.map(doc => (
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

                                {!['terminated','rejected','approved','panchayat_approved'].includes(a.status) && (
                                  <div className={styles.actionPanel} style={{ borderTop: '1px solid #fca5a5', paddingTop: 16 }}>
                                    <button className={styles.rejectBtn} onClick={async () => {
                                      if (!await updateApplication(a.id, { status: 'terminated', terminatedBy: 'provider', terminationReason: 'Declined by staff' })) return;
                                      publishApplicationUpdate({ applicationId: a.id, actor: user!, title: 'Application terminated', summary: 'The assigned staff member terminated this application.', type: 'status_change' });
                                      setActionDone('Project declined and terminated.');
                                      setTimeout(() => setActionDone(''), 3000);
                                    }}>
                                      <XCircle size={16} /> Decline / Terminate Project
                                    </button>
                                  </div>
                                )}
                                
                                <div style={{ marginTop: 24 }}>
                                  <ActivityThread appId={a.id} activities={a.activityLog} />
                                </div>

                                <ActionConsole 
                                  app={a}
                                  uploaderRole="staff"
                                  onUpdate={(updates, msg, notifyType, notifyMsg) => handleActionConsoleUpdate(a.id, updates, msg, notifyType, notifyMsg)}
                                />
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })
              }
            </tbody>
          </table>
          <PaginationControls page={page} pageCount={Math.max(1, Math.ceil(filtered.length / 10))} total={filtered.length} onPageChange={setPage} />
        </div>
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
