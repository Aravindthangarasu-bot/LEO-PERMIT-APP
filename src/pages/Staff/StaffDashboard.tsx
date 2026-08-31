import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, ArrowRight, Briefcase, Clock, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useAppStore } from '../../context/AppStoreContext';
import AnimateIn from '../../components/AnimateIn';
import styles from '../../components/DashboardShared.module.css';

export default function StaffDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { getAppsForUser, getMyStaffProfile } = useAppStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);

  const me     = user ? getMyStaffProfile(user) : null;
  const myApps = user ? getAppsForUser(user) : [];

  const searchSuggestions = myApps.filter(a => {
    if (!searchTerm.trim()) return false;
    const s = searchTerm.toLowerCase();
    return a.id.toLowerCase().includes(s) || a.type.replace(/_/g, ' ').includes(s);
  }).slice(0, 5);

  const stats = {
    total: myApps.length,
    pending: myApps.filter(a => !['pending', 'approved', 'panchayat_approved', 'terminated', 'rejected', 'panchayat_rejected'].includes(a.status)).length,
    inReview: myApps.filter(a => ['document_verification', 'panchayat_review', 'client_review'].includes(a.status)).length,
    completed: myApps.filter(a => ['approved', 'panchayat_approved'].includes(a.status)).length,
  };

  const processingApps = myApps.filter(a => ['under_review', 'plan_preparation'].includes(a.status));
  const reviewApps = myApps.filter(a => a.status === 'documents_required');

  const handleSearch = () => {
    if (!searchTerm.trim()) return;
    navigate(`/staff/applications?search=${encodeURIComponent(searchTerm)}`);
  };

  if (me?.status === 'inactive') {
    return (
      <div style={{ textAlign: 'center', padding: 80 }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🔒</div>
        <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Account Inactive</h2>
        <p style={{ color: 'var(--text-muted)' }}>Your staff account has been deactivated. Please contact your manager.</p>
      </div>
    );
  }

  return (
    <AnimateIn animationClass="fade-in">
      <div className={`page-enter ${styles.page}`}>

      {/* 1. HERO & SEARCH */}
      <section className={styles.hero}>
        <h1 className={styles.heroHeading}>
          Staff <span className={styles.heroHighlight}>Workspace.</span>
        </h1>
        <p className={styles.heroSub}>
          Welcome back, {user?.name}. Manage your assigned applications and track progress.
        </p>

        <div className={styles.searchBox}>
          <div className={styles.searchInner}>
            <Search size={18} className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Search assigned applications by ID or service..."
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
                    onMouseDown={() => navigate(`/staff/applications?application=${app.id}`)}
                  >
                    <Briefcase size={15} />
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
      </section>

      <section className={styles.statsSection} style={{ marginTop: 0 }}>
        <div className={styles.statsGrid}>
          <Link to="/staff/applications" className={styles.statBlock}>
            <div className={styles.statValue}>{stats.total}</div>
            <div className={styles.statLabel}>Assigned to Me</div>
          </Link>
          <Link to="/staff/applications?status=in_progress" className={styles.statBlock}>
            <div className={styles.statValue}>{stats.pending}</div>
            <div className={styles.statLabel}>Active Tasks</div>
          </Link>
          <Link to="/staff/applications?status=document_verification" className={styles.statBlock}>
            <div className={styles.statValue}>{stats.inReview}</div>
            <div className={styles.statLabel}>In Review</div>
          </Link>
          <Link to="/staff/applications?status=approved_all" className={styles.statBlock}>
            <div className={styles.statValue}>{stats.completed}</div>
            <div className={styles.statLabel}>Completed</div>
          </Link>
        </div>
      </section>

      {/* 2. CTA / ACTION CARDS */}
      <section className={styles.actionSection}>
        <div className={styles.actionGrid}>

          {/* Processing (Light Card) */}
          <div className={styles.ctaCard}>
            <div className={styles.ctaIcon} style={{ background: 'var(--primary-bg)' }}>
              <Clock size={28} style={{ color: 'var(--primary)' }} />
            </div>
            <h3>In Progress</h3>
            <p>Applications you are actively working on.</p>
            <ul className={styles.ctaList}>
              {processingApps.slice(0, 3).map(app => (
                <li key={app.id}>
                  <span>{app.customerName}</span>
                  <span className={`${styles.itemBadge} ${styles.badgeLight}`}>ID: {app.id.slice(0, 6)}</span>
                </li>
              ))}
              {processingApps.length === 0 && <li><span style={{ color: 'var(--text-muted)' }}>No pending tasks</span></li>}
            </ul>
            <Link to="/staff/applications?status=in_progress" className={`btn btn-primary ${styles.ctaBtn}`}>
              Work on Applications <ArrowRight size={16} />
            </Link>
          </div>

          {/* Under Review (Dark Card) */}
          <div className={`${styles.ctaCard} ${styles.ctaCardDark}`}>
            <div className={styles.ctaIcon} style={{ background: 'rgba(255,255,255,0.1)' }}>
              <CheckCircle2 size={28} style={{ color: 'white' }} />
            </div>
            <h3>Awaiting Action</h3>
            <p>Applications that need further documentation or review.</p>
            <ul className={styles.ctaList}>
              {reviewApps.slice(0, 3).map(app => (
                <li key={app.id}>
                  <span>{app.customerName}</span>
                  <span className={`${styles.itemBadge} ${styles.badgeDark}`}>In Review</span>
                </li>
              ))}
              {reviewApps.length === 0 && <li><span style={{ color: 'rgba(255,255,255,0.5)' }}>No applications in review</span></li>}
            </ul>
            <Link to="/staff/applications?status=documents_required" className={`btn ${styles.ctaBtnOutline}`}>
              View Status <ArrowRight size={16} />
            </Link>
          </div>

        </div>
      </section>

      </div>
    </AnimateIn>
  );
}
