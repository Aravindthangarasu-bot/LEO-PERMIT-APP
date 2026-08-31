import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, ArrowRight, FileCheck2, Plus, Bell } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useAppStore } from '../../context/AppStoreContext';
import { useLanguage } from '../../context/LanguageContext';
import AnimateIn from '../../components/AnimateIn';
import PaginationControls from '../../components/PaginationControls';
import { STATUS_CONFIG } from './statusConfig';
import sharedStyles from '../../components/DashboardShared.module.css';
import customerStyles from './Customer.module.css';

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

  const [page, setPage] = useState(1);
  const itemsPerPage = 5;

  const filteredApps = myApps.filter(a => {
    if (filter === 'all') return true;
    if (filter === 'approved_all') return ['approved', 'panchayat_approved'].includes(a.status);
    if (filter === 'in_progress') return !['pending', 'approved', 'panchayat_approved', 'terminated', 'rejected', 'panchayat_rejected'].includes(a.status);
    if (filter === 'rejected_all') return ['rejected', 'panchayat_rejected'].includes(a.status);
    return a.status === filter;
  });

  const paginatedApps = filteredApps.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  const handleSearch = () => {
    if (!searchTerm.trim()) return;
    navigate(`/customer/applications?search=${encodeURIComponent(searchTerm)}`);
  };

  return (
    <AnimateIn animationClass="fade-in">
      <div className={`page-enter ${sharedStyles.page}`}>
        
        {/* 1. HERO & SEARCH */}
        <section className={sharedStyles.hero}>
          
          <h1 className={sharedStyles.heroHeading}>
            {t('portal.dashboard.welcome')} <span className={sharedStyles.heroHighlight}>{user?.name?.split(' ')[0]}</span>.
          </h1>
          <p className={sharedStyles.heroSub}>
            {t('portal.dashboard.trackDesc')}
          </p>

          <div className={sharedStyles.searchBox}>
            <div className={sharedStyles.searchInner}>
              <Search size={18} className={sharedStyles.searchIcon} />
              <input
                type="text"
                placeholder={t('portal.dashboard.searchPlaceholder')}
                className={sharedStyles.searchInput}
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setTimeout(() => setSearchFocused(false), 200)}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
              />
              {searchFocused && searchSuggestions.length > 0 && (
                <div className={sharedStyles.searchSuggestions}>
                  {searchSuggestions.map(app => (
                    <button 
                      key={app.id} 
                      className={sharedStyles.searchSuggestion} 
                      onMouseDown={() => navigate(`/customer/application/${app.id}`)}
                    >
                      <FileCheck2 size={15} />
                      <span className={sharedStyles.suggestionText}>
                        <strong>{app.type.replace(/_/g, ' ')}</strong>
                        <small>ID: {app.id}</small>
                      </span>
                      <ArrowRight size={14} />
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button className={`btn btn-primary ${sharedStyles.searchBtn}`} onClick={handleSearch}>
              {t('portal.dashboard.searchBtn')}
            </button>
          </div>
        </section>

        <section className={sharedStyles.statsSection} style={{ marginTop: 0 }}>
          <div className={sharedStyles.statsGrid}>
            <button 
              className={sharedStyles.statBlock} 
              style={{ background: 'none', border: filter === 'all' ? '2px solid var(--primary)' : 'none', cursor: 'pointer', textAlign: 'center', width: '100%' }}
              onClick={() => { setFilter('all'); setPage(1); }}
            >
              <div className={sharedStyles.statValue}>{stats.total}</div>
              <div className={sharedStyles.statLabel}>{t('portal.dashboard.stats.total')}</div>
            </button>
            <button 
              className={sharedStyles.statBlock} 
              style={{ background: 'none', border: filter === 'approved_all' ? '2px solid var(--primary)' : 'none', cursor: 'pointer', textAlign: 'center', width: '100%' }}
              onClick={() => { setFilter('approved_all'); setPage(1); }}
            >
              <div className={sharedStyles.statValue}>{stats.approved}</div>
              <div className={sharedStyles.statLabel}>{t('portal.dashboard.stats.approved')}</div>
            </button>
            <button 
              className={sharedStyles.statBlock} 
              style={{ background: 'none', border: filter === 'in_progress' ? '2px solid var(--primary)' : 'none', cursor: 'pointer', textAlign: 'center', width: '100%' }}
              onClick={() => { setFilter('in_progress'); setPage(1); }}
            >
              <div className={sharedStyles.statValue}>{stats.inProgress}</div>
              <div className={sharedStyles.statLabel}>{t('portal.dashboard.stats.inProgress')}</div>
            </button>
            <button 
              className={sharedStyles.statBlock} 
              style={{ background: 'none', border: filter === 'rejected_all' ? '2px solid var(--primary)' : 'none', cursor: 'pointer', textAlign: 'center', width: '100%' }}
              onClick={() => { setFilter('rejected_all'); setPage(1); }}
            >
              <div className={sharedStyles.statValue}>{stats.rejected}</div>
              <div className={sharedStyles.statLabel}>{t('portal.dashboard.stats.rejected')}</div>
            </button>
          </div>
        </section>

        {/* 2. CTA / ACTION CARDS */}
        <section style={{ padding: '40px 20px', maxWidth: '1200px', margin: '0 auto' }}>
          <div className={customerStyles.detailLayout}>
            
            {/* Left Col: Active Applications */}
            <div className={`card ${customerStyles.recentCard}`}>
              <div className={customerStyles.cardHeader}>
                <h2>{t('portal.dashboard.activeApps')}</h2>
                <Link to="/customer/applications" className={customerStyles.viewAll}>
                  {t('portal.dashboard.viewAll')} <ArrowRight size={14} />
                </Link>
              </div>

              {filteredApps.length > 0 ? (
                <>
                  <div className={customerStyles.appList}>
                    {paginatedApps.map(app => (
                      <Link to={`/customer/application/${app.id}`} key={app.id} className={customerStyles.appItem}>
                        <div className={customerStyles.appLeft}>
                          <div className={customerStyles.appType}>{app.type.replace(/_/g, ' ')}</div>
                          <div className={customerStyles.appId}>ID: {app.id}</div>
                        </div>
                        <span className={`status-badge ${app.status}`} style={{ margin: 0 }}>
                          {STATUS_CONFIG[app.status as keyof typeof STATUS_CONFIG]?.label || app.status}
                        </span>
                      </Link>
                    ))}
                  </div>
                  {filteredApps.length > itemsPerPage && (
                    <div style={{ marginTop: 24, display: 'flex', justifyContent: 'center' }}>
                      <PaginationControls page={page} pageCount={Math.ceil(filteredApps.length / itemsPerPage)} total={filteredApps.length} onPageChange={setPage} />
                    </div>
                  )}
                </>
              ) : (
                <div className={customerStyles.emptyState}>
                  <FileCheck2 size={32} />
                  <p>{t('portal.dashboard.noActiveApps')}</p>
                </div>
              )}
            </div>

            {/* Right Col: Actions & Notifications */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              
              <Link to="/customer/new" className="btn btn-primary" style={{ padding: '20px', fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', borderRadius: '12px' }}>
                <Plus size={22} />
                {t('portal.dashboard.applyNew')}
              </Link>

              <div className={`card ${customerStyles.recentCard}`}>
                <div className={customerStyles.cardHeader}>
                  <h2><Bell size={16} style={{ display: 'inline', verticalAlign: 'text-bottom' }} /> {t('portal.dashboard.recentNotifications')}</h2>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {notifications.filter(n => n.userId === user?.id).length > 0 ? (
                    notifications.filter(n => n.userId === user?.id).slice(0,3).map(n => (
                      <div key={n.id} className={customerStyles.notifCard} onClick={() => {
                        markNotificationRead(n.id);
                        if (n.applicationId) {
                          navigate(`/customer/application/${n.applicationId}`);
                        }
                      }} style={{ padding: '12px', border: '1px solid var(--border)', borderRadius: '8px', background: n.read ? 'transparent' : 'var(--primary-bg)', cursor: 'pointer' }}>
                        <div className={customerStyles.notifBody}>
                          <div className={customerStyles.notifMessage}>{n.message}</div>
                          <div className={customerStyles.notifTime}>{new Date(n.timestamp).toLocaleDateString()}</div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p style={{ color: 'var(--text-muted)', fontSize: '14px', textAlign: 'center', padding: '20px 0' }}>{t('portal.dashboard.noNotifications')}</p>
                  )}
                </div>
                
              </div>

            </div>
          </div>
        </section>

      </div>
    </AnimateIn>
  );
}
