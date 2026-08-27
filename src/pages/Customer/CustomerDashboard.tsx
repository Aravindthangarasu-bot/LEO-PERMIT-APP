import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, ArrowRight, FileCheck2, Clock, Plus, Bell, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useAppStore } from '../../context/AppStoreContext';
import { useLanguage } from '../../context/LanguageContext';
import AnimateIn from '../../components/AnimateIn';
import { STATUS_CONFIG, LIFECYCLE_STAGES, COMMON_STATUS_FILTERS } from './statusConfig';
import styles from '../../components/DashboardShared.module.css';

export default function CustomerDashboard() {
  const { user } = useAuth();
  const { t } = useLanguage();
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

  const handleSearch = () => {
    if (!searchTerm.trim()) return;
    navigate(`/customer/applications?search=${encodeURIComponent(searchTerm)}`);
  };

  return (
    <AnimateIn animationClass="fade-in">
      <div className={`page-enter ${styles.page}`}>
        
        {/* 1. HERO & SEARCH */}
        <section className={styles.hero}>
          
          <h1 className={styles.heroHeading}>
            {t('portal.dashboard.welcome')} <span className={styles.heroHighlight}>{user?.name?.split(' ')[0]}</span>.
          </h1>
          <p className={styles.heroSub}>
            {t('portal.dashboard.trackDesc')}
          </p>

          <div className={styles.searchBox}>
            <div className={styles.searchInner}>
              <Search size={18} className={styles.searchIcon} />
              <input
                type="text"
                placeholder={t('portal.dashboard.searchPlaceholder')}
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
              {t('portal.dashboard.searchBtn')}
            </button>
          </div>
          <div className={styles.filterContainer}>
            <button className={`${styles.filterBtn} ${filter === 'all' ? styles.filterActive : ''}`} onClick={() => setFilter('all')}>{t('portal.dashboard.filterAll')}</button>
            {COMMON_STATUS_FILTERS.map(f => (
              <button key={f} className={`${styles.filterBtn} ${filter === f ? styles.filterActive : ''}`} onClick={() => setFilter(f)}>
                {STATUS_CONFIG[f as keyof typeof STATUS_CONFIG].label}
              </button>
            ))}
          </div>
        </section>

        <section className={styles.statsSection} style={{ marginTop: 0 }}>
          <div className={styles.statCard}>
            <div className={styles.statIcon}><FileCheck2 size={20} /></div>
            <div className={styles.statInfo}>
              <h3>{stats.total}</h3>
              <p>{t('portal.dashboard.stats.total')}</p>
            </div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statIcon} style={{ background: '#dcfce7', color: '#166534' }}><FileCheck2 size={20} /></div>
            <div className={styles.statInfo}>
              <h3>{stats.approved}</h3>
              <p>{t('portal.dashboard.stats.approved')}</p>
            </div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statIcon} style={{ background: '#fef3c7', color: '#b45309' }}><Clock size={20} /></div>
            <div className={styles.statInfo}>
              <h3>{stats.inProgress}</h3>
              <p>{t('portal.dashboard.stats.inProgress')}</p>
            </div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statIcon} style={{ background: '#fee2e2', color: '#991b1b' }}><X size={20} /></div>
            <div className={styles.statInfo}>
              <h3>{stats.rejected}</h3>
              <p>{t('portal.dashboard.stats.rejected')}</p>
            </div>
          </div>
        </section>

        {/* 2. CTA / ACTION CARDS */}
        <section className={styles.actionSection}>
        <div className={styles.gridContainer}>
          <div className={styles.mainCol}>
            <div className={styles.sectionHeader}>
              <h2>{t('portal.dashboard.activeApps')}</h2>
              <Link to="/customer/applications" className={styles.viewAllLink}>{t('portal.dashboard.viewAll')} <ArrowRight size={16} /></Link>
            </div>

            {activeApps.length > 0 ? (
              <div className={styles.appList}>
                {activeApps.map(app => (
                  <Link to={`/customer/application/${app.id}`} key={app.id} className={styles.appCard}>
                    <div className={styles.appHeader}>
                      <div>
                        <h3>{app.type.replace(/_/g, ' ')}</h3>
                        <span className={styles.appId}>ID: {app.id}</span>
                      </div>
                      <span className={`status-badge ${app.status}`}>
                        {STATUS_CONFIG[app.status as keyof typeof STATUS_CONFIG]?.label || app.status}
                      </span>
                    </div>
                    <div className={styles.appProgress}>
                      <div className={styles.progressBar}>
                        <div 
                          className={styles.progressFill}
                          style={{ width: `${STATUS_CONFIG[app.status as keyof typeof STATUS_CONFIG]?.progress || 0}%` }}
                        ></div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className={styles.emptyState}>
                <FileCheck2 size={40} className={styles.emptyIcon} />
                <p>{t('portal.dashboard.noActiveApps')}</p>
                <Link to="/customer/new" className="btn btn-primary" style={{ marginTop: '16px' }}>
                  <Plus size={18} /> {t('portal.dashboard.applyNew')}
                </Link>
              </div>
            )}
          </div>

          <div className={styles.sideCol}>
            <Link to="/customer/new" className={styles.actionCardPrimary}>
              <div className={styles.actionIcon}><Plus size={24} /></div>
              <h3>{t('portal.dashboard.applyNew')}</h3>
              <ArrowRight size={20} className={styles.actionArrow} />
            </Link>

            <div className={styles.notifCard}>
              <div className={styles.notifHeader}>
                <h3><Bell size={18} /> {t('portal.dashboard.recentNotifications')}</h3>
              </div>
              <div className={styles.notifList}>
                {notifications.filter(n => n.userId === user?.id).length > 0 ? (
                  notifications.filter(n => n.userId === user?.id).slice(0,3).map(n => (
                    <div key={n.id} className={`${styles.notifItem} ${!n.read ? styles.unread : ''}`} onClick={() => markNotificationRead(n.id)}>
                      <p>{n.message}</p>
                      <span>{new Date(n.createdAt).toLocaleDateString()}</span>
                    </div>
                  ))
                ) : (
                  <p className={styles.emptyText}>{t('portal.dashboard.noNotifications')}</p>
                )}
              </div>
              <Link to="/customer/notifications" className={styles.viewAllLink} style={{ display: 'block', textAlign: 'center', marginTop: '12px' }}>
                {t('portal.dashboard.viewAll')}
              </Link>
            </div>
          </div>
        </div>
        </section>

      </div>
    </AnimateIn>
  );
}
