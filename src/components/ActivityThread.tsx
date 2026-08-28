import { useState } from 'react';
import { MessageSquare, RefreshCw, Paperclip } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useAppStore } from '../context/AppStoreContext';
import type { ActivityLogEntry } from '../types';

interface ActivityThreadProps {
  appId: string;
  activities?: ActivityLogEntry[];
}

const ROLE_STYLES: Record<string, { color: string; background: string; border: string; iconBackground: string }> = {
  customer: { color: '#c2410c', background: '#fff7ed', border: '#fdba74', iconBackground: '#ffedd5' },
  provider: { color: '#166534', background: '#f0fdf4', border: '#86efac', iconBackground: '#dcfce7' },
  staff:    { color: '#075985', background: '#f0f9ff', border: '#7dd3fc', iconBackground: '#e0f2fe' },
  admin:    { color: '#6b21a8', background: '#faf5ff', border: '#d8b4fe', iconBackground: '#f3e8ff' },
};

const DEFAULT_ROLE_STYLE = { color: '#475569', background: '#f8fafc', border: '#cbd5e1', iconBackground: '#f1f5f9' };

export default function ActivityThread({ appId, activities = [] }: ActivityThreadProps) {
  const { user } = useAuth();
  const { applications, addApplicationActivity, addNotification } = useAppStore();
  const app = applications.find(a => a.id === appId);
  const [comment, setComment] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim() || !user) return;

    addApplicationActivity(appId, {
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      type: 'comment',
      content: comment.trim()
    });

    if (app) {
      const msg = `New comment on ${app.id} from ${user.name}: "${comment.substring(0, 30)}${comment.length > 30 ? '...' : ''}"`;
      const recipients = [app.customerId, app.assignedProviderId, app.assignedStaffId]
        .filter((id): id is string => Boolean(id) && id !== user.id);
      [...new Set(recipients)].forEach((userId, index) => addNotification({ id: `n_${Date.now()}_${index}`, applicationId: appId, userId, type: 'comment', title: 'New application comment', message: msg, contactName: user.name, contactPhone: user.phone, timestamp: new Date().toISOString(), read: false }));
    }

    setComment('');
  };

  const getIcon = (type: string, roleColor: string) => {
    if (type === 'status_change') return <RefreshCw size={14} style={{ color: '#0ea5e9' }} />;
    if (type === 'document_upload') return <Paperclip size={14} style={{ color: '#f59e0b' }} />;
    return <MessageSquare size={14} style={{ color: roleColor }} />;
  };

  return (
    <div style={{ background: 'white', borderRadius: 12, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
      <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', margin: 0 }}>Activity & Comments</h3>
      </div>
      
      {/* Thread list (Jira Style) */}
      <div style={{ 
        padding: '20px', 
        maxHeight: 400, 
        overflowY: 'auto', 
        display: 'flex', 
        flexDirection: 'column', 
      }}>
        {activities.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#6b7280', fontSize: 13, margin: '20px 0' }}>
            No activity yet.
          </p>
        ) : (
          activities.map((act, index) => {
            const roleStyle = ROLE_STYLES[act.userRole.toLowerCase()] ?? DEFAULT_ROLE_STYLE;
            const isComment = act.type === 'comment';
            const isOwnComment = isComment && act.userId === user?.id;

            if (!isComment) {
              // System events (Jira style subtle history)
              return (
                <div key={act.id} style={{ 
                  display: 'flex', 
                  flexDirection: 'column',
                  gap: 4, 
                  padding: '12px 12px 12px 48px', 
                  borderBottom: index < activities.length - 1 ? '1px solid #f1f5f9' : 'none',
                  fontSize: 12, 
                  color: '#64748b',
                  position: 'relative'
                }}>
                  <div style={{ position: 'absolute', left: 16, top: 14 }}>
                    {getIcon(act.type, '#94a3b8')}
                  </div>
                  <span>
                    <strong>{act.userName}</strong>
                    {act.type === 'status_change' && ' changed the status: '}
                    {act.type === 'document_upload' && ' uploaded a document: '}
                    <span style={{ color: '#0f172a' }}>{act.content}</span>
                  </span>
                  <div style={{ fontSize: 11, color: '#94a3b8' }}>
                    {new Date(act.timestamp).toLocaleString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              );
            }

            // User comments (Jira style)
            return (
              <div key={act.id} style={{ 
                display: 'flex',
                gap: 12,
                padding: '16px 0',
                borderBottom: index < activities.length - 1 ? '1px solid #f1f5f9' : 'none'
              }}>
                {/* Avatar */}
                <div style={{ 
                  width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                  background: roleStyle.iconBackground, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: roleStyle.color, fontWeight: 600, fontSize: 14
                }}>
                  {act.userName.charAt(0).toUpperCase()}
                </div>
                
                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>
                      {act.userName}
                    </span>
                    <span style={{ fontSize: 12, color: '#64748b', background: '#f1f5f9', padding: '2px 6px', borderRadius: 4 }}>
                      {act.userRole}{isOwnComment ? ' (You)' : ''}
                    </span>
                  </div>
                  
                  <div style={{ fontSize: 14, color: '#334155', lineHeight: 1.5, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                    {act.content}
                  </div>
                  
                  <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 8 }}>
                    {new Date(act.timestamp).toLocaleString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Input box */}
      <div style={{ padding: '16px 20px', borderTop: '1px solid #e2e8f0', background: '#f8fafc' }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          <div style={{ flex: 1 }}>
            <textarea
              placeholder="Add a comment or internal note..."
              value={comment}
              onChange={e => setComment(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 14px',
                borderRadius: 8,
                border: '1px solid #cbd5e1',
                fontSize: 13,
                fontFamily: 'inherit',
                resize: 'vertical',
                minHeight: 40,
                outline: 'none',
                transition: 'border-color 0.2s'
              }}
              onFocus={e => e.target.style.borderColor = 'var(--primary)'}
              onBlur={e => e.target.style.borderColor = '#cbd5e1'}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
            />
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
              Press Enter to post, Shift+Enter for new line
            </div>
          </div>
          <button 
            type="submit" 
            disabled={!comment.trim()}
            style={{
              padding: '12px 20px',
              background: 'var(--primary)',
              color: 'white',
              border: 'none',
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 600,
              cursor: comment.trim() ? 'pointer' : 'not-allowed',
              opacity: comment.trim() ? 1 : 0.5
            }}
          >
            Post
          </button>
        </form>
      </div>
    </div>
  );
}
