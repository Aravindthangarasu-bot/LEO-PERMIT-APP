import { useState } from 'react';
import { Search, FileText, CheckCircle2, XCircle, Calendar, MessageSquare, AlertTriangle, Users, Upload } from 'lucide-react';
import { PERMIT_TYPES } from '../../data/mockData';
import { useAppStore } from '../../context/AppStoreContext';
import { STATUS_CONFIG } from '../Customer/statusConfig';
import { useAuth } from '../../context/AuthContext';
import DocumentUpload from '../../components/DocumentUpload/DocumentUpload';
import type { UploadedFile } from '../../components/DocumentUpload/DocumentUpload';
import type { ApplicationStatus } from '../../types';
import styles from './Provider.module.css';

export default function AssignedApplications() {
  const { user } = useAuth();
  const { updateApplication, addNotification, getAppsForUser, getStaffForProvider, getMyProviderProfile } = useAppStore();
  const provider = user ? getMyProviderProfile(user) : null;
  const myApps   = user ? getAppsForUser(user) : [];
  const myStaff  = user ? getStaffForProvider(user) : [];
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [selected, setSelected] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [visitDate, setVisitDate] = useState('');
  const [planUpload, setPlanUpload] = useState<UploadedFile | null>(null);
  const [actionDone, setActionDone] = useState('');
  const [assignStaffId, setAssignStaffId] = useState('');

  // Security: only expose active staff for THIS provider
  const activeStaff = myStaff.filter(s => s.status === 'active');

  const filtered = myApps.filter(a => {
    const matchS = a.id.toLowerCase().includes(search.toLowerCase()) || a.customerName.toLowerCase().includes(search.toLowerCase());
    const matchF = filter === 'all' || a.status === filter;
    return matchS && matchF;
  });
  const app = myApps.find(a => a.id === selected) ?? null;

  const notify = (appId: string, customerId: string, type: any, message: string, cName?: string, cPhone?: string) => {
    addNotification({ id: `n_${Date.now()}`, applicationId: appId, customerId, type, message, contactName: cName, contactPhone: cPhone, timestamp: new Date().toISOString(), read: false });
  };

  const update = (id: string, patch: Partial<typeof app>, msg: string) => {
    updateApplication(id, patch as any);
    setActionDone(msg);
    setTimeout(() => setActionDone(''), 3000);
  };

  const handleAssignStaff = () => {
    if (!assignStaffId || !app) return;
    const s = activeStaff.find(x => x.id === assignStaffId);
    if (!s) return;
    update(app.id, { assignedStaffId: s.id, assignedStaffName: s.name, assignedStaffPhone: s.phone, status: 'under_review' },
      `Assigned to ${s.name}`);
    notify(app.id, app.customerId, 'staff_assigned',
      `Your request ${app.id} is now being handled by our office staff. Contact: ${s.name} (+91 ${s.phone}).`,
      s.name, s.phone
    );
    setAssignStaffId('');
  };

  const statusFilters: ApplicationStatus[] = [
    'pending','under_review','documents_required','site_visit_scheduled',
    'plan_preparation','plan_uploaded','client_review','plan_revision_requested',
    'panchayat_review','panchayat_approved','terminated',
  ];

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
          <input type="text" placeholder="Search by ID or customer…" value={search} onChange={e => setSearch(e.target.value)} className={styles.searchInput} />
        </div>
        <div className={styles.filterBtns}>
          <button className={`${styles.filterBtn} ${filter === 'all' ? styles.filterActive : ''}`} onClick={() => setFilter('all')}>All</button>
          {statusFilters.map(f => (
            <button key={f} className={`${styles.filterBtn} ${filter === f ? styles.filterActive : ''}`} onClick={() => setFilter(f)}>
              {STATUS_CONFIG[f]?.label ?? f}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.appGrid}>
        {/* List */}
        <div className={`card ${styles.appListCard}`}>
          {filtered.map(a => {
            const sc = STATUS_CONFIG[a.status];
            return (
              <button key={a.id} className={`${styles.appRow} ${selected === a.id ? styles.appRowActive : ''}`}
                onClick={() => { setSelected(a.id); setNotes(''); setVisitDate(''); setPlanUpload(null); setActionDone(''); }}>
                <div className={styles.appRowLeft}>
                  <div className={styles.appId}>{a.id}</div>
                  <div className={styles.appType}>{PERMIT_TYPES.find(p => p.value === a.type)?.label}</div>
                  <div className={styles.appCustomer}>👤 {a.customerName} · {a.customerPhone}</div>
                  <div className={styles.appDate}>{new Date(a.submittedAt).toLocaleDateString('en-IN')}</div>
                </div>
                <span className={styles.appBadge} style={{ background: sc.bg, color: sc.color }}>
                  <span className={`status-dot ${sc.dot}`} /> {sc.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* Detail + Actions */}
        {app && (
          <div className={`card ${styles.reviewCard}`}>
            {actionDone && <div className={styles.actionSuccess}><CheckCircle2 size={16} /> {actionDone}</div>}

            <div className={styles.detailHeader}>
              <div>
                <div className={styles.appId}>{app.id}</div>
                <div className={styles.detailType}>{PERMIT_TYPES.find(p => p.value === app.type)?.label}</div>
              </div>
              <span className={styles.appBadge} style={{ background: STATUS_CONFIG[app.status].bg, color: STATUS_CONFIG[app.status].color }}>
                {STATUS_CONFIG[app.status].label}
              </span>
            </div>

            {/* Customer info */}
            <div className={styles.detailSection}>
              <h4>Customer</h4>
              <div className={styles.detailRows}>
                <div className={styles.detailRow}><span>Name</span><span>{app.customerName}</span></div>
                <div className={styles.detailRow}><span>Phone</span><span>{app.customerPhone}</span></div>
                <div className={styles.detailRow}><span>Address</span><span>{app.address}</span></div>
                <div className={styles.detailRow}><span>Landmark</span><span>{app.landmark}</span></div>
                <div className={styles.detailRow}><span>Description</span><span>{app.description}</span></div>
              </div>
            </div>

            {/* Documents */}
            <div className={styles.detailSection}>
              <h4>Documents ({app.documents.length})</h4>
              {app.documents.map(doc => (
                <div key={doc.id} className={styles.docRow}>
                  <FileText size={14} />
                  <span className={styles.docName}>{doc.name}</span>
                  <span className={`badge ${doc.status === 'verified' ? 'badge-success' : doc.status === 'rejected' ? 'badge-error' : 'badge-warning'}`}>{doc.status}</span>
                </div>
              ))}
            </div>

            {/* Acknowledgement panel for new pending applications */}
            {app.status === 'pending' && (
              <div className={styles.actionPanel}>
                <h4>Acknowledge Request</h4>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>
                  Acknowledge this request to notify the customer with your contact details.
                </p>
                <button className={styles.approveBtn} onClick={() => {
                  update(app.id, { status: 'under_review' }, 'Request acknowledged. Customer notified.');
                  notify(app.id, app.customerId, 'acknowledgement',
                    `Your application ${app.id} has been acknowledged by ${provider?.officeName ?? 'our team'}. Feel free to contact us at +91 ${user?.phone}.`,
                    provider?.officeName, user?.phone
                  );
                }}>
                  <CheckCircle2 size={16} /> Acknowledge & Notify Customer
                </button>
              </div>
            )}

            {/* Assign to staff panel */}
            {activeStaff.length > 0 && !['terminated','rejected','approved','panchayat_approved'].includes(app.status) && (
              <div className={styles.actionPanel}>
                <h4><Users size={14} /> Assign to Staff</h4>
                {app.assignedStaffName && (
                  <p style={{ fontSize: 12, color: 'var(--success)', marginBottom: 10 }}>
                    ✓ Currently assigned to: <strong>{app.assignedStaffName}</strong> (+91 {app.assignedStaffPhone})
                  </p>
                )}
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <select className="form-input" style={{ flex: 1 }} value={assignStaffId} onChange={e => setAssignStaffId(e.target.value)}>
                    <option value="">Select staff member…</option>
                    {activeStaff.map(s => <option key={s.id} value={s.id}>{s.name} ({s.role})</option>)}
                  </select>
                  <button className={styles.approveBtn} onClick={handleAssignStaff} disabled={!assignStaffId}>
                    Assign
                  </button>
                </div>
              </div>
            )}

            {/* ── STAGE-BASED ACTIONS ── */}

            {/* Stage: Verify documents */}
            {['pending','under_review'].includes(app.status) && (
              <div className={styles.actionPanel}>
                <h4>Verify Documents</h4>
                <div className="form-group">
                  <label className="form-label">Notes / Issue (if any)</label>
                  <textarea className="form-input" rows={2} placeholder="Describe document issue or leave blank if all OK…" value={notes} onChange={e => setNotes(e.target.value)} />
                </div>
                <div className={styles.actionBtns}>
                  <button className={styles.approveBtn} onClick={() => {
                    update(app.id, { status: 'under_review', notes: notes || undefined }, 'Documents verified! Awaiting site visit dates from customer.');
                    notify(app.id, app.customerId, 'status_change',
                      `Documents for ${app.id} verified. Please propose 3 site visit dates in your portal. Contact: ${provider?.officeName} (+91 ${user?.phone}).`,
                      provider?.officeName, user?.phone);
                  }}>
                    <CheckCircle2 size={16} /> Documents OK
                  </button>
                  <button className={styles.rejectBtn} onClick={() => { if (!notes) return; update(app.id, { status: 'documents_required', notes }, 'Document issue reported to customer.'); }}>
                    <AlertTriangle size={16} /> Report Issue
                  </button>
                </div>
              </div>
            )}

            {/* Stage: Select site visit date from customer's 3 options */}
            {app.status === 'site_visit_scheduled' && app.siteVisitDates && !app.selectedSiteVisitDate && (
              <div className={styles.actionPanel}>
                <h4><Calendar size={14} /> Select Site Visit Date</h4>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 12 }}>Customer proposed these dates. Select one to confirm.</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
                  {app.siteVisitDates.map(d => (
                    <label key={d} className={`${styles.dateOption} ${visitDate === d ? styles.dateOptionActive : ''}`}>
                      <input type="radio" name="visitDate" value={d} checked={visitDate === d} onChange={() => setVisitDate(d)} style={{ display: 'none' }} />
                      {visitDate === d && <CheckCircle2 size={14} />}
                      {new Date(d).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                    </label>
                  ))}
                </div>
                <button className={styles.approveBtn} onClick={() => { if (!visitDate) return; update(app.id, { selectedSiteVisitDate: visitDate, status: 'site_visit_confirmed' }, 'Site visit date confirmed!'); }}>
                  <CheckCircle2 size={16} /> Confirm Date
                </button>
              </div>
            )}

            {/* Stage: Mark site visit done & start plan preparation */}
            {app.status === 'site_visit_confirmed' && (
              <div className={styles.actionPanel}>
                <h4>Site Visit Done?</h4>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 12 }}>
                  Confirmed visit: <strong>{app.selectedSiteVisitDate ? new Date(app.selectedSiteVisitDate).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' }) : '-'}</strong>
                </p>
                <button className={styles.approveBtn} onClick={() => update(app.id, { status: 'plan_preparation' }, 'Site visit marked complete. Now prepare the plan.')}>
                  <CheckCircle2 size={16} /> Mark Site Visit Complete
                </button>
              </div>
            )}

            {/* Stage: Upload plan PDF */}
            {['plan_preparation','plan_revision_requested'].includes(app.status) && (
              <div className={styles.actionPanel}>
                <h4>Upload Plan PDF</h4>
                {app.status === 'plan_revision_requested' && app.clientComments && (
                  <div className={styles.clientCommentBox}>
                    <MessageSquare size={13} /> <strong>Client comments:</strong> {app.clientComments}
                  </div>
                )}
                <DocumentUpload
                  label="Building Plan (PDF)"
                  accept=".pdf"
                  value={planUpload}
                  onChange={setPlanUpload}
                  hint="Upload the prepared plan for client review"
                />
                <button className={styles.approveBtn} disabled={!planUpload} onClick={() => {
                  const rev = app.planRevisions ?? [];
                  update(app.id, {
                    status: 'client_review',
                    planUrl: planUpload!.url,
                    planRevisions: [...rev, { id: `pr${Date.now()}`, version: rev.length + 1, uploadedAt: new Date().toISOString(), comments: planUpload!.name }],
                  }, 'Plan uploaded! Sent to client for review.');
                  setPlanUpload(null);
                }}>
                  Submit Plan to Client
                </button>
              </div>
            )}

            {/* Stage: Submit to Panchayat */}
            {app.status === 'panchayat_review' && (
              <div className={styles.actionPanel}>
                <h4>Submit to Authority</h4>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>Client has approved the plan. Submit the application to the authority for final approval.</p>
                <div style={{ display: 'flex', gap: 12 }}>
                  <button className={styles.approveBtn} onClick={() => update(app.id, { status: 'panchayat_approved', panchayatStatus: 'approved', approvalNumber: `PERM-KL-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}` }, 'Authority approved! Approval number generated.')}>
                    <CheckCircle2 size={16} /> Authority Approved
                  </button>
                  <button className={styles.rejectBtn} onClick={() => update(app.id, { status: 'panchayat_rejected', panchayatStatus: 'rejected' }, 'Authority rejection recorded.')}>
                    <XCircle size={16} /> Authority Rejected
                  </button>
                </div>
              </div>
            )}

            {/* Stage: Upload approved documents */}
            {app.status === 'panchayat_approved' && (
              <div className={styles.actionPanel}>
                <h4><Upload size={14} /> Upload Authority Approved Documents</h4>
                <p style={{ fontSize: 13, color: 'var(--success)', marginBottom: 12 }}>Approval No: <strong>{app.approvalNumber}</strong></p>
                <label className={styles.uploadBtn} style={{ width: '100%', justifyContent: 'center' }}>
                  <Upload size={14} /> Upload Approved Docs
                  <input type="file" accept=".pdf" style={{ display: 'none' }} onChange={() => update(app.id, { status: 'approved' }, 'Approved documents uploaded. Project complete!')} />
                </label>
              </div>
            )}

            {/* Terminate */}
            {!['terminated','rejected','approved','panchayat_approved'].includes(app.status) && (
              <div className={styles.actionPanel} style={{ borderTop: '1px solid #fca5a5', paddingTop: 16 }}>
                <button className={styles.rejectBtn} onClick={() => update(app.id, { status: 'terminated', terminatedBy: 'provider', terminationReason: 'Declined by provider' }, 'Project declined and terminated.')}>
                  <XCircle size={16} /> Decline / Terminate Project
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

