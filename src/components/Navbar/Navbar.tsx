import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, Globe, User, ChevronDown, LogOut, Phone } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import NotificationsDropdown from '../NotificationsDropdown';
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
              <img src="/logo.png" alt="LEO - Licensed Engineering Online" className={styles.logoImg} />
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
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <NotificationsDropdown />
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
                    <li><a href="/#about">{t('navbar.about')}</a></li>
                    <li><a href="/#services">{t('navbar.services')}</a></li>
                    <li><a href="/#track">{t('navbar.track')}</a></li>
                    <li><Link to="/user-manuals">{t('navbar.downloads')}</Link></li>
                    <li><a href="/#contact">{t('navbar.contact')}</a></li>
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
