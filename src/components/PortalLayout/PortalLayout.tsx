import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Building2, LogOut, Menu, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
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
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/', { replace: true }); // replace so back button doesn't re-enter the portal
  };

  return (
    <div className={styles.layout}>
      {/* Sidebar */}
      <aside className={`${styles.sidebar} ${sidebarOpen ? styles.open : ''}`}>
        <div className={styles.sidebarTop}>
          <Link to="/" className={styles.brand}>
            <div className={styles.logoBox} style={accentColor ? { background: accentColor } : undefined}>
              <Building2 size={20} />
            </div>
            <div>
              <div className={styles.brandName}>LEO</div>
              <div className={styles.brandPortal}>{portalName}</div>
            </div>
          </Link>
        </div>

        <nav className={styles.nav}>
          {navItems.map(item => (
            <Link
              key={item.path}
              to={item.path}
              className={`${styles.navItem} ${location.pathname === item.path ? styles.navActive : ''}`}
              onClick={() => setSidebarOpen(false)}
            >
              {item.icon}
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className={styles.sidebarBottom}>
          <div className={styles.userCard}>
            <div className={styles.userAvatar}>{user?.name?.[0]?.toUpperCase() ?? 'U'}</div>
            <div className={styles.userInfo}>
              <div className={styles.userName}>{user?.name}</div>
              <div className={styles.userPhone}>{user?.phone}</div>
            </div>
          </div>
          <button className={styles.logoutBtn} onClick={handleLogout}>
            <LogOut size={16} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {sidebarOpen && <div className={styles.overlay} onClick={() => setSidebarOpen(false)} />}

      {/* Main */}
      <div className={styles.main}>
        <header className={styles.topbar}>
          <button className={styles.menuBtn} onClick={() => setSidebarOpen(v => !v)}>
            {sidebarOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
          <div className={styles.topbarRight}>
            <div className={styles.topbarUser}>
              <div className={styles.topbarAvatar}>{user?.name?.[0]?.toUpperCase() ?? 'U'}</div>
              <span>{user?.name}</span>
            </div>
          </div>
        </header>
        <main className={styles.content}>
          {children}
        </main>
      </div>
    </div>
  );
}
