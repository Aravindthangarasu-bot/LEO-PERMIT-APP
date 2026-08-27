import { useState, Fragment, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Building2, Phone, Mail, MapPin, CheckCircle2, AlertCircle, ArrowLeft } from 'lucide-react';
import { KPBR_LICENCE_CATEGORIES } from '../../data/licenceData';
import { useAppStore } from '../../context/AppStoreContext';
import DocumentUpload from '../../components/DocumentUpload/DocumentUpload';
import type { UploadedFile } from '../../components/DocumentUpload/DocumentUpload';
import { ProviderRegistrationSchema } from '../../utils/validation';
import Navbar from '../../components/Navbar/Navbar';
import styles from './ProviderRegisterPage.module.css';
import { lookupPincode, type PincodeLocation } from '../../utils/pincode';

interface Form {
  ownerName: string; officeName: string; phone: string; email: string;
  officeAddress: string; area: string; pincode: string; city: string; taluk: string; district: string; state: string;
  licenceCategory: string; licenceNumber: string; licenceExpiry: string; licenceImageName: string; logoImageName: string;
}

const validateField = (k: keyof Form, value: string): string => {
  if (k === 'licenceImageName') return !value ? 'Please upload your licence document.' : '';
  
  const schema = ProviderRegistrationSchema.shape[k as keyof typeof ProviderRegistrationSchema.shape];
  if (schema) {
    const result = schema.safeParse(value);
    if (!result.success) {
      return result.error.issues[0].message;
    }
  }
  return '';
};

