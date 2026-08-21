import { useState, Fragment } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircle2, Upload, AlertCircle, Scan, ShieldCheck, ShieldAlert,
  Building2, Phone, Mail, MapPin, FileText, Image, Info, User,
} from 'lucide-react';
import { KPBR_LICENCE_CATEGORIES } from '../../data/licenceData';
import styles from './AddProvider.module.css';

const STEPS = ['Business Details', 'Licence', 'Optional Info', 'Review'];

interface ProviderForm {
  ownerName: string;
  officeName: string;
  phone: string;
  email: string;
  officeAddress: string;
  area: string;
  licenceCategory: string;
  licenceNumber: string;
  licenceExpiry: string;
  licenceImageName: string;
  photoName: string;
  aboutUs: string;
  projectsCompleted: string;
}

type FieldErrors = Partial<Record<keyof ProviderForm, string>>;

const VALIDATORS: Partial<Record<keyof ProviderForm, (v: string) => string>> = {
  ownerName:       v => !v.trim() ? 'Owner name is required.' : v.trim().length < 3 ? 'Min 3 characters.' : '',
  officeName:      v => !v.trim() ? 'Office name is required.' : '',
  phone:           v => !/^[6-9]\d{9}$/.test(v) ? 'Enter a valid 10-digit Indian mobile number.' : '',
  email:           v => !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? 'Enter a valid email address.' : '',
  officeAddress:   v => !v.trim() || v.trim().length < 10 ? 'Enter a complete office address (min 10 chars).' : '',
  area:            v => !v.trim() ? 'Service area/city is required.' : '',
  licenceCategory: v => !v ? 'Please select a licence category.' : '',
  licenceNumber:   v => !v.trim() ? 'Licence number is required.' : '',
  licenceExpiry:   v => {
    if (!v) return 'Licence expiry date is required.';
    if (new Date(v) < new Date()) return 'Licence has already expired. Cannot onboard.';
    return '';
  },
  licenceImageName: v => !v ? 'Please upload the licence document/image.' : '',
};

type VerificationState = 'idle' | 'processing' | 'verified' | 'failed';

