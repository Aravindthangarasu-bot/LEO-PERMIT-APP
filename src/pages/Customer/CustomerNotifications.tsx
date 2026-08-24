import { Bell, Phone, CheckCircle2, Users, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useAppStore } from '../../context/AppStoreContext';
import { STATUS_CONFIG } from './statusConfig';
import { getApplicationNotificationPath } from '../../utils/notificationNavigation';
import styles from './Customer.module.css';

const TYPE_ICON: Record<string, React.ReactNode> = {
  assigned:      <CheckCircle2 size={16} />,
  staff_assigned: <Users size={16} />,
  status_change: <AlertCircle size={16} />,
  acknowledgement: <Bell size={16} />,
};

export default function CustomerNotifications() {
  const { user } = useAuth();
  const { applications, notifications, markNotificationRead } = useAppStore();
  const navigate = useNavigate();
  // Only show notifications for this customer — matched by both id and phone
  const myNotifs = notifications
    .filter(n => n.userId === user?.id || n.userId === user?.phone)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const unread = myNotifs.filter(n => !n.read).length;

  return (
    <div className={`page-enter ${styles.page}`}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Notifications</h1>
          <p className={styles.pageSub}>{unread > 0 ? `${unread} unread` : 'All caught up'}</p>
        </div>
        {unread > 0 && (
          <button className="btn btn-outline" style={{ fontSize: 13 }}
            onClick={() => myNotifs.forEach(n => !n.read && markNotificationRead(n.id))}>
            Mark all as read
          </button>
        )}
      </div>

      {myNotifs.length === 0 ? (
        <div className={`card ${styles.emptyState}`} style={{ padding: 64 }}>
          <Bell size={44} />
          <p>No notifications yet. You'll be notified when your application status changes.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {myNotifs.map(n => {
            const application = applications.find(item => item.id === n.applicationId);
            const statusConfig = application ? STATUS_CONFIG[application.status] : STATUS_CONFIG.pending;
            return (
            <div
              key={n.id}
              role="button"
              tabIndex={0}
              className={`card ${styles.notifCard} ${!n.read ? styles.notifUnread : ''}`}
              onClick={() => { if (!user) return; markNotificationRead(n.id); navigate(getApplicationNotificationPath(user.role, n.applicationId)); }}
              onKeyDown={event => { if ((event.key === 'Enter' || event.key === ' ') && user) { markNotificationRead(n.id); navigate(getApplicationNotificationPath(user.role, n.applicationId)); } }}
              style={{ borderLeft: `4px solid ${statusConfig.color}`, background: !n.read ? statusConfig.bg : undefined, cursor: 'pointer' }}
            >
              <div className={styles.notifIcon} style={{ background: statusConfig.bg, color: statusConfig.color }}>
                {TYPE_ICON[n.type] ?? <Bell size={16} />}
              </div>
              <div className={styles.notifBody}>
                <p className={styles.notifMessage}>{n.message}</p>
                {(n.contactName || n.contactPhone) && (
                  <div className={styles.notifContact}>
                    <Phone size={12} />
                    <strong>{n.contactName}</strong>
                    {n.contactPhone && <span>· +91 {n.contactPhone}</span>}
                  </div>
                )}
                <p className={styles.notifTime}>
                  {new Date(n.timestamp).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  {' · App: '}<strong style={{ color: statusConfig.color }}>{n.applicationId} · {statusConfig.label}</strong>
                </p>
              </div>
              {!n.read && <div className={styles.notifDot} />}
            </div>
          )})}
        </div>
      )}
    </div>
  );
}
