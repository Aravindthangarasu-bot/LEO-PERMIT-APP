import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LogOut, ChevronDown, User, Building2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import NotificationsDropdown from '../../components/NotificationsDropdown';
import styles from './AdminLayout.module.css';

interface NavItem {
  path: string;
  icon?: React.ReactNode;
  label: string;
}

interface AdminLayoutProps {
  children: React.ReactNode;
  navItems: NavItem[];
}

export default function AdminLayout({ children, navItems }: AdminLayoutProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <div className={styles.layout}>
      {/* Sidebar */}
      <aside className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <NavLink to="/admin" className={styles.logo}>
            <Building2 className={styles.logoIcon} size={24} />
            LEO PERMIT
          </NavLink>
        </div>
        <nav className={styles.nav}>
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/admin'}
              className={({ isActive }) => 
                isActive ? `${styles.navItem} ${styles.navItemActive}` : styles.navItem
              }
            >
              {item.icon}
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <div className={styles.mainContent}>
        {/* Topbar */}
        <header className={styles.topbar}>
          <div className={styles.userControls}>
            <NotificationsDropdown />
            
            {user && (
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
        </header>

        {/* Page Content */}
        <main className={styles.contentArea}>
          {children}
        </main>
      </div>
    </div>
  );
}
