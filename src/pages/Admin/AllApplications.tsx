import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Calendar, ExternalLink, FileText, MapPin, Phone, UserRound } from 'lucide-react';
import { useAppStore, isLicenceExpired } from '../../context/AppStoreContext';
import { STATUS_CONFIG } from '../Customer/statusConfig';
import { PERMIT_TYPES } from '../../data/mockData';
import ActivityThread from '../../components/ActivityThread';
import { sortByNewest } from '../../utils/sorting';
import styles from './Admin.module.css';

export default function AllApplications() {
  const { applications, updateApplication, providers } = useAppStore();
  const [apps, setApps] = useState(applications);
  const [searchParams, setSearchParams] = useSearchParams();
  const initialFilter = searchParams.get('status') || 'all';
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState(initialFilter);

  useEffect(() => {
    const status = searchParams.get('status') || 'all';
    setFilter(status);
    const applicationId = searchParams.get('application');
    if (applicationId) {
      setSearch(applicationId);
      setSelected(applicationId);
    }
  }, [searchParams]);

  useEffect(() => {
    setApps(sortByNewest(applications, app => app.submittedAt));
  }, [applications]);

  const handleFilterChange = (f: string) => {
    setFilter(f);
    if (f === 'all') {
      searchParams.delete('status');
    } else {
      searchParams.set('status', f);
    }
    setSearchParams(searchParams);
  };
  const [selected, setSelected] = useState<string | null>(null);
  const [assignProvider, setAssignProvider] = useState('');
  const selectedApp = apps.find(app => app.id === selected) ?? null;

  const activeProviders = providers.filter(p => p.status === 'active' && !isLicenceExpired(p));

  const filtered = sortByNewest(apps.filter(a => {
    const normalizedSearch = search.trim().toLowerCase();
    const exactApplicationId = normalizedSearch.length > 0 && a.id.toLowerCase() === normalizedSearch;
    const matchS = a.id.toLowerCase().includes(normalizedSearch) ||
      a.customerName.toLowerCase().includes(normalizedSearch);
    
    let matchF = false;
    if (filter === 'all') matchF = true;
    else if (filter === 'approved_all') {
      matchF = ['approved', 'panchayat_approved'].includes(a.status);
    } else if (filter === 'rejected_all') {
      matchF = ['rejected', 'panchayat_rejected'].includes(a.status);
    } else {
      matchF = a.status === filter;
    }
    
    // An exact application number must always be retrievable, regardless of the active status filter.
    return matchS && (exactApplicationId || matchF);
  }), app => app.submittedAt);

  const handleAssign = () => {
    if (!assignProvider || !selected) return;
    const prov = activeProviders.find(p => p.id === assignProvider);
    setApps(prev => prev.map(a =>
      a.id === selected
        ? { ...a, assignedProviderId: prov?.id, assignedProviderName: prov?.officeName ?? prov?.name, status: 'under_review' as const, updatedAt: new Date().toISOString() }
        : a
    ));
    updateApplication(selected, { assignedProviderId: prov?.id, assignedProviderName: prov?.officeName ?? prov?.name, status: 'under_review' });
    setAssignProvider('');
  };

  return (
    <div className={`page-enter ${styles.page}`}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>All Applications</h1>
          <p className={styles.pageSub}>{apps.length} total applications in the system</p>
        </div>
      </div>

      <div className={styles.filterRow}>
        <div className={styles.searchBox}>
          <Search size={16} />
          <input
            type="text" placeholder="Enter application number or customer…"
            value={search} onChange={e => setSearch(e.target.value)}
            className={styles.searchInput}
          />
        </div>
        <div className={styles.filterBtns}>
          {['all', 'pending', 'under_review', 'documents_required', 'approved_all', 'rejected_all'].map(f => (
            <button
              key={f}
              className={`${styles.filterBtn} ${filter === f ? styles.filterActive : ''}`}
              onClick={() => handleFilterChange(f)}
            >
              {f === 'all' ? 'All' 
                : f === 'approved_all' ? 'Approved' 
                : f === 'rejected_all' ? 'Rejected' 
                : STATUS_CONFIG[f as keyof typeof STATUS_CONFIG]?.label ?? f}
            </button>
          ))}
        </div>
      </div>

      <div className={`card ${styles.card}`} style={{ padding: 0, overflow: 'hidden' }}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>App ID</th>
              <th>Customer</th>
              <th>Permit Type</th>
              <th>Submitted</th>
              <th>Assigned Provider</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(app => {
              const sc = STATUS_CONFIG[app.status];
              return (
                <tr
                  key={app.id}
                  className={selected === app.id ? styles.tableRowActive : ''}
                  onClick={() => { setSelected(app.id); setAssignProvider(''); }}
                  style={{ cursor: 'pointer' }}
                >
                  <td className={styles.appId}>{app.id}</td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{app.customerName}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{app.customerPhone}</div>
                  </td>
                  <td>{app.type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</td>
                  <td style={{ fontSize: 12 }}>{new Date(app.submittedAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
                  <td>
                    {app.assignedProviderName
                      ? <span style={{ fontWeight: 500 }}>{app.assignedProviderName}</span>
                      : <span className={`badge badge-warning`}>Unassigned</span>
                    }
                  </td>
                  <td>
                    <span className={styles.statusBadge} style={{ background: sc.bg, color: sc.color }}>
                      {sc.label}
                    </span>
                  </td>
                  <td onClick={e => e.stopPropagation()}>
                    <div className={styles.assignRow}>
                      <select
                        className={styles.assignSelect}
                        value={selected === app.id ? assignProvider : ''}
                        onChange={e => { setSelected(app.id); setAssignProvider(e.target.value); }}
                      >
                        <option value="">Assign…</option>
                        {activeProviders.map(p => <option key={p.id} value={p.id}>{p.officeName ?? p.name}</option>)}
                      </select>
                      {selected === app.id && assignProvider && (
                        <button className={styles.assignBtn} onClick={handleAssign}>Assign</button>
                      )}
                      <button className={styles.assignBtn} onClick={() => { setSelected(app.id); setAssignProvider(''); }}>Details</button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)' }}>
                  No application matches this application number or filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {selectedApp && (() => {
        const status = STATUS_CONFIG[selectedApp.status];
        const permitLabel = PERMIT_TYPES.find(type => type.value === selectedApp.type)?.label ?? selectedApp.type;
        return (
          <section className={`card ${styles.detailCard}`} style={{ marginTop: 24 }} aria-label={`Application details for ${selectedApp.id}`}>
            <div className={styles.detailHeader}>
              <div style={{ flex: 1 }}>
                <div className={styles.appId}>{selectedApp.id}</div>
                <h2 style={{ margin: '4px 0 0', fontSize: 20 }}>{permitLabel}</h2>
              </div>
              <span className={styles.statusBadge} style={{ background: status.bg, color: status.color }}>{status.label}</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 24 }}>
              <div className={styles.detailSection}>
                <h4><UserRound size={13} /> Customer</h4>
                <div className={styles.detailRows}>
                  <div className={styles.detailRow}><span>Name</span><strong>{selectedApp.customerName}</strong></div>
                  <div className={styles.detailRow}><span><Phone size={13} /> Phone</span><strong>{selectedApp.customerPhone}</strong></div>
                  <div className={styles.detailRow}><span><MapPin size={13} /> Address</span><strong>{selectedApp.address}</strong></div>
                  {selectedApp.landmark && <div className={styles.detailRow}><span>Landmark</span><strong>{selectedApp.landmark}</strong></div>}
                </div>
              </div>

              <div className={styles.detailSection}>
                <h4><Calendar size={13} /> Service & Assignment</h4>
                <div className={styles.detailRows}>
                  <div className={styles.detailRow}><span>Submitted</span><strong>{new Date(selectedApp.submittedAt).toLocaleString('en-IN')}</strong></div>
                  <div className={styles.detailRow}><span>Updated</span><strong>{new Date(selectedApp.updatedAt).toLocaleString('en-IN')}</strong></div>
                  <div className={styles.detailRow}><span>Provider</span><strong>{selectedApp.assignedProviderName ?? 'Unassigned'}</strong></div>
                  <div className={styles.detailRow}><span>Handler</span><strong>{selectedApp.servicedBy === 'staff' ? selectedApp.assignedStaffName ?? 'Staff assignment pending' : selectedApp.servicedBy === 'provider' ? 'Service provider' : 'Not selected'}</strong></div>
                </div>
              </div>
            </div>

            <div className={styles.detailSection}>
              <h4>Description</h4>
              <p style={{ margin: 0, color: 'var(--text)', lineHeight: 1.6 }}>{selectedApp.description || 'No description provided.'}</p>
            </div>

            <div className={styles.detailSection}>
              <h4><FileText size={13} /> Documents ({selectedApp.documents.length})</h4>
              {selectedApp.documents.length === 0 ? <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: 13 }}>No documents have been uploaded.</p> : (
                <div className={styles.detailRows}>
                  {selectedApp.documents.map(document => (
                    <div className={styles.detailRow} key={document.id}>
                      <span>{document.name}</span>
                      <strong>{document.status}</strong>
                      {document.url && <a href={document.url} target="_blank" rel="noreferrer" aria-label={`Open ${document.name}`} title="Open document" style={{ color: 'var(--primary)' }}><ExternalLink size={15} /></a>}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {(selectedApp.planRevisions?.length || selectedApp.siteVisitDates?.length || selectedApp.approvalNumber || selectedApp.notes || selectedApp.clientComments) && (
              <div className={styles.detailSection}>
                <h4>Workflow Details</h4>
                <div className={styles.detailRows}>
                  {selectedApp.siteVisitDates?.length && <div className={styles.detailRow}><span>Proposed visits</span><strong>{selectedApp.siteVisitDates.map(date => new Date(date).toLocaleDateString('en-IN')).join(', ')}</strong></div>}
                  {selectedApp.selectedSiteVisitDate && <div className={styles.detailRow}><span>Confirmed visit</span><strong>{new Date(selectedApp.selectedSiteVisitDate).toLocaleDateString('en-IN')}</strong></div>}
                  {selectedApp.planRevisions?.length && <div className={styles.detailRow}><span>Plan revisions</span><strong>{selectedApp.planRevisions.length}</strong></div>}
                  {selectedApp.approvalNumber && <div className={styles.detailRow}><span>Approval number</span><strong>{selectedApp.approvalNumber}</strong></div>}
                  {selectedApp.notes && <div className={styles.detailRow}><span>Latest note</span><strong>{selectedApp.notes}</strong></div>}
                  {selectedApp.clientComments && <div className={styles.detailRow}><span>Customer comment</span><strong>{selectedApp.clientComments}</strong></div>}
                </div>
              </div>
            )}

            <ActivityThread appId={selectedApp.id} activities={selectedApp.activityLog} />
          </section>
        );
      })()}
    </div>
  );
}
