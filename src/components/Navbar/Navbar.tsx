import { useState } from 'react';
import { useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Building2, MapPin, LogOut, ChevronDown, Search, X, CheckCircle2, AlertTriangle, Sun, Moon } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useAppStore } from '../../context/AppStoreContext';
import styles from './Navbar.module.css';

interface NavbarProps {
  variant?: 'landing' | 'portal';
}

export default function Navbar({ variant = 'landing' }: NavbarProps) {
  const { user, logout, isAuthenticated } = useAuth();
  const { providers } = useAppStore();
  const navigate = useNavigate();
  const [locationOpen, setLocationOpen] = useState(false);
  const [pincode, setPincode] = useState('');
  const [locationName, setLocationName] = useState('');
  const [locationError, setLocationError] = useState('');
  const [result, setResult] = useState<{ serviceable: boolean; providerCount: number; label: string } | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => (localStorage.getItem('leo_theme') as 'light' | 'dark') || 'light');
  const locationFallbackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem('leo_theme', theme);
  }, [theme]);

  useEffect(() => {
    if (!locationError) return;

    const dismissOnOutsideClick = (event: MouseEvent) => {
      if (!locationFallbackRef.current?.contains(event.target as Node)) {
        setLocationError('');
      }
    };
    const dismissOnScroll = () => setLocationError('');

    document.addEventListener('pointerdown', dismissOnOutsideClick);
    window.addEventListener('scroll', dismissOnScroll, true);
    return () => {
      document.removeEventListener('pointerdown', dismissOnOutsideClick);
      window.removeEventListener('scroll', dismissOnScroll, true);
    };
  }, [locationError]);

  const checkPincode = () => {
    setLocationError('');
    if (!/^\d{6}$/.test(pincode)) {
      setLocationError('Enter a valid 6-digit pincode.');
      return;
    }
    setResult(null);
    const normalizedPincode = pincode.trim();
    const byPincode = providers.filter(provider =>
      provider.status === 'active' && (provider.pincode ?? '').trim() === normalizedPincode
    );
    const label = `Pincode ${normalizedPincode}`;
    setLocationName(label);
    setResult({ serviceable: byPincode.length > 0, providerCount: byPincode.length, label });
  };

  const handleLogout = () => {
    logout();
    navigate('/', { replace: true });
  };

  const dashboardPath =
    user?.role === 'admin'    ? '/admin'    :
    user?.role === 'provider' ? '/provider' :
    user?.role === 'staff'    ? '/staff'    :
                                '/customer';

  return (
    <nav className={`${styles.navbar} ${variant === 'portal' ? styles.portal : ''}`}>
      <div className={`container ${styles.inner}`}>
        <Link to="/" className={styles.brand}>
          <div className={styles.logoBox}>
            <Building2 size={22} />
          </div>
          <div className={styles.brandText}>
            <span className={styles.brandName}>LEO</span>
            <span className={styles.brandSub}>Building Permit Services</span>
          </div>
        </Link>

        <div className={styles.actions}>
          <div className={`${styles.navServiceability} ${result ? (result.serviceable ? styles.navServiceable : styles.navNotServiceable) : styles.navServiceabilityPrompt}`}>
            {result ? (result.serviceable ? <CheckCircle2 size={15} /> : <AlertTriangle size={15} />) : <MapPin size={15} />}
            <span>{result ? (result.serviceable ? 'Pincode is serviceable' : 'Pincode is not serviceable') : 'Check service pincode'}</span>
          </div>
          {result && !result.serviceable ? (
            <div ref={locationFallbackRef} className={styles.locationFallback}>
              <div className={styles.locationInlineInput}>
                <MapPin size={15} />
                <input
                  value={pincode}
                  maxLength={6}
                  inputMode="numeric"
                  placeholder="Enter pincode"
                  aria-label="Enter service pincode"
                  onChange={event => { setPincode(event.target.value.replace(/\D/g, '')); setLocationError(''); }}
                  onKeyDown={event => event.key === 'Enter' && checkPincode()}
                />
                <button onClick={checkPincode}>Check</button>
              </div>
              {locationError && <span className={styles.inlineLocationError}>{locationError}</span>}
            </div>
          ) : (
            <button className={`${styles.locationBtn} ${locationName ? styles.locationSelected : ''}`} onClick={() => setLocationOpen(true)}>
              <MapPin size={15} />
              <span>{locationName || 'Enter Pincode'}</span>
              <ChevronDown size={14} />
            </button>
          )}
          <button
            className={styles.themeToggle}
            onClick={() => setTheme(current => current === 'light' ? 'dark' : 'light')}
            aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
            title={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
          >
            {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
          </button>

          {isAuthenticated ? (
            <div className={styles.userMenu}>
              <Link to={dashboardPath} className={styles.userBtn}>
                <div className={styles.userAvatar}>
                  {user?.name?.[0]?.toUpperCase() ?? 'U'}
                </div>
                <span>{user?.name}</span>
              </Link>
              <button onClick={handleLogout} className={`btn btn-ghost ${styles.logoutBtn}`}>
                <LogOut size={16} />
                Logout
              </button>
            </div>
          ) : (
            <>
              <Link to="/login" className={`btn btn-ghost ${styles.loginBtn}`}>
                Log In
              </Link>
              <Link to="/get-started" className={`btn btn-primary ${styles.signupBtn}`}>
                Get Started
              </Link>
            </>
          )}
        </div>
      </div>

      {locationOpen && (
        <div className={styles.locationBackdrop} onClick={() => setLocationOpen(false)}>
          <div className={styles.locationModal} onClick={event => event.stopPropagation()}>
            <div className={styles.locationModalHeader}>
              <div><h2>Check Service Availability</h2><p>Enter the property's pincode to find active providers.</p></div>
              <button className={styles.closeLocation} onClick={() => setLocationOpen(false)} aria-label="Close"><X size={18} /></button>
            </div>

            <div className={styles.pincodeCheckRow}>
              <div className={styles.pincodeInputWrap}><Search size={16} /><input value={pincode} maxLength={6} inputMode="numeric" placeholder="6-digit pincode" onChange={event => setPincode(event.target.value.replace(/\D/g, ''))} onKeyDown={event => event.key === 'Enter' && checkPincode()} /></div>
              <button className="btn btn-primary" onClick={checkPincode}>Check</button>
            </div>

            {locationError && <div className={styles.locationError}><AlertTriangle size={16} />{locationError}</div>}
            {result && (
              <div className={`${styles.serviceabilityResult} ${result.serviceable ? styles.serviceable : styles.notServiceable}`}>
                {result.serviceable ? <CheckCircle2 size={23} /> : <AlertTriangle size={23} />}
                <div>
                  <strong>{result.serviceable ? 'Pincode is serviceable' : 'Pincode is not serviceable yet'}</strong>
                  <p>{result.serviceable
                    ? `${result.providerCount} active service provider${result.providerCount > 1 ? 's are' : ' is'} available for ${result.label}.`
                    : `There are no active providers for ${result.label} yet. Enter another pincode to check a different service area.`}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
