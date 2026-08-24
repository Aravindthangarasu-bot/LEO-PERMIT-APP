import { useEffect, useState } from 'react';
import { Bell, ExternalLink, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useAppStore } from '../context/AppStoreContext';
import { STATUS_CONFIG } from '../pages/Customer/statusConfig';
import { getNotificationPath } from '../utils/notificationNavigation';

export default function ApplicationNotificationToast() {
  const { user } = useAuth();
  const { applications, notifications, markNotificationRead } = useAppStore();
  const navigate = useNavigate();
  const [notificationId, setNotificationId] = useState<string | null>(null);
  const [handledNotificationIds, setHandledNotificationIds] = useState<string[]>([]);

  const notification = notifications.find(item => item.id === notificationId);

  useEffect(() => {
    const newestUnread = notifications.find(item => item.userId === user?.id && !item.read && !handledNotificationIds.includes(item.id));
    if (newestUnread && newestUnread.id !== notificationId) setNotificationId(newestUnread.id);
  }, [notifications, notificationId, handledNotificationIds, user?.id]);

  if (!notification) return null;
  const application = applications.find(item => item.id === notification.applicationId);
  const statusConfig = application ? STATUS_CONFIG[application.status] : STATUS_CONFIG.pending;

  const dismiss = () => {
    setHandledNotificationIds(current => [...current, notification.id]);
    markNotificationRead(notification.id);
    setNotificationId(null);
  };

  const openApplication = () => {
    if (!user) return;
    setHandledNotificationIds(current => [...current, notification.id]);
    markNotificationRead(notification.id);
    setNotificationId(null);
    navigate(getNotificationPath(user.role, notification.applicationId, notification.type));
  };

  return (
    <aside role="status" aria-live="polite" style={{ position: 'fixed', right: 24, bottom: 24, width: 'min(380px, calc(100vw - 32px))', background: statusConfig.bg, border: `1px solid ${statusConfig.color}55`, borderLeft: `4px solid ${statusConfig.color}`, borderRadius: 8, boxShadow: '0 18px 45px rgba(15, 23, 42, 0.2)', padding: 16, zIndex: 2000 }}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
        <Bell size={20} color={statusConfig.color} aria-hidden="true" />
        <button type="button" onClick={openApplication} style={{ flex: 1, minWidth: 0, padding: 0, border: 0, background: 'transparent', textAlign: 'left', cursor: 'pointer', color: 'inherit' }} aria-label={notification.type === 'provider_registration' ? 'Open provider registration requests' : `Open application ${notification.applicationId}`}>
          <strong style={{ display: 'block', fontSize: 14, color: '#0f172a', marginBottom: 4 }}>{notification.title || 'Application update'}</strong>
          <p style={{ margin: 0, fontSize: 13, lineHeight: 1.45, color: '#475569' }}>{notification.message}</p>
          <span style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 8, fontSize: 11, fontWeight: 700, color: statusConfig.color }}>{notification.type === 'provider_registration' ? 'Provider registration requests' : `${notification.applicationId} · ${statusConfig.label}`} <ExternalLink size={12} /></span>
        </button>
        <button type="button" onClick={event => { event.stopPropagation(); dismiss(); }} aria-label="Dismiss notification" title="Dismiss notification" style={{ border: 0, background: 'transparent', padding: 2, cursor: 'pointer', color: '#64748b' }}><X size={18} /></button>
      </div>
    </aside>
  );
}