export default function AddProvider() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<ProviderForm>({
    ownerName: '', officeName: '', phone: '', email: '',
    officeAddress: '', area: '',
    licenceCategory: '', licenceNumber: '', licenceExpiry: '', licenceImageName: '',
    photoName: '', aboutUs: '', projectsCompleted: '',
  });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [touched, setTouched] = useState<Partial<Record<keyof ProviderForm, boolean>>>({});
  const [verifyState, setVerifyState] = useState<VerificationState>('idle');
  const [verifyProgress, setVerifyProgress] = useState(0);
  const [verifyNote, setVerifyNote] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const selectedLicence = KPBR_LICENCE_CATEGORIES.find(l => l.id === form.licenceCategory);

  // Expiry warning
  const daysToExpiry = form.licenceExpiry
    ? Math.ceil((new Date(form.licenceExpiry).getTime() - Date.now()) / 86400000)
    : null;

  const set = (k: keyof ProviderForm) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const val = k === 'phone' ? e.target.value.replace(/\D/g, '') : e.target.value;
    setForm(f => ({ ...f, [k]: val }));
    if (touched[k] && VALIDATORS[k]) setErrors(prev => ({ ...prev, [k]: VALIDATORS[k]!(val) }));
  };

  const blur = (k: keyof ProviderForm) => () => {
    setTouched(prev => ({ ...prev, [k]: true }));
    if (VALIDATORS[k]) setErrors(prev => ({ ...prev, [k]: VALIDATORS[k]!(form[k]) }));
  };

  const validateStep = (s: number): boolean => {
    const fields: (keyof ProviderForm)[][] = [
      ['ownerName', 'officeName', 'phone', 'email', 'officeAddress', 'area'],
      ['licenceCategory', 'licenceNumber', 'licenceExpiry', 'licenceImageName'],
      [],
      [],
    ];
    const stepFields = fields[s - 1];
    const newErrors: FieldErrors = {};
    const newTouched: Partial<Record<keyof ProviderForm, boolean>> = {};
    stepFields.forEach(k => {
      newTouched[k] = true;
      if (VALIDATORS[k]) {
        const err = VALIDATORS[k]!(form[k]);
        if (err) newErrors[k] = err;
      }
    });
    setTouched(prev => ({ ...prev, ...newTouched }));
    setErrors(prev => ({ ...prev, ...newErrors }));
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => { if (validateStep(step)) setStep(s => s + 1); };

  // Mock ML licence verification
  const runVerification = () => {
    if (!form.licenceImageName) return;
    setVerifyState('processing');
    setVerifyProgress(0);
    setVerifyNote('');
    const interval = setInterval(() => {
      setVerifyProgress(p => {
        if (p >= 100) {
          clearInterval(interval);
          // 90% chance success in demo
          const success = Math.random() > 0.1;
          if (success) {
            setVerifyState('verified');
            setVerifyNote(`✓ Licence number ${form.licenceNumber || 'detected'} verified. Expiry date confirmed.`);
          } else {
            setVerifyState('failed');
            setVerifyNote('⚠ Could not extract licence data from image. Please ensure the image is clear and try again.');
          }
          return 100;
        }
        return p + 12;
      });
    }, 180);
  };

  if (submitted) {
    return (
      <div className={`page-enter ${styles.page}`}>
        <div className={styles.successWrap}>
          <div className={styles.successIcon}><CheckCircle2 size={56} /></div>
          <h2>Provider Onboarded Successfully!</h2>
          <p>
            <strong>{form.officeName}</strong> has been registered. Their account is now
            <strong> pending activation</strong>. Activate after document verification.
          </p>
          <div className={styles.summaryGrid}>
            <div><span>Owner</span><strong>{form.ownerName}</strong></div>
            <div><span>Office</span><strong>{form.officeName}</strong></div>
            <div><span>Phone</span><strong>+91 {form.phone}</strong></div>
            <div><span>Licence</span><strong>{selectedLicence?.label}</strong></div>
            <div><span>Licence No.</span><strong>{form.licenceNumber}</strong></div>
            <div><span>Expiry</span><strong>{form.licenceExpiry}</strong></div>
          </div>
          <div className={styles.successBtns}>
            <button className="btn btn-primary" onClick={() => navigate('/admin/providers')}>View Providers</button>
            <button className="btn btn-outline" onClick={() => { setSubmitted(false); setStep(1); setForm({ ownerName: '', officeName: '', phone: '', email: '', officeAddress: '', area: '', licenceCategory: '', licenceNumber: '', licenceExpiry: '', licenceImageName: '', photoName: '', aboutUs: '', projectsCompleted: '' }); setVerifyState('idle'); }}>Add Another</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`page-enter ${styles.page}`}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Onboard Service Provider</h1>
          <p className={styles.pageSub}>Register a new KPBR-licensed permit approver</p>
        </div>
      </div>

      {/* Stepper */}
      <div className={styles.stepper}>
        {STEPS.map((s, i) => (
          <Fragment key={s}>
            <div className={`${styles.step} ${step > i + 1 ? styles.stepDone : step === i + 1 ? styles.stepActive : ''}`}>
              <div className={styles.stepCircle}>{step > i + 1 ? <CheckCircle2 size={15} /> : i + 1}</div>
              <span>{s}</span>
            </div>
            {i < STEPS.length - 1 && <div className={`${styles.stepLine} ${step > i + 1 ? styles.stepLineDone : ''}`} />}
          </Fragment>
        ))}
      </div>

      <div className={`card ${styles.formCard}`}>

        {/* ── STEP 1: BUSINESS DETAILS ── */}
        {step === 1 && (
          <div>
            <h3 className={styles.stepTitle}>Step 1: Business Details</h3>
            <div className={styles.formGrid}>

              <div className="form-group">
                <label className="form-label"><User size={13} /> Owner / Contact Person Name *</label>
                <input className={`form-input ${touched.ownerName && errors.ownerName ? styles.inputError : touched.ownerName && !errors.ownerName ? styles.inputValid : ''}`}
                  type="text" placeholder="e.g. Arjun Nair"
                  value={form.ownerName} onChange={set('ownerName')} onBlur={blur('ownerName')} />
                {touched.ownerName && errors.ownerName && <p className={styles.fieldError}><AlertCircle size={12} /> {errors.ownerName}</p>}
              </div>

              <div className="form-group">
                <label className="form-label"><Building2 size={13} /> Office / Business Name *</label>
                <input className={`form-input ${touched.officeName && errors.officeName ? styles.inputError : touched.officeName && !errors.officeName ? styles.inputValid : ''}`}
                  type="text" placeholder="e.g. Arjun Constructions"
                  value={form.officeName} onChange={set('officeName')} onBlur={blur('officeName')} />
                {touched.officeName && errors.officeName && <p className={styles.fieldError}><AlertCircle size={12} /> {errors.officeName}</p>}
              </div>

              <div className="form-group">
                <label className="form-label"><Phone size={13} /> Mobile Number *</label>
                <div className={`${styles.phoneInput} ${touched.phone && errors.phone ? styles.phoneError : touched.phone && !errors.phone ? styles.phoneValid : ''}`}>
                  <span className={styles.phonePrefix}>+91</span>
                  <input className={styles.phoneField} type="tel" maxLength={10} placeholder="10-digit number"
                    value={form.phone} onChange={set('phone')} onBlur={blur('phone')} />
                </div>
                {touched.phone && errors.phone && <p className={styles.fieldError}><AlertCircle size={12} /> {errors.phone}</p>}
              </div>

              <div className="form-group">
                <label className="form-label"><Mail size={13} /> Email Address *</label>
                <input className={`form-input ${touched.email && errors.email ? styles.inputError : touched.email && !errors.email ? styles.inputValid : ''}`}
                  type="email" placeholder="office@email.com"
                  value={form.email} onChange={set('email')} onBlur={blur('email')} />
                {touched.email && errors.email && <p className={styles.fieldError}><AlertCircle size={12} /> {errors.email}</p>}
              </div>

              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label className="form-label"><MapPin size={13} /> Office Address *</label>
                <textarea className={`form-input ${touched.officeAddress && errors.officeAddress ? styles.inputError : touched.officeAddress && !errors.officeAddress ? styles.inputValid : ''}`}
                  rows={2} placeholder="Door no., Street, City, District, PIN"
                  value={form.officeAddress} onChange={set('officeAddress')} onBlur={blur('officeAddress')}
                  style={{ resize: 'none' }} />
                {touched.officeAddress && errors.officeAddress && <p className={styles.fieldError}><AlertCircle size={12} /> {errors.officeAddress}</p>}
              </div>

              <div className="form-group">
                <label className="form-label"><MapPin size={13} /> Primary Service Area / City *</label>
                <input className={`form-input ${touched.area && errors.area ? styles.inputError : touched.area && !errors.area ? styles.inputValid : ''}`}
                  type="text" placeholder="e.g. Thrissur"
                  value={form.area} onChange={set('area')} onBlur={blur('area')} />
                {touched.area && errors.area && <p className={styles.fieldError}><AlertCircle size={12} /> {errors.area}</p>}
              </div>

            </div>
          </div>
        )}

        {/* ── STEP 2: LICENCE DETAILS ── */}
        {step === 2 && (
          <div>
            <h3 className={styles.stepTitle}>Step 2: Licence Details</h3>

            <div className="form-group">
              <label className="form-label">Licence Category (KPBR 2019) *</label>
              <select
                className={`form-input ${touched.licenceCategory && errors.licenceCategory ? styles.inputError : touched.licenceCategory && !errors.licenceCategory ? styles.inputValid : ''}`}
                value={form.licenceCategory}
                onChange={set('licenceCategory')}
                onBlur={blur('licenceCategory')}
              >
                <option value="">Select licence category…</option>
                {KPBR_LICENCE_CATEGORIES.map(l => (
                  <option key={l.id} value={l.id}>{l.label}</option>
                ))}
              </select>
              {touched.licenceCategory && errors.licenceCategory && <p className={styles.fieldError}><AlertCircle size={12} /> {errors.licenceCategory}</p>}
            </div>

            {selectedLicence && (
              <div className={`${styles.licenceBadge} ${selectedLicence.unlimited ? styles.licenceBadgeGreen : styles.licenceBadgeBlue}`}>
                <Info size={15} />
                <div>
                  <strong>{selectedLicence.label}</strong>
                  <p>{selectedLicence.description}</p>
                  {!selectedLicence.unlimited && (
                    <p className={styles.limitsRow}>
                      <span>Max Area: <strong>{selectedLicence.maxArea} m²</strong></span>
                      <span>Max Floors: <strong>{selectedLicence.maxFloors}</strong></span>
                      <span>Max Height: <strong>{selectedLicence.maxHeightM} m</strong></span>
                    </p>
                  )}
                  {selectedLicence.unlimited && (
                    <p className={styles.unlimitedNote}>✓ No building size restrictions under this licence</p>
                  )}
                </div>
              </div>
            )}

            <div className={styles.formGrid}>
              <div className="form-group">
                <label className="form-label">Licence Number *</label>
                <input className={`form-input ${touched.licenceNumber && errors.licenceNumber ? styles.inputError : touched.licenceNumber && !errors.licenceNumber ? styles.inputValid : ''}`}
                  type="text" placeholder="e.g. KL/ARCH/2022/4521"
                  value={form.licenceNumber} onChange={set('licenceNumber')} onBlur={blur('licenceNumber')} />
                {touched.licenceNumber && errors.licenceNumber && <p className={styles.fieldError}><AlertCircle size={12} /> {errors.licenceNumber}</p>}
              </div>

              <div className="form-group">
                <label className="form-label">Licence Expiry Date *</label>
                <input
                  className={`form-input ${touched.licenceExpiry && errors.licenceExpiry ? styles.inputError : touched.licenceExpiry && !errors.licenceExpiry ? styles.inputValid : ''}`}
                  type="date"
                  value={form.licenceExpiry}
                  onChange={set('licenceExpiry')}
                  onBlur={blur('licenceExpiry')}
                />
                {touched.licenceExpiry && errors.licenceExpiry && <p className={styles.fieldError}><AlertCircle size={12} /> {errors.licenceExpiry}</p>}
                {daysToExpiry !== null && daysToExpiry > 0 && daysToExpiry <= 90 && (
                  <p className={`${styles.expiryWarning} ${daysToExpiry <= 30 ? styles.expiryRed : daysToExpiry <= 60 ? styles.expiryOrange : styles.expiryBlue}`}>
                    {daysToExpiry <= 30 ? '🔴' : daysToExpiry <= 60 ? '🟡' : '🔵'}
                    {' '}Licence expires in <strong>{daysToExpiry} days</strong>.
                    {daysToExpiry <= 30 ? ' Reminders will be sent to the provider.' : ''}
                  </p>
                )}
              </div>
            </div>

            {/* Licence Image Upload + ML Verification */}
            <div className="form-group">
              <label className="form-label"><FileText size={13} /> Upload Licence Document / Image *</label>
              <div className={styles.licenceUploadArea}>
                <label className={styles.licenceUploadLabel}>
                  <Upload size={20} />
                  <span>{form.licenceImageName || 'Click to upload licence image (JPG, PNG, PDF)'}</span>
                  <span className={styles.uploadHint}>Clear photo of the physical licence document</span>
                  <input
                    type="file"
                    accept=".jpg,.jpeg,.png,.pdf"
                    style={{ display: 'none' }}
                    onChange={e => {
                      const name = e.target.files?.[0]?.name ?? '';
                      setForm(f => ({ ...f, licenceImageName: name }));
                      setTouched(prev => ({ ...prev, licenceImageName: true }));
                      setErrors(prev => ({ ...prev, licenceImageName: name ? '' : 'Please upload the licence document.' }));
                      setVerifyState('idle');
                    }}
                  />
                </label>
                {touched.licenceImageName && errors.licenceImageName && (
                  <p className={styles.fieldError}><AlertCircle size={12} /> {errors.licenceImageName}</p>
                )}
              </div>
            </div>

            {/* ML Verification Panel */}
            {form.licenceImageName && (
              <div className={styles.mlPanel}>
                <div className={styles.mlHeader}>
                  <Scan size={18} />
                  <div>
                    <strong>ML Licence Verification</strong>
                    <p>Automatically extract and verify licence details using OCR + ML</p>
                  </div>
                  {verifyState === 'idle' && (
                    <button className={styles.verifyBtn} onClick={runVerification}>
                      Run Verification
                    </button>
                  )}
                </div>

                {verifyState === 'processing' && (
                  <div className={styles.mlProcessing}>
                    <div className={styles.progressBar}>
                      <div className={styles.progressFill} style={{ width: `${verifyProgress}%` }} />
                    </div>
                    <p>Analysing licence image… {verifyProgress}%</p>
                    <p className={styles.mlSteps}>
                      {verifyProgress < 30 && '→ Extracting text with OCR…'}
                      {verifyProgress >= 30 && verifyProgress < 60 && '→ Validating licence number format…'}
                      {verifyProgress >= 60 && verifyProgress < 85 && '→ Cross-referencing with KPBR database…'}
                      {verifyProgress >= 85 && '→ Verifying expiry date and category…'}
                    </p>
                  </div>
                )}

                {verifyState === 'verified' && (
                  <div className={styles.mlVerified}>
                    <ShieldCheck size={20} />
                    <div>
                      <strong>Licence Verified Successfully</strong>
                      <p>{verifyNote}</p>
                    </div>
                  </div>
                )}

                {verifyState === 'failed' && (
                  <div className={styles.mlFailed}>
                    <ShieldAlert size={20} />
                    <div>
                      <strong>Verification Failed</strong>
                      <p>{verifyNote}</p>
                      <button className={styles.retryBtn} onClick={runVerification}>Retry Verification</button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Expiry Notification Info */}
            <div className={styles.notifInfo}>
              <Info size={14} />
              <p>
                The system will automatically send licence expiry reminders to this provider at:
                <strong> 90 days, 60 days, 30 days</strong> before expiry, and <strong>daily</strong> for the final 10 days.
              </p>
            </div>
          </div>
        )}

        {/* ── STEP 3: OPTIONAL INFO ── */}
        {step === 3 && (
          <div>
            <h3 className={styles.stepTitle}>Step 3: Optional Information</h3>
            <p className={styles.optionalNote}>These fields are not mandatory but help customers make better choices.</p>

            <div className="form-group">
              <label className="form-label"><Image size={13} /> Office / Owner Photo</label>
              <label className={styles.photoUploadLabel}>
                {form.photoName
                  ? <><CheckCircle2 size={18} style={{ color: 'var(--success)' }} /> {form.photoName}</>
                  : <><Upload size={18} /> Upload a photo of the office or construction owner</>
                }
                <input
                  type="file"
                  accept=".jpg,.jpeg,.png"
                  style={{ display: 'none' }}
                  onChange={e => setForm(f => ({ ...f, photoName: e.target.files?.[0]?.name ?? '' }))}
                />
              </label>
              <p className={styles.uploadHintSmall}>JPG or PNG · Not mandatory</p>
            </div>

            <div className="form-group">
              <label className="form-label"><Info size={13} /> About Us</label>
              <textarea
                className="form-input"
                rows={4}
                placeholder="Brief description of the firm, experience, and services offered…"
                value={form.aboutUs}
                onChange={set('aboutUs')}
                style={{ resize: 'vertical' }}
              />
            </div>

            <div className="form-group">
              <label className="form-label"><CheckCircle2 size={13} /> Projects Completed</label>
              <textarea
                className="form-input"
                rows={3}
                placeholder="e.g. 127 residential permits, 15 commercial buildings in Thrissur…"
                value={form.projectsCompleted}
                onChange={set('projectsCompleted')}
                style={{ resize: 'vertical' }}
              />
            </div>
          </div>
        )}

        {/* ── STEP 4: REVIEW ── */}
        {step === 4 && (
          <div>
            <h3 className={styles.stepTitle}>Step 4: Review & Confirm</h3>

            <div className={styles.reviewGrid}>
              <div className={styles.reviewSection}>
                <h4>Business Details</h4>
                <div className={styles.reviewRows}>
                  <div className={styles.reviewRow}><span>Owner Name</span><strong>{form.ownerName}</strong></div>
                  <div className={styles.reviewRow}><span>Office Name</span><strong>{form.officeName}</strong></div>
                  <div className={styles.reviewRow}><span>Phone</span><strong>+91 {form.phone}</strong></div>
                  <div className={styles.reviewRow}><span>Email</span><strong>{form.email}</strong></div>
                  <div className={styles.reviewRow}><span>Address</span><strong>{form.officeAddress}</strong></div>
                  <div className={styles.reviewRow}><span>Service Area</span><strong>{form.area}</strong></div>
                </div>
              </div>

              <div className={styles.reviewSection}>
                <h4>Licence Details</h4>
                <div className={styles.reviewRows}>
                  <div className={styles.reviewRow}><span>Category</span><strong>{selectedLicence?.label ?? '-'}</strong></div>
                  <div className={styles.reviewRow}><span>Number</span><strong>{form.licenceNumber}</strong></div>
                  <div className={styles.reviewRow}><span>Expiry</span><strong>{form.licenceExpiry}</strong></div>
                  <div className={styles.reviewRow}>
                    <span>Building Limits</span>
                    <strong>
                      {selectedLicence?.unlimited
                        ? 'Unlimited (KPBR)'
                        : `${selectedLicence?.maxArea} m² / ${selectedLicence?.maxFloors} floors / ${selectedLicence?.maxHeightM} m`}
                    </strong>
                  </div>
                  <div className={styles.reviewRow}>
                    <span>ML Verification</span>
                    <span className={verifyState === 'verified' ? styles.verifiedTag : styles.pendingTag}>
                      {verifyState === 'verified' ? '✓ Verified' : '⏳ Pending'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {verifyState !== 'verified' && (
              <div className={styles.reviewWarning}>
                <AlertCircle size={15} />
                ML licence verification is pending. The provider will be marked <strong>pending</strong> until
                an admin verifies the licence manually or the ML check passes.
              </div>
            )}

            {daysToExpiry !== null && daysToExpiry <= 90 && (
              <div className={`${styles.reviewWarning} ${daysToExpiry <= 30 ? styles.reviewWarningRed : styles.reviewWarningOrange}`}>
                <AlertCircle size={15} />
                Licence expires in <strong>{daysToExpiry} days</strong>.
                Expiry reminders will be sent automatically to the provider.
              </div>
            )}
          </div>
        )}

        <div className={styles.stepActions}>
          {step > 1 && <button className="btn btn-outline" onClick={() => setStep(s => s - 1)}>Back</button>}
          {step < 4
            ? <button className="btn btn-primary" onClick={handleNext}>Continue →</button>
            : <button className="btn btn-primary" onClick={() => setSubmitted(true)}>
                Add Provider
              </button>
          }
        </div>
      </div>
    </div>
  );
}
