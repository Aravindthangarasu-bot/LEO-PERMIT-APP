import { useState, useMemo } from 'react';
import { CheckCircle2, Upload, MessageSquare, Calendar } from 'lucide-react';
import { STATUS_CONFIG } from '../pages/Customer/statusConfig';
import type { PermitApplication, ApplicationStatus } from '../types';
import DocumentUpload, { type UploadedFile } from './DocumentUpload/DocumentUpload';

const VALID_TRANSITIONS: Partial<Record<ApplicationStatus, ApplicationStatus[]>> = {
  pending: ['under_review', 'documents_required'],
  documents_required: ['under_review'],
  under_review: [],
  site_visit_scheduled: ['site_visit_confirmed'],
  site_visit_confirmed: ['site_visit_completed'],
  site_visit_completed: [],
  site_visit_completion_confirmed: ['plan_preparation'],
  plan_preparation: ['plan_uploaded'],
  plan_uploaded: [], // Waits for customer review
  client_review: [], // Waits for customer review
  plan_revision_requested: ['plan_preparation', 'plan_uploaded'],
  panchayat_review: ['panchayat_approved', 'panchayat_rejected'],
  panchayat_approved: ['approved'],
  panchayat_rejected: ['plan_preparation', 'rejected']
};

interface ActionConsoleProps {
  app: PermitApplication;
  uploaderRole?: 'provider' | 'staff';
  onUpdate: (updates: Partial<PermitApplication>, msg: string, notifyType?: 'status_change', notifyMsg?: string) => void;
}