export default function ProviderRegisterPage() {
  const navigate = useNavigate();
  const { addProvider } = useAppStore();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<Form>({
    ownerName: '', officeName: '', phone: '', email: '', officeAddress: '', area: '', pincode: '', city: '', taluk: '', district: '', state: '',
    licenceCategory: '', licenceNumber: '', licenceExpiry: '', licenceImageName: '', logoImageName: '',
  });
  const [licenceFile, setLicenceFile] = useState<UploadedFile | null>(null);
  const [logoFile, setLogoFile] = useState<UploadedFile | null>(null);
  const [errors, setErrors] = useState<Partial<Record<keyof Form, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof Form, boolean>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [pincodeLocation, setPincodeLocation] = useState<PincodeLocation | null>(null);
  const [pincodeOptions, setPincodeOptions] = useState<PincodeLocation[]>([]);
  const [pincodeStatus, setPincodeStatus] = useState<'idle' | 'loading' | 'error' | 'not_found'>('idle');
  const [success, setSuccess] = useState(false);
  const [serviceAreas, setServiceAreas] = useState<Array<PincodeLocation & { pincode: string }>>([]);
  const [additionalPincode, setAdditionalPincode] = useState('');
  const [additionalLocation, setAdditionalLocation] = useState<PincodeLocation | null>(null);

  const selectedLicence = KPBR_LICENCE_CATEGORIES.find(l => l.id === form.licenceCategory);

  useEffect(() => {
    if (form.pincode.length === 6) {
      setPincodeStatus('loading');
      lookupPincode(form.pincode).then(res => {
        if (!res) {
          setPincodeStatus('not_found');
          setPincodeOptions([]);
          setForm(prev => ({ ...prev, city: '', taluk: '', district: '', state: '' }));
          setPincodeLocation(null);
        } else {
          setPincodeStatus('idle');
          setPincodeOptions(res.options);
          setPincodeLocation(res.primary);
          if (res.options.length === 1) {
            setForm(prev => ({
              ...prev,
              city: res.options[0].city,
              taluk: res.options[0].taluk,
              district: res.options[0].district,
              state: res.options[0].state
            }));
          } else {
            setForm(prev => ({ ...prev, city: '', taluk: '', district: '', state: '' }));
          }
        }
      });
    } else {
      setPincodeOptions([]);
      setPincodeStatus('idle');
      setForm(prev => ({ ...prev, city: '', taluk: '', district: '', state: '' }));
      setPincodeLocation(null);
    }
  }, [form.pincode]);

  useEffect(() => {
    if (!/^\d{6}$/.test(additionalPincode)) { setAdditionalLocation(null); return; }
    lookupPincode(additionalPincode).then(result => setAdditionalLocation(result?.primary ?? null)).catch(() => setAdditionalLocation(null));
  }, [additionalPincode]);

  const addServiceArea = () => {
    if (!additionalLocation || additionalPincode === form.pincode || serviceAreas.some(area => area.pincode === additionalPincode)) return;
    setServiceAreas(current => [...current, { ...additionalLocation, pincode: additionalPincode }]);
    setAdditionalPincode('');
    setAdditionalLocation(null);
  };

  const handleChange = (k: keyof Form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm(prev => ({ ...prev, [k]: e.target.value }));
    if (touched[k]) {
      setErrors(prev => ({ ...prev, [k]: validateField(k, e.target.value) }));
    }
  };

  const blur = (k: keyof Form) => () => {
    setTouched(prev => ({ ...prev, [k]: true }));
    setErrors(prev => ({ ...prev, [k]: validateField(k, form[k]) }));
  };

  const validateStep = (s: number) => {
    const keys: (keyof Form)[] = s === 1 
      ? ['ownerName', 'officeName', 'phone', 'email', 'officeAddress', 'area', 'pincode']
      : ['licenceCategory', 'licenceNumber', 'licenceExpiry', 'licenceImageName'];
    
    let valid = true;
    const newErrors = { ...errors };
    const newTouched = { ...touched };

    keys.forEach(k => {
      newTouched[k] = true;
      const err = validateField(k, form[k]);
      newErrors[k] = err;
      if (err) valid = false;
    });

    setErrors(newErrors);
    setTouched(newTouched);
    return valid;
  };

  const cls = (k: keyof Form) => `form-input ${touched[k] && errors[k] ? styles.inputError : touched[k] && !errors[k] ? styles.inputValid : ''}`;

  if (success) {
    return (
      <div className={styles.page}>
        <Navbar variant="landing" />
        <div className={styles.mainContent}>
          <div className={styles.successCard}>
            <CheckCircle2 size={64} color="#10b981" />
            <h2>Registration Submitted!</h2>
            <p>Your provider application has been sent for verification. You will be notified via SMS once approved by the department.</p>
            <button className={styles.continueBtn} onClick={() => navigate('/')}>Return to Home</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <Navbar variant="landing" />

      <div className={styles.mainContent}>
        <div className={styles.loginCard}>
          <div className={styles.formBox}>
            <Link to="/" className={styles.backBtn}><ArrowLeft size={16} /> Back</Link>

            {/* Stepper */}
            <div className={styles.stepper}>
              {['Business Details', 'Licence Info'].map((s, i) => (
                <Fragment key={s}>
                  <div className={`${styles.step} ${step > i + 1 ? styles.stepDone : step === i + 1 ? styles.stepActive : ''}`}>
                    <div className={styles.stepCircle}>{step > i + 1 ? <CheckCircle2 size={13} /> : i + 1}</div>
                    <span>{s}</span>
                  </div>
                  {i < 1 && <div className={`${styles.stepLine} ${step > i + 1 ? styles.stepLineDone : ''}`} />}
                </Fragment>
              ))}
            </div>

            {/* STEP 1 */}
            {step === 1 && (
              <>
                <h1 className={styles.formTitle}>Provider Registration</h1>
                <p className={styles.formSub}>Tell us about your business</p>

                <div className="form-group">
                  <label className="form-label">Owner / Contact Name *</label>
                  <input className={cls('ownerName')} type="text" placeholder="As per licence document"
                    value={form.ownerName} onChange={handleChange('ownerName')} onBlur={blur('ownerName')} />
                  {touched.ownerName && errors.ownerName && <p className={styles.err}><AlertCircle size={12} /> {errors.ownerName}</p>}
                </div>

                <div className="form-group">
                  <label className="form-label">Office / Business Name *</label>
                  <input className={cls('officeName')} type="text" placeholder="e.g. Arjun Constructions"
                    value={form.officeName} onChange={handleChange('officeName')} onBlur={blur('officeName')} />
                  {touched.officeName && errors.officeName && <p className={styles.err}><AlertCircle size={12} /> {errors.officeName}</p>}
                </div>

                <div className="form-group">
                  <label className="form-label">Mobile Number *</label>
                  <div className={`${styles.phoneInput} ${touched.phone && errors.phone ? styles.phoneError : touched.phone && !errors.phone ? styles.phoneValid : ''}`}>
                    <span className={styles.phonePrefix}>+91</span>
                    <input className={styles.phoneField} type="tel" maxLength={10} placeholder="10-digit number"
                      value={form.phone} onChange={handleChange('phone')} onBlur={blur('phone')} />
                  </div>
                  {touched.phone && errors.phone && <p className={styles.err}><AlertCircle size={12} /> {errors.phone}</p>}
                </div>

                <div className="form-group">
                  <label className="form-label">Email Address *</label>
                  <input className={cls('email')} type="email" placeholder="office@email.com"
                    value={form.email} onChange={handleChange('email')} onBlur={blur('email')} />
                  {touched.email && errors.email && <p className={styles.err}><AlertCircle size={12} /> {errors.email}</p>}
                </div>

                <div className="form-group">
                  <label className="form-label">Office Address *</label>
                  <textarea className={`form-input ${touched.officeAddress && errors.officeAddress ? styles.inputError : touched.officeAddress && !errors.officeAddress ? styles.inputValid : ''}`}
                    rows={2} placeholder="Door no., Street, City, PIN"
                    value={form.officeAddress} onChange={handleChange('officeAddress')} onBlur={blur('officeAddress')} style={{ resize: 'none' }} />
                  {touched.officeAddress && errors.officeAddress && <p className={styles.err}><AlertCircle size={12} /> {errors.officeAddress}</p>}
                </div>

                <div className={styles.grid2}>
                  <div className="form-group">
                    <label className="form-label">Primary Service Area *</label>
                    <input className={cls('area')} type="text" placeholder="e.g. Thrissur"
                      value={form.area} onChange={handleChange('area')} onBlur={blur('area')} />
                    {touched.area && errors.area && <p className={styles.err}><AlertCircle size={12} /> {errors.area}</p>}
                  </div>

                  <div className="form-group">
                    <label className="form-label"><MapPin size={12} /> Service Pincode *</label>
                    <input className={cls('pincode')} type="text" maxLength={6} placeholder="6-digit pincode"
                      value={form.pincode} onChange={handleChange('pincode')} onBlur={blur('pincode')} />
                    {touched.pincode && errors.pincode && <p className={styles.err}><AlertCircle size={12} /> {errors.pincode}</p>}
                    {pincodeStatus === 'loading' && <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Looking up pincode...</p>}
                    {pincodeStatus === 'not_found' && <p style={{ fontSize: 12, color: 'var(--danger)' }}>Pincode not found.</p>}
                    {touched.pincode && !errors.pincode && form.pincode.length === 6 && <p className={styles.licenceDesc}>✓ Customers searching for pincode {form.pincode} will find you once approved.</p>}
                    {pincodeLocation && <p className={styles.licenceDesc}>{pincodeLocation.city}, {pincodeLocation.district} · Taluk: {pincodeLocation.taluk}</p>}
                    <div style={{ marginTop: 12 }}>
                      <label className="form-label">Additional service pincodes</label>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <input className="form-input" type="text" maxLength={6} placeholder="Add nearby pincode" value={additionalPincode} onChange={e => setAdditionalPincode(e.target.value.replace(/\D/g, ''))} />
                        <button type="button" className="btn btn-outline" disabled={!additionalLocation} onClick={addServiceArea}>Add</button>
                      </div>
                      {additionalLocation && <p className={styles.licenceDesc}>{additionalLocation.city}, {additionalLocation.district} · Taluk: {additionalLocation.taluk}</p>}
                      {serviceAreas.length > 0 && <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>{serviceAreas.map(area => <span key={area.pincode} className={styles.licenceDesc}>{area.pincode}: {area.city} ({area.taluk}) <button type="button" onClick={() => setServiceAreas(current => current.filter(item => item.pincode !== area.pincode))}>Remove</button></span>)}</div>}
                    </div>
                  </div>
                </div>
                
                {pincodeOptions.length > 1 && (
                  <div className="form-group">
                    <label className="form-label">Select Your Location *</label>
                    <select
                      className="form-input"
                      value={`${form.city}|${form.taluk}|${form.district}`}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val) {
                          const [city, taluk, district] = val.split('|');
                          const opt = pincodeOptions.find(o => o.city === city && o.taluk === taluk && o.district === district);
                          if (opt) {
                            setForm(prev => ({ ...prev, city: opt.city, taluk: opt.taluk, district: opt.district, state: opt.state }));
                          }
                        }
                      }}
                    >
                      <option value="|">-- Select Location --</option>
                      {pincodeOptions.map((opt, i) => (
                        <option key={i} value={`${opt.city}|${opt.taluk}|${opt.district}`}>
                          {opt.office}, {opt.city} (Taluk: {opt.taluk}, Dist: {opt.district})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {form.city && form.district && pincodeOptions.length <= 1 && (
                  <div style={{ marginBottom: 16, fontSize: 13, color: 'var(--text-muted)', display: 'flex', gap: 6, alignItems: 'center' }}>
                    <MapPin size={14} /> {form.city}, {form.taluk}, {form.district}, {form.state}
                  </div>
                )}

                <DocumentUpload
                  label="Company Logo (Optional)"
                  accept=".jpg,.jpeg,.png"
                  value={logoFile}
                  onChange={(f: UploadedFile | null) => {
                    setLogoFile(f);
                    setForm(prev => ({ ...prev, logoImageName: f?.name ?? '' }));
                  }}
                  hint="Upload your company logo for your public profile"
                />
              </>
            )}

            {/* STEP 2 */}
            {step === 2 && (
              <>
                <h1 className={styles.formTitle}>Licence Details</h1>
                <p className={styles.formSub}>Your KPBR licence will be verified by our team</p>

                <div className="form-group">
                  <label className="form-label">Licence Category (KPBR 2019) *</label>
                  <select className={cls('licenceCategory')} value={form.licenceCategory}
                    onChange={handleChange('licenceCategory')} onBlur={blur('licenceCategory')}>
                    <option value="">Select category...</option>
                    {KPBR_LICENCE_CATEGORIES.map(l => <option key={l.id} value={l.id}>{l.label}</option>)}
                  </select>
                  {touched.licenceCategory && errors.licenceCategory && <p className={styles.err}><AlertCircle size={12} /> {errors.licenceCategory}</p>}
                </div>

                <div className="form-group">
                  <label className="form-label">Licence Number *</label>
                  <input className={cls('licenceNumber')} type="text" placeholder="e.g. KL/ARCH/2022/4521"
                    value={form.licenceNumber} onChange={handleChange('licenceNumber')} onBlur={blur('licenceNumber')} />
                  {touched.licenceNumber && errors.licenceNumber && <p className={styles.err}><AlertCircle size={12} /> {errors.licenceNumber}</p>}
                </div>

                <div className="form-group">
                  <label className="form-label">Licence Expiry Date *</label>
                  <input className={cls('licenceExpiry')} type="date"
                    value={form.licenceExpiry} onChange={handleChange('licenceExpiry')} onBlur={blur('licenceExpiry')} />
                  {touched.licenceExpiry && errors.licenceExpiry && <p className={styles.err}><AlertCircle size={12} /> {errors.licenceExpiry}</p>}
                </div>

                <DocumentUpload
                  label="Licence Document *"
                  accept=".pdf,.jpg,.jpeg,.png"
                  value={licenceFile}
                  onChange={(f: UploadedFile | null) => {
                    setLicenceFile(f);
                    setForm(prev => ({ ...prev, licenceImageName: f?.name ?? '' }));
                    setTouched(p => ({ ...p, licenceImageName: true }));
                    setErrors(p => ({ ...p, licenceImageName: f ? '' : 'Required.' }));
                  }}
                  hint="Upload a clear photo or scan of your KPBR licence"
                />
                {touched.licenceImageName && errors.licenceImageName && <p className={styles.err}><AlertCircle size={12} /> {errors.licenceImageName}</p>}
              </>
            )}

            <div className={styles.actions}>
              {step > 1 && <button className={styles.backStepBtn} onClick={() => setStep(s => s - 1)}>Back</button>}
              {step < 2
                ? <button className={styles.continueBtn} onClick={() => { if (validateStep(1)) setStep(2); }}>Continue</button>
                : <button className={styles.continueBtn} disabled={submitting} onClick={async () => {
                  if (validateStep(2)) {
                    setSubmitting(true);
                    setSubmitError('');
                    await addProvider({
                      id: crypto.randomUUID(),
                      ownerName: form.ownerName,
                      officeName: form.officeName,
                      name: form.officeName,
                      phone: form.phone,
                      email: form.email,
                      officeAddress: form.officeAddress,
                      area: form.area,
                      pincode: form.pincode,
                      city: form.city || pincodeLocation?.city,
                      taluk: form.taluk || pincodeLocation?.taluk,
                      district: form.district || pincodeLocation?.district,
                      state: form.state || pincodeLocation?.state,
                      serviceAreas,
                      logo: form.logoImageName ? `/logos/${form.logoImageName}` : undefined,
                      landmarks: [],
                      licenceCategory: form.licenceCategory,
                      licenceNumber: form.licenceNumber,
                      licenceExpiry: form.licenceExpiry,
                      licenceImageUrl: form.licenceImageName,
                      licenceVerified: false,
                      licenceVerificationStatus: 'pending',
                      staff: [],
                      applicationsAssigned: 0,
                      rating: 0,
                      reviews: 0,
                      createdAt: new Date().toISOString()
                    });
                    setSubmitting(false);
                    setSuccess(true);
                  }
                }}>
                  {submitting ? 'Submitting...' : 'Submit Registration'}
                </button>
              }
            </div>
            {submitError && <div className={styles.err}>{submitError}</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
