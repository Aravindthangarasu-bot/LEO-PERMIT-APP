import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Phone, LogOut, ChevronDown, User, Globe, Moon, Sun, Bell } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import { useAppStore } from '../../context/AppStoreContext';
import type { UserRole } from '../../types';
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
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);


  const getApplicationPath = (role: UserRole, appId?: string) => {
    if (!appId) return `/${role}`;
    switch (role) {
      case 'customer': return `/customer/applications/${appId}`;
      case 'provider': return `/provider/applications?application=${appId}`;
      case 'staff': return `/staff/applications?application=${appId}`;
      case 'admin': return `/admin/applications?application=${appId}`;
      default: return `/${role}`;
    }
  };
  
  // Safe useAppStore
  let appStore = null;
  try {
    appStore = useAppStore();
  } catch (e) {
    // If used outside AppStoreProvider (e.g. landing page)
  }

  const { notifications, markNotificationRead, deleteNotification } = appStore || { notifications: [], markNotificationRead: () => {}, deleteNotification: () => {} };

  const myNotifications = notifications
    .filter(n => n.userId === user?.id)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  const unreadCount = myNotifications.filter(n => !n.read).length;

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
                onClick={toggleTheme}
                title="Toggle Theme"
              >
                {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
              </button>

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
                <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                  {isAuthenticated && user && (
                    <>
                      <div className={styles.userMenu}>
                        <button 
                          className={styles.userBtn}
                          onClick={() => { setNotifOpen(!notifOpen); setDropdownOpen(false); }}
                          style={{ position: 'relative', padding: '8px' }}
                        >
                          <Bell size={20} />
                          {unreadCount > 0 && (
                            <span style={{ position: 'absolute', top: 0, right: 0, background: '#ef4444', color: 'white', fontSize: '10px', fontWeight: 'bold', width: '16px', height: '16px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              {unreadCount}
                            </span>
                          )}
                        </button>

                        {notifOpen && (
                          <div className={styles.dropdown} style={{ width: '320px', right: 0, overflow: 'hidden' }}>
                            <div className={styles.dropdownHeader} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <strong>Notifications</strong>
                              <span style={{ margin: 0, background: 'var(--primary-bg)', color: 'var(--primary)', padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold' }}>{unreadCount} New</span>
                            </div>
                            <div style={{ maxHeight: '350px', overflowY: 'auto' }}>
                              {myNotifications.length > 0 ? myNotifications.map(n => (
                                <div key={n.id} onClick={() => { markNotificationRead(n.id); navigate(getApplicationPath(user.role, n.applicationId)); setNotifOpen(false); }} style={{ padding: '12px 16px', borderBottom: '1px solid #e2e8f0', background: n.read ? 'white' : '#f8fafc', cursor: 'pointer', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                                  <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontSize: '13px', color: '#0f172a', fontWeight: n.read ? 400 : 600, marginBottom: '4px', lineHeight: 1.4 }}>{n.message}</div>
                                    <div style={{ fontSize: '11px', color: '#64748b' }}>{new Date(n.timestamp).toLocaleString()}</div>
                                  </div>
                                  <button onClick={(e) => { e.stopPropagation(); deleteNotification(n.id); }} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px' }}>
                                    <span style={{ fontSize: '16px', lineHeight: 1 }}>&times;</span>
                                  </button>
                                </div>
                              )) : (
                                <div style={{ padding: '24px', textAlign: 'center', color: '#64748b', fontSize: '13px' }}>
                                  No notifications yet
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>

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
                    </>
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
