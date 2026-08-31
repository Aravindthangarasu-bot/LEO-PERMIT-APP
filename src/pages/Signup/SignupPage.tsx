import { useState, useRef, useEffect } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { Phone, ArrowLeft, CheckCircle2, ChevronRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Navbar from '../../components/Navbar/Navbar';
import styles from './SignupPage.module.css';
import { lookupPincode, type PincodeLocation } from '../../utils/pincode';

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
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return 'Enter a valid email address.';
    return '';
  },
  pincode: (v: string) => {
    if (!v)                       return 'Pincode is required.';
    if (!/^\d{6}$/.test(v))      return 'Pincode must be exactly 6 digits.';
    return '';
  },
  address: (v: string) => {
    if (!v.trim())               return 'Address is required.';
    if (v.trim().length < 10)   return 'Please enter a complete address.';
    return '';
  },
};

export default function SignupPage() {
  const [step, setStep]       = useState<Step>('details');
  const [form, setForm]       = useState({ name: '', phone: '', email: '', address: '', pincode: '', city: '', taluk: '', district: '', state: '', lsg: '' });
  const [pincodeOptions, setPincodeOptions] = useState<PincodeLocation[]>([]);
  const [pincodeStatus, setPincodeStatus] = useState<'idle' | 'loading' | 'error' | 'not_found'>('idle');
  const [errors, setErrors]   = useState<FieldErrors>({});
  const [touched, setTouched] = useState<Partial<Record<keyof FieldErrors, boolean>>>({});
  const [otp, setOtp]         = useState(['', '', '', '', '', '']);
  const [otpError, setOtpError] = useState('');
  const [resendTimer, setResendTimer] = useState(0);
  const [loading, setLoading] = useState(false);

  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);
  const { registerCustomer, isAuthenticated, user } = useAuth();


  // Already logged in
  if (isAuthenticated && user) {
    const dest = user.role === 'admin' ? '/admin' : user.role === 'provider' ? '/provider' : user.role === 'staff' ? '/staff' : '/customer';
    return <Navigate to={dest} replace />;
  }

  // Auto-start resend timer when OTP step opens
  useEffect(() => {
    if (step === 'otp') {
      setResendTimer(30);
    }
  }, [step]);

  useEffect(() => {
    if (resendTimer > 0) {
      const t = setTimeout(() => setResendTimer(r => r - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [resendTimer]);

  useEffect(() => {
    if (form.pincode.length === 6) {
      setPincodeStatus('loading');
      lookupPincode(form.pincode).then(res => {
        if (!res) {
          setPincodeStatus('not_found');
          setPincodeOptions([]);
          setForm(prev => ({ ...prev, city: '', taluk: '', district: '', state: '' }));
        } else {
          setPincodeStatus('idle');
          setPincodeOptions(res.options);
          if (res.options.length === 1) {
            setForm(prev => ({
              ...prev,
              city: res.options[0].city,
              taluk: res.options[0].taluk,
              district: res.options[0].district,
              state: res.options[0].state
            }));
          }
        }
      });
    } else {
      setPincodeOptions([]);
      setPincodeStatus('idle');
    }
  }, [form.pincode]);

  const handleChange = (field: keyof FieldErrors) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    let val = e.target.value;
    if (field === 'phone' || field === 'pincode') val = val.replace(/\D/g, '');
    
    setForm(prev => ({ ...prev, [field]: val }));
    if (touched[field]) {
      setErrors(prev => ({ ...prev, [field]: VALIDATORS[field](val) }));
    }
  };

  const handleBlur = (field: keyof FieldErrors) => () => {
    setTouched(prev => ({ ...prev, [field]: true }));
    setErrors(prev => ({ ...prev, [field]: VALIDATORS[field](form[field]) }));
  };

  const validateAll = () => {
    const newErrors: FieldErrors = {
      name: VALIDATORS.name(form.name),
      phone: VALIDATORS.phone(form.phone),
      email: VALIDATORS.email(form.email),
      pincode: VALIDATORS.pincode(form.pincode),
      address: VALIDATORS.address(form.address),
    };
    setErrors(newErrors);
    setTouched({ name: true, phone: true, email: true, pincode: true, address: true });
    return !Object.values(newErrors).some(err => err !== '');
  };

  const handleContinue = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateAll()) {
      setLoading(true);
      setTimeout(() => {
        setLoading(false);
        setStep('otp');
      }, 1000);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    if (value && index < 5) otpRefs.current[index + 1]?.focus();
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleRegister = async () => {
    const code = otp.join('');
    if (code.length !== 6) {
      setOtpError('Please enter all 6 digits.');
      return;
    }
    
    setLoading(true);
    setOtpError('');
    try {
      await registerCustomer({ ...form });
    } catch (err: any) {
      console.error('Registration error:', err);
      setOtpError(err?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const cls = (field: keyof FieldErrors) => `form-input ${touched[field] && errors[field] ? styles.inputError : touched[field] && !errors[field] ? styles.inputValid : ''}`;

  return (
    <div className={styles.page}>
      <Navbar variant="landing" />

      <div className={styles.mainContent}>
        <div className={styles.loginCard}>
          {step === 'details' && (
            <div className={styles.formBox}>
              <h2 className={styles.formTitle}>Citizen Registration</h2>
              <p className={styles.formSub}>Join LEO to apply for permits.</p>

              <form onSubmit={handleContinue}>
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

                  <div className={styles.grid2}>
                    <div className="form-group">
                      <label className="form-label">Pincode *</label>
                      <div className={styles.inputWrap}>
                        <input className={cls('pincode')} type="text" maxLength={6} placeholder="6-digit pincode"
                          value={form.pincode} onChange={handleChange('pincode')} onBlur={handleBlur('pincode')} />
                      </div>
                      {touched.pincode && errors.pincode && <p className={styles.fieldError}>{errors.pincode}</p>}
                      {pincodeStatus === 'loading' && <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Looking up pincode...</p>}
                      {pincodeStatus === 'not_found' && <p style={{ fontSize: 12, color: 'var(--danger)' }}>Pincode not found.</p>}
                    </div>
                  </div>

                  <div className={styles.grid2}>
                    <div className="form-group">
                      <label className="form-label">District *</label>
                      <select className="form-input" value={form.district} onChange={e => setForm(f => ({ ...f, district: e.target.value }))}>
                        <option value="">Select District</option>
                        {pincodeOptions.length > 0 
                          ? Array.from(new Set(pincodeOptions.map(o => o.district))).map(d => <option key={d} value={d}>{d}</option>)
                          : form.district ? <option value={form.district}>{form.district}</option> : null}
                        <option value="Thiruvananthapuram">Thiruvananthapuram</option>
                        <option value="Ernakulam">Ernakulam</option>
                        <option value="Kozhikode">Kozhikode</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Taluka *</label>
                      <select className="form-input" value={form.taluk} onChange={e => setForm(f => ({ ...f, taluk: e.target.value }))}>
                        <option value="">Select Taluka</option>
                        {pincodeOptions.length > 0 
                          ? Array.from(new Set(pincodeOptions.filter(o => !form.district || o.district === form.district).map(o => o.taluk))).map(t => <option key={t} value={t}>{t}</option>)
                          : form.taluk ? <option value={form.taluk}>{form.taluk}</option> : null}
                        <option value="Trivandrum">Trivandrum</option>
                        <option value="Kochi">Kochi</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Local Body (Panchayat / Municipality) *</label>
                    <select className="form-input" value={form.lsg} onChange={e => setForm(f => ({ ...f, lsg: e.target.value }))}>
                      <option value="">Select Local Body</option>
                      <option value="Trivandrum Corporation">Trivandrum Corporation</option>
                      <option value="Kochi Corporation">Kochi Corporation</option>
                      <option value="Kozhikode Corporation">Kozhikode Corporation</option>
                      <option value="Kollam Corporation">Kollam Corporation</option>
                      <option value="Thrissur Corporation">Thrissur Corporation</option>
                      <option value="Kannur Corporation">Kannur Corporation</option>
                      <option value="Other">Other (Grama Panchayat)</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Address *</label>
                    <textarea
                      className={`form-input ${touched.address && errors.address ? styles.inputError : touched.address && !errors.address ? styles.inputValid : ''}`}
                      rows={2} placeholder="Door no., Street, City"
                      value={form.address} onChange={handleChange('address')} onBlur={handleBlur('address')}
                    />
                    {touched.address && errors.address && <p className={styles.fieldError}>{errors.address}</p>}
                  </div>

                <button type="submit" className={styles.continueBtn} disabled={loading}>
                  {loading ? 'Processing...' : <>Continue <ChevronRight size={18} /></>}
                </button>

                <div className={styles.authLinks}>
                  Already have an account? <Link to="/login">Login here</Link>
                </div>
              </form>
            </div>
          )}

          {step === 'otp' && (
            <div className={styles.formBox}>
              <button className={styles.backBtn} onClick={() => setStep('details')}><ArrowLeft size={16} /> Back</button>
              <h2 className={styles.formTitle}>Verify Mobile Number</h2>
              <p className={styles.formSub}>Enter the 6-digit OTP sent to +91 {form.phone}</p>
              
              {otpError && <div className={styles.errorAlert}>{otpError}</div>}
              
              <div className={styles.otpGrid}>
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    ref={el => { otpRefs.current[i] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    className={styles.otpInput}
                    value={digit}
                    onChange={e => handleOtpChange(i, e.target.value)}
                    onKeyDown={e => handleOtpKeyDown(i, e)}
                    autoFocus={i === 0}
                  />
                ))}
              </div>

              <button 
                className={styles.continueBtn} 
                onClick={handleRegister}
                disabled={loading || otp.join('').length !== 6}
              >
                {loading ? 'Creating Account...' : 'Complete Registration'}
              </button>

              <div className={styles.resendText}>
                {resendTimer > 0 ? (
                  <span>Resend OTP in {resendTimer}s</span>
                ) : (
                  <button className={styles.resendBtn} onClick={() => setResendTimer(30)}>Resend OTP</button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
