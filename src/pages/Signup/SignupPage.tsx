import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import { Building2, Phone, ArrowLeft, User, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import styles from './SignupPage.module.css';

type Step = 'details' | 'otp';

interface FieldErrors {
  name?: string; phone?: string; email?: string; pincode?: string; address?: string;
}

const VALIDATORS = {
  name: (v: string) => {
    if (!v.trim())                              return 'Full name is required.';
    if (v.trim().length < 3)                   return 'Name must be at least 3 characters.';
    if (!/^[a-zA-Z\s.'\-]+$/.test(v.trim()))  return 'Name can only contain letters, spaces, dots or hyphens.';
    return '';
  },
  phone: (v: string) => {
    if (!v)                          return 'Mobile number is required.';
    if (!/^[6-9]\d{9}$/.test(v))    return 'Enter a valid 10-digit Indian mobile number starting with 6–9.';
    return '';
  },
  email: (v: string) => {
    if (!v.trim())                           return 'Email address is required.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return 'Enter a valid email address (e.g. name@domain.com).';
    return '';
  },
  pincode: (v: string) => {
    if (!v)                       return 'Pincode is required.';
    if (!/^\d{6}$/.test(v))      return 'Pincode must be exactly 6 digits.';
    return '';
  },
  address: (v: string) => {
    if (!v.trim())               return 'Address is required.';
    if (v.trim().length < 10)   return 'Please enter a complete address (min 10 characters).';
    return '';
  },
};

export default function SignupPage() {
  const [step, setStep]       = useState<Step>('details');
  const [form, setForm]       = useState({ name: '', phone: '', email: '', address: '', pincode: '' });
  const [errors, setErrors]   = useState<FieldErrors>({});
  const [touched, setTouched] = useState<Partial<Record<keyof FieldErrors, boolean>>>({});
  const [otp, setOtp]         = useState(['', '', '', '', '', '']);
  const [otpError, setOtpError] = useState('');
  const [resendTimer, setResendTimer] = useState(0);
  const [loading, setLoading] = useState(false);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  const { registerCustomer, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Already logged in — don't show signup page
  if (isAuthenticated) return <Navigate to="/customer" replace />;

  useEffect(() => { if (step === 'otp') setResendTimer(30); }, [step]);
  useEffect(() => {
    if (resendTimer > 0) { const t = setTimeout(() => setResendTimer(r => r - 1), 1000); return () => clearTimeout(t); }
  }, [resendTimer]);

  const validate = (k: keyof FieldErrors, v: string) => VALIDATORS[k](v);

  const handleChange = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const val = k === 'phone' || k === 'pincode' ? e.target.value.replace(/\D/g, '') : e.target.value;
    setForm(f => ({ ...f, [k]: val }));
    // Only show error once user has started typing
    if (val.length > 0) setErrors(prev => ({ ...prev, [k]: validate(k, val) }));
    else setErrors(prev => ({ ...prev, [k]: undefined }));
    if (val.length > 0) setTouched(prev => ({ ...prev, [k]: true }));
  };

  const handleBlur = (k: keyof FieldErrors) => () => {
    // Only flag as touched on blur if user actually typed something
    if (form[k].length > 0) {
      setTouched(prev => ({ ...prev, [k]: true }));
      setErrors(prev => ({ ...prev, [k]: validate(k, form[k]) }));
    }
  };

  const handleSendOtp = () => {
    setTouched({ name: true, phone: true, email: true, pincode: true, address: true });
    const newErrors: FieldErrors = {};
    (Object.keys(VALIDATORS) as (keyof FieldErrors)[]).forEach(k => { const e = validate(k, form[k]); if (e) newErrors[k] = e; });
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;
    setLoading(true);
    setTimeout(() => { setLoading(false); setStep('otp'); }, 800);
  };

  const handleOtpChange = (idx: number, val: string) => {
    if (!/^\d?$/.test(val)) return;
    const next = [...otp]; next[idx] = val; setOtp(next);
    if (val && idx < 5) otpRefs.current[idx + 1]?.focus();
  };

  const handleOtpKeyDown = (idx: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[idx] && idx > 0) otpRefs.current[idx - 1]?.focus();
  };

  const handleRegister = async () => {
    setOtpError('');
    if (otp.join('').length < 6) { setOtpError('Please enter the complete 6-digit OTP.'); return; }
    setLoading(true);
    try {
      await registerCustomer(form);
      navigate('/customer', { replace: true });
    } catch (error) {
      setOtpError(error instanceof Error ? error.message : 'Unable to create your account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const cls = (k: keyof FieldErrors) =>
    `form-input ${touched[k] && errors[k] ? styles.inputError : touched[k] && !errors[k] ? styles.inputValid : ''}`;

  return (
    <div className={styles.page}>
      <div className={styles.left}>
        <div className={styles.leftInner}>
          <Link to="/" className={styles.brand}>
            <div className={styles.logoBox}><Building2 size={22} /></div>
            <div><div className={styles.brandName}>LEO</div><div className={styles.brandSub}>Building Permit Services</div></div>
          </Link>
          <div className={styles.leftContent}>
            <h2 className={styles.leftTitle}>Start your permit journey today.</h2>
            <p className={styles.leftDesc}>Create a free account and apply for building permits instantly.</p>
          </div>
        </div>
      </div>

      <div className={styles.right}>
        <div className={styles.formWrap}>
          <div className={styles.formBox}>
            {step === 'details' ? (
              <>
                <div className={styles.iconRow}><div className={styles.formIcon}><User size={24} /></div></div>
                <h1 className={styles.formTitle}>Create Account</h1>
                <p className={styles.formSub}>Join LEO as a customer to apply for permits.</p>

                <div className="form-group">
                  <label className="form-label">Full Name *</label>
                  <div className={styles.inputWrap}>
                    <input className={cls('name')} type="text" placeholder="As per Aadhaar card"
                      value={form.name} onChange={handleChange('name')} onBlur={handleBlur('name')} />
                    {touched.name && !errors.name && <CheckCircle2 size={16} className={styles.validIcon} />}
                  </div>
                  {touched.name && errors.name && <p className={styles.fieldError}>{errors.name}</p>}
                </div>

                <div className="form-group">
                  <label className="form-label">Mobile Number *</label>
                  <div className={`${styles.phoneInput} ${touched.phone && errors.phone ? styles.phoneError : touched.phone && !errors.phone ? styles.phoneValid : ''}`}>
                    <span className={styles.phonePrefix}><Phone size={15} /> +91</span>
                    <input className={styles.phoneField} type="tel" maxLength={10} placeholder="10-digit number"
                      value={form.phone} onChange={handleChange('phone')} onBlur={handleBlur('phone')} />
                    {touched.phone && !errors.phone && <CheckCircle2 size={16} className={styles.validIcon} />}
                  </div>
                  {touched.phone && errors.phone && <p className={styles.fieldError}>{errors.phone}</p>}
                </div>

                <div className="form-group">
                  <label className="form-label">Email Address *</label>
                  <div className={styles.inputWrap}>
                    <input className={cls('email')} type="email" placeholder="your@email.com"
                      value={form.email} onChange={handleChange('email')} onBlur={handleBlur('email')} />
                    {touched.email && !errors.email && <CheckCircle2 size={16} className={styles.validIcon} />}
                  </div>
                  {touched.email && errors.email && <p className={styles.fieldError}>{errors.email}</p>}
                </div>

                <div className="form-group">
                  <label className="form-label">Pincode *</label>
                  <div className={styles.inputWrap}>
                    <input className={cls('pincode')} type="text" maxLength={6} placeholder="6-digit pincode"
                      value={form.pincode} onChange={handleChange('pincode')} onBlur={handleBlur('pincode')} />
                    {touched.pincode && !errors.pincode && <CheckCircle2 size={16} className={styles.validIcon} />}
                  </div>
                  {touched.pincode && errors.pincode && <p className={styles.fieldError}>{errors.pincode}</p>}
                </div>

                <div className="form-group">
                  <label className="form-label">Address *</label>
                  <textarea
                    className={`form-input ${touched.address && errors.address ? styles.inputError : touched.address && !errors.address ? styles.inputValid : ''}`}
                    rows={2} placeholder="Door no., Street, City"
                    value={form.address} onChange={handleChange('address')} onBlur={handleBlur('address')}
                    style={{ resize: 'none' }}
                  />
                  {touched.address && errors.address && <p className={styles.fieldError}>{errors.address}</p>}
                </div>

                <button className={`btn btn-primary ${styles.continueBtn}`} onClick={handleSendOtp} disabled={loading}>
                  {loading ? 'Sending OTP…' : 'Send OTP'}
                </button>
                <p className={styles.loginLink}>Already have an account? <Link to="/login">Log in</Link></p>
              </>
            ) : (
              <>
                <button className={styles.backBtn} onClick={() => setStep('details')}><ArrowLeft size={16} /> Back</button>
                <h1 className={styles.formTitle}>Verify OTP</h1>
                <p className={styles.formSub}>Enter the 6-digit code sent to +91 {form.phone}</p>
                <div className={styles.otpRow}>
                  {otp.map((digit, i) => (
                    <input key={i} ref={el => { otpRefs.current[i] = el; }} className={styles.otpBox}
                      type="text" inputMode="numeric" maxLength={1} value={digit}
                      onChange={e => handleOtpChange(i, e.target.value)}
                      onKeyDown={e => handleOtpKeyDown(i, e)} />
                  ))}
                </div>
                {otpError && <p className={styles.fieldError}>{otpError}</p>}
                <div className={styles.resendRow}>
                  {resendTimer > 0
                    ? <span className={styles.timerText}>Resend in {resendTimer}s</span>
                    : <button className={styles.resendBtn} onClick={() => { setOtp(['','','','','','']); setResendTimer(30); }}>Resend OTP</button>
                  }
                </div>
                <button className={`btn btn-primary ${styles.continueBtn}`} onClick={handleRegister} disabled={loading}>
                  {loading ? 'Creating account…' : 'Verify & Create Account'}
                </button>
                <p className={styles.demoHint}>Demo: any 6-digit OTP works</p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

