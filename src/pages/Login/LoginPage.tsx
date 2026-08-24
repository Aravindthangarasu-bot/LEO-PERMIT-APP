import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useSearchParams, Navigate } from 'react-router-dom';
import { Building2, Phone, ArrowLeft, Shield, User, ChevronRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import type { UserRole } from '../../types';
import styles from './LoginPage.module.css';

type Step = 'role' | 'phone' | 'otp';

export default function LoginPage() {
  const [searchParams] = useSearchParams();
  const defaultRole = (searchParams.get('role') as UserRole) ?? 'customer';

  const [step, setStep] = useState<Step>('role');
  const [role, setRole] = useState<UserRole>(defaultRole);
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [resendTimer, setResendTimer] = useState(0);
  const [loading, setLoading] = useState(false);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  const { login, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  // Already logged in — redirect away from login page immediately
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

  const handleSendOtp = () => {
    setError('');
    if (!/^[6-9]\d{9}$/.test(phone)) {
      setError('Please enter a valid 10-digit Indian mobile number.');
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setStep('otp');
    }, 800);
  };

  const handleOtpChange = (idx: number, val: string) => {
    if (!/^\d?$/.test(val)) return;
    const next = [...otp];
    next[idx] = val;
    setOtp(next);
    if (val && idx < 5) otpRefs.current[idx + 1]?.focus();
  };

  const handleOtpKeyDown = (idx: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[idx] && idx > 0) {
      otpRefs.current[idx - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    setError('');
    const code = otp.join('');
    if (code.length < 6) {
      setError('Please enter the complete 6-digit OTP.');
      return;
    }
    setLoading(true);
    try {
      await login(phone, role);
      navigate(role === 'admin' ? '/admin' : role === 'provider' ? '/provider' : role === 'staff' ? '/staff' : '/customer', { replace: true });
    } catch (err: any) {
      console.error('Login verification error:', err);
      setError(err?.message || 'Login failed. User not found.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      {/* Left panel */}
      <div className={styles.left}>
        <div className={styles.leftInner}>
          <Link to="/" className={styles.brand}>
            <div className={styles.logoBox}><Building2 size={22} /></div>
            <div>
              <div className={styles.brandName}>LEO</div>
              <div className={styles.brandSub}>Building Permit Services</div>
            </div>
          </Link>

          <div className={styles.leftContent}>
            <h2 className={styles.leftTitle}>Your permits, <br />simplified.</h2>
            <p className={styles.leftDesc}>
              Apply for building permits, track approvals, and connect with certified
              service providers — all from one place.
            </p>
            <div className={styles.features}>
              {['Fast approvals in 48 hours', 'Certified licensed providers', 'Real-time status tracking', 'Fully digital process'].map(f => (
                <div key={f} className={styles.feature}>
                  <div className={styles.featureDot} />
                  {f}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className={styles.right}>
        <div className={styles.formWrap}>
          {step === 'role' && (
            <div className={styles.formBox}>
              <h1 className={styles.formTitle}>Welcome Back</h1>
              <p className={styles.formSub}>Choose your account type to continue</p>

              <div className={styles.roleCards}>
                <button
                  className={`${styles.roleCard} ${role === 'customer' ? styles.roleActive : ''}`}
                  onClick={() => setRole('customer')}
                >
                  <div className={styles.roleIcon}><User size={24} /></div>
                  <div>
                    <div className={styles.roleTitle}>Customer</div>
                    <div className={styles.roleDesc}>Apply for permits & track applications</div>
                  </div>
                  <ChevronRight size={18} className={styles.roleArrow} />
                </button>

                <button
                  className={`${styles.roleCard} ${role === 'provider' ? styles.roleActive : ''}`}
                  onClick={() => setRole('provider')}
                >
                  <div className={styles.roleIcon} style={{ background: '#f0fdf4', color: '#15803d' }}>
                    <Shield size={24} />
                  </div>
                  <div>
                    <div className={styles.roleTitle}>Service Provider</div>
                    <div className={styles.roleDesc}>Review &amp; approve permit applications</div>
                  </div>
                  <ChevronRight size={18} className={styles.roleArrow} />
                </button>

                <button
                  className={`${styles.roleCard} ${role === 'admin' ? styles.roleActive : ''}`}
                  onClick={() => setRole('admin')}
                >
                  <div className={styles.roleIcon} style={{ background: '#eff6ff', color: '#1d4ed8' }}>
                    <Building2 size={24} />
                  </div>
                  <div>
                    <div className={styles.roleTitle}>Super Admin</div>
                    <div className={styles.roleDesc}>Manage providers &amp; system settings</div>
                  </div>
                  <ChevronRight size={18} className={styles.roleArrow} />
                </button>

                <button
                  className={`${styles.roleCard} ${role === 'staff' ? styles.roleActive : ''}`}
                  onClick={() => setRole('staff')}
                >
                  <div className={styles.roleIcon} style={{ background: '#f0fdf4', color: '#15803d' }}>
                    <User size={24} />
                  </div>
                  <div>
                    <div className={styles.roleTitle}>Office Staff</div>
                    <div className={styles.roleDesc}>Handle assigned permit requests</div>
                  </div>
                  <ChevronRight size={18} className={styles.roleArrow} />
                </button>
              </div>

              <button
                className={`btn btn-primary ${styles.continueBtn}`}
                onClick={() => setStep('phone')}
              >
                Continue as {role === 'admin' ? 'Admin' : role === 'provider' ? 'Provider' : role === 'staff' ? 'Office Staff' : 'Customer'}
              </button>

              <p className={styles.signupLink}>
                New customer?{' '}
                <Link to="/signup">Create an account</Link>
              </p>
            </div>
          )}

          {step === 'phone' && (
            <div className={styles.formBox}>
              <button className={styles.backBtn} onClick={() => setStep('role')}>
                <ArrowLeft size={16} /> Back
              </button>
              <h1 className={styles.formTitle}>Enter Your Phone</h1>
              <p className={styles.formSub}>
                We'll send a 6-digit OTP to verify your number.
              </p>

              <div className="form-group">
                <label className="form-label">Mobile Number</label>
                <div className={styles.phoneInput}>
                  <span className={styles.phonePrefix}>
                    <Phone size={15} /> +91
                  </span>
                  <input
                    className={styles.phoneField}
                    type="tel"
                    maxLength={10}
                    placeholder="Enter 10-digit number"
                    value={phone}
                    onChange={e => setPhone(e.target.value.replace(/\D/g, ''))}
                    onKeyDown={e => e.key === 'Enter' && handleSendOtp()}
                  />
                </div>
                {error && <p className={styles.errorMsg}>{error}</p>}
              </div>

              <button
                className={`btn btn-primary ${styles.continueBtn}`}
                onClick={handleSendOtp}
                disabled={loading}
              >
                {loading ? 'Sending OTP…' : 'Send OTP'}
              </button>

              {role === 'provider' && (
                <p className={styles.providerNote}>
                  <Shield size={13} />
                  Provider accounts are created by admin only. Contact your admin if you haven't received access.
                </p>
              )}
            </div>
          )}

          {step === 'otp' && (
            <div className={styles.formBox}>
              <button className={styles.backBtn} onClick={() => setStep('phone')}>
                <ArrowLeft size={16} /> Back
              </button>
              <h1 className={styles.formTitle}>Verify OTP</h1>
              <p className={styles.formSub}>
                Enter the 6-digit code sent to +91 {phone}
              </p>

              <div className={styles.otpRow}>
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    ref={el => { otpRefs.current[i] = el; }}
                    className={styles.otpBox}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={e => handleOtpChange(i, e.target.value)}
                    onKeyDown={e => handleOtpKeyDown(i, e)}
                  />
                ))}
              </div>

              {error && <p className={styles.errorMsg}>{error}</p>}

              <div className={styles.resendRow}>
                {resendTimer > 0 ? (
                  <span className={styles.timerText}>Resend OTP in {resendTimer}s</span>
                ) : (
                  <button className={styles.resendBtn} onClick={() => { setOtp(['','','','','','']); setResendTimer(30); }}>
                    Resend OTP
                  </button>
                )}
              </div>

              <button
                className={`btn btn-primary ${styles.continueBtn}`}
                onClick={handleVerify}
                disabled={loading}
              >
                {loading ? 'Verifying…' : 'Verify & Login'}
              </button>

              <p className={styles.demoHint}>
                Demo: any 6-digit OTP works (e.g. 123456)
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
