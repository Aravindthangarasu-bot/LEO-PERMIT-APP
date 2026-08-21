import { Routes, Route, Navigate } from 'react-router-dom';
import { LayoutDashboard, FileText, Bell } from 'lucide-react';
import PortalLayout from '../../components/PortalLayout/PortalLayout';
import StaffDashboard from './StaffDashboard';
import StaffApplications from './StaffApplications';

const NAV_ITEMS = [
  { path: '/staff',              icon: <LayoutDashboard size={18} />, label: 'Dashboard'           },
  { path: '/staff/applications', icon: <FileText size={18} />,        label: 'My Assignments'      },
  { path: '/staff/notifications',icon: <Bell size={18} />,            label: 'Notifications'       },
];

export default function StaffPortal() {
  return (
    <PortalLayout navItems={NAV_ITEMS} portalName="Staff Portal" accentColor="#15803d">
      <Routes>
        <Route index element={<StaffDashboard />} />
        <Route path="applications" element={<StaffApplications />} />
        <Route path="notifications" element={<div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Notifications coming soon.</div>} />
        <Route path="*" element={<Navigate to="/staff" replace />} />
      </Routes>
    </PortalLayout>
  );
}
