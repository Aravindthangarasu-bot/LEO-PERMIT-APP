import { useMemo, useState } from 'react';
import { Activity, AlertTriangle, BarChart3, Bell, CheckCircle2, Clock, FileText, MapPin, PieChart, ShieldCheck, TrendingUp, Users } from 'lucide-react';
import { useAppStore, isLicenceExpired } from '../../context/AppStoreContext';
import { PERMIT_TYPES } from '../../data/mockData';
import { STATUS_CONFIG } from '../Customer/statusConfig';
import { sortByNewest } from '../../utils/sorting';
import styles from './Admin.module.css';

function pct(value: number, total: number) {
  if (!total) return '0%';
  return `${Math.round((value / total) * 100)}%`;
}

function avg(value: number, total: number) {
  if (!total) return '0.0';
  return (value / total).toFixed(1);
}

function labelForPermit(type: string) {
  return PERMIT_TYPES.find(item => item.value === type)?.label ?? type.replace(/_/g, ' ');
}

function formatDate(value?: string) {
  if (!value) return '-';
  return new Date(value).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function countBy<T>(items: T[], getKey: (item: T) => string | undefined) {
  const counts = new Map<string, number>();
  for (const item of items) {
    const key = getKey(item)?.trim() || 'Unknown';
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return [...counts.entries()].map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value || a.label.localeCompare(b.label));
}

function MetricCard({ title, value, subtitle, icon, tone = '#f97316' }: { title: string; value: string | number; subtitle: string; icon: React.ReactNode; tone?: string }) {
  return (
    <div className={`card ${styles.statCard}`} style={{ textAlign: 'left' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start' }}>
        <div>
          <div className={styles.statLabel}>{title}</div>
          <div className={styles.statValue}>{value}</div>
          <div style={{ marginTop: 6, color: 'var(--text-muted)', fontSize: 12 }}>{subtitle}</div>
        </div>
        <div className={styles.statIcon} style={{ margin: 0, background: `${tone}18`, color: tone }}>{icon}</div>
      </div>
    </div>
  );
}

function BarList({ rows, maxRows = 8, empty = 'No data yet' }: { rows: Array<{ label: string; value: number; sublabel?: string }>; maxRows?: number; empty?: string }) {
  const visible = rows.slice(0, maxRows);
  const max = Math.max(...visible.map(row => row.value), 1);
  if (visible.length === 0) return <div className={styles.emptyState}><p>{empty}</p></div>;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {visible.map(row => (
        <div key={`${row.label}_${row.sublabel ?? ''}`}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, fontSize: 13, marginBottom: 5 }}>
            <span style={{ fontWeight: 700, color: 'var(--text)' }}>{row.label}</span>
            <span style={{ color: 'var(--text-muted)' }}>{row.value}</span>
          </div>
          <div style={{ height: 8, borderRadius: 999, background: 'var(--surface)', overflow: 'hidden' }}>
            <div style={{ width: `${Math.max(6, (row.value / max) * 100)}%`, height: '100%', background: 'var(--primary)', borderRadius: 999 }} />
          </div>
          {row.sublabel && <div style={{ marginTop: 4, fontSize: 11, color: 'var(--text-muted)' }}>{row.sublabel}</div>}
        </div>
      ))}
    </div>
  );
}

const REPORT_TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'applications', label: 'Applications' },
  { id: 'customers', label: 'Customers' },
  { id: 'providers', label: 'Providers' },
  { id: 'geography', label: 'Geography' },
  { id: 'operations', label: 'Operations' },
  { id: 'activity', label: 'Activity' },
] as const;

type ReportTab = typeof REPORT_TABS[number]['id'];

