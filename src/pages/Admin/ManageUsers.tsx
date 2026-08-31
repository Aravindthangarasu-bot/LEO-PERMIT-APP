import { useState } from 'react';
import { Search, Phone, Mail, MapPin } from 'lucide-react';
import { useAppStore } from '../../context/AppStoreContext';
import styles from './Admin.module.css';

export default function ManageUsers() {
  const { users } = useAppStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [selected, setSelected] = useState<string | null>(null);

  const filteredUsers = users.filter(user => {
    if (user.role !== 'customer') return false;
    const matchesSearch = 
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      user.phone.includes(searchTerm) ||
      (user.email && user.email.toLowerCase().includes(searchTerm.toLowerCase()));
    
    return matchesSearch;
  });

  const getStatus = (id: string) => {
    // Generate mock status based on user ID for demonstration
    const hash = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const remainder = hash % 3;
    if (remainder === 0) return 'active';
    if (remainder === 1) return 'suspended'; // acts as inactive in css
    return 'pending'; // acts as barely active in css
  };

  const getStatusLabel = (status: string) => {
    if (status === 'active') return 'ACTIVE';
    if (status === 'suspended') return 'INACTIVE';
    return 'BARELY ACTIVE';
  };

  return (
    <div className={`page-enter ${styles.page}`}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Manage Users</h1>
          <p className={styles.pageSub}>{filteredUsers.length} customers registered</p>
        </div>
      </div>

      <div className={styles.filterRow}>
        <div className={styles.searchBox}>
          <Search size={16} />
          <input
            type="text" 
            placeholder="Search by name, phone or email..."
            value={searchTerm} 
            onChange={e => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
        </div>
        <div className={styles.filterBtns}>
          {/* Filter pills removed since we only show customers now */}
        </div>
      </div>

      <div className={styles.appGrid}>
        <div className={`card ${styles.appListCard}`}>
          {filteredUsers.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
              No customers found matching your criteria.
            </div>
          ) : filteredUsers.map(user => {
            const status = getStatus(user.id);
            const initials = user.name ? user.name.charAt(0).toUpperCase() : '?';
            
            return (
              <button
                key={user.id}
                className={`${styles.providerRow} ${selected === user.id ? styles.providerRowActive : ''}`}
                onClick={() => setSelected(user.id)}
              >
                <div className={styles.providerRowAvatar}>{initials}</div>
                <div className={styles.providerRowInfo}>
                  <div className={styles.providerName}>{user.name}</div>
                  <div className={styles.providerMeta}>👤 Customer</div>
                  <div className={styles.providerMeta}>📞 {user.phone}{user.email ? ` · ✉️ ${user.email}` : ''}</div>
                  {(user.city || user.district) && (
                    <div className={styles.providerMeta}>
                      📍 {user.city || user.district} {user.pincode ? `(${user.pincode})` : ''}
                    </div>
                  )}
                </div>
                <div className={styles.providerRowRight}>
                  <span className={`badge ${status === 'active' ? 'badge-success' : status === 'pending' ? 'badge-warning' : 'badge-error'}`}>
                    {getStatusLabel(status)}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {selected && (() => {
          const detail = filteredUsers.find(u => u.id === selected);
          if (!detail) return null;
          const status = getStatus(detail.id);
          
          return (
            <div className={`card ${styles.detailCard}`}>
              <div className={styles.detailHeader}>
                <div className={styles.detailAvatar}>{detail.name ? detail.name.charAt(0).toUpperCase() : '?'}</div>
                <div>
                  <div className={styles.detailName}>{detail.name}</div>
                  <div className={styles.detailMeta}>👤 Customer</div>
                  <div className={styles.detailMeta}>{detail.phone} {detail.email ? `· ${detail.email}` : ''}</div>
                </div>
                <span className={`badge ${status === 'active' ? 'badge-success' : status === 'pending' ? 'badge-warning' : 'badge-error'}`}>
                  {getStatusLabel(status)}
                </span>
              </div>

              <div className={styles.detailSection}>
                <h4>User Information</h4>
                <div className={styles.detailRows}>
                  <div className={styles.detailRow}><span>Phone Number</span><span>{detail.phone}</span></div>
                  <div className={styles.detailRow}><span>Email Address</span><span>{detail.email || '-'}</span></div>
                  <div className={styles.detailRow}><span>Location / City</span><span>{detail.city || detail.district || '-'}</span></div>
                  <div className={styles.detailRow}><span>Pincode</span><span>{detail.pincode || '-'}</span></div>
                  <div className={styles.detailRow}><span>Address</span><span>{detail.address || '-'}</span></div>
                </div>
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
}
