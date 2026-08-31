import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ExternalLink, BookOpen, MapPin, Loader2, CheckCircle2 } from 'lucide-react';
import Navbar from '../../components/Navbar/Navbar';
import { DocumentViewer } from '../../components/DocumentViewer/DocumentViewer';
import { detectUserRegion } from '../../utils/regionDetection';
import { getStateResource, ALL_STATES } from '../../data/stateResources';
import styles from './Resources.module.css';

export default function BuildingRulesPage() {
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
  const categories = ['All', ...Array.from(new Set(resource.buildingRules.map(r => r.category)))];
  const filtered = activeCategory === 'All' ? resource.buildingRules : resource.buildingRules.filter(r => r.category === activeCategory);

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
              <div className={styles.heroIcon}><BookOpen size={26} color="white" /></div>
              <h1 className={styles.heroTitle}>Building Rules & Regulations</h1>
              <p className={styles.heroSub}>
                Official building rules and regulations from government sources. Auto-detected based on your location.
              </p>
            </div>
          </div>

          <div className={styles.regionBar}>
            <MapPin size={16} color="rgba(255,255,255,0.7)" />
            <span className={styles.regionLabel}>Showing rules for:</span>
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
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 6 }}>
          <h2 className={styles.sectionTitle}>{state} Building Rules</h2>
        </div>
        <p className={styles.sectionSub}>
          All documents link to official government sources. Click to view or download from the respective government portal.
        </p>

        {/* Category filter */}
        <div className={styles.tabRow}>
          {categories.map(cat => (
            <button
              key={cat}
              className={`${styles.tab} ${activeCategory === cat ? styles.tabActive : ''}`}
              onClick={() => setActiveCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className={styles.docsGrid}>
          {filtered.map((doc, i) => (
            <div key={i} className={styles.docCard}>
              <div className={styles.docCardTop}>
                <span className={styles.docCategory}>{doc.category}</span>
                {doc.year && <span className={styles.docYear}>{doc.year}</span>}
              </div>
              <h3 className={styles.docTitle}>{doc.title}</h3>
              <p className={styles.docDesc}>{doc.description}</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <button type="button" onClick={() => setViewingDoc({ url: doc.url, name: doc.title })} className={styles.docLink} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                  <ExternalLink size={13} /> View Document
                </button>
                {doc.isOfficial && (
                  <span className={styles.officialBadge}><CheckCircle2 size={10} /> Official</span>
                )}
              </div>
            </div>
          ))}
        </div>

        <div style={{ background: '#fef3c7', border: '1px solid #fcd34d', borderRadius: 10, padding: '14px 18px', display: 'flex', gap: 10, alignItems: 'flex-start', fontSize: 13, color: '#92400e' }}>
          <span style={{ fontSize: 16 }}>⚠️</span>
          <span>
            <strong>Disclaimer:</strong> All links lead to official government websites. LEO does not host these documents.
            Always verify with the latest gazette notification from your local body before construction.
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
