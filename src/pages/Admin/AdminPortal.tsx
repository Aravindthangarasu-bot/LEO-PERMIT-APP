import { Routes, Route, Navigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, FileText, UserPlus, Settings, BarChart3,
} from 'lucide-react';
import AdminLayout from './AdminLayout';
import AdminDashboard from './AdminDashboard';
import ManageProviders from './ManageProviders';
import AddProvider from './AddProvider';
import AllApplications from './AllApplications';
import ReportsDashboard from './ReportsDashboard';
import { useLanguage } from '../../context/LanguageContext';

export default function AdminPortal() {
  const { t } = useLanguage();

  const NAV_ITEMS = [
    { path: '/admin',               icon: <LayoutDashboard size={18} />, label: t('portal.nav.dashboard') },
    { path: '/admin/providers',     icon: <Users size={18} />,           label: t('portal.nav.manageProviders') },
    { path: '/admin/add-provider',  icon: <UserPlus size={18} />,        label: 'Add Provider' },
    { path: '/admin/applications',  icon: <FileText size={18} />,        label: t('portal.nav.allApplications') },
    { path: '/admin/reports',       icon: <BarChart3 size={18} />,       label: t('portal.nav.reports') },
    { path: '/admin/settings',      icon: <Settings size={18} />,        label: 'Settings' },
  ];
  return (
    <AdminLayout navItems={NAV_ITEMS}>
      <Routes>
        <Route index element={<AdminDashboard />} />
        <Route path="providers"    element={<ManageProviders />} />
        <Route path="add-provider" element={<AddProvider />} />
        <Route path="applications" element={<AllApplications />} />
        <Route path="reports"   element={<ReportsDashboard />} />
        <Route path="settings"  element={<ComingSoon title="System Settings" />} />
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Routes>
    </AdminLayout>
  );
}

function ComingSoon({ title }: { title: string }) {
  return (
    <div style={{ textAlign: 'center', padding: '80px 24px', color: 'var(--text-muted)' }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>🚧</div>
      <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>{title}</h2>
      <p>This section is coming soon.</p>
    </div>
  );
}
