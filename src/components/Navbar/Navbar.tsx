import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Building2, Phone, LogOut, ChevronDown, User, Globe } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import styles from './Navbar.module.css';

interface NavItem {
  path: string;
  icon?: React.ReactNode;
  label: string;
}

interface NavbarProps {
  variant?: 'landing' | 'portal';
  navItems?: NavItem[];
}

export default function Navbar({ variant = 'landing', navItems }: NavbarProps) {
  const { user, logout, isAuthenticated } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const isPortal = variant === 'portal' || location.pathname.includes('/customer') || location.pathname.includes('/provider') || location.pathname.includes('/admin') || location.pathname.includes('/staff');

  return (
    <div className={styles.navbarWrapper}>
      {/* 2. Main Header */}
      <header className={styles.mainHeader}>
        <div className="container">
          <div className={styles.mainHeaderInner}>
            <Link to="/" className={styles.brand}>
              <div className={styles.logo}>
                <Building2 size={32} color="white" />
              </div>
              <div className={styles.brandText}>
                <h1>{t('navbar.title')}</h1>
                <p>{t('navbar.subtitle')}</p>
              </div>
            </Link>
            
            <div className={styles.headerRight}>
              <button 
                className={styles.langToggle} 
                onClick={() => setLanguage(language === 'en' ? 'ml' : 'en')}
              >
                <Globe size={18} />
                <span>{language === 'en' ? 'മലയാളം' : 'English'}</span>
              </button>

              {!isPortal ? (
                <div className={styles.contactItem}>
                  <Phone size={18} className={styles.contactIcon} />
                  <div>
                    <strong>{t('navbar.helpdesk')}</strong>
                    <span>1800-425-XXXX</span>
                  </div>
                </div>
              ) : (
                <div className={styles.portalControls}>
                  {isAuthenticated && user && (
                    <div className={styles.userMenu}>
                      <button 
                        className={styles.userBtn}
                        onClick={() => setDropdownOpen(!dropdownOpen)}
                      >
                        <div className={styles.avatar}>
                          <User size={16} />
                        </div>
                        <span className={styles.userName}>{user.name}</span>
                        <ChevronDown size={14} />
                      </button>
                      
                      {dropdownOpen && (
                        <div className={styles.dropdown}>
                          <div className={styles.dropdownHeader}>
                            <strong>{user.name}</strong>
                            <span>{user.email}</span>
                          </div>
                          <button onClick={handleLogout} className={styles.dropdownItem}>
                            <LogOut size={14} /> Sign Out
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* 3. Navigation Bar */}
      <nav className={styles.navBar}>
        <div className="container">
          <ul className={styles.navLinks}>
            {navItems ? (
              navItems.map(item => (
                <li key={item.path}>
                  <Link to={item.path} className={location.pathname === item.path ? styles.activeLink : ''}>
                    {item.icon && <span className={styles.navIcon}>{item.icon}</span>}
                    {item.label}
                  </Link>
                </li>
              ))
            ) : (
              <>
                <li><Link to="/">{t('navbar.home')}</Link></li>
                {!isPortal ? (
                  <>
                    <li><Link to="/">{t('navbar.about')}</Link></li>
                    <li><Link to="/">{t('navbar.services')}</Link></li>
                    <li><Link to="/">{t('navbar.track')}</Link></li>
                    <li><Link to="/">{t('navbar.downloads')}</Link></li>
                    <li><Link to="/">{t('navbar.contact')}</Link></li>
                  </>
                ) : (
                  <>
                    <li><Link to={`/${user?.role || 'customer'}`}>{t('navbar.dashboard')}</Link></li>
                  </>
                )}
              </>
            )}
          </ul>
        </div>
      </nav>
    </div>
  );
}
