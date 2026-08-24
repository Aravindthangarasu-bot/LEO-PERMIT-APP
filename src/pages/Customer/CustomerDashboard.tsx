import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, ArrowRight, FileCheck2, Clock, Plus, Bell, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useAppStore } from '../../context/AppStoreContext';
import { STATUS_CONFIG, LIFECYCLE_STAGES, COMMON_STATUS_FILTERS } from './statusConfig';
import styles from '../../components/DashboardShared.module.css';

export default function CustomerDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { applications, notifications, markNotificationRead } = useAppStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [filter, setFilter] = useState('all');

  const myApps = applications.filter(a => a.customerId === user?.id);

  const searchSuggestions = myApps.filter(a => {
    if (!searchTerm.trim()) return false;
    const s = searchTerm.toLowerCase();
    return a.id.toLowerCase().includes(s) || a.type.replace(/_/g, ' ').includes(s);
  }).slice(0, 5);

  const stats = {
    total: myApps.length,
    approved: myApps.filter(a => ['approved', 'panchayat_approved'].includes(a.status)).length,
    inProgress: myApps.filter(a => !['pending', 'approved', 'panchayat_approved', 'terminated', 'rejected', 'panchayat_rejected'].includes(a.status)).length,
    rejected: myApps.filter(a => ['rejected', 'panchayat_rejected'].includes(a.status)).length,
  };

  const activeApps = myApps.filter(a => ['pending', 'processing', 'document_verification'].includes(a.status));
  const completedApps = myApps.filter(a => a.status === 'approved');

  const handleSearch = () => {
    if (!searchTerm.trim()) return;
    navigate(`/customer/applications?search=${encodeURIComponent(searchTerm)}`);
  };

  return (
    <div className={`page-enter ${styles.page}`}>
      
      {/* 1. HERO & SEARCH */}
      <section className={styles.hero}>
        
        <h1 className={styles.heroHeading}>
          Welcome back, <span className={styles.heroHighlight}>{user?.name?.split(' ')[0]}</span>.
        </h1>
        <p className={styles.heroSub}>
          Track your permit applications, apply for new services, and download your approved certificates.
        </p>

        <div className={styles.searchBox}>
          <div className={styles.searchInner}>
            <Search size={18} className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Search your applications by ID or service..."
              className={styles.searchInput}
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setTimeout(() => setSearchFocused(false), 200)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
            />
            {searchFocused && searchSuggestions.length > 0 && (
              <div className={styles.searchSuggestions}>
                {searchSuggestions.map(app => (
                  <button 
                    key={app.id} 
                    className={styles.searchSuggestion} 
                    onMouseDown={() => navigate(`/customer/application/${app.id}`)}
                  >
                    <FileCheck2 size={15} />
                    <span className={styles.suggestionText}>
                      <strong>{app.type.replace(/_/g, ' ')}</strong>
                      <small>ID: {app.id}</small>
                    </span>
                    <ArrowRight size={14} />
                  </button>
                ))}
              </div>
            )}
          </div>
          <button className={`btn btn-primary ${styles.searchBtn}`} onClick={handleSearch}>
            Search
          </button>
        </div>
        <div className={styles.filterContainer}>
          <button className={`${styles.filterBtn} ${filter === 'all' ? styles.filterActive : ''}`} onClick={() => setFilter('all')}>All</button>
          {COMMON_STATUS_FILTERS.map(f => (
            <button key={f} className={`${styles.filterBtn} ${filter === f ? styles.filterActive : ''}`} onClick={() => setFilter(f)}>
              {STATUS_CONFIG[f as keyof typeof STATUS_CONFIG].label}
            </button>
          ))}
        </div>
      </section>

      <section className={styles.statsSection} style={{ marginTop: 0 }}>
        <div className={styles.statsGrid}>
          <Link to="/customer/applications" className={styles.statBlock}>
            <div className={styles.statValue}>{stats.total}</div>
            <div className={styles.statLabel}>Total Apps</div>
          </Link>
          <Link to="/customer/applications?status=in_progress" className={styles.statBlock}>
            <div className={styles.statValue}>{stats.inProgress}</div>
            <div className={styles.statLabel}>In Progress</div>
          </Link>
          <Link to="/customer/applications?status=approved_all" className={styles.statBlock}>
            <div className={styles.statValue}>{stats.approved}</div>
            <div className={styles.statLabel}>Approved</div>
          </Link>
          <Link to="/customer/applications?status=rejected_all" className={styles.statBlock}>
            <div className={styles.statValue}>{stats.rejected}</div>
            <div className={styles.statLabel}>Rejected</div>
          </Link>
        </div>
      </section>

      {/* 2. CTA / ACTION CARDS */}
      <section className={styles.actionSection}>
        <div className={styles.actionGrid}>
          
          {/* Apply New (Light Card) */}
          <div className={styles.ctaCard}>
            <div className={styles.ctaIcon} style={{ background: '#fff7ed' }}>
              <Plus size={28} style={{ color: 'var(--primary)' }} />
            </div>
            <h3>New Application</h3>
            <p>Start a new building permit, renovation permit, or request a completion certificate.</p>
            <ul className={styles.ctaList}>
              <li><span>Building Permit</span> <ArrowRight size={14} style={{ color: 'var(--text-muted)' }}/></li>
              <li><span>Renovation Permit</span> <ArrowRight size={14} style={{ color: 'var(--text-muted)' }}/></li>
              <li><span>Occupancy Certificate</span> <ArrowRight size={14} style={{ color: 'var(--text-muted)' }}/></li>
            </ul>
            <Link to="/customer/new" className={`btn btn-primary ${styles.ctaBtn}`}>
              Start Application <ArrowRight size={16} />
            </Link>
          </div>

          {/* Active Applications (Dark Card) */}
          <div className={`${styles.ctaCard} ${styles.ctaCardDark}`}>
            <div className={styles.ctaIcon} style={{ background: 'rgba(255,255,255,0.1)' }}>
              <Clock size={28} style={{ color: 'white' }} />
            </div>
            <h3>Active Applications</h3>
            <p>Track the status of your currently pending or processing applications.</p>
            <ul className={styles.ctaList}>
              {activeApps.slice(0, 3).map(app => (
                <li key={app.id}>
                  <span>{app.type?.replace(/_/g, ' ')}</span>
                  <span className={`${styles.itemBadge} ${styles.badgeDark}`}>{app.status.replace(/_/g, ' ')}</span>
                </li>
              ))}
              {activeApps.length === 0 && <li><span style={{ color: 'rgba(255,255,255,0.5)' }}>No active applications</span></li>}
            </ul>
            <Link to="/customer/applications" className={styles.ctaBtnWhite}>
              View My Applications <ArrowRight size={16} />
            </Link>
          </div>

        </div>
      </section>

    </div>
  );
}
