import { useState, useEffect, Fragment } from 'react';
import { Search, FileText, CheckCircle2, XCircle, X, AlertTriangle, Users } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { useAppStore } from '../../context/AppStoreContext';
import { useAuth } from '../../context/AuthContext';
import { STATUS_CONFIG, COMMON_STATUS_FILTERS } from '../Customer/statusConfig';

import ActivityThread from '../../components/ActivityThread';
import ActionConsole from '../../components/ActionConsole';
import type { PermitApplication } from '../../types';
import styles from './Provider.module.css';
import { sortByNewest } from '../../utils/sorting';
import PaginationControls from '../../components/PaginationControls';
import { DocumentViewer } from '../../components/DocumentViewer/DocumentViewer';

export default function AssignedApplications() {
  const { user } = useAuth();
  const { updateApplication, publishApplicationUpdate, getAppsForUser, getStaffForProvider, getMyProviderProfile } = useAppStore();
  const provider = user ? getMyProviderProfile(user) : null;
  const myApps   = sortByNewest(user ? getAppsForUser(user) : [], app => app.submittedAt);
  const myStaff  = user ? getStaffForProvider(user) : [];
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [filter, setFilter] = useState(searchParams.get('status') || 'all');
  const [selected, setSelected] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [viewingDoc, setViewingDoc] = useState<{ url: string; name: string } | null>(null);

  useEffect(() => {
    if (searchParams.get('search')) setSearch(searchParams.get('search') || '');
    if (searchParams.get('status')) setFilter(searchParams.get('status') || 'all');
    const applicationId = searchParams.get('application');
    if (applicationId) {
      setSearch(applicationId);
      setFilter('all');
      setSelected(applicationId);
    }
  }, [searchParams]);

  const [actionDone, setActionDone] = useState('');
  const [assignStaffId, setAssignStaffId] = useState('');

  const closeApplication = () => {
    setSelected(null);
    setSearch('');
    setFilter('all');
    setActionDone('');
    setAssignStaffId('');
    setSearchParams({}, { replace: true });
  };

  // Security: only expose active staff for THIS provider
  const activeStaff = myStaff.filter(s => s.status === 'active');

  const filtered = sortByNewest(myApps.filter(a => {
    const s = search.toLowerCase();
    const matchS = a.id.toLowerCase().includes(s) || a.customerName.toLowerCase().includes(s);
    
    let matchF = false;
    if (filter === 'all') matchF = true;
    else if (filter === 'in_progress') {
      matchF = !['pending', 'approved', 'panchayat_approved', 'terminated', 'rejected', 'panchayat_rejected'].includes(a.status);
    } else if (filter === 'approved_all') {
      matchF = ['approved', 'panchayat_approved'].includes(a.status);
    } else {
      matchF = a.status === filter;
    }

    return matchS && matchF;
  }), app => app.submittedAt);

  const app = myApps.find(a => a.id === selected) ?? null;

  const handleActionConsoleUpdate = async (appId: string, updates: Partial<PermitApplication>, msg: string, notifyType?: 'status_change', notifyMsg?: string) => {
    if (!await updateApplication(appId, updates)) return;
    setActionDone(msg);
    setTimeout(() => setActionDone(''), 3000);

    if (notifyType && notifyMsg) {
      publishApplicationUpdate({ applicationId: appId, actor: user!, title: 'Application status updated', summary: notifyMsg, type: notifyType, contactName: provider?.officeName, contactPhone: user?.phone });
    }
  };

  const handleServiceMyself = async () => {
    if (!app) return;
    const wasAssignedToStaff = app.servicedBy === 'staff';
    if (!await updateApplication(app.id, {
      servicedBy: 'provider',
      ...(wasAssignedToStaff && {
        assignedStaffId: null,
        assignedStaffName: null,
        assignedStaffPhone: null,
      }),
    })) return;
    setActionDone('✓ You are now servicing this application');
    publishApplicationUpdate({ applicationId: app.id, actor: user!, title: 'Application received', summary: `Your application has been received and is being reviewed by ${provider?.officeName || user!.name}. For questions, contact ${user!.name} at +91 ${user!.phone}.`, type: 'acknowledgement', contactName: user!.name, contactPhone: user!.phone });
    setTimeout(() => setActionDone(''), 3000);
  };

  const handleAssignStaff = async () => {
    if (!assignStaffId || !app) return;
    const s = activeStaff.find(x => x.id === assignStaffId);
    if (!s) return;
    if (!await updateApplication(app.id, { 
      servicedBy: 'staff',
      assignedStaffId: s.id, 
      assignedStaffName: s.name, 
      assignedStaffPhone: s.phone, 
      status: 'under_review' 
    })) return;
    setActionDone(`Assigned to ${s.name}`);
    publishApplicationUpdate({ applicationId: app.id, actor: user!, recipientIds: [s.id], title: 'Application handler assigned', summary: `Your application has been received and is being reviewed by ${s.name}. For questions, contact ${s.name} at +91 ${s.phone}.`, type: 'staff_assigned', contactName: s.name, contactPhone: s.phone });
    setAssignStaffId('');
    setTimeout(() => setActionDone(''), 3000);
  };

  return (
    <div className={`page-enter ${styles.page}`}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Assigned Applications</h1>
          <p className={styles.pageSub}>{myApps.length} applications assigned to you</p>
        </div>
      </div>

      <div className={styles.filterRow}>
        <div className={styles.searchBox}>
          <Search size={16} />
          <input type="text" placeholder="Search by ID or customer…" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} className={styles.searchInput} />
        </div>
        <div className={styles.filterBtns}>
          <button className={`${styles.filterBtn} ${filter === 'all' ? styles.filterActive : ''}`} onClick={() => { setFilter('all'); setPage(1); }}>All</button>
          <button className={`${styles.filterBtn} ${filter === 'approved_all' ? styles.filterActive : ''}`} onClick={() => { setFilter('approved_all'); setPage(1); }}>Completed</button>
          {COMMON_STATUS_FILTERS.map(f => (
            <button key={f} className={`${styles.filterBtn} ${filter === f ? styles.filterActive : ''}`} onClick={() => { setFilter(f); setPage(1); }}>
              {STATUS_CONFIG[f as keyof typeof STATUS_CONFIG]?.label ?? f}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.appGrid}>
        {/* List */}
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
                    <div className={styles.emptyState}>
                      <p>No applications found matching your criteria</p>
                    </div>
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
                              onClick={closeApplication}
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
                              
                              {/* Customer info */}
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
                                    <div className={styles.detailGridLabel}>Address / Landmark</div>
                                    <div className={styles.detailGridValue}>{a.address} {a.landmark ? `(Near ${a.landmark})` : ''}</div>
                                  </div>
                                  <div className={`${styles.detailGridItem} ${styles.detailGridValueFull}`}>
                                    <div className={styles.detailGridLabel}>Description</div>
                                    <div className={styles.detailGridValue}>{a.description}</div>
                                  </div>
                                </div>
                              </div>

                              {/* Documents */}
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

                              {/* Service Status Banner */}
                              {a.servicedBy && (
                                <div style={{ 
                                  padding: '12px 16px', 
                                  background: a.servicedBy === 'provider' ? '#dcfce7' : '#e0f2fe',
                                  border: `1px solid ${a.servicedBy === 'provider' ? '#86efac' : '#7dd3fc'}`,
                                  borderRadius: '8px',
                                  marginBottom: '16px',
                                  fontSize: '13px',
                                  color: a.servicedBy === 'provider' ? '#166534' : '#0c4a6e',
                                  fontWeight: 500
                                }}>
                                  {a.servicedBy === 'provider' ? (
                                    <>✓ You are servicing this application</>
                                  ) : (
                                    <>✓ Assigned to: <strong>{a.assignedStaffName}</strong> (+91 {a.assignedStaffPhone})</>
                                  )}
                                </div>
                              )}

                              {/* Service Choice Panel - Show when servicedBy is not set */}
                              {!a.servicedBy && activeStaff.length > 0 && !['terminated','rejected','approved','panchayat_approved'].includes(a.status) && (
                                <div className={styles.actionPanel} style={{ 
                                  background: '#fffbeb',
                                  borderLeft: '4px solid #f59e0b',
                                  marginBottom: '16px'
                                }}>
                                  <h4 style={{ marginBottom: '12px', color: '#92400e' }}>
                                    <AlertTriangle size={16} style={{ marginRight: '8px', display: 'inline' }} />
                                    How would you like to handle this application?
                                  </h4>
                                  <p style={{ fontSize: '13px', color: '#78350f', marginBottom: '14px' }}>
                                    Choose whether you'll service this application yourself or assign it to one of your office staff members.
                                  </p>
                                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                    <button 
                                      className={styles.approveBtn} 
                                      onClick={handleServiceMyself}
                                      style={{ 
                                        background: '#15803d',
                                        padding: '12px 16px',
                                        fontSize: '14px',
                                        fontWeight: 600,
                                        border: 'none',
                                        borderRadius: '6px',
                                        cursor: 'pointer',
                                        color: 'white'
                                      }}
                                    >
                                      ✓ Service This Myself
                                    </button>
                                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                      <select 
                                        className="form-input" 
                                        value={assignStaffId} 
                                        onChange={e => setAssignStaffId(e.target.value)}
                                        style={{ flex: 1 }}
                                      >
                                        <option value="">Select staff member…</option>
                                        {activeStaff.map(s => <option key={s.id} value={s.id}>{s.name} ({s.role})</option>)}
                                      </select>
                                      <button 
                                        className={styles.approveBtn}
                                        onClick={handleAssignStaff} 
                                        disabled={!assignStaffId}
                                        style={{
                                          background: assignStaffId ? '#1d4ed8' : '#cbd5e1',
                                          color: 'white',
                                          padding: '12px 16px',
                                          border: 'none',
                                          borderRadius: '6px',
                                          cursor: assignStaffId ? 'pointer' : 'not-allowed',
                                          fontWeight: 600,
                                          whiteSpace: 'nowrap'
                                        }}
                                      >
                                        Assign
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              )}

                              {/* Assign to staff panel - Show when already assigned to staff and user wants to change */}
                              {a.servicedBy === 'staff' && activeStaff.length > 0 && !['terminated','rejected','approved','panchayat_approved'].includes(a.status) && (
                                <div className={styles.actionPanel}>
                                  <h4><Users size={14} /> Change Staff Assignment</h4>
                                  <p style={{ fontSize: 12, color: 'var(--success)', marginBottom: 10 }}>
                                    ✓ Currently assigned to: <strong>{a.assignedStaffName}</strong> (+91 {a.assignedStaffPhone})
                                  </p>
                                  <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                                    <select className="form-input" style={{ flex: 1 }} value={assignStaffId} onChange={e => setAssignStaffId(e.target.value)}>
                                      <option value="">Select different staff member…</option>
                                      {activeStaff.map(s => <option key={s.id} value={s.id}>{s.name} ({s.role})</option>)}
                                    </select>
                                    <button className={styles.approveBtn} onClick={handleAssignStaff} disabled={!assignStaffId}>
                                      Change
                                    </button>
                                  </div>
                                </div>
                              )}

                              {/* Take over from staff */}
                              {a.servicedBy === 'staff' && !['terminated','rejected','approved','panchayat_approved'].includes(a.status) && (
                                <div className={styles.actionPanel} style={{ borderTop: '1px solid #e5e7eb', paddingTop: 12, marginTop: 12 }}>
                                  <button 
                                    onClick={handleServiceMyself}
                                    style={{
                                      background: 'transparent',
                                      border: '1px solid #3b82f6',
                                      color: '#3b82f6',
                                      padding: '10px 14px',
                                      fontSize: '13px',
                                      fontWeight: 600,
                                      borderRadius: '6px',
                                      cursor: 'pointer'
                                    }}
                                  >
                                    ← Take Over - Service This Myself
                                  </button>
                                </div>
                              )}

                              {/* ── STAGE-BASED ACTIONS ── */}
                              <ActionConsole 
                                app={a}
                                uploaderRole="provider"
                                onUpdate={(updates, msg, notifyType, notifyMsg) => handleActionConsoleUpdate(a.id, updates, msg, notifyType, notifyMsg)}
                              />

                              {/* Terminate */}
                              {!['terminated','rejected','approved','panchayat_approved'].includes(a.status) && (
                                <div className={styles.actionPanel} style={{ borderTop: '1px solid #fca5a5', paddingTop: 16 }}>
                                  <button className={styles.rejectBtn} onClick={async () => {
                                    if (!await updateApplication(a.id, { status: 'terminated', terminatedBy: 'provider', terminationReason: 'Declined by provider' })) return;
                                    publishApplicationUpdate({ applicationId: a.id, actor: user!, title: 'Application terminated', summary: 'The service provider terminated this application.', type: 'status_change' });
                                  }}>
                                    <XCircle size={16} /> Decline / Terminate Project
                                  </button>
                                </div>
                              )}

                              <div className={styles.activityPanel} style={{ marginTop: 24 }}>
                                <ActivityThread appId={a.id} activities={a.activityLog} />
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
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
