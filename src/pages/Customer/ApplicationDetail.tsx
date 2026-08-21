import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, FileText, CheckCircle2, XCircle, Calendar, Download, MessageSquare, AlertTriangle } from 'lucide-react';
import { useAppStore } from '../../context/AppStoreContext';
import { useAuth } from '../../context/AuthContext';
import { canCustomerAccessApp } from '../../utils/security';
import { PERMIT_TYPES } from '../../data/mockData';
import { STATUS_CONFIG, LIFECYCLE_STAGES } from './statusConfig';
import type { ApplicationStatus } from '../../types';
import styles from './Customer.module.css';

const STAGE_ORDER: ApplicationStatus[] = [
  'pending', 'under_review', 'site_visit_scheduled', 'plan_preparation',
  'client_review', 'panchayat_review', 'panchayat_approved',
];

export default function ApplicationDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { applications, updateApplication } = useAppStore();
  const [dates, setDates] = useState(['', '', '']);
  const [comments, setComments] = useState('');
  const [actionDone, setActionDone] = useState('');

  const app = applications.find(a => a.id === id);

  // Security: verify the customer owns this application
  if (app && user && canCustomerAccessApp(user, app).allowed === false) {
    return (
      <div className={styles.page} style={{ textAlign: 'center', padding: 80 }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🔒</div>
        <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Access Denied</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: 24 }}>You do not have permission to view this application.</p>
        <Link to="/customer/applications" className="btn btn-primary">My Applications</Link>
      </div>
    );
  }
  if (!app) return (
    <div className={styles.page} style={{ textAlign: 'center', padding: 80 }}>
      <p>Application not found. <Link to="/customer/applications">Go back</Link></p>
    </div>
  );

  const sc = STATUS_CONFIG[app.status];
  const permitLabel = PERMIT_TYPES.find(p => p.value === app.type)?.label ?? app.type;
  const stageIdx = STAGE_ORDER.indexOf(app.status as ApplicationStatus);

  const updateApp = (patch: Partial<typeof app>, msg: string) => {
    updateApplication(id!, patch as Partial<typeof app>);
    setActionDone(msg);
    setTimeout(() => setActionDone(''), 3000);
  };

  const handleSubmitDates = () => {
    const filled = dates.filter(d => d);
    if (filled.length < 1) return;
    updateApp({ siteVisitDates: filled, status: 'site_visit_scheduled' }, 'Site visit dates submitted!');
    setDates(['', '', '']);
  };

  const handleApprovePlan = () => {
    updateApp({ status: 'panchayat_review' }, 'Plan approved! Sent for Panchayat review.');
  };

  const handleRequestRevision = () => {
    if (!comments.trim()) return;
    updateApp({ status: 'plan_revision_requested', clientComments: comments }, 'Revision request sent to provider.');
    setComments('');
  };

  const handleTerminate = () => {
    updateApp({ status: 'terminated', terminatedBy: 'client', terminationReason: 'Terminated by client' }, 'Project terminated.');
  };

  return (
    <div className={`page-enter ${styles.page}`}>
      {/* Header */}
      <div className={styles.pageHeader}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button className={styles.backBtn} onClick={() => navigate(-1)}><ArrowLeft size={16} /> Back</button>
          <div>
            <h1 className={styles.pageTitle}>{app.id}</h1>
            <p className={styles.pageSub}>{permitLabel}</p>
          </div>
        </div>
        <span className={styles.appBadge} style={{ background: sc.bg, color: sc.color }}>
          <span className={`status-dot ${sc.dot}`} /> {sc.label}
        </span>
      </div>

      {actionDone && (
        <div className={styles.actionSuccess}><CheckCircle2 size={16} /> {actionDone}</div>
      )}

      <div className={styles.detailLayout}>
        {/* LEFT — Timeline + Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Lifecycle Timeline */}
          <div className={`card ${styles.timelineCard}`}>
            <h3 className={styles.cardSectionTitle}>Application Progress</h3>
            <div className={styles.timeline}>
              {LIFECYCLE_STAGES.map((stage, i) => {
                const done  = stageIdx > i || ['panchayat_approved','approved'].includes(app.status);
                const current = app.status === stage.status ||
                  (stage.status === 'client_review' && ['client_review','plan_uploaded','plan_revision_requested'].includes(app.status));
                return (
                  <div key={stage.status} className={styles.timelineItem}>
                    <div className={`${styles.timelineDot} ${done ? styles.timelineDone : current ? styles.timelineCurrent : ''}`}>
                      {done ? <CheckCircle2 size={14} /> : i + 1}
                    </div>
                    <div className={`${styles.timelineLabel} ${current ? styles.timelineLabelActive : ''}`}>{stage.label}</div>
                  </div>
                );
              })}
              {['terminated','rejected','panchayat_rejected'].includes(app.status) && (
                <div className={styles.timelineItem}>
                  <div className={`${styles.timelineDot} ${styles.timelineTerminated}`}><XCircle size={14} /></div>
                  <div className={styles.timelineLabel} style={{ color: 'var(--error)' }}>{sc.label}</div>
                </div>
              )}
            </div>
          </div>

          {/* ACTION PANELS based on status */}

          {/* Customer needs to provide 3 site visit dates */}
          {app.status === 'under_review' && !app.siteVisitDates && (
            <div className={`card ${styles.actionCard}`}>
              <h3 className={styles.cardSectionTitle}><Calendar size={16} /> Propose Site Visit Dates</h3>
              <p className={styles.actionNote}>Your documents are verified. Please provide 3 available dates for the site visit.</p>
              {dates.map((d, i) => (
                <div key={i} className="form-group">
                  <label className="form-label">Date Option {i + 1}{i === 0 ? ' (required)' : ' (optional)'}</label>
                  <input className="form-input" type="date" value={d} min={new Date().toISOString().split('T')[0]}
                    onChange={e => setDates(prev => { const n = [...prev]; n[i] = e.target.value; return n; })} />
                </div>
              ))}
              <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={handleSubmitDates}>
                Submit Dates
              </button>
            </div>
          )}

          {/* Site visit dates already submitted */}
          {app.siteVisitDates && app.siteVisitDates.length > 0 && ['site_visit_scheduled','site_visit_confirmed','plan_preparation','plan_uploaded'].includes(app.status) && (
            <div className={`card ${styles.actionCard}`}>
              <h3 className={styles.cardSectionTitle}><Calendar size={16} /> Site Visit</h3>
              <div className={styles.dateRow}>
                <span>Your proposed dates:</span>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 6 }}>
                  {app.siteVisitDates.map(d => <span key={d} className={styles.dateChip}>{new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>)}
                </div>
              </div>
              {app.selectedSiteVisitDate && (
                <div className={styles.confirmedDate}>
                  <CheckCircle2 size={16} /> Confirmed date: <strong>{new Date(app.selectedSiteVisitDate).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</strong>
                </div>
              )}
            </div>
          )}

          {/* Client Review — approve or request revision */}
          {['client_review', 'plan_uploaded'].includes(app.status) && app.planUrl && (
            <div className={`card ${styles.actionCard}`}>
              <h3 className={styles.cardSectionTitle}><FileText size={16} /> Review Plan</h3>
              <p className={styles.actionNote}>Your service provider has uploaded the plan. Please review and approve or request changes.</p>
              <div className={styles.planFile}>
                <FileText size={18} />
                <span>{app.planUrl}</span>
                <button className={styles.downloadBtn}><Download size={14} /> Download</button>
              </div>
              {app.planRevisions && app.planRevisions.length > 0 && (
                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16 }}>
                  Version {app.planRevisions[app.planRevisions.length - 1].version} uploaded on{' '}
                  {new Date(app.planRevisions[app.planRevisions.length - 1].uploadedAt).toLocaleDateString('en-IN')}
                </p>
              )}
              <div className="form-group">
                <label className="form-label">Comments / Revision Request</label>
                <textarea className="form-input" rows={3} placeholder="Describe any changes needed…"
                  value={comments} onChange={e => setComments(e.target.value)} />
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <button className={styles.approveBtn} onClick={handleApprovePlan}><CheckCircle2 size={16} /> Approve Plan</button>
                <button className={styles.revisionBtn} onClick={handleRequestRevision}><MessageSquare size={16} /> Request Revision</button>
              </div>
            </div>
          )}

          {/* Panchayat status */}
          {['panchayat_review','panchayat_approved','panchayat_rejected'].includes(app.status) && (
            <div className={`card ${styles.actionCard}`}>
              <h3 className={styles.cardSectionTitle}>Authority Review</h3>
              {app.status === 'panchayat_review' && <p className={styles.actionNote}>Your application has been submitted to the authority for approval. This typically takes 3–5 working days.</p>}
              {app.status === 'panchayat_approved' && (
                <div className={styles.approvalBanner}>
                  <span>✅ Approved — <strong>{app.approvalNumber}</strong></span>
                  <button className={styles.downloadBtn}><Download size={14} /> Download Approval</button>
                </div>
              )}
              {app.status === 'panchayat_rejected' && (
                <div style={{ background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: 8, padding: '12px 16px', color: '#991b1b', fontSize: 13 }}>
                  ❌ Authority has rejected this application. Please contact your service provider for next steps.
                </div>
              )}
            </div>
          )}

          {/* Terminate option */}
          {!['terminated','rejected','panchayat_approved','approved'].includes(app.status) && (
            <div className={`card ${styles.actionCard}`} style={{ borderColor: '#fca5a5' }}>
              <h3 className={styles.cardSectionTitle} style={{ color: 'var(--error)' }}><AlertTriangle size={16} /> Decline / Terminate Project</h3>
              <p className={styles.actionNote}>You can terminate this project at any stage. This action cannot be undone.</p>
              <button className={styles.terminateBtn} onClick={handleTerminate}><XCircle size={16} /> Terminate Project</button>
            </div>
          )}
        </div>

        {/* RIGHT — Application Info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className={`card ${styles.infoCard}`}>
            <h3 className={styles.cardSectionTitle}>Application Details</h3>
            <div className={styles.detailRows}>
              <div className={styles.detailRow}><span>Service</span><span>{permitLabel}</span></div>
              <div className={styles.detailRow}><span>Address</span><span>{app.address}</span></div>
              <div className={styles.detailRow}><span>Landmark</span><span>{app.landmark}</span></div>
              <div className={styles.detailRow}><span>Description</span><span>{app.description}</span></div>
              <div className={styles.detailRow}><span>Submitted</span><span>{new Date(app.submittedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</span></div>
              <div className={styles.detailRow}><span>Provider</span><span>{app.assignedProviderName ?? 'Not yet assigned'}</span></div>
            </div>
          </div>

          {app.notes && (
            <div className={`card ${styles.infoCard}`}>
              <h3 className={styles.cardSectionTitle}><MessageSquare size={14} /> Notes from Provider</h3>
              <p className={styles.notesText}>{app.notes}</p>
            </div>
          )}

          <div className={`card ${styles.infoCard}`}>
            <h3 className={styles.cardSectionTitle}>Documents ({app.documents.length})</h3>
            {app.documents.length === 0
              ? <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>No documents uploaded yet.</p>
              : app.documents.map(doc => (
                <div key={doc.id} className={styles.docRow}>
                  <FileText size={14} />
                  <span className={styles.docName}>{doc.name}</span>
                  <span className={`badge ${doc.status === 'verified' ? 'badge-success' : doc.status === 'rejected' ? 'badge-error' : 'badge-warning'}`}>{doc.status}</span>
                  {doc.url && (
                    <a href={doc.url} target="_blank" rel="noreferrer" style={{ marginLeft: 'auto', fontSize: 12, color: '#1d4ed8', fontWeight: 600 }}>
                      View
                    </a>
                  )}
                </div>
              ))
            }
          </div>
        </div>
      </div>
    </div>
  );
}