export default function ReportsDashboard() {
  const { applications, providers, staff, notifications } = useAppStore();
  const [activeTab, setActiveTab] = useState<ReportTab>('overview');

  const report = useMemo(() => {
    const totalApps = applications.length;
    const uniqueCustomers = new Set(applications.map(app => app.customerPhone || app.customerId)).size;
    const assignedApps = applications.filter(app => Boolean(app.assignedProviderId));
    const unassignedApps = applications.filter(app => !app.assignedProviderId);
    const completedApps = applications.filter(app => ['approved', 'panchayat_approved'].includes(app.status));
    const rejectedApps = applications.filter(app => ['rejected', 'panchayat_rejected'].includes(app.status));
    const inProgressApps = applications.filter(app => !['pending', 'approved', 'panchayat_approved', 'terminated', 'rejected', 'panchayat_rejected'].includes(app.status));
    const docsUploaded = applications.reduce((sum, app) => sum + (app.documents?.length ?? 0), 0);
    const comments = applications.reduce((sum, app) => sum + (app.activityLog ?? []).filter(entry => entry.type === 'comment').length, 0);
    const documentEvents = applications.reduce((sum, app) => sum + (app.activityLog ?? []).filter(entry => entry.type === 'document_upload').length, 0);

    const activeProviders = providers.filter(provider => provider.status === 'active' && !isLicenceExpired(provider));
    const pendingProviders = providers.filter(provider => provider.status === 'pending');
    const suspendedProviders = providers.filter(provider => provider.status === 'suspended');
    const expiredProviders = providers.filter(provider => isLicenceExpired(provider));
    const providerWorkload = providers.map(provider => {
      const assigned = applications.filter(app => app.assignedProviderId === provider.id);
      return {
        label: provider.officeName,
        value: assigned.length,
        sublabel: `${provider.status}${isLicenceExpired(provider) ? ' · licence expired' : ''} · ${provider.pincode ?? 'no pincode'}`,
      };
    }).sort((a, b) => b.value - a.value || a.label.localeCompare(b.label));

    const leastLoadedProviders = providers
      .filter(provider => provider.status === 'active' && !isLicenceExpired(provider))
      .map(provider => ({
        label: provider.officeName,
        value: applications.filter(app => app.assignedProviderId === provider.id).length,
        sublabel: `${provider.city || provider.area || 'Unknown area'} · ${provider.pincode ?? 'no pincode'}`,
      }))
      .sort((a, b) => a.value - b.value || a.label.localeCompare(b.label));

    const customerRows = countBy(applications, app => app.customerPhone).map(row => {
      const app = applications.find(item => item.customerPhone === row.label);
      return { ...row, label: app?.customerName ?? row.label, sublabel: row.label };
    });

    return {
      totalApps,
      uniqueCustomers,
      assignedApps,
      unassignedApps,
      completedApps,
      rejectedApps,
      inProgressApps,
      docsUploaded,
      comments,
      documentEvents,
      activeProviders,
      pendingProviders,
      suspendedProviders,
      expiredProviders,
      providerWorkload,
      leastLoadedProviders,
      customerRows,
      statusRows: countBy(applications, app => STATUS_CONFIG[app.status]?.label ?? app.status),
      permitRows: countBy(applications, app => labelForPermit(app.type)),
      cityRows: countBy(applications, app => app.city || app.address?.split(',').at(-1)),
      talukRows: countBy(applications, app => app.taluk),
      pincodeRows: countBy(providers, provider => provider.pincode).map(row => ({ ...row, sublabel: 'service providers' })),
      notificationRows: countBy(notifications, notification => notification.type.replace(/_/g, ' ')),
      recentApps: sortByNewest(applications, app => app.submittedAt).slice(0, 10),
      recentProviders: sortByNewest(providers, provider => provider.joinedAt).slice(0, 10),
      unreadNotifications: notifications.filter(notification => !notification.read),
      staffCount: staff.length,
      activeStaff: staff.filter(member => member.status === 'active'),
    };
  }, [applications, providers, staff, notifications]);

  return (
    <div className={`page-enter ${styles.page}`}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Reports & Analytics</h1>
          <p className={styles.pageSub}>Live operational, customer, provider, and super-admin metrics from collected QA data.</p>
        </div>
      </div>

      <div className={styles.filterBtns} style={{ marginBottom: 24 }}>
        {REPORT_TABS.map(tab => (
          <button key={tab.id} className={`${styles.filterBtn} ${activeTab === tab.id ? styles.filterActive : ''}`} onClick={() => setActiveTab(tab.id)}>
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <div className={styles.statsGrid}>
          <MetricCard title="Total Applications" value={report.totalApps} subtitle={`${report.unassignedApps.length} unassigned · ${report.inProgressApps.length} in progress`} icon={<FileText size={22} />} />
          <MetricCard title="Customers" value={report.uniqueCustomers} subtitle={`${avg(report.totalApps, report.uniqueCustomers)} applications per customer`} icon={<Users size={22} />} tone="#2563eb" />
          <MetricCard title="Service Providers" value={providers.length} subtitle={`${report.activeProviders.length} active · ${report.pendingProviders.length} pending`} icon={<ShieldCheck size={22} />} tone="#16a34a" />
          <MetricCard title="Completion Rate" value={pct(report.completedApps.length, report.totalApps)} subtitle={`${report.completedApps.length} completed · ${report.rejectedApps.length} rejected`} icon={<CheckCircle2 size={22} />} tone="#0f766e" />
          <MetricCard title="Assignment Coverage" value={pct(report.assignedApps.length, report.totalApps)} subtitle={`${report.assignedApps.length} assigned applications`} icon={<TrendingUp size={22} />} tone="#7c3aed" />
          <MetricCard title="Admin Queue" value={report.unassignedApps.length + report.pendingProviders.length} subtitle={`${report.unassignedApps.length} apps · ${report.pendingProviders.length} providers`} icon={<AlertTriangle size={22} />} tone="#dc2626" />
          <MetricCard title="Documents" value={report.docsUploaded} subtitle={`${report.documentEvents} upload activities recorded`} icon={<FileText size={22} />} tone="#ea580c" />
          <MetricCard title="Notifications" value={notifications.length} subtitle={`${report.unreadNotifications.length} unread requests/updates`} icon={<Bell size={22} />} tone="#0891b2" />
        </div>
      )}

      {activeTab === 'applications' && (
        <div className={styles.twoCol}>
          <section className={`card ${styles.card}`}><div className={styles.cardHeader}><h2><PieChart size={16} /> Application Status</h2></div><BarList rows={report.statusRows} /></section>
          <section className={`card ${styles.card}`}><div className={styles.cardHeader}><h2><BarChart3 size={16} /> Permit Types</h2></div><BarList rows={report.permitRows} /></section>
        </div>
      )}

      {activeTab === 'customers' && (
        <div className={styles.twoCol}>
          <section className={`card ${styles.card}`}><div className={styles.cardHeader}><h2><Users size={16} /> Customer Metrics</h2></div><BarList rows={report.customerRows} empty="No customer applications yet" /></section>
          <section className={`card ${styles.card}`}><div className={styles.cardHeader}><h2><FileText size={16} /> Customer Documents</h2></div><MetricCard title="Documents" value={report.docsUploaded} subtitle={`${report.documentEvents} upload activities recorded`} icon={<FileText size={20} />} /></section>
        </div>
      )}

      {activeTab === 'providers' && (
        <div className={styles.twoCol}>
          <section className={`card ${styles.card}`}><div className={styles.cardHeader}><h2><ShieldCheck size={16} /> Provider Workload</h2></div><BarList rows={report.providerWorkload} empty="No provider assignments yet" /></section>
          <section className={`card ${styles.card}`}><div className={styles.cardHeader}><h2><Activity size={16} /> Fairness Queue</h2></div><BarList rows={report.leastLoadedProviders} empty="No active providers yet" /></section>
          <section className={`card ${styles.card}`}><div className={styles.cardHeader}><h2><MapPin size={16} /> Provider Coverage by Pincode</h2></div><BarList rows={report.pincodeRows} empty="No provider pincodes yet" /></section>
        </div>
      )}

      {activeTab === 'geography' && (
        <div className={styles.twoCol}>
          <section className={`card ${styles.card}`}><div className={styles.cardHeader}><h2><MapPin size={16} /> Application Geography</h2></div><BarList rows={report.cityRows} empty="No city data yet" /></section>
          <section className={`card ${styles.card}`}><div className={styles.cardHeader}><h2><MapPin size={16} /> Taluk Demand</h2></div><BarList rows={report.talukRows} empty="No taluk data yet" /></section>
        </div>
      )}

      {activeTab === 'operations' && (
        <div className={styles.twoCol}>
          <section className={`card ${styles.card}`}><div className={styles.cardHeader}><h2><Bell size={16} /> Notification Mix</h2></div><BarList rows={report.notificationRows} empty="No notifications yet" /></section>
          <section className={`card ${styles.card}`}><div className={styles.cardHeader}><h2><Users size={16} /> Staff Metrics</h2></div><div className={styles.statsGrid} style={{ marginBottom: 0 }}><MetricCard title="Total Staff" value={report.staffCount} subtitle={`${report.activeStaff.length} active`} icon={<Users size={20} />} tone="#4f46e5" /><MetricCard title="Comments" value={report.comments} subtitle="Application comments recorded" icon={<Activity size={20} />} tone="#9333ea" /></div></section>
        </div>
      )}

      {activeTab === 'activity' && (
        <div className={styles.twoCol}>
          <section className={`card ${styles.card}`}><div className={styles.cardHeader}><h2><Clock size={16} /> Recent Applications</h2></div><div className={styles.detailRows}>{report.recentApps.map(app => <div key={app.id} className={styles.detailRow}><span>{formatDate(app.submittedAt)}</span><strong>{app.customerName} · {labelForPermit(app.type)} · {STATUS_CONFIG[app.status]?.label ?? app.status}</strong></div>)}{report.recentApps.length === 0 && <div className={styles.emptyState}><p>No applications yet</p></div>}</div></section>
          <section className={`card ${styles.card}`}><div className={styles.cardHeader}><h2><Clock size={16} /> Recent Provider Onboarding</h2></div><div className={styles.detailRows}>{report.recentProviders.map(provider => <div key={provider.id} className={styles.detailRow}><span>{formatDate(provider.joinedAt)}</span><strong>{provider.officeName} · {provider.status} · {provider.pincode ?? 'no pincode'}</strong></div>)}{report.recentProviders.length === 0 && <div className={styles.emptyState}><p>No providers yet</p></div>}</div></section>
        </div>
      )}
    </div>
  );
}
