import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Building2, Home, User,
  FileText, Shield, ArrowRight, ChevronRight, HardHat, FileCheck2
} from 'lucide-react';
import Navbar from '../../components/Navbar/Navbar';
import styles from './LandingPage.module.css';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';

import type { UserRole } from '../../types';

export default function LandingPage() {
  const navigate = useNavigate();
  const { verifyPhone, login } = useAuth();
  const { t } = useLanguage();

  const SERVICES = [
    { icon: <FileCheck2 size={32} />, title: t('landing.services.newPermit.title'), desc: t('landing.services.newPermit.desc'), link: '/' },
    { icon: <Home size={32} />, title: t('landing.services.renovation.title'), desc: t('landing.services.renovation.desc'), link: '/' },
    { icon: <FileText size={32} />, title: t('landing.services.occupancy.title'), desc: t('landing.services.occupancy.desc'), link: '/' },
    { icon: <Shield size={32} />, title: t('landing.services.completion.title'), desc: t('landing.services.completion.desc'), link: '/' },
    { icon: <Building2 size={32} />, title: t('landing.services.wall.title'), desc: t('landing.services.wall.desc'), link: '/' },
    { icon: <HardHat size={32} />, title: t('landing.services.providerReg.title'), desc: t('landing.services.providerReg.desc'), link: '/provider-register' },
  ];
  
  const [loginStep, setLoginStep] = useState<'PHONE' | 'OTP' | 'ROLE_SELECT'>('PHONE');
  const [loginPhone, setLoginPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [availableRoles, setAvailableRoles] = useState<UserRole[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [modalService, setModalService] = useState('');

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (loginPhone.length < 10) {
      setErrorMsg(t('landing.login.errorInvalidMobile'));
      return;
    }
    setLoading(true);
    // In a real app, send OTP here
    setTimeout(() => {
      setLoading(false);
      setLoginStep('OTP');
    }, 800);
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (otp !== '1234') {
      setErrorMsg(t('landing.login.errorInvalidOtp'));
      return;
    }
    
    setLoading(true);
    try {
      const roles = await verifyPhone(loginPhone);
      if (roles.length === 0) {
        setErrorMsg(t('landing.login.errorNotRegistered'));
        setLoading(false);
        return;
      }
      
      if (roles.length === 1) {
        // Only 1 role found, login directly
        await login(loginPhone, roles[0]);
        navigate(`/${roles[0]}`);
      } else {
        // Multiple roles, prompt user to select
        setAvailableRoles(roles);
        setLoginStep('ROLE_SELECT');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Verification failed');
    }
    setLoading(false);
  };

  const handleSelectRole = async (role: UserRole) => {
    setLoading(true);
    setErrorMsg('');
    try {
      await login(loginPhone, role);
      navigate(`/${role}`);
    } catch (err: any) {
      setErrorMsg(err.message || 'Login failed');
    }
    setLoading(false);
  };

  const handleServiceClick = (e: React.MouseEvent<HTMLAnchorElement>, link: string, title: string) => {
    if (link === '/') {
      e.preventDefault();
      setModalService(title);
      setShowLoginModal(true);
      setLoginStep('PHONE');
      setErrorMsg('');
    }
  };

  const closeModal = () => {
    setShowLoginModal(false);
    setLoginStep('PHONE');
    setOtp('');
    setErrorMsg('');
    setAvailableRoles([]);
  };

  return (
    <div className={styles.page}>
      
      <Navbar variant="landing" />

      {/* 4. Banner & Login Section */}
      <section className={styles.heroSection}>
        <div className={styles.heroBanner}>
          <div className="container">
            <div className={styles.heroContent}>
              <div className={styles.heroText}>
                <h2>{t('landing.welcome')}</h2>
                <p>{t('landing.description')}</p>
                <div className={styles.bannerStats}>
                  <div className={styles.bannerStat}>
                    <strong>5,200+</strong>
                    <span>{t('landing.stats.approved')}</span>
                  </div>
                  <div className={styles.bannerStat}>
                    <strong>120+</strong>
                    <span>{t('landing.stats.providers')}</span>
                  </div>
                </div>
              </div>

              {/* Login Box Overlapping Banner */}
              <div className={styles.loginBox}>
                <div className={styles.loginHeader}>
                  <User size={20} />
                  <h3>{loginStep === 'ROLE_SELECT' ? t('landing.login.selectAccount') : t('landing.login.title')}</h3>
                </div>

                {loginStep === 'PHONE' && (
                  <form className={styles.loginForm} onSubmit={handleSendOtp}>
                    <div className={styles.formGroup}>
                      <label>{t('landing.login.mobileLabel')}</label>
                      <input 
                        id="mobile-login-input"
                        type="tel"
                        maxLength={10}
                        placeholder={t('landing.login.mobilePlaceholder')} 
                        className={styles.input}
                        value={loginPhone}
                        onChange={(e) => setLoginPhone(e.target.value.replace(/\D/g, ''))}
                        disabled={loading}
                      />
                    </div>
                    {errorMsg && <p className={styles.errorMsg}>{errorMsg}</p>}
                    <button type="submit" className={styles.loginBtn} disabled={loading}>
                      {loading ? t('landing.login.btnSending') : t('landing.login.btnSendOtp')} <ArrowRight size={16} />
                    </button>
                    <div className={styles.loginLinks}>
                      <Link to="/signup">{t('landing.login.linkNewUser')}</Link>
                      <Link to="/provider-register">{t('landing.login.linkProvider')}</Link>
                    </div>
                  </form>
                )}

                {loginStep === 'OTP' && (
                  <form className={styles.loginForm} onSubmit={handleVerifyOtp}>
                    <div className={styles.formGroup}>
                      <label>{t('landing.login.otpLabel')} {loginPhone}</label>
                      <input 
                        type="text"
                        maxLength={4}
                        placeholder={t('landing.login.otpPlaceholder')} 
                        className={styles.input}
                        value={otp}
                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                        disabled={loading}
                        autoFocus
                      />
                    </div>
                    {errorMsg && <p className={styles.errorMsg}>{errorMsg}</p>}
                    <button type="submit" className={styles.loginBtn} disabled={loading}>
                      {loading ? t('landing.login.btnVerifying') : t('landing.login.btnVerify')} <ArrowRight size={16} />
                    </button>
                    <button type="button" className={styles.backBtn} onClick={() => { setLoginStep('PHONE'); setOtp(''); setErrorMsg(''); }}>
                      {t('landing.login.btnChangeMobile')}
                    </button>
                  </form>
                )}

                {loginStep === 'ROLE_SELECT' && (
                  <div className={styles.roleSelectBox}>
                    <p className={styles.roleSelectText}>{t('landing.login.multipleAccounts')}</p>
                    {errorMsg && <p className={styles.errorMsg}>{errorMsg}</p>}
                    <div className={styles.roleButtons}>
                      {availableRoles.includes('customer') && (
                        <button className={styles.roleBtn} onClick={() => handleSelectRole('customer')} disabled={loading}>
                          {t('landing.login.loginCitizen')}
                        </button>
                      )}
                      {availableRoles.includes('provider') && (
                        <button className={styles.roleBtn} onClick={() => handleSelectRole('provider')} disabled={loading}>
                          {t('landing.login.loginProvider')}
                        </button>
                      )}
                      {availableRoles.includes('staff') && (
                        <button className={styles.roleBtn} onClick={() => handleSelectRole('staff')} disabled={loading}>
                          {t('landing.login.loginStaff')}
                        </button>
                      )}
                      {availableRoles.includes('admin') && (
                        <button className={styles.roleBtn} onClick={() => handleSelectRole('admin')} disabled={loading}>
                          {t('landing.login.loginAdmin')}
                        </button>
                      )}
                    </div>
                    <button type="button" className={styles.backBtn} onClick={() => { setLoginStep('PHONE'); setOtp(''); setErrorMsg(''); setAvailableRoles([]); }}>
                      {t('landing.login.cancel')}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Online Services Grid */}
      <section id="services" className={styles.servicesSection}>
        <div className="container">
          <div className={styles.sectionHeader}>
            <h2>{t('landing.services.title')}</h2>
            <div className={styles.titleUnderline}></div>
          </div>

          <div className={styles.servicesGrid}>
            {SERVICES.map((service, idx) => (
              <Link 
                to={service.link} 
                key={idx} 
                className={styles.serviceTile}
                onClick={(e) => handleServiceClick(e, service.link, service.title)}
              >
                <div className={styles.tileIcon}>
                  {service.icon}
                </div>
                <h3>{service.title}</h3>
                <p>{service.desc}</p>
                <span className={styles.tileArrow}>
                  <ChevronRight size={18} />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 6. Footer (Portal Style) */}
      <footer className={styles.portalFooter}>
        <div className="container">
          <div className={styles.footerGrid}>
            <div id="about" className={styles.footerCol}>
              <h4>{t('landing.footer.aboutTitle')}</h4>
              <p>{t('landing.footer.aboutDesc')}</p>
            </div>
            <div className={styles.footerCol}>
              <h4>{t('landing.footer.quickLinks')}</h4>
              <ul>
                <li><Link to="/building-rules">{t('landing.footer.buildingRules')}</Link></li>
                <li><Link to="/fee-calculator">{t('landing.footer.feeCalc')}</Link></li>
                <li><Link to="/user-manuals">{t('landing.footer.manuals')}</Link></li>
                <li><Link to="/govt-orders">{t('landing.footer.orders')}</Link></li>
              </ul>
            </div>
            <div id="contact" className={styles.footerCol}>
              <h4>{t('landing.footer.helpSupport')}</h4>
              <ul>
                <li><Link to="/">{t('landing.footer.faq')}</Link></li>
                <li><Link to="/">{t('landing.footer.ticket')}</Link></li>
                <li><Link to="/">{t('landing.footer.contactDir')}</Link></li>
              </ul>
            </div>
          </div>
          <div className={styles.footerBottom}>
            <p>&copy; {new Date().getFullYear()} {t('landing.footer.rights')}</p>
            <p className={styles.footerCredits}>{t('landing.footer.credits')}</p>
          </div>
        </div>
      </footer>
      {/* Login Modal Popup */}
      {showLoginModal && (
        <div className={styles.modalOverlay} onClick={closeModal}>
          <div className={styles.modalBox} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div>
                <h3 className={styles.modalTitle}>Login to Apply</h3>
                {modalService && <p className={styles.modalSubtitle}>{modalService}</p>}
              </div>
              <button className={styles.modalClose} onClick={closeModal} aria-label="Close">✕</button>
            </div>

            {loginStep === 'PHONE' && (
              <form className={styles.loginForm} onSubmit={handleSendOtp}>
                <div className={styles.formGroup}>
                  <label>{t('landing.login.mobileLabel')}</label>
                  <input
                    id="modal-login-input"
                    type="tel"
                    maxLength={10}
                    placeholder={t('landing.login.mobilePlaceholder')}
                    className={styles.input}
                    value={loginPhone}
                    onChange={(e) => setLoginPhone(e.target.value.replace(/\D/g, ''))}
                    disabled={loading}
                    autoFocus
                  />
                </div>
                {errorMsg && <p className={styles.errorMsg}>{errorMsg}</p>}
                <button type="submit" className={styles.loginBtn} disabled={loading}>
                  {loading ? t('landing.login.btnSending') : t('landing.login.btnSendOtp')} <ArrowRight size={16} />
                </button>
                <div className={styles.loginLinks}>
                  <Link to="/signup" onClick={closeModal}>{t('landing.login.linkNewUser')}</Link>
                  <Link to="/provider-register" onClick={closeModal}>{t('landing.login.linkProvider')}</Link>
                </div>
              </form>
            )}

            {loginStep === 'OTP' && (
              <form className={styles.loginForm} onSubmit={handleVerifyOtp}>
                <div className={styles.formGroup}>
                  <label>{t('landing.login.otpLabel')} {loginPhone}</label>
                  <input
                    type="text"
                    maxLength={4}
                    placeholder={t('landing.login.otpPlaceholder')}
                    className={styles.input}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    disabled={loading}
                    autoFocus
                  />
                </div>
                {errorMsg && <p className={styles.errorMsg}>{errorMsg}</p>}
                <button type="submit" className={styles.loginBtn} disabled={loading}>
                  {loading ? t('landing.login.btnVerifying') : t('landing.login.btnVerify')} <ArrowRight size={16} />
                </button>
                <button type="button" className={styles.backBtn} onClick={() => { setLoginStep('PHONE'); setOtp(''); setErrorMsg(''); }}>
                  {t('landing.login.btnChangeMobile')}
                </button>
              </form>
            )}

            {loginStep === 'ROLE_SELECT' && (
              <div className={styles.roleSelectBox}>
                <p className={styles.roleSelectText}>{t('landing.login.multipleAccounts')}</p>
                {errorMsg && <p className={styles.errorMsg}>{errorMsg}</p>}
                <div className={styles.roleButtons}>
                  {availableRoles.includes('customer') && (
                    <button className={styles.roleBtn} onClick={() => handleSelectRole('customer')} disabled={loading}>
                      {t('landing.login.loginCitizen')}
                    </button>
                  )}
                  {availableRoles.includes('provider') && (
                    <button className={styles.roleBtn} onClick={() => handleSelectRole('provider')} disabled={loading}>
                      {t('landing.login.loginProvider')}
                    </button>
                  )}
                  {availableRoles.includes('staff') && (
                    <button className={styles.roleBtn} onClick={() => handleSelectRole('staff')} disabled={loading}>
                      {t('landing.login.loginStaff')}
                    </button>
                  )}
                  {availableRoles.includes('admin') && (
                    <button className={styles.roleBtn} onClick={() => handleSelectRole('admin')} disabled={loading}>
                      {t('landing.login.loginAdmin')}
                    </button>
                  )}
                </div>
                <button type="button" className={styles.backBtn} onClick={() => { setLoginStep('PHONE'); setOtp(''); setErrorMsg(''); setAvailableRoles([]); }}>
                  {t('landing.login.cancel')}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
