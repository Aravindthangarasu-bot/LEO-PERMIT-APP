import { Routes, Route, Navigate } from 'react-router-dom';
import { LayoutDashboard, FileText, CheckSquare, Star, Settings, Users } from 'lucide-react';
import PortalLayout from '../../components/PortalLayout/PortalLayout';
import ProviderDashboard from './ProviderDashboard';
import AssignedApplications from './AssignedApplications';
import StaffManagement from './StaffManagement';

const NAV_ITEMS = [
  { path: '/provider',               icon: <LayoutDashboard size={18} />, label: 'Dashboard' },
  { path: '/provider/applications',  icon: <FileText size={18} />,        label: 'Assigned Applications' },
  { path: '/provider/staff',         icon: <Users size={18} />,           label: 'My Staff' },
  { path: '/provider/approved',      icon: <CheckSquare size={18} />,     label: 'Approved Permits' },
  { path: '/provider/reviews',       icon: <Star size={18} />,            label: 'Reviews' },
  { path: '/provider/profile',       icon: <Settings size={18} />,        label: 'Profile & Documents' },
];

export default function ProviderPortal() {
  return (
    <PortalLayout navItems={NAV_ITEMS} portalName="Provider Portal" accentColor="#15803d">
      <Routes>
        <Route index element={<ProviderDashboard />} />
        <Route path="applications" element={<AssignedApplications />} />
        <Route path="staff"        element={<StaffManagement />} />
        <Route path="approved"     element={<ComingSoon title="Approved Permits" />} />
        <Route path="reviews"      element={<ComingSoon title="Reviews" />} />
        <Route path="profile"      element={<ComingSoon title="Profile & Documents" />} />
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
