import { useState } from 'react';
import { Search } from 'lucide-react';
import { useAppStore, isLicenceExpired } from '../../context/AppStoreContext';
import { STATUS_CONFIG } from '../Customer/statusConfig';
import styles from './Admin.module.css';

export default function AllApplications() {
  const { applications, updateApplication, providers } = useAppStore();
  const [apps, setApps] = useState(applications);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [selected, setSelected] = useState<string | null>(null);
  const [assignProvider, setAssignProvider] = useState('');

  const activeProviders = providers.filter(p => p.status === 'active' && !isLicenceExpired(p));

  const filtered = apps.filter(a => {
    const matchS = a.id.toLowerCase().includes(search.toLowerCase()) ||
      a.customerName.toLowerCase().includes(search.toLowerCase());
    const matchF = filter === 'all' || a.status === filter;
    return matchS && matchF;
  });

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
            type="text" placeholder="Search by ID or customer…"
            value={search} onChange={e => setSearch(e.target.value)}
            className={styles.searchInput}
          />
        </div>
        <div className={styles.filterBtns}>
          {['all', 'pending', 'under_review', 'documents_required', 'approved', 'rejected'].map(f => (
            <button
              key={f}
              className={`${styles.filterBtn} ${filter === f ? styles.filterActive : ''}`}
              onClick={() => setFilter(f)}
            >
              {f === 'all' ? 'All' : STATUS_CONFIG[f as keyof typeof STATUS_CONFIG]?.label ?? f}
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
                  <td style={{ fontSize: 12 }}>{new Date(app.submittedAt).toLocaleDateString('en-IN')}</td>
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
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
