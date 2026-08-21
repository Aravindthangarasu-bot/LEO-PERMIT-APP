import { Bell, Phone, CheckCircle2, Users, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useAppStore } from '../../context/AppStoreContext';
import styles from './Customer.module.css';

const TYPE_ICON: Record<string, React.ReactNode> = {
  assigned:      <CheckCircle2 size={16} />,
  staff_assigned: <Users size={16} />,
  status_change: <AlertCircle size={16} />,
  acknowledgement: <Bell size={16} />,
};

const TYPE_COLOR: Record<string, string> = {
  assigned:      '#16a34a',
  staff_assigned: '#3b82f6',
  status_change: '#f59e0b',
  acknowledgement: '#c0522a',
};

export default function CustomerNotifications() {
  const { user } = useAuth();
  const { notifications, markNotificationRead } = useAppStore();
  // Only show notifications for this customer — matched by both id and phone
  const myNotifs = notifications
    .filter(n => n.customerId === user?.id || n.customerId === user?.phone)
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
          {myNotifs.map(n => (
            <div
              key={n.id}
              className={`card ${styles.notifCard} ${!n.read ? styles.notifUnread : ''}`}
              onClick={() => markNotificationRead(n.id)}
            >
              <div className={styles.notifIcon} style={{ background: `${TYPE_COLOR[n.type]}18`, color: TYPE_COLOR[n.type] }}>
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
                  {' · App: '}<strong>{n.applicationId}</strong>
                </p>
              </div>
              {!n.read && <div className={styles.notifDot} />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
