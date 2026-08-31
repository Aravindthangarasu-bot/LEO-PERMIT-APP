import { useState, useEffect, Fragment } from 'react';
import { Search, FileText, CheckCircle2, XCircle, X, AlertTriangle, Users, UserRound, Phone, MapPin, Calendar, ExternalLink } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { useAppStore } from '../../context/AppStoreContext';
import { useAuth } from '../../context/AuthContext';
import { STATUS_CONFIG } from '../Customer/statusConfig';

import ActivityThread from '../../components/ActivityThread';
import ActionConsole from '../../components/ActionConsole';
import type { PermitApplication } from '../../types';
import styles from './Provider.module.css';
import { sortByNewest } from '../../utils/sorting';
import PaginationControls from '../../components/PaginationControls';
import { DocumentViewer } from '../../components/DocumentViewer/DocumentViewer';

export default function ApprovedPermits() {
  const { user } = useAuth();
  const { updateApplication, publishApplicationUpdate, getAppsForUser, getStaffForProvider, getMyProviderProfile } = useAppStore();
  const provider = user ? getMyProviderProfile(user) : null;
  const myApps   = sortByNewest(user ? getAppsForUser(user) : [], app => app.submittedAt);
  const myStaff  = user ? getStaffForProvider(user) : [];
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [selected, setSelected] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [viewingDoc, setViewingDoc] = useState<{ url: string; name: string } | null>(null);

  useEffect(() => {
    if (searchParams.get('search')) setSearch(searchParams.get('search') || '');
    const applicationId = searchParams.get('application');
    if (applicationId) {
      setSearch(applicationId);
      setSelected(applicationId);
    }
  }, [searchParams]);

  const [actionDone, setActionDone] = useState('');
  const [assignStaffId, setAssignStaffId] = useState('');

  const closeApplication = () => {
    setSelected(null);
    setSearch('');
    setActionDone('');
    setAssignStaffId('');
    setSearchParams({}, { replace: true });
  };

  // Security: only expose active staff for THIS provider
  const activeStaff = myStaff.filter(s => s.status === 'active');

  const filtered = sortByNewest(myApps.filter(a => {
    // Only approved apps
    if (!['approved', 'panchayat_approved'].includes(a.status)) return false;

    const s = search.toLowerCase();
    return a.id.toLowerCase().includes(s) || a.customerName.toLowerCase().includes(s);
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
          <h1 className={styles.pageTitle}>Approved Permits</h1>
          <p className={styles.pageSub}>{filtered.length} completed applications</p>
        </div>
      </div>
      <div className={styles.filterRow}>
        <div className={styles.searchBox}>
          <Search size={16} />
          <input type="text" placeholder="Search by ID or customer..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} className={styles.searchInput} />
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
                                    <div className={styles.actionPanel} style={{ marginBottom: 16 }}>
                                      <h4 style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Users size={14} /> Change Staff Assignment</h4>
                                      <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginTop: 12 }}>
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
                                    <div className={styles.actionPanel} style={{ borderTop: '1px solid #e5e7eb', paddingTop: 12, marginTop: 12, marginBottom: 16 }}>
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
                                    <div className={styles.actionPanel} style={{ borderTop: '1px solid #fca5a5', paddingTop: 16, marginTop: 24 }}>
                                      <button className={styles.rejectBtn} onClick={async () => {
                                        if (!await updateApplication(a.id, { status: 'terminated', terminatedBy: 'provider', terminationReason: 'Declined by provider' })) return;
                                        publishApplicationUpdate({ applicationId: a.id, actor: user!, title: 'Application terminated', summary: 'The service provider terminated this application.', type: 'status_change' });
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
