import { useState } from 'react';
import { Search, FileText, CheckCircle2, XCircle, Upload } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useAppStore } from '../../context/AppStoreContext';
import { STATUS_CONFIG } from '../Customer/statusConfig';
import { PERMIT_TYPES } from '../../data/mockData';
import type { ApplicationStatus } from '../../types';
import styles from './Staff.module.css';

export default function StaffApplications() {
  const { user } = useAuth();
  const { updateApplication, addNotification, getAppsForUser } = useAppStore();
  const myApps = user ? getAppsForUser(user) : [];

  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [actionDone, setActionDone] = useState('');

  // Security: find the app only within the staff's allowed apps (already filtered by getAppsForUser)
  const app = myApps.find(a => a.id === selected) ?? null;

  const filtered = myApps.filter(a =>
    a.id.toLowerCase().includes(search.toLowerCase()) ||
    a.customerName.toLowerCase().includes(search.toLowerCase())
  );

  const notify = (appId: string, customerId: string, type: any, message: string) => {
    addNotification({
      id: `n_${Date.now()}`,
      applicationId: appId,
      customerId,
      type,
      message,
      contactName: user?.name,
      contactPhone: user?.phone,
      timestamp: new Date().toISOString(),
      read: false,
    });
  };

  const update = (id: string, status: ApplicationStatus, msg: string) => {
    updateApplication(id, { status, notes: notes || undefined });
    const a = myApps.find(x => x.id === id)!;
    notify(id, a.customerId, 'status_change',
      `Your application ${id} status updated to "${STATUS_CONFIG[status].label}". Handled by: ${user?.name} (+91 ${user?.phone}).`
    );
    setActionDone(msg);
    setTimeout(() => setActionDone(''), 3000);
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
            onChange={e => setSearch(e.target.value)} className={styles.searchInput} />
        </div>
      </div>

      <div className={styles.appGrid}>
        <div className={`card ${styles.appListCard}`}>
          {filtered.length === 0
            ? <div className={styles.emptyState}><FileText size={36} /><p>No assignments yet</p></div>
            : filtered.map(a => {
                const sc = STATUS_CONFIG[a.status];
                return (
                  <button key={a.id} className={`${styles.appRow} ${selected === a.id ? styles.appRowActive : ''}`}
                    onClick={() => { setSelected(a.id); setNotes(''); setActionDone(''); }}>
                    <div className={styles.appRowLeft}>
                      <div className={styles.appId}>{a.id}</div>
                      <div className={styles.appType}>{PERMIT_TYPES.find(p => p.value === a.type)?.label}</div>
                      <div className={styles.appCustomer}>👤 {a.customerName} · {a.customerPhone}</div>
                    </div>
                    <span className={styles.appBadge} style={{ background: sc.bg, color: sc.color }}>
                      <span className={`status-dot ${sc.dot}`} /> {sc.label}
                    </span>
                  </button>
                );
              })
          }
        </div>

        {app && (
          <div className={`card ${styles.detailCard}`}>
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

            <div className={styles.detailSection}>
              <h4>Customer Details</h4>
              <div className={styles.detailRows}>
                <div className={styles.detailRow}><span>Name</span><span>{app.customerName}</span></div>
                <div className={styles.detailRow}><span>Phone</span><span>{app.customerPhone}</span></div>
                <div className={styles.detailRow}><span>Address</span><span>{app.address}</span></div>
                <div className={styles.detailRow}><span>Description</span><span>{app.description}</span></div>
              </div>
            </div>

            {!['approved','panchayat_approved','rejected','terminated'].includes(app.status) && (
              <div className={styles.actionPanel}>
                <h4>Update Status</h4>
                <div className="form-group">
                  <label className="form-label">Notes / Remarks</label>
                  <textarea className="form-input" rows={2} placeholder="Add notes for the customer…"
                    value={notes} onChange={e => setNotes(e.target.value)} />
                </div>
                <div className={styles.actionBtns}>
                  <button className={styles.approveBtn} onClick={() => update(app.id, 'under_review', 'Marked as under review.')}>
                    <CheckCircle2 size={15} /> Under Review
                  </button>
                  <button className={styles.docsBtn} onClick={() => update(app.id, 'documents_required', 'Requested more documents.')}>
                    <Upload size={15} /> Request Docs
                  </button>
                  <button className={styles.rejectBtn} onClick={() => update(app.id, 'rejected', 'Application rejected.')}>
                    <XCircle size={15} /> Reject
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
