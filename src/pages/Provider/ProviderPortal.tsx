import { Routes, Route, Navigate } from 'react-router-dom';
import { LayoutDashboard, FileText, CheckSquare, Star, Settings, Users, WalletCards } from 'lucide-react';
import PortalLayout from '../../components/PortalLayout/PortalLayout';
import ProviderDashboard from './ProviderDashboard';
import AssignedApplications from './AssignedApplications';
import ProviderProfile from './ProviderProfile';
import StaffManagement from './StaffManagement';
import DocumentWallet from '../../components/DocumentWallet';
import ApprovedPermits from './ApprovedPermits';
import { useLanguage } from '../../context/LanguageContext';

export default function ProviderPortal() {
  const { t } = useLanguage();

  const NAV_ITEMS = [
    { path: '/provider',               icon: <LayoutDashboard size={18} />, label: t('portal.nav.dashboard') },
    { path: '/provider/applications',  icon: <FileText size={18} />,        label: t('portal.nav.assignedApplications') },
    { path: '/provider/staff',         icon: <Users size={18} />,           label: t('portal.nav.staffManagement') },
    { path: '/provider/wallet',        icon: <WalletCards size={18} />,     label: t('portal.nav.documentWallet') },
    { path: '/provider/approved',      icon: <CheckSquare size={18} />,     label: 'Approved Permits' },
    { path: '/provider/reviews',       icon: <Star size={18} />,            label: 'Reviews' },
    { path: '/provider/profile',       icon: <Settings size={18} />,        label: 'Profile & Documents' },
  ];
  return (
    <PortalLayout navItems={NAV_ITEMS} portalName={t('portal.provider')} accentColor="#15803d">
      <Routes>
        <Route index element={<ProviderDashboard />} />
        <Route path="applications" element={<AssignedApplications />} />
        <Route path="staff"        element={<StaffManagement />} />
        <Route path="wallet"       element={<DocumentWallet />} />
        <Route path="approved"     element={<ApprovedPermits />} />
        <Route path="reviews"      element={<ComingSoon title="Reviews" />} />
        <Route path="profile"      element={<ProviderProfile />} />
        <Route path="*" element={<Navigate to="/provider" replace />} />
      </Routes>
    </PortalLayout>
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
