import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search, ArrowRight, Shield, Clock
} from 'lucide-react';
import { useAppStore, isLicenceExpired } from '../../context/AppStoreContext';
import AnimateIn from '../../components/AnimateIn';
import styles from '../../components/DashboardShared.module.css';
import { sortByNewest } from '../../utils/sorting';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { applications, providers } = useAppStore();
  const [searchTerm, setSearchTerm] = useState('');

  const stats = {
    totalApps: applications.length,
    approved: applications.filter(a => a.status === 'approved').length,
    providers: providers.length,
    activeProviders: providers.filter(p => p.status === 'active' && !isLicenceExpired(p)).length,
  };

  const pendingApps = sortByNewest(applications.filter(a => a.status === 'pending'), app => app.submittedAt);
  const pendingProviders = sortByNewest(providers.filter(p => p.status === 'pending'), provider => provider.joinedAt);

  const handleSearch = () => {
    if (!searchTerm.trim()) return;
    navigate(`/admin/applications?search=${encodeURIComponent(searchTerm)}`);
  };

  return (
    <AnimateIn animationClass="fade-in">
      <div className={`page-enter ${styles.page}`}>
      
      {/* 1. HERO & SEARCH */}
      <section className={styles.hero}>
        <h1 className={styles.heroHeading}>
          Admin <span className={styles.heroHighlight}>Command Center.</span>
        </h1>
        <p className={styles.heroSub}>
          Search for applications, review incoming provider requests, and manage system-wide approvals instantly.
        </p>

        <div className={styles.searchBox}>
          <div className={styles.searchInner}>
            <Search size={18} className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Search by Application ID or Customer Name..."
              className={styles.searchInput}
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
            />
          </div>
          <button className={`btn btn-primary ${styles.searchBtn}`} onClick={handleSearch}>
            Search
          </button>
        </div>
      </section>

      <section className={styles.statsSection} style={{ marginTop: 0 }}>
        <div className={styles.statsGrid}>
          <Link to="/admin/applications" className={styles.statBlock}>
            <div className={styles.statValue}>{stats.totalApps}</div>
            <div className={styles.statLabel}>Total Apps</div>
          </Link>
          <Link to="/admin/applications?status=approved_all" className={styles.statBlock}>
            <div className={styles.statValue}>{stats.approved}</div>
            <div className={styles.statLabel}>Approved</div>
          </Link>
          <Link to="/admin/providers" className={styles.statBlock}>
            <div className={styles.statValue}>{stats.providers}</div>
            <div className={styles.statLabel}>Total Providers</div>
          </Link>
          <Link to="/admin/providers?status=active" className={styles.statBlock}>
            <div className={styles.statValue}>{stats.activeProviders}</div>
            <div className={styles.statLabel}>Active Providers</div>
          </Link>
        </div>
      </section>

      {/* 2. CTA / ACTION CARDS */}
      <section className={styles.actionSection}>
        <div className={styles.actionGrid}>
          
          {/* Applications Awaiting Review (Light Card) */}
          <div className={styles.ctaCard}>
            <div className={styles.ctaIcon} style={{ background: 'var(--primary-bg)' }}>
              <Clock size={28} style={{ color: 'var(--primary)' }} />
            </div>
            <h3>Applications</h3>
            <p>You have new applications that need to be assigned to a service provider.</p>
            <ul className={styles.ctaList}>
              {pendingApps.slice(0, 3).map(app => (
                <li key={app.id}>
                  <span>{app.customerName}</span>
                  <span className={`${styles.itemBadge} ${styles.badgeLight}`}>ID: {app.id.slice(0,6)}</span>
                </li>
              ))}
              {pendingApps.length === 0 && <li><span style={{ color: 'var(--text-muted)' }}>All caught up!</span></li>}
            </ul>
            <Link to="/admin/applications?status=pending" className={`btn btn-primary ${styles.ctaBtn}`}>
              Review Applications <ArrowRight size={16} />
            </Link>
          </div>

          {/* Providers Awaiting Approval (Dark Card) */}
          <div className={`${styles.ctaCard} ${styles.ctaCardDark}`}>
            <div className={styles.ctaIcon} style={{ background: 'rgba(255,255,255,0.1)' }}>
              <Shield size={28} style={{ color: 'white' }} />
            </div>
            <h3>Service Providers</h3>
            <p>New providers have requested to join the network and are awaiting your verification.</p>
            <ul className={styles.ctaList}>
              {pendingProviders.slice(0, 3).map(p => (
                <li key={p.id}>
                  <span>{p.officeName}</span>
                  <span className={`${styles.itemBadge} ${styles.badgeDark}`}>Pending</span>
                </li>
              ))}
              {pendingProviders.length === 0 && <li><span style={{ color: 'rgba(255,255,255,0.5)' }}>All caught up!</span></li>}
            </ul>
            <Link to="/admin/providers?status=pending" className={styles.ctaBtnWhite}>
              Verify Providers <ArrowRight size={16} />
            </Link>
          </div>

        </div>
      </section>
      </div>
    </AnimateIn>
  );
}
