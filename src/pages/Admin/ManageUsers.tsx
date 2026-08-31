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
                <div className={styles.providerAvatar}>{initials}</div>
                <div className={styles.providerMain}>
                  <h4>{user.name}</h4>
                  <p style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Phone size={14} /> {user.phone}
                  </p>
                  {user.email && (
                    <p style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Mail size={14} /> {user.email}
                    </p>
                  )}
                  {(user.city || user.district) && (
                    <p style={{ display: 'flex', alignItems: 'center', gap: 6, opacity: 0.8 }}>
                      <MapPin size={14} /> {user.city || user.district} {user.pincode ? `(${user.pincode})` : ''}
                    </p>
                  )}
                </div>
                <div className={styles.providerMeta}>
                  <div className={`${styles.statusBadge} ${styles['status' + status]}`}>
                    {getStatusLabel(status)}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
