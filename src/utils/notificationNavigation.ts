import type { UserRole } from '../types';

export function getApplicationNotificationPath(role: UserRole, applicationId: string): string {
  const encodedId = encodeURIComponent(applicationId);

  if (role === 'customer') return `/customer/application/${encodedId}`;
  if (role === 'provider') return `/provider/applications?application=${encodedId}`;
  if (role === 'staff') return `/staff/applications?application=${encodedId}`;
  if (role === 'admin') return `/admin/applications?application=${encodedId}`;

  return '/';
}
