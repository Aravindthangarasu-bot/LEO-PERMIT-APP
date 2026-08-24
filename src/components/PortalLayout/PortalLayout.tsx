import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Building2, LogOut, Menu, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import NotificationsDropdown from '../NotificationsDropdown';
import styles from './PortalLayout.module.css';

interface NavItem {
  path: string;
  icon: React.ReactNode;
  label: string;
}

interface PortalLayoutProps {
  children: React.ReactNode;
  navItems: NavItem[];
  portalName: string;
  accentColor?: string;
}

export default function PortalLayout({ children, navItems, portalName, accentColor }: PortalLayoutProps) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/', { replace: true });
  };

  const navLinks = navItems.map(item => (
    <Link
      key={item.path}
      to={item.path}
      className={`${styles.navItem} ${location.pathname === item.path ? styles.navActive : ''}`}
      onClick={() => setMobileMenuOpen(false)}
    >
      {item.icon}
      <span>{item.label}</span>
    </Link>
  ));

  return (
    <div className={styles.layout}>
      {/* Glass Top Header */}
      <header className={styles.topHeader}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <button className={styles.menuBtn} onClick={() => setMobileMenuOpen(v => !v)}>
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
          
          <Link to="/" className={styles.brand}>
            <div className={styles.logoBox} style={accentColor ? { background: accentColor } : undefined}>
              <Building2 size={20} />
            </div>
            <div>
              <div className={styles.brandName}>LEO</div>
              <div className={styles.brandPortal}>{portalName}</div>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className={styles.nav}>
            {navLinks}
          </nav>
        </div>

        <div className={styles.headerRight}>
          <NotificationsDropdown />
          
          <div className={styles.userProfile}>
            <div className={styles.userInfo}>
              <div className={styles.userName}>{user?.name}</div>
              <div className={styles.userPhone}>{user?.phone}</div>
            </div>
            <div className={styles.userAvatar}>{user?.name?.[0]?.toUpperCase() ?? 'U'}</div>
          </div>
          <button className={styles.logoutBtn} onClick={handleLogout}>
            <LogOut size={16} />
            <span>Logout</span>
          </button>
        </div>
      </header>

      {/* Mobile Nav Dropdown */}
      {mobileMenuOpen && (
        <nav className={styles.mobileNav}>
          {navLinks}
        </nav>
      )}

      {/* Main Content Area */}
      <div className={styles.main}>
        <main className={styles.content}>
          {children}
        </main>
      </div>
    </div>
  );
}
