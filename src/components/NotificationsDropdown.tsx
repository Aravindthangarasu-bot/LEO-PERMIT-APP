import { useState, useRef, useEffect } from 'react';
import { Bell, Check, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useAppStore } from '../context/AppStoreContext';
import { STATUS_CONFIG } from '../pages/Customer/statusConfig';
import { getApplicationNotificationPath } from '../utils/notificationNavigation';

export default function NotificationsDropdown() {
  const { user } = useAuth();
  const { applications, notifications, markNotificationRead } = useAppStore();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const myNotifs = notifications.filter(n => n.userId === user?.id);
  const unreadCount = myNotifs.filter(n => !n.read).length;

  const openNotification = (notificationId: string, applicationId: string) => {
    if (!user) return;
    markNotificationRead(notificationId);
    setOpen(false);
    navigate(getApplicationNotificationPath(user.role, applicationId));
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={dropdownRef} style={{ position: 'relative', marginRight: 16 }}>
      <button 
        onClick={() => setOpen(!open)}
        aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
        title="Notifications"
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          width: 40, height: 40, borderRadius: '50%',
          position: 'relative', color: 'var(--text-muted)'
        }}
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute', top: 6, right: 6,
            background: 'var(--error)', color: 'white',
            width: 18, height: 18, borderRadius: '50%',
            fontSize: 11, fontWeight: 700,
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            {unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: 48, right: 0, width: 360,
          background: 'white', borderRadius: 12, boxShadow: 'var(--shadow-xl)',
          border: '1px solid var(--border)', zIndex: 1000, overflow: 'hidden'
        }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc' }}>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>Notifications</h3>
            {unreadCount > 0 && (
              <span style={{ fontSize: 12, color: 'var(--primary)', fontWeight: 600 }}>{unreadCount} unread</span>
            )}
          </div>
          
          <div style={{ maxHeight: 400, overflowY: 'auto' }}>
            {myNotifs.length === 0 ? (
              <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                You're all caught up!
              </div>
            ) : (
              myNotifs.map(n => {
                const application = applications.find(item => item.id === n.applicationId);
                const statusConfig = application ? STATUS_CONFIG[application.status] : STATUS_CONFIG.pending;
                return (
                <div key={n.id} role="button" tabIndex={0}
                  onClick={() => openNotification(n.id, n.applicationId)}
                  onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') openNotification(n.id, n.applicationId); }}
                  style={{
                  padding: 16, borderBottom: '1px solid var(--border)', 
                  background: n.read ? 'white' : statusConfig.bg,
                  borderLeft: `4px solid ${statusConfig.color}`,
                  display: 'flex', gap: 12, alignItems: 'flex-start', cursor: 'pointer'
                }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, color: 'var(--text)', marginBottom: 4, lineHeight: 1.5 }}>
                      {n.message}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                      {new Date(n.timestamp).toLocaleString()}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 6, fontSize: 11, fontWeight: 700, color: statusConfig.color }}>
                      {n.applicationId} · {statusConfig.label} <ExternalLink size={11} />
                    </div>
                  </div>
                  {!n.read && (
                    <button 
                      onClick={event => { event.stopPropagation(); markNotificationRead(n.id); }}
                      title="Mark as read"
                      style={{ 
                        background: 'none', border: 'none', cursor: 'pointer',
                        color: 'var(--primary)', padding: 4 
                      }}
                    >
                      <Check size={16} />
                    </button>
                  )}
                </div>
              )})
            )}
          </div>
        </div>
      )}
    </div>
  );
}
