import { useState } from 'react';
import { UserPlus, CheckCircle2, Phone, Mail, AlertCircle, Users } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useAppStore } from '../../context/AppStoreContext';
import { StaffManagementSchema, sanitizeInput } from '../../utils/validation';
import styles from './Provider.module.css';

export default function StaffManagement() {
  const { user } = useAuth();
  const { addStaff, updateStaffStatus, applications, getStaffForProvider, getMyProviderProfile } = useAppStore();
  // Security: only see staff belonging to this provider
  const myStaff  = user ? getStaffForProvider(user) : [];
  const provider = user ? getMyProviderProfile(user) : null;

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', email: '', role: 'associate' as const });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [actionMsg, setActionMsg] = useState('');

  const appCountForStaff = (staffId: string) =>
    applications.filter(a => a.assignedStaffId === staffId && !['approved','terminated','panchayat_approved'].includes(a.status)).length;

  const validate = () => {
    const e: Record<string, string> = {};
    
    const validateField = (field: string, value: string) => {
      const schema = StaffManagementSchema.shape[field as keyof typeof StaffManagementSchema.shape];
      if (schema) {
        const res = schema.safeParse(value);
        if (!res.success) return res.error.errors[0].message;
      }
      return null;
    };

    const nameErr = validateField('name', form.name);
    if (nameErr) e.name = nameErr;
    const phoneErr = validateField('phone', form.phone);
    if (phoneErr) e.phone = phoneErr;
    const emailErr = validateField('email', form.email);
    if (emailErr) e.email = emailErr;

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleAdd = () => {
    if (!validate()) return;
    const result = addStaff({
      id: `s_${Date.now()}`,
      name: form.name,
      phone: form.phone,
      email: form.email,
      role: form.role,
      // Security: providerId is taken from the logged-in provider's profile, not from user input
      providerId: provider?.id ?? user?.id ?? 'unknown',
      status: 'active',
      joinedAt: new Date().toISOString(),
    });
    if (!result.ok) {
      setErrors(prev => ({ ...prev, phone: result.error }));
      setActionMsg('Staff member was not added. This phone number is already in use.');
      setTimeout(() => setActionMsg(''), 4000);
      return;
    }
    setForm({ name: '', phone: '', email: '', role: 'associate' });
    setShowForm(false);
    setActionMsg(`${form.name} added. They can log in using +91 ${form.phone}.`);
    setTimeout(() => setActionMsg(''), 4000);
  };

  return (
    <div className={`page-enter ${styles.page}`}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>My Staff</h1>
          <p className={styles.pageSub}>{myStaff.length} office staff members</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(v => !v)}>
          <UserPlus size={16} /> {showForm ? 'Cancel' : 'Add Staff'}
        </button>
      </div>

      {actionMsg && (
        <div className={styles.actionSuccess}><CheckCircle2 size={16} /> {actionMsg}</div>
      )}

      {/* Add Staff Form */}
      {showForm && (
        <div className={`card ${styles.addStaffCard}`}>
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>Add New Staff Member</h3>
          <div className={styles.staffFormGrid}>
            <div className="form-group">
              <label className="form-label">Full Name *</label>
              <input className="form-input" type="text" placeholder="e.g. Rajan Menon"
                value={form.name} onChange={e => setForm(f => ({ ...f, name: sanitizeInput(e.target.value) }))} />
              {errors.name && <p className={styles.fieldErr}><AlertCircle size={12} /> {errors.name}</p>}
            </div>
            <div className="form-group">
              <label className="form-label"><Phone size={12} /> Mobile Number (Login ID) *</label>
              <div className={styles.phoneInput}>
                <span className={styles.phonePrefix}>+91</span>
                <input className={styles.phoneField} type="tel" maxLength={10} placeholder="10-digit number"
                  value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value.replace(/\D/g,'') }))} />
              </div>
              {errors.phone && <p className={styles.fieldErr}><AlertCircle size={12} /> {errors.phone}</p>}
              <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>This number is their login ID for the Staff Portal.</p>
            </div>
            <div className="form-group">
              <label className="form-label"><Mail size={12} /> Email *</label>
              <input className="form-input" type="email" placeholder="staff@email.com"
                value={form.email} onChange={e => setForm(f => ({ ...f, email: sanitizeInput(e.target.value) }))} />
              {errors.email && <p className={styles.fieldErr}><AlertCircle size={12} /> {errors.email}</p>}
            </div>
            <div className="form-group">
              <label className="form-label">Role</label>
              <select className="form-input" value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value as any }))}>
                <option value="associate">Associate</option>
                <option value="manager">Manager</option>
              </select>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
            <button className="btn btn-outline" onClick={() => setShowForm(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleAdd}>Add Staff Member</button>
          </div>
        </div>
      )}

      {/* Staff Table */}
      {myStaff.length === 0 ? (
        <div className={`card ${styles.emptyState}`} style={{ padding: 48 }}>
          <Users size={40} />
          <p>No staff members yet. Add your first staff member to get started.</p>
        </div>
      ) : (
        <div className={`card`} style={{ padding: 0, overflow: 'hidden' }}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Name</th>
                <th>Login ID (Phone)</th>
                <th>Email</th>
                <th>Role</th>
                <th>Active Jobs</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {myStaff.map(s => (
                <tr key={s.id}>
                  <td style={{ fontWeight: 600 }}>{s.name}</td>
                  <td>
                    <span className={styles.loginIdBadge}>+91 {s.phone}</span>
                  </td>
                  <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{s.email}</td>
                  <td>
                    <span className={`badge ${s.role === 'manager' ? 'badge-info' : 'badge-primary'}`}>
                      {s.role}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontWeight: 700, color: appCountForStaff(s.id) > 0 ? 'var(--primary)' : 'var(--text-muted)' }}>
                      {appCountForStaff(s.id)} active
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${s.status === 'active' ? 'badge-success' : 'badge-error'}`}>
                      {s.status}
                    </span>
                  </td>
                  <td>
                    {s.status === 'active'
                      ? <button className={styles.deactivateBtn} onClick={() => { updateStaffStatus(s.id, 'inactive'); setActionMsg(`${s.name} deactivated.`); setTimeout(() => setActionMsg(''), 2500); }}>Deactivate</button>
                      : <button className={styles.activateSmallBtn} onClick={() => { updateStaffStatus(s.id, 'active'); setActionMsg(`${s.name} reactivated.`); setTimeout(() => setActionMsg(''), 2500); }}>Reactivate</button>
                    }
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className={`card ${styles.staffLoginInfo}`}>
        <h4>Staff Login Instructions</h4>
        <ol>
          <li>Staff members go to the LEO application and click <strong>Log In</strong>.</li>
          <li>Select <strong>"Office Staff"</strong> as account type.</li>
          <li>Enter their registered mobile number and verify with OTP.</li>
          <li>They will see only applications assigned to them.</li>
        </ol>
      </div>
    </div>
  );
}
