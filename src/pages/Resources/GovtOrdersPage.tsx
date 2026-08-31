import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ExternalLink, FileText, MapPin, Loader2, CheckCircle2 } from 'lucide-react';
import Navbar from '../../components/Navbar/Navbar';
import { DocumentViewer } from '../../components/DocumentViewer/DocumentViewer';
import { detectUserRegion } from '../../utils/regionDetection';
import { getStateResource, ALL_STATES } from '../../data/stateResources';
import styles from './Resources.module.css';

const CATEGORY_LABELS: Record<string, string> = {
  All: 'All Orders',
  building: '🏗️ Building',
  fee: '💰 Fee Revision',
  general: '📋 General',
  heritage: '🏛️ Heritage',
  coastal: '🌊 Coastal',
};

export default function GovtOrdersPage() {
  const [state, setState] = useState('Kerala');
  const [detectedState, setDetectedState] = useState('');
  const [detecting, setDetecting] = useState(true);
  const [activeCategory, setActiveCategory] = useState('All');
  const [viewingDoc, setViewingDoc] = useState<{ url: string; name: string } | null>(null);

  useEffect(() => {
    detectUserRegion().then(region => {
      const s = ALL_STATES.includes(region.state) ? region.state : 'Kerala';
      setState(s);
      setDetectedState(region.city ? `${region.city}, ${region.state}` : region.state);
      setDetecting(false);
    });
  }, []);

  const resource = getStateResource(state);
  const orders = activeCategory === 'All'
    ? resource.govtOrders
    : resource.govtOrders.filter(o => o.category === activeCategory);

  const categories = ['All', ...Array.from(new Set(resource.govtOrders.map(o => o.category)))];

  return (
    <div className={styles.page}>
      <Navbar variant="landing" />

      <div className={styles.hero}>
        <div className={styles.heroInner}>
          <Link to="/" className={styles.backLink}>
            <ArrowLeft size={14} /> Back to Home
          </Link>
          <div className={styles.heroTop}>
            <div>
              <div className={styles.heroIcon}><FileText size={26} color="white" /></div>
              <h1 className={styles.heroTitle}>Government Orders</h1>
              <p className={styles.heroSub}>
                Official Government Orders (GOs) related to building permits, fees, and construction regulations.
                Auto-detected based on your location.
              </p>
            </div>
          </div>

          <div className={styles.regionBar}>
            <MapPin size={16} color="rgba(255,255,255,0.7)" />
            <span className={styles.regionLabel}>Showing GOs for:</span>
            <select
              className={styles.regionSelect}
              value={state}
              onChange={e => setState(e.target.value)}
            >
              {ALL_STATES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            {detecting ? (
              <span className={styles.detectedBadge}><Loader2 size={12} /> Detecting location…</span>
            ) : detectedState ? (
              <span className={styles.detectedBadge}><CheckCircle2 size={12} /> Auto-detected: {detectedState}</span>
            ) : null}
          </div>
        </div>
      </div>

      <div className={styles.content}>
        <h2 className={styles.sectionTitle}>{state} Government Orders</h2>
        <p className={styles.sectionSub}>
          Recent government orders affecting building permits and construction regulations in {state}.
        </p>

        {/* Category filter */}
        <div className={styles.tabRow}>
          {categories.map(cat => (
            <button
              key={cat}
              className={`${styles.tab} ${activeCategory === cat ? styles.tabActive : ''}`}
              onClick={() => setActiveCategory(cat)}
            >
              {CATEGORY_LABELS[cat] || cat}
            </button>
          ))}
        </div>

        <table className={styles.ordersTable}>
          <thead>
            <tr>
              <th>GO Number</th>
              <th>Date</th>
              <th>Subject</th>
              <th>Department</th>
              <th>Category</th>
              <th>Link</th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', color: '#94a3b8', padding: '40px' }}>
                  No orders found for this category.
                </td>
              </tr>
            ) : (
              orders.map((go, i) => (
                <tr key={i}>
                  <td><span className={styles.goNumber}>{go.goNumber}</span></td>
                  <td style={{ whiteSpace: 'nowrap', color: '#64748b', fontSize: 12 }}>{go.date}</td>
                  <td><span className={styles.goSubject}>{go.subject}</span></td>
                  <td style={{ color: '#64748b', fontSize: 12 }}>{go.department}</td>
                  <td>
                    <span className={`${styles.goCat} ${styles[go.category]}`}>
                      {CATEGORY_LABELS[go.category] || go.category}
                    </span>
                  </td>
                  <td>
                    <button type="button" onClick={() => setViewingDoc({ url: go.url, name: go.subject })} className={styles.docLink} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                      <ExternalLink size={12} /> View
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, padding: '14px 18px', display: 'flex', gap: 10, alignItems: 'flex-start', fontSize: 13, color: '#14532d' }}>
          <span style={{ fontSize: 16 }}>ℹ️</span>
          <span>
            <strong>Note:</strong> Government Orders are sourced from official government portals.
            For the most current and legally binding orders, always refer to the Official Gazette of {state}.
          </span>
        </div>
      </div>

      {viewingDoc && (
        <DocumentViewer
          url={viewingDoc.url}
          title={viewingDoc.name}
          onClose={() => setViewingDoc(null)}
        />
      )}
    </div>
  );
}
