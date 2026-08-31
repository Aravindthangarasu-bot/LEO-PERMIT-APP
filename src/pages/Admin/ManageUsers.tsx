import { useState } from 'react';
import { Search, Users, Phone, MapPin, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { useAppStore } from '../../context/AppStoreContext';

export default function ManageUsers() {
  const { users } = useAppStore();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredUsers = users.filter(user => {
    if (user.role !== 'customer') return false;
    const matchesSearch = 
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      user.phone.includes(searchTerm) ||
      (user.email && user.email.toLowerCase().includes(searchTerm.toLowerCase()));
    
    return matchesSearch;
  });

  const getStatusBadge = (id: string) => {
    // Generate mock status based on user ID for demonstration
    const hash = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const remainder = hash % 3;
    if (remainder === 0) return <span className="badge bg-success rounded-pill px-3 py-2"><CheckCircle2 size={14} className="me-1" /> Active</span>;
    if (remainder === 1) return <span className="badge bg-secondary rounded-pill px-3 py-2"><XCircle size={14} className="me-1" /> Inactive</span>;
    return <span className="badge bg-warning text-dark rounded-pill px-3 py-2"><AlertCircle size={14} className="me-1" /> Barely Active</span>;
  };

  return (
    <div className="container-fluid py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="h3 fw-bold mb-1 text-dark">Manage Users</h1>
          <p className="text-muted small mb-0">View all {filteredUsers.length} registered customers in the system</p>
        </div>
      </div>

      <div className="card shadow-sm border-0 rounded-4 overflow-hidden mb-4">
        <div className="card-header bg-white border-bottom p-4">
          <div className="row g-3">
            <div className="col-12 col-md-5">
              <div className="position-relative">
                <Search size={18} className="position-absolute text-muted" style={{ left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
                <input 
                  type="text" 
                  className="form-control form-control-lg bg-light border-0" 
                  placeholder="Search by name, phone or email..."
                  style={{ paddingLeft: '44px', fontSize: '15px' }}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="col-12 col-md-7 d-flex gap-2 flex-wrap justify-content-md-end">
              {/* Filter pills removed since we only show customers now */}
            </div>
          </div>
        </div>
        
        <div className="table-responsive">
          <table className="table table-hover mb-0 align-middle">
            <thead className="table-light">
              <tr>
                <th className="py-3 px-4 text-uppercase small fw-bold text-muted" style={{ letterSpacing: '0.5px' }}>User Details</th>
                <th className="py-3 px-4 text-uppercase small fw-bold text-muted" style={{ letterSpacing: '0.5px' }}>Contact</th>
                <th className="py-3 px-4 text-uppercase small fw-bold text-muted" style={{ letterSpacing: '0.5px' }}>Location</th>
                <th className="py-3 px-4 text-uppercase small fw-bold text-muted" style={{ letterSpacing: '0.5px' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-5">
                    <Users size={48} className="text-muted opacity-50 mb-3" />
                    <p className="text-muted fw-semibold mb-0">No users found matching your criteria</p>
                  </td>
                </tr>
              ) : filteredUsers.map(user => (
                <tr key={user.id} style={{ transition: 'background-color 0.2s' }}>
                  <td className="px-4 py-3">
                    <div className="fw-bold text-dark fs-6">{user.name}</div>
                    <div className="small text-muted font-monospace">{user.id}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="d-flex align-items-center gap-2 mb-1">
                      <Phone size={14} className="text-muted" /> 
                      <span className="fw-semibold text-dark">{user.phone}</span>
                    </div>
                    {user.email && <div className="small text-muted">{user.email}</div>}
                  </td>
                  <td className="px-4 py-3">
                    {user.city || user.district ? (
                      <div className="d-flex align-items-center gap-2">
                        <MapPin size={14} className="text-muted" />
                        <span className="text-dark">{user.city || user.district}</span>
                        {user.pincode && <span className="badge bg-light text-secondary border">{user.pincode}</span>}
                      </div>
                    ) : (
                      <span className="text-muted small fst-italic">Not specified</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {getStatusBadge(user.id)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
