import { Routes, Route, Navigate } from 'react-router-dom';
import { LayoutDashboard, FileText, Bell, WalletCards } from 'lucide-react';
import PortalLayout from '../../components/PortalLayout/PortalLayout';
import StaffDashboard from './StaffDashboard';
import StaffApplications from './StaffApplications';
import DocumentWallet from '../../components/DocumentWallet';
import { useLanguage } from '../../context/LanguageContext';

export default function StaffPortal() {
  const { t } = useLanguage();

  const NAV_ITEMS = [
    { path: '/staff',              icon: <LayoutDashboard size={18} />, label: t('portal.nav.dashboard')           },
    { path: '/staff/applications', icon: <FileText size={18} />,        label: t('portal.nav.staffApplications')      },
    { path: '/staff/wallet',       icon: <WalletCards size={18} />,     label: t('portal.nav.documentWallet')     },
    { path: '/staff/notifications',icon: <Bell size={18} />,            label: t('portal.nav.notifications')       },
  ];
  return (
    <PortalLayout navItems={NAV_ITEMS} portalName={t('portal.staff')} accentColor="#15803d">
      <Routes>
        <Route index element={<StaffDashboard />} />
        <Route path="applications" element={<StaffApplications />} />
        <Route path="wallet" element={<DocumentWallet />} />
        <Route path="notifications" element={<div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Notifications coming soon.</div>} />
        <Route path="*" element={<Navigate to="/staff" replace />} />
      </Routes>
    </PortalLayout>
  );
}
