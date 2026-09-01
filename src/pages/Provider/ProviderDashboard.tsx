import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, ArrowRight, Briefcase, Clock, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useAppStore } from '../../context/AppStoreContext';
import AnimateIn from '../../components/AnimateIn';
import styles from '../../components/DashboardShared.module.css';
import SubscriptionStatusWidget from './SubscriptionStatusWidget';

export default function ProviderDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { applications, getProviderSubscription } = useAppStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);

  const subscription = user ? getProviderSubscription(user.id) : null;

  const assignedApps = applications.filter(a => a.assignedProviderId === user?.id);

  const searchSuggestions = assignedApps.filter(a => {
    if (!searchTerm.trim()) return false;
    const s = searchTerm.toLowerCase();
    return a.id.toLowerCase().includes(s) || a.type.replace(/_/g, ' ').includes(s);
  }).slice(0, 5);

  const stats = {
    total: assignedApps.length,
    pending: assignedApps.filter(a => !['pending', 'approved', 'panchayat_approved', 'terminated', 'rejected', 'panchayat_rejected'].includes(a.status)).length,
    inReview: assignedApps.filter(a => ['document_verification', 'panchayat_review', 'client_review'].includes(a.status)).length,
    completed: assignedApps.filter(a => ['approved', 'panchayat_approved'].includes(a.status)).length,
  };

  const processingApps = assignedApps.filter(a => ['under_review', 'plan_preparation'].includes(a.status));
  const reviewApps = assignedApps.filter(a => a.status === 'documents_required');

  const handleSearch = () => {
    if (!searchTerm.trim()) return;
    navigate(`/provider/applications?search=${encodeURIComponent(searchTerm)}`);
  };

  return (
    <AnimateIn animationClass="fade-in">
      <div className={`page-enter ${styles.page}`}>

      {/* Subscription Status Widget */}
      <SubscriptionStatusWidget subscription={subscription} />

      {/* 1. HERO & SEARCH */}
      <section className={styles.hero}>
        <h1 className={styles.heroHeading}>
          Provider <span className={styles.heroHighlight}>Workspace.</span>
        </h1>
        <p className={styles.heroSub}>
          Manage your assigned applications, upload documents, and track approvals.
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
                    onMouseDown={() => navigate(`/provider/application/${app.id}`)}
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
          <Link to="/provider/applications" className={styles.statBlock}>
            <div className={styles.statValue}>{stats.total}</div>
            <div className={styles.statLabel}>Total Assigned</div>
          </Link>
          <Link to="/provider/applications?status=in_progress" className={styles.statBlock}>
            <div className={styles.statValue}>{stats.pending}</div>
            <div className={styles.statLabel}>In Progress</div>
          </Link>
          <Link to="/provider/applications?status=document_verification" className={styles.statBlock}>
            <div className={styles.statValue}>{stats.inReview}</div>
            <div className={styles.statLabel}>In Admin Review</div>
          </Link>
          <Link to="/provider/applications?status=approved_all" className={styles.statBlock}>
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
            <p>Applications currently assigned to you that require processing and document uploads.</p>
            <ul className={styles.ctaList}>
              {processingApps.slice(0, 3).map(app => (
                <li key={app.id}>
                  <span>{app.customerName}</span>
                  <span className={`${styles.itemBadge} ${styles.badgeLight}`}>ID: {app.id.slice(0, 6)}</span>
                </li>
              ))}
              {processingApps.length === 0 && <li><span style={{ color: 'var(--text-muted)' }}>No pending tasks</span></li>}
            </ul>
            <Link to="/provider/applications?status=under_review" className={`btn btn-primary ${styles.ctaBtn}`}>
              Work on Applications <ArrowRight size={16} />
            </Link>
          </div>

          {/* Under Review (Dark Card) */}
          <div className={`${styles.ctaCard} ${styles.ctaCardDark}`}>
            <div className={styles.ctaIcon} style={{ background: 'rgba(255,255,255,0.1)' }}>
              <CheckCircle2 size={28} style={{ color: 'white' }} />
            </div>
            <h3>Awaiting Admin</h3>
            <p>Applications you have processed that are currently awaiting final admin verification.</p>
            <ul className={styles.ctaList}>
              {reviewApps.slice(0, 3).map(app => (
                <li key={app.id}>
                  <span>{app.customerName}</span>
                  <span className={`${styles.itemBadge} ${styles.badgeDark}`}>In Review</span>
                </li>
              ))}
              {reviewApps.length === 0 && <li><span style={{ color: 'rgba(255,255,255,0.5)' }}>No applications in review</span></li>}
            </ul>
            <Link to="/provider/applications?status=documents_required" className={`btn ${styles.ctaBtnOutline}`}>
              View Status <ArrowRight size={16} />
            </Link>
          </div>

        </div>
      </section>

      </div>
    </AnimateIn>
  );
}
