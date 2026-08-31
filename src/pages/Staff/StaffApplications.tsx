import { useState, useMemo, useEffect, Fragment } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, FileText, CheckCircle2, XCircle, X, UserRound, Phone, MapPin, Calendar, ExternalLink } from 'lucide-react';
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
                                
                            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 400px', gap: 32, textAlign: 'left' }}>
                              {/* Left Column: Details */}
                              <div>
                                {/* Top Info Grid */}
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 24, marginBottom: 24 }}>
                                  
                                  {/* Customer */}
                                  <div>
                                    <h4 style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}><UserRound size={13} /> Customer</h4>
                                    <div style={{ fontSize: 13, marginBottom: 4 }}><strong>{a.customerName}</strong></div>
                                    <div style={{ fontSize: 13, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}><Phone size={13} /> {a.customerPhone}</div>
                                    <div style={{ fontSize: 13, color: 'var(--text-muted)' }}><MapPin size={13} style={{ display: 'inline', verticalAlign: 'text-bottom' }} /> {a.address}</div>
                                    {a.landmark && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Landmark: {a.landmark}</div>}
                                  </div>

                                  {/* Service & Assignment */}
                                  <div>
                                    <h4 style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}><Calendar size={13} /> Service & Assignment</h4>
                                    <div style={{ fontSize: 12, marginBottom: 4 }}><span style={{ color: 'var(--text-muted)', width: 60, display: 'inline-block' }}>Submitted</span> <strong>{new Date(a.submittedAt).toLocaleString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</strong></div>
                                    <div style={{ fontSize: 12, marginBottom: 4 }}><span style={{ color: 'var(--text-muted)', width: 60, display: 'inline-block' }}>Updated</span> <strong>{new Date(a.updatedAt).toLocaleString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</strong></div>
                                    <div style={{ fontSize: 12, marginBottom: 4 }}><span style={{ color: 'var(--text-muted)', width: 60, display: 'inline-block' }}>Provider</span> <strong>{a.assignedProviderName ?? 'Unassigned'}</strong></div>
                                    <div style={{ fontSize: 12, marginBottom: 4 }}><span style={{ color: 'var(--text-muted)', width: 60, display: 'inline-block' }}>Handler</span> <strong>{a.servicedBy === 'staff' ? a.assignedStaffName ?? 'Staff pending' : a.servicedBy === 'provider' ? 'Service provider' : 'Not selected'}</strong></div>
                                  </div>
                                </div>

                                {/* Description */}
                                {a.description && (
                                  <div style={{ marginBottom: 24, padding: '12px 16px', background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                                    <h4 style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', margin: '0 0 4px' }}>Description</h4>
                                    <p style={{ margin: 0, fontSize: 13, color: 'var(--text)', lineHeight: 1.5 }}>{a.description}</p>
                                  </div>
                                )}

                                {/* Documents */}
                                <div>
                                  <h4 style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}><FileText size={13} /> Documents ({a.documents.length})</h4>
                                  {a.documents.length === 0 ? (
                                    <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: 13 }}>No documents uploaded.</p>
                                  ) : (
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                                      {a.documents.map(document => (
                                        <div key={document.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 6, fontSize: 12 }}>
                                          <span style={{ fontWeight: 600, color: 'var(--text)' }}>{document.name}</span>
                                          <span style={{ color: document.status === 'verified' ? '#16a34a' : 'var(--text-muted)', textTransform: 'uppercase', fontSize: 10, fontWeight: 700 }}>{document.status}</span>
                                          {document.url && <button type="button" onClick={() => setViewingDoc({ url: document.url!, name: document.name })} style={{ color: 'var(--primary)', display: 'flex', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}><ExternalLink size={14} /></button>}
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>

                                {/* Actions */}
                                <div style={{ marginTop: 32 }}>
                                  <ActionConsole 
                                    app={a}
                                    uploaderRole="staff"
                                    onUpdate={(updates, msg, notifyType, notifyMsg) => handleActionConsoleUpdate(a.id, updates, msg, notifyType, notifyMsg)}
                                  />
                                  
                                  {!['terminated','rejected','approved','panchayat_approved'].includes(a.status) && (
                                    <div className={styles.actionPanel} style={{ borderTop: '1px solid #fca5a5', paddingTop: 16, marginTop: 24 }}>
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
                                </div>
                              </div>
                              
                              {/* Right Column: Activity */}
                              <div style={{ borderLeft: '1px solid var(--border)', paddingLeft: 32 }}>
                                <ActivityThread appId={a.id} activities={a.activityLog} />
                              </div>
                            </div>
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
