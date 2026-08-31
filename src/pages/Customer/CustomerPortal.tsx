import { Routes, Route, Navigate } from 'react-router-dom';
import {
  LayoutDashboard, FileText, PlusCircle, Bell, HelpCircle, WalletCards,
} from 'lucide-react';
import PortalLayout from '../../components/PortalLayout/PortalLayout';
import CustomerDashboard from './CustomerDashboard';
import MyApplications from './MyApplications';
import NewApplication from './NewApplication';
import ApplicationDetail from './ApplicationDetail';
import CustomerNotifications from './CustomerNotifications';
import DocumentWallet from '../../components/DocumentWallet';
import { useLanguage } from '../../context/LanguageContext';

export default function CustomerPortal() {
  const { t } = useLanguage();

  const NAV_ITEMS = [
    { path: '/customer', icon: <LayoutDashboard size={18} />, label: t('portal.nav.dashboard') },
    { path: '/customer/applications', icon: <FileText size={18} />, label: t('portal.nav.myApplications') },
    { path: '/customer/new', icon: <PlusCircle size={18} />, label: t('portal.nav.newApplication') },
    { path: '/customer/wallet', icon: <WalletCards size={18} />, label: t('portal.nav.documentWallet') },
    { path: '/customer/help', icon: <HelpCircle size={18} />, label: t('portal.nav.helpSupport') },
  ];
  return (
    <PortalLayout navItems={NAV_ITEMS} portalName={t('portal.customer')}>
      <Routes>
        <Route index element={<CustomerDashboard />} />
        <Route path="applications" element={<MyApplications />} />
        <Route path="new" element={<NewApplication />} />
        <Route path="wallet" element={<DocumentWallet />} />
        <Route path="application/:id" element={<ApplicationDetail />} />
        <Route path="help" element={<ComingSoon title={t('portal.nav.helpSupport')} desc={t('portal.comingSoon.desc')} />} />
        <Route path="*" element={<Navigate to="/customer" replace />} />
      </Routes>
    </PortalLayout>
  );
}

function ComingSoon({ title, desc }: { title: string, desc?: string }) {
  return (
    <div style={{ textAlign: 'center', padding: '80px 24px', color: 'var(--text-muted)' }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>🚧</div>
      <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>{title}</h2>
      <p>{desc || 'This section is coming soon.'}</p>
    </div>
  );
}
