import { useEffect, useState } from 'react';
import { CheckCircle2, MapPin, Save, UserRound } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useAppStore } from '../../context/AppStoreContext';
import { lookupPincode, type PincodeLocation } from '../../utils/pincode';
import DocumentUpload, { type UploadedFile } from '../../components/DocumentUpload/DocumentUpload';
import styles from './Provider.module.css';

export default function ProviderProfile() {
  const { user } = useAuth();
  const { getMyProviderProfile, updateProviderProfile } = useAppStore();
  const provider = user ? getMyProviderProfile(user) : null;
  const [form, setForm] = useState({ ownerName: '', officeName: '', phone: '', email: '', officeAddress: '', pincode: '', city: '', taluk: '', district: '' });
  const [areas, setAreas] = useState<Array<PincodeLocation & { pincode: string }>>([]);
  const [newPincode, setNewPincode] = useState('');
  const [newLocation, setNewLocation] = useState<PincodeLocation | null>(null);
  const [logo, setLogo] = useState<UploadedFile | null>(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!provider) return;
    setForm({ ownerName: provider.ownerName, officeName: provider.officeName, phone: provider.phone, email: provider.email, officeAddress: provider.officeAddress, pincode: provider.pincode ?? '', city: provider.city ?? '', taluk: provider.taluk ?? '', district: provider.district ?? '' });
    setAreas(provider.serviceAreas ?? []);
  }, [provider]);

  useEffect(() => {
    if (!/^\d{6}$/.test(newPincode)) { setNewLocation(null); return; }
    lookupPincode(newPincode).then(result => setNewLocation(result?.primary ?? null)).catch(() => setNewLocation(null));
  }, [newPincode]);

  if (!provider) return <div className={styles.page}><p className={styles.pageSub}>Provider profile not found.</p></div>;

  const addArea = () => {
    if (!newLocation || newPincode === form.pincode || areas.some(area => area.pincode === newPincode)) return;
    setAreas(current => [...current, { ...newLocation, pincode: newPincode }]);
    setNewPincode('');
  };

  const save = async () => {
    const saved = await updateProviderProfile(provider.id, { ...form, serviceAreas: areas, logoUrl: logo?.url ?? provider.logoUrl });
    setMessage(saved ? 'Profile updated successfully.' : 'Unable to update profile. Please try again.');
    setTimeout(() => setMessage(''), 3000);
  };

  return (
    <div className={`page-enter ${styles.page}`}>
      <div className={styles.pageHeader}>
        <div><h1 className={styles.pageTitle}>Profile & Documents</h1><p className={styles.pageSub}>Maintain your public provider details and service coverage.</p></div>
        <button className="btn btn-primary" onClick={save}><Save size={16} /> Save changes</button>
      </div>
      {message && <div className={styles.actionSuccess}><CheckCircle2 size={16} /> {message}</div>}
      <div className={`card ${styles.detailCard}`}>
        <h3 className={styles.cardSectionTitle}><UserRound size={16} /> Business profile</h3>
        <div className={styles.detailGrid}>
          {([['ownerName', 'Owner name'], ['officeName', 'Company / office name'], ['phone', 'Phone'], ['email', 'Email'], ['officeAddress', 'Company address']] as const).map(([key, label]) => (
            <label key={key} className={`${styles.detailGridItem} ${key === 'officeAddress' ? styles.detailGridValueFull : ''}`}>
              <span className={styles.detailGridLabel}>{label}</span>
              {key === 'officeAddress' ? <textarea className="form-input" rows={3} value={form[key]} onChange={event => setForm(current => ({ ...current, [key]: event.target.value }))} /> : <input className="form-input" value={form[key]} onChange={event => setForm(current => ({ ...current, [key]: event.target.value }))} />}
            </label>
          ))}
        </div>
      </div>
      <div className={`card ${styles.detailCard}`} style={{ marginTop: 20 }}>
        <h3 className={styles.cardSectionTitle}><MapPin size={16} /> Service coverage</h3>
        <p className={styles.pageSub}>The primary pincode is used as your default coverage. Add nearby pincodes to receive matching applications there too.</p>
        <div className={styles.detailGrid}>
          <label className={styles.detailGridItem}><span className={styles.detailGridLabel}>Primary pincode</span><input className="form-input" value={form.pincode} onChange={event => setForm(current => ({ ...current, pincode: event.target.value.replace(/\D/g, '') }))} /></label>
          <div className={styles.detailGridItem}><span className={styles.detailGridLabel}>Resolved location</span><strong>{form.city || '-'} · {form.taluk || '-'} · {form.district || '-'}</strong></div>
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 16 }}><input className="form-input" maxLength={6} placeholder="Add nearby pincode" value={newPincode} onChange={event => setNewPincode(event.target.value.replace(/\D/g, ''))} /><button className="btn btn-outline" type="button" disabled={!newLocation} onClick={addArea}>Add coverage</button></div>
        {newLocation && <p className={styles.pageSub}>{newLocation.city} · {newLocation.taluk} · {newLocation.district}</p>}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>{areas.map(area => <span key={area.pincode} className={styles.specTag}>{area.pincode}: {area.city} ({area.taluk}) <button type="button" onClick={() => setAreas(current => current.filter(item => item.pincode !== area.pincode))}>Remove</button></span>)}</div>
      </div>
      <div className={`card ${styles.detailCard}`} style={{ marginTop: 20 }}>
        <h3 className={styles.cardSectionTitle}>Company logo</h3>
        <DocumentUpload label="Upload company logo" accept=".jpg,.jpeg,.png,.webp" value={logo} onChange={setLogo} hint="PNG or JPG · max 5 MB" />
      </div>
    </div>
  );
}
