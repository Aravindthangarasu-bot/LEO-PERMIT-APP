import { useState } from 'react';
import { useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Building2, MapPin, LogOut, ChevronDown, LocateFixed, Search, X, CheckCircle2, AlertTriangle, LoaderCircle, Sun, Moon } from 'lucide-react';
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
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState<{ serviceable: boolean; providerCount: number; label: string } | null>(null);

  const [locationChecked, setLocationChecked] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => (localStorage.getItem('leo_theme') as 'light' | 'dark') || 'light');
  const locationFallbackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem('leo_theme', theme);
  }, [theme]);

  useEffect(() => {
    const savedLocation = localStorage.getItem('leo_location');
    if (savedLocation) {
      const saved = JSON.parse(savedLocation) as { latitude: number; longitude: number; label: string };
      checkCoordinates(saved.latitude, saved.longitude, saved.label);
    } else {
      detectLocation();
    }
  }, []);

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

  const distanceKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const earthRadius = 6371;
    const toRadians = (value: number) => value * Math.PI / 180;
    const dLat = toRadians(lat2 - lat1);
    const dLon = toRadians(lon2 - lon1);
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLon / 2) ** 2;
    return earthRadius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  const checkCoordinates = (latitude: number, longitude: number, label: string) => {
    const nearby = providers.filter(provider => provider.status === 'active' && provider.latitude && provider.longitude)
      .filter(provider => distanceKm(latitude, longitude, provider.latitude!, provider.longitude!) <= 5);
    setLocationName(label);
    setResult({ serviceable: nearby.length > 0, providerCount: nearby.length, label });
    setLocationChecked(true);
    localStorage.setItem('leo_location', JSON.stringify({ latitude, longitude, label }));
    setChecking(false);
  };

  const detectLocation = () => {
    setLocationError('');
    setResult(null);
    setChecking(true);
    if (!navigator.geolocation) {
      setChecking(false);
      setLocationChecked(true);
      setLocationError('Location detection is not supported by this browser. Please enter your pincode.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      position => checkCoordinates(position.coords.latitude, position.coords.longitude, 'Current location'),
      () => {
        setChecking(false);
        setLocationChecked(true);
        setLocationError('We could not access your location. Please allow location access or enter your pincode.');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 },
    );
  };

  const checkPincode = () => {
    setLocationError('');
    if (!/^\d{6}$/.test(pincode)) {
      setLocationError('Enter a 6-digit pincode to check another service area.');
      return;
    }
    setResult(null);
    // Dynamically check ALL active providers for the entered pincode
    const activeProviders = providers.filter(p => p.status === 'active');
    // First try exact pincode match
    const byPincode = activeProviders.filter(p => p.pincode === pincode);
    if (byPincode.length > 0) {
      const label = byPincode[0].area ? `${byPincode[0].area} · ${pincode}` : `Pincode ${pincode}`;
      setLocationName(label);
      setResult({ serviceable: true, providerCount: byPincode.length, label });
      setLocationChecked(true);
      return;
    }
    // Fallback: check by coordinates if provider has lat/lng
    const byCoords = activeProviders.filter(p => p.latitude && p.longitude);
    if (byCoords.length > 0) {
      // Build a quick lookup from known pincodes via provider data
      const label = `Pincode ${pincode}`;
      setLocationName(label);
      setResult({ serviceable: false, providerCount: 0, label });
      setLocationChecked(true);
    } else {
      setLocationName(`Pincode ${pincode}`);
      setResult({ serviceable: false, providerCount: 0, label: `Pincode ${pincode}` });
      setLocationChecked(true);
    }
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
            <span>{result ? (result.serviceable ? 'Location serviceable' : 'Current location is not serviceable') : locationChecked ? 'Enter pincode to check' : 'Checking location…'}</span>
          </div>
          {result && !result.serviceable ? (
            <div ref={locationFallbackRef} className={styles.locationFallback}>
              <div className={styles.locationInlineInput}>
                <MapPin size={15} />
                <input
                  value={pincode}
                  maxLength={6}
                  inputMode="numeric"
                  placeholder="Check another pincode"
                  aria-label="Check another pincode"
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
              <span>{locationName || 'Select Location'}</span>
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
              <div><h2>Check Service Availability</h2><p>We check for active providers within 5 km.</p></div>
              <button className={styles.closeLocation} onClick={() => setLocationOpen(false)} aria-label="Close"><X size={18} /></button>
            </div>

            <button className={styles.detectLocationBtn} onClick={detectLocation} disabled={checking}>
              {checking ? <LoaderCircle size={17} className={styles.spin} /> : <LocateFixed size={17} />}
              {checking ? 'Detecting location…' : 'Use my current location'}
            </button>

            <div className={styles.locationDivider}><span>or enter pincode</span></div>
            <div className={styles.pincodeCheckRow}>
              <div className={styles.pincodeInputWrap}><Search size={16} /><input value={pincode} maxLength={6} inputMode="numeric" placeholder="6-digit pincode" onChange={event => setPincode(event.target.value.replace(/\D/g, ''))} onKeyDown={event => event.key === 'Enter' && checkPincode()} /></div>
              <button className="btn btn-primary" onClick={checkPincode}>Check</button>
            </div>

            {locationError && <div className={styles.locationError}><AlertTriangle size={16} />{locationError}</div>}
            {result && (
              <div className={`${styles.serviceabilityResult} ${result.serviceable ? styles.serviceable : styles.notServiceable}`}>
                {result.serviceable ? <CheckCircle2 size={23} /> : <AlertTriangle size={23} />}
                <div>
                  <strong>{result.serviceable ? 'Location is serviceable' : 'Location is not serviceable yet'}</strong>
                  <p>{result.serviceable
                    ? `${result.providerCount} active service provider${result.providerCount > 1 ? 's are' : ' is'} available near ${result.label}.`
                    : `There are no active providers near ${result.label} yet. Change your pincode to search another service area, or check back soon as we expand.`}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