export default function ActionConsole({ app, onUpdate, uploaderRole = 'provider' }: ActionConsoleProps) {
  const [selectedAction, setSelectedAction] = useState<ApplicationStatus | null>(null);
  const [notes, setNotes] = useState('');
  
  // Conditional field state
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [uploadFile, setUploadFile] = useState<UploadedFile | null>(null);
  const [approvalNumber, setApprovalNumber] = useState('');

  const validNextStates = VALID_TRANSITIONS[app.status] || [];

  const markVisitRequired = () => {
    onUpdate(
      { siteVisitRequired: true, notes: notes.trim() || 'Site visit required before plan preparation.' },
      'Site visit requested from customer.',
      'status_change',
      'A site visit is required. Please provide at least one available date and time. Map location is optional; otherwise confirm the property address.'
    );
    setNotes('');
  };

  const skipSiteVisit = () => {
    onUpdate(
      { siteVisitRequired: false, status: 'plan_preparation', notes: notes.trim() || 'Site visit not required for this service.' },
      'Site visit skipped. Moved to plan preparation.',
      'status_change',
      'Your service provider confirmed that a site visit is not required. Plan preparation has started.'
    );
    setNotes('');
  };

  const isFormValid = useMemo(() => {
    if (!selectedAction) return false;
    if (!notes.trim()) return false; // Mandatory for all
    
    if (selectedAction === 'site_visit_confirmed' && !selectedDate) return false;
    if (selectedAction === 'plan_uploaded' && !uploadFile) return false;
    if (selectedAction === 'panchayat_approved' && !approvalNumber.trim()) return false;
    
    return true;
  }, [selectedAction, notes, selectedDate, uploadFile, approvalNumber]);

  const handleSubmit = () => {
    if (!isFormValid || !selectedAction) return;

    const updates: Partial<PermitApplication> = {
      status: selectedAction,
      notes: notes.trim()
    };

    let successMsg = `Status updated to ${STATUS_CONFIG[selectedAction]?.label}`;
    let notifyMsg = `Your application status was updated to ${STATUS_CONFIG[selectedAction]?.label}.`;

    if (selectedAction === 'site_visit_confirmed') {
      updates.selectedSiteVisitDate = selectedDate;
      successMsg = 'Site visit date confirmed.';
      notifyMsg = `Your site visit has been confirmed for ${new Date(selectedDate).toLocaleString()}.`;
    }

    if (selectedAction === 'site_visit_completed') {
      successMsg = 'Site visit marked as completed.';
      notifyMsg = 'Your service provider marked the site visit as completed. Please confirm the visit completion.';
    }

    if (selectedAction === 'plan_uploaded') {
      const newPlan = {
        id: uploadFile!.id,
        version: (app.planRevisions?.length || 0) + 1,
        uploadedAt: new Date().toISOString(),
        uploadedBy: uploaderRole,
        comments: notes.trim()
      };
      updates.planRevisions = [...(app.planRevisions || []), newPlan];
      updates.planUrl = uploadFile!.url; // Save the blob URL
      successMsg = 'Plan uploaded successfully.';
      notifyMsg = 'A new plan has been uploaded for your review.';
    }

    if (selectedAction === 'panchayat_approved') {
      updates.approvalNumber = approvalNumber.trim();
      updates.panchayatStatus = 'approved';
      successMsg = 'Authority approval recorded.';
      notifyMsg = `Congratulations! Your application has been approved by the authority. Approval Number: ${approvalNumber.trim()}`;
    }
    
    if (selectedAction === 'documents_required') {
      notifyMsg = `Additional documents are required. Note: ${notes.trim()}`;
    }

    onUpdate(updates, successMsg, 'status_change', notifyMsg);
    
    setSelectedAction(null);
    setNotes('');
    setSelectedDate('');
    setUploadFile(null);
    setApprovalNumber('');
  };

  if (['approved', 'rejected', 'terminated'].includes(app.status)) {
    return null; // Terminal states
  }

  if (app.status === 'under_review' && app.siteVisitRequired !== true) {
    return (
      <div style={{ background: 'white', borderRadius: 12, border: '1px solid #e2e8f0', overflow: 'hidden', marginTop: 24 }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', margin: 0 }}>Site Visit Decision</h3>
        </div>
        <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>Decide whether this service requires a physical site visit. If required, the customer will be asked for date, time, and optional map location.</p>
          <textarea className="form-input" rows={3} placeholder="Provider notes for the customer or internal record..." value={notes} onChange={e => setNotes(e.target.value)} />
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <button className="btn btn-primary" onClick={markVisitRequired}><Calendar size={14} /> Site Visit Required</button>
            <button className="btn btn-outline" onClick={skipSiteVisit}><CheckCircle2 size={14} /> No Visit Required</button>
          </div>
        </div>
      </div>
    );
  }

  if (validNextStates.length === 0) {
    return (
      <div style={{ background: '#f8fafc', padding: 20, borderRadius: 12, border: '1px solid #e2e8f0', marginTop: 24, textAlign: 'center' }}>
        <CheckCircle2 size={32} style={{ color: '#94a3b8', margin: '0 auto 12px' }} />
        <h4 style={{ fontSize: 15, color: 'var(--text)', marginBottom: 4 }}>Awaiting Customer Action</h4>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>
          You cannot transition the application from <strong>{STATUS_CONFIG[app.status]?.label}</strong> until the customer takes the next step.
        </p>
      </div>
    );
  }

  return (
    <div style={{ background: 'white', borderRadius: 12, border: '1px solid #e2e8f0', overflow: 'hidden', marginTop: 24 }}>
      <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', margin: 0 }}>Action Console</h3>
      </div>
      
      <div style={{ padding: 20 }}>
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 8 }}>
            Select Next Step
          </label>
          <select 
            className="form-input" 
            value={selectedAction || ''} 
            onChange={e => setSelectedAction(e.target.value as ApplicationStatus)}
            style={{ width: '100%', maxWidth: 400 }}
          >
            <option value="">-- Choose an action --</option>
            {validNextStates.map(status => (
              <option key={status} value={status}>
                {STATUS_CONFIG[status]?.label}
              </option>
            ))}
          </select>
        </div>

        {selectedAction && (
          <div style={{ background: '#f8fafc', padding: 20, borderRadius: 8, border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: 16 }}>
            
            {/* Conditional: Site Visit Confirmed */}
            {selectedAction === 'site_visit_confirmed' && (
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 8 }}>
                  <Calendar size={14} style={{ display: 'inline', verticalAlign: 'text-bottom', marginRight: 4 }} />
                  Select Date (Customer Proposed) *
                </label>
                {app.siteVisitDates && app.siteVisitDates.length > 0 ? (
                  <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                    {app.siteVisitDates.map(d => (
                      <label key={d} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'white', padding: '10px 14px', border: `1px solid ${selectedDate === d ? 'var(--primary)' : '#e2e8f0'}`, borderRadius: 8, cursor: 'pointer' }}>
                        <input 
                          type="radio" 
                          name="siteVisitDate" 
                          value={d} 
                          checked={selectedDate === d}
                          onChange={e => setSelectedDate(e.target.value)}
                        />
                        <span style={{ fontSize: 14 }}>{new Date(d).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}</span>
                      </label>
                    ))}
                  </div>
                ) : (
                  <p style={{ color: 'var(--error)', fontSize: 13 }}>Error: Customer has not provided any date and time options.</p>
                )}
              </div>
            )}

            {/* Conditional: Plan Upload */}
            {selectedAction === 'plan_uploaded' && (
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 8 }}>
                  <Upload size={14} style={{ display: 'inline', verticalAlign: 'text-bottom', marginRight: 4 }} />
                  Upload Architectural Plan *
                </label>
                <DocumentUpload 
                  label="Architectural Plan (PDF/Image)" 
                  value={uploadFile} 
                  onChange={setUploadFile} 
                />
              </div>
            )}

            {/* Conditional: Approval Number */}
            {selectedAction === 'panchayat_approved' && (
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 8 }}>
                  Approval / Permit Number *
                </label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="e.g. PERM-KL-2026-1024"
                  value={approvalNumber} 
                  onChange={e => setApprovalNumber(e.target.value)} 
                  style={{ maxWidth: 400 }}
                />
              </div>
            )}

            {/* Mandatory Notes */}
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 8 }}>
                <MessageSquare size={14} style={{ display: 'inline', verticalAlign: 'text-bottom', marginRight: 4 }} />
                Mandatory Comments / Notes *
              </label>
              <textarea 
                className="form-input" 
                rows={3} 
                placeholder="Explain this transition, or provide notes for the customer/staff..."
                value={notes} 
                onChange={e => setNotes(e.target.value)} 
              />
            </div>

            <button 
              className="btn btn-primary" 
              style={{ alignSelf: 'flex-start', padding: '10px 24px', opacity: isFormValid ? 1 : 0.5, cursor: isFormValid ? 'pointer' : 'not-allowed' }}
              disabled={!isFormValid}
              onClick={handleSubmit}
            >
              Update Status
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
