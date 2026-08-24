import { useState, Fragment } from 'react';
import { Link } from 'react-router-dom';
import { Building2, Phone, Mail, MapPin, CheckCircle2, AlertCircle, ArrowLeft } from 'lucide-react';
import { KPBR_LICENCE_CATEGORIES } from '../../data/licenceData';
import { useAppStore } from '../../context/AppStoreContext';
import DocumentUpload from '../../components/DocumentUpload/DocumentUpload';
import type { UploadedFile } from '../../components/DocumentUpload/DocumentUpload';
import { ProviderRegistrationSchema, sanitizeInput } from '../../utils/validation';
import styles from './ProviderRegisterPage.module.css';

interface Form {
  ownerName: string; officeName: string; phone: string; email: string;
  officeAddress: string; area: string; pincode: string;
  licenceCategory: string; licenceNumber: string; licenceExpiry: string; licenceImageName: string;
}

const validateField = (k: keyof Form, value: string): string => {
  if (k === 'licenceImageName') return !value ? 'Please upload your licence document.' : '';
  
  // Zod throws an error if the specific field fails
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
  const { addProvider } = useAppStore();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<Form>({
    ownerName: '', officeName: '', phone: '', email: '', officeAddress: '', area: '', pincode: '',
    licenceCategory: '', licenceNumber: '', licenceExpiry: '', licenceImageName: '',
  });
  const [errors, setErrors] = useState<Partial<Record<keyof Form, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof Form, boolean>>>({});

  const selectedLicence = KPBR_LICENCE_CATEGORIES.find(l => l.id === form.licenceCategory);

  const handleChange = (k: keyof Form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    let val = e.target.value;
    if (k === 'phone') val = val.replace(/\D/g, '');
    
    // Sanitize input before setting state to prevent XSS
    val = k !== 'phone' && k !== 'licenceImageName' ? sanitizeInput(val) : val;

    setForm(f => ({ ...f, [k]: val }));
    if (touched[k]) setErrors(p => ({ ...p, [k]: validateField(k, val) }));
  };

  const blur = (k: keyof Form) => () => {
    setTouched(p => ({ ...p, [k]: true }));
    setErrors(p => ({ ...p, [k]: validateField(k, form[k]) }));
  };

  const validateStep = (s: number) => {
    const stepFields: (keyof Form)[][] = [
      ['ownerName', 'officeName', 'phone', 'email', 'officeAddress', 'area', 'pincode'],
      ['licenceCategory', 'licenceNumber', 'licenceExpiry', 'licenceImageName'],
    ];
    const fields = stepFields[s - 1] ?? [];
    const newErrors: Partial<Record<keyof Form, string>> = {};
    fields.forEach(k => {
      const e = validateField(k, form[k]);
      if (e) newErrors[k] = e;
    });
    setTouched(p => Object.fromEntries([...Object.entries(p), ...fields.map(k => [k, true])]));
    setErrors(p => ({ ...p, ...newErrors }));
    return Object.keys(newErrors).length === 0;
  };

  const [licenceFile, setLicenceFile] = useState<UploadedFile | null>(null);

  const cls = (k: keyof Form) =>
    `form-input ${touched[k] && errors[k] ? styles.inputError : touched[k] && !errors[k] ? styles.inputValid : ''}`;

  if (step === 3) {
    return (
      <div className={styles.page}>
        <div className={styles.successWrap}>
          <div className={styles.successIcon}><CheckCircle2 size={60} /></div>
          <h2>Application Submitted!</h2>
          <p>
            Thank you, <strong>{form.ownerName}</strong>. Your provider registration request has been received.
            Our team will verify your licence details and activate your account within <strong>1–2 business days</strong>.
            You'll receive an SMS on <strong>+91 {form.phone}</strong> once your account is activated.
          </p>
          <div className={styles.refBox}>
            <span>Reference ID</span>
            <strong>LEO-PRV-{new Date().getFullYear()}-{Math.floor(1000 + Math.random() * 9000)}</strong>
          </div>
          <div className={styles.successBtns}>
            <Link to="/login?role=provider" className="btn btn-primary">Go to Provider Login</Link>
            <Link to="/" className="btn btn-outline">Back to Home</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.left}>
        <div className={styles.leftInner}>
          <Link to="/" className={styles.brand}>
            <div className={styles.logoBox}><Building2 size={22} /></div>
            <div><div className={styles.brandName}>LEO</div><div className={styles.brandSub}>Licensed Engineering Online</div></div>
          </Link>
          <div className={styles.leftContent}>
            <h2 className={styles.leftTitle}>Join our network of licensed approvers.</h2>
            <p className={styles.leftDesc}>Register your KPBR licence, get verified, and start processing permit applications in your area.</p>
            <div className={styles.steps}>
              {['Submit your licence details', 'Admin verifies your licence', 'Account activated via SMS', 'Start receiving applications'].map((s, i) => (
                <div key={s} className={styles.stepItem}>
                  <div className={styles.stepNum}>{i + 1}</div>
                  <span>{s}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className={styles.right}>
        <div className={styles.formWrap}>
          <div className={styles.formBox}>
            <Link to="/get-started" className={styles.backBtn}><ArrowLeft size={15} /> Back</Link>

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
                  <label className="form-label"><Building2 size={12} /> Office / Business Name *</label>
                  <input className={cls('officeName')} type="text" placeholder="e.g. Arjun Constructions"
                    value={form.officeName} onChange={handleChange('officeName')} onBlur={blur('officeName')} />
                  {touched.officeName && errors.officeName && <p className={styles.err}><AlertCircle size={12} /> {errors.officeName}</p>}
                </div>

                <div className="form-group">
                  <label className="form-label"><Phone size={12} /> Mobile Number *</label>
                  <div className={`${styles.phoneInput} ${touched.phone && errors.phone ? styles.phoneError : touched.phone && !errors.phone ? styles.phoneValid : ''}`}>
                    <span className={styles.phonePrefix}>+91</span>
                    <input className={styles.phoneField} type="tel" maxLength={10} placeholder="10-digit number"
                      value={form.phone} onChange={handleChange('phone')} onBlur={blur('phone')} />
                  </div>
                  {touched.phone && errors.phone && <p className={styles.err}><AlertCircle size={12} /> {errors.phone}</p>}
                </div>

                <div className="form-group">
                  <label className="form-label"><Mail size={12} /> Email Address *</label>
                  <input className={cls('email')} type="email" placeholder="office@email.com"
                    value={form.email} onChange={handleChange('email')} onBlur={blur('email')} />
                  {touched.email && errors.email && <p className={styles.err}><AlertCircle size={12} /> {errors.email}</p>}
                </div>

                <div className="form-group">
                  <label className="form-label"><MapPin size={12} /> Office Address *</label>
                  <textarea className={`form-input ${touched.officeAddress && errors.officeAddress ? styles.inputError : touched.officeAddress && !errors.officeAddress ? styles.inputValid : ''}`}
                    rows={2} placeholder="Door no., Street, City, PIN"
                    value={form.officeAddress} onChange={handleChange('officeAddress')} onBlur={blur('officeAddress')} style={{ resize: 'none' }} />
                  {touched.officeAddress && errors.officeAddress && <p className={styles.err}><AlertCircle size={12} /> {errors.officeAddress}</p>}
                </div>

                <div className="form-group">
                  <label className="form-label">Primary Service Area *</label>
                  <input className={cls('area')} type="text" placeholder="e.g. Thrissur"
                    value={form.area} onChange={handleChange('area')} onBlur={blur('area')} />
                  {touched.area && errors.area && <p className={styles.err}><AlertCircle size={12} /> {errors.area}</p>}
                </div>

                <div className="form-group">
                  <label className="form-label"><MapPin size={12} /> Service Pincode *</label>
                  <input className={cls('pincode')} type="text" maxLength={6} placeholder="6-digit pincode you serve"
                    value={form.pincode} onChange={handleChange('pincode')} onBlur={blur('pincode')} />
                  {touched.pincode && errors.pincode && <p className={styles.err}><AlertCircle size={12} /> {errors.pincode}</p>}
                  {touched.pincode && !errors.pincode && form.pincode.length === 6 && <p className={styles.licenceDesc}>✓ Customers searching for pincode {form.pincode} will find you once approved.</p>}
                </div>
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
                    <option value="">Select category…</option>
                    {KPBR_LICENCE_CATEGORIES.map(l => <option key={l.id} value={l.id}>{l.label}</option>)}
                  </select>
                  {touched.licenceCategory && errors.licenceCategory && <p className={styles.err}><AlertCircle size={12} /> {errors.licenceCategory}</p>}
                  {selectedLicence && (
                    <p className={styles.licenceDesc}>
                      {selectedLicence.unlimited
                        ? '✓ No building size restrictions'
                        : `Max: ${selectedLicence.maxArea} m² · ${selectedLicence.maxFloors} floors · ${selectedLicence.maxHeightM} m`}
                    </p>
                  )}
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
              {step > 1 && <button className="btn btn-outline" onClick={() => setStep(s => s - 1)}>Back</button>}
              {step < 2
                ? <button className="btn btn-primary" onClick={() => { if (validateStep(1)) setStep(2); }}>Continue →</button>
                : <button className="btn btn-primary" onClick={() => {
                  if (validateStep(2)) {
                    // Submit provider registration into the shared store as pending
                    addProvider({
                      id: `pr_${Date.now()}`,
                      ownerName: form.ownerName,
                      officeName: form.officeName,
                      name: form.officeName,
                      phone: form.phone,
                      email: form.email,
                      officeAddress: form.officeAddress,
                      area: form.area,
                      pincode: form.pincode,
                      landmarks: [],
                      licenceCategory: form.licenceCategory,
                      licenceNumber: form.licenceNumber,
                      licenceExpiry: form.licenceExpiry,
                      licenceImageUrl: form.licenceImageName,
                      licenceVerified: false,
                      licenceVerificationStatus: 'pending',
                      status: 'pending',
                      joinedAt: new Date().toISOString(),
                      rating: 0,
                      totalApprovals: 0,
                      specializations: [],
                      documents: [],
                    });
                    setStep(3);
                  }
                }}>Submit Application</button>
              }
            </div>

            <p className={styles.loginLink}>Already registered? <Link to="/login?role=provider">Log in</Link></p>
          </div>
        </div>
      </div>
    </div>
  );
}
