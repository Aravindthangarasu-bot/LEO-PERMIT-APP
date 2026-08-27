import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, CheckCircle2, XCircle, Eye, FileText, Bell } from 'lucide-react';
import { getLicenceById, getExpiryNotification } from '../../data/licenceData';
import { useAppStore, isLicenceExpired } from '../../context/AppStoreContext';
import Pagination from '../../components/Pagination/Pagination';
import styles from './Admin.module.css';
import { sortByNewest } from '../../utils/sorting';

export default function ManageProviders() {
  const { providers, updateProviderStatus } = useAppStore();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialFilter = searchParams.get('status') || 'all';
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState(initialFilter);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const status = searchParams.get('status') || 'all';
    setFilter(status);
  }, [searchParams]);

  const handleFilterChange = (f: string) => {
    setFilter(f);
    setCurrentPage(1);
    if (f === 'all') {
      searchParams.delete('status');
    } else {
      searchParams.set('status', f);
    }
    setSearchParams(searchParams);
  };
  const [selected, setSelected] = useState<string | null>(null);
  const [actionMsg, setActionMsg] = useState('');

  const filtered = sortByNewest(providers.filter(p => {
    const matchS = (p.officeName ?? p.name).toLowerCase().includes(search.toLowerCase()) || p.phone.includes(search);
    const expired = isLicenceExpired(p);
    if (filter === 'expired') return expired && matchS;
    if (filter === 'all') return matchS;
    return p.status === filter && matchS;
  }), provider => provider.joinedAt);

  const itemsPerPage = 10;
  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginatedProviders = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const detail = providers.find(p => p.id === selected);

  const updateStatus = (id: string, status: 'active' | 'suspended') => {
    const prov = providers.find(p => p.id === id);
    if (status === 'active' && prov && isLicenceExpired(prov)) {
      setActionMsg('⛔ Cannot activate: licence has expired. Provider must renew first.');
      setTimeout(() => setActionMsg(''), 3000);
      return;
    }
    updateProviderStatus(id, status);
    setActionMsg(status === 'active' ? 'Provider activated successfully' : 'Provider suspended');
    setTimeout(() => setActionMsg(''), 2500);
  };

  return (
    <div className={`page-enter ${styles.page}`}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Service Providers</h1>
          <p className={styles.pageSub}>{providers.length} providers registered</p>
        </div>
      </div>

      <div className={styles.filterRow}>
        <div className={styles.searchBox}>
          <Search size={16} />
          <input
            type="text" placeholder="Search by name or phone…"
            value={search} 
            onChange={e => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            className={styles.searchInput}
          />
        </div>
        <div className={styles.filterBtns}>
          {['all', 'active', 'pending', 'suspended', 'expired'].map(f => (
            <button
              key={f}
              className={`${styles.filterBtn} ${filter === f ? styles.filterActive : ''}`}
              onClick={() => handleFilterChange(f)}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.appGrid}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className={`card ${styles.appListCard}`}>
            {paginatedProviders.map(p => (
              <button
                key={p.id}
                className={`${styles.providerRow} ${selected === p.id ? styles.providerRowActive : ''}`}
                onClick={() => { setSelected(p.id); setActionMsg(''); }}
              >
                <div className={styles.providerRowAvatar}>{p.officeName[0]}</div>
                <div className={styles.providerRowInfo}>
                  <div className={styles.providerName}>{p.officeName}</div>
                  <div className={styles.providerMeta}>👤 {p.ownerName} · {p.area}</div>
                  <div className={styles.providerMeta}>{p.phone}</div>
                  <div className={styles.providerMeta}>Onboarded {new Date(p.joinedAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
                </div>
                <div className={styles.providerRowRight}>
                  <span className={`badge ${isLicenceExpired(p) ? 'badge-error' : p.status === 'active' ? 'badge-success' : p.status === 'pending' ? 'badge-warning' : 'badge-error'}`}>
                    {isLicenceExpired(p) ? 'Licence Expired' : p.status}
                  </span>
                  <div className={styles.providerStats}>⭐ {p.rating || 'N/A'} · {p.totalApprovals} approvals</div>
                </div>
              </button>
            ))}
            {filtered.length === 0 && (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                No service providers found.
              </div>
            )}
          </div>
          
          {filtered.length > 0 && (
            <Pagination 
              currentPage={currentPage} 
              totalPages={totalPages} 
              totalItems={filtered.length} 
              itemsPerPage={itemsPerPage} 
              onPageChange={setCurrentPage} 
            />
          )}
        </div>

        {detail && (
          <div className={`card ${styles.detailCard}`}>
            {actionMsg && <div className={styles.actionSuccess}><CheckCircle2 size={16} /> {actionMsg}</div>}

            {/* Expiry notification banner */}
            {(() => {
              const notif = getExpiryNotification(detail.licenceExpiry);
              if (!notif) return null;
              return (
                <div className={`${styles.expiryAlert} ${notif.urgency === 'daily' || notif.urgency === 'critical' ? styles.expiryAlertRed : notif.urgency === 'warning' ? styles.expiryAlertOrange : styles.expiryAlertBlue}`}>
                  <Bell size={14} /> {notif.message}
                </div>
              );
            })()}

            <div className={styles.detailHeader}>
              <div className={styles.detailAvatar}>{detail.officeName[0]}</div>
              <div>
                <div className={styles.detailName}>{detail.officeName}</div>
                <div className={styles.detailMeta}>👤 {detail.ownerName} · {detail.area}</div>
                <div className={styles.detailMeta}>{detail.phone} · {detail.email}</div>
                <div className={styles.detailMeta}>Onboarded {new Date(detail.joinedAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
              </div>
              <span className={`badge ${detail.status === 'active' ? 'badge-success' : detail.status === 'pending' ? 'badge-warning' : 'badge-error'}`}>{detail.status}</span>
            </div>

            <div className={styles.detailSection}>
              <h4>KPBR Licence</h4>
              {(() => {
                const lic = getLicenceById(detail.licenceCategory ?? '');
                return (
                  <div className={styles.detailRows}>
                    <div className={styles.detailRow}><span>Category</span><span>{lic?.label ?? '-'}</span></div>
                    <div className={styles.detailRow}><span>Licence No.</span><span>{detail.licenceNumber}</span></div>
                    <div className={styles.detailRow}><span>Expiry</span><span>{new Date(detail.licenceExpiry).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</span></div>
                    <div className={styles.detailRow}><span>Max Area</span><span>{lic?.unlimited ? 'Unlimited' : `${lic?.maxArea} m²`}</span></div>
                    <div className={styles.detailRow}><span>Max Floors</span><span>{lic?.unlimited ? 'Unlimited' : lic?.maxFloors}</span></div>
                    <div className={styles.detailRow}><span>Max Height</span><span>{lic?.unlimited ? 'Unlimited' : `${lic?.maxHeightM} m`}</span></div>
                    <div className={styles.detailRow}><span>ML Verified</span>
                      <span className={`badge ${detail.licenceVerified ? 'badge-success' : 'badge-warning'}`}>{detail.licenceVerificationStatus}</span>
                    </div>
                  </div>
                );
              })()}
            </div>

            <div className={styles.detailSection}>
              <h4>Documents</h4>
              {detail.documents.map(doc => (
                <div key={doc.id} className={styles.docRow}>
                  <FileText size={14} />
                  <span className={styles.docName}>{doc.name}</span>
                  <span className={`badge ${doc.status === 'verified' ? 'badge-success' : doc.status === 'rejected' ? 'badge-error' : 'badge-warning'}`}>{doc.status}</span>
                  <button 
                    className={styles.viewDocBtn}
                    onClick={() => {
                      if (doc.url && doc.url !== '#') window.open(doc.url, '_blank');
                      else alert(`Document preview for ${doc.name} is not available in the demo environment.`);
                    }}
                    title="View Document"
                  >
                    <Eye size={13} />
                  </button>
                </div>
              ))}
            </div>

            {detail.aboutUs && (
              <div className={styles.detailSection}>
                <h4>About</h4>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6 }}>{detail.aboutUs}</p>
              </div>
            )}

            {detail.status !== 'active' && (
              <button className={styles.activateBtn} onClick={() => updateStatus(detail.id, 'active')}>
                <CheckCircle2 size={16} /> Activate Provider
              </button>
            )}
            {detail.status === 'active' && (
              <button className={styles.suspendBtn} onClick={() => updateStatus(detail.id, 'suspended')}>
                <XCircle size={16} /> Suspend Provider
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
