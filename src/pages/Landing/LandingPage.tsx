import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FileCheck2, HardHat, Star, Shield, ChevronRight,
  Phone, MapPin, CheckCircle2, ArrowRight, Zap,
} from 'lucide-react';
import Navbar from '../../components/Navbar/Navbar';
import { mockProviders } from '../../data/mockData';
import styles from './LandingPage.module.css';

const SERVICE_SEARCH_TERMS: Record<string, string[]> = {
  'house permit': ['new_building_permit'],
  'building permit': ['new_building_permit'],
  'new building': ['new_building_permit'],
  'completion certificate': ['completion_certificate'],
  'occupancy certificate': ['occupancy_certificate'],
  'renovation permit': ['renovation_permit'],
  'renovation': ['renovation_permit'],
  'compound wall': ['compound_wall_permit'],
  'boundary wall': ['compound_wall_permit'],
};

const SERVICE_LABELS: Record<string, string> = {
  new_building_permit: 'New Building Permit',
  completion_certificate: 'Completion Certificate',
  occupancy_certificate: 'Occupancy Certificate',
  renovation_permit: 'Renovation Permit',
  compound_wall_permit: 'Compound / Boundary Wall Permit',
};

const SEARCH_SUGGESTIONS = [
  { label: 'New Building Permit', query: 'house permit', type: 'Permit' },
  { label: 'Renovation Permit', query: 'renovation permit', type: 'Permit' },
  { label: 'Compound / Boundary Wall Permit', query: 'compound wall', type: 'Permit' },
  { label: 'Completion Certificate', query: 'completion certificate', type: 'Certificate' },
  { label: 'Occupancy Certificate', query: 'occupancy certificate', type: 'Certificate' },
];

const SERVICE_CARDS = [
  {
    badge: 'FAST APPROVAL',
    icon: <FileCheck2 size={52} />,
    title: 'Building Permits',
    desc: 'Kerala approvals & sanctions',
    items: ['New Building Permit', 'Renovation Permit', 'Compound / Boundary Wall'],
    cta: 'Get Permit',
    dark: false,
  },
  {
    badge: 'VERIFIED PROS',
    icon: <HardHat size={52} />,
    title: 'Certificates',
    desc: 'Completion & occupancy certifications',
    items: ['Completion Certificate', 'Occupancy Certificate'],
    cta: 'Get Certificate',
    dark: true,
  },
];

const STEPS = [
  { num: '01', title: 'Submit Application', desc: 'Fill in your details and upload required documents online.' },
  { num: '02', title: 'Provider Review', desc: 'A licensed approver is assigned and reviews your application.' },
  { num: '03', title: 'Get Approved', desc: 'Receive your permit approval number digitally, hassle-free.' },
];

const STATS = [
  { value: '5,200+', label: 'Permits Approved' },
  { value: '120+', label: 'Licensed Providers' },
  { value: '48 hrs', label: 'Avg. Turnaround' },
  { value: '98%', label: 'Satisfaction Rate' },
];

export default function LandingPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchMessage, setSearchMessage] = useState('');
  const [searchResults, setSearchResults] = useState<typeof mockProviders>([]);
  const [searching, setSearching] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);

  const getDistanceKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const radians = (value: number) => value * Math.PI / 180;
    const dLat = radians(lat2 - lat1);
    const dLon = radians(lon2 - lon1);
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(radians(lat1)) * Math.cos(radians(lat2)) * Math.sin(dLon / 2) ** 2;
    return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  const searchServices = (term = searchTerm) => {
    const query = term.trim().toLowerCase();
    if (!query) {
      setSearchMessage('Enter a service such as “house permit” or “renovation permit”.');
      setSearchResults([]);
      return;
    }

    const serviceKey = Object.keys(SERVICE_SEARCH_TERMS).find(term => query.includes(term));
    if (!serviceKey) {
      setSearchMessage('Try New Building Permit, Renovation Permit, Compound Wall, Completion Certificate, or Occupancy Certificate.');
      setSearchResults([]);
      return;
    }

    const savedLocation = localStorage.getItem('leo_location');
    const searchAtLocation = (latitude: number, longitude: number, label: string) => {
      const serviceTypes = SERVICE_SEARCH_TERMS[serviceKey];
      const providers = mockProviders.filter(provider =>
        provider.status === 'active' &&
        provider.latitude && provider.longitude &&
        provider.specializations.some(service => serviceTypes.includes(service)) &&
        getDistanceKm(latitude, longitude, provider.latitude, provider.longitude) <= 5,
      );
      setSearchResults(providers);
      setSearchMessage(providers.length
        ? `${providers.length} provider${providers.length > 1 ? 's' : ''} for ${SERVICE_LABELS[serviceTypes[0]]} near ${label}.`
        : `This service is not available near ${label} yet. We are expanding our coverage.`);
      setSearching(false);
    };

    if (savedLocation) {
      const location = JSON.parse(savedLocation) as { latitude: number; longitude: number; label: string };
      setSearching(true);
      searchAtLocation(location.latitude, location.longitude, location.label);
      return;
    }

    if (!navigator.geolocation) {
      setSearchMessage('Select a location first using the location control above, then search again.');
      return;
    }
    setSearching(true);
    navigator.geolocation.getCurrentPosition(
      position => searchAtLocation(position.coords.latitude, position.coords.longitude, 'your current location'),
      () => { setSearching(false); setSearchMessage('Allow location access or select a pincode above before searching.'); },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 },
    );
  };

  const suggestions = searchTerm.trim()
    ? SEARCH_SUGGESTIONS.filter(item => `${item.label} ${item.query}`.toLowerCase().includes(searchTerm.trim().toLowerCase()))
    : SEARCH_SUGGESTIONS;

  const chooseSuggestion = (query: string) => {
    setSearchTerm(query);
    setSearchFocused(false);
    window.setTimeout(() => searchServices(query), 0);
  };

  return (
    <div className={styles.page}>
      <Navbar />

      {/* HERO */}
      <section className={styles.hero}>
        <div className={styles.heroGrid} />
        <div className={`container ${styles.heroContent}`}>
          <div className={styles.heroText}>
            <h1 className={styles.heroHeading}>
              Build Your Future
              <span className={styles.heroHighlight}> Faster.</span>
            </h1>
            <p className={styles.heroSub}>
              Get building permits, renovation approvals, and occupancy certificates
              processed in hours, not weeks — from trusted Kerala authorities.
            </p>
          </div>

          <div className={styles.searchBox}>
            <div className={styles.searchInner}>
              <MapPin size={18} className={styles.searchIcon} />
              <input
                type="text"
                placeholder="Search permits, services, approvals…"
                className={styles.searchInput}
                value={searchTerm}
                onChange={event => setSearchTerm(event.target.value)}
                onFocus={() => setSearchFocused(true)}
                onKeyDown={event => event.key === 'Enter' && searchServices()}
              />
              {searchFocused && suggestions.length > 0 && (
                <div className={styles.searchSuggestions}>
                  {suggestions.map(suggestion => (
                    <button key={suggestion.label} className={styles.searchSuggestion} onMouseDown={() => chooseSuggestion(suggestion.query)}>
                      <MapPin size={15} />
                      <span className={styles.suggestionText}>
                        <strong>{suggestion.label}</strong>
                        <small>{suggestion.type} service</small>
                      </span>
                      <ArrowRight size={14} />
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button className={`btn btn-primary ${styles.searchBtn}`} onClick={() => searchServices()} disabled={searching}>
              {searching ? 'Checking…' : 'Search'}
            </button>
          </div>

          {(searchMessage || searchResults.length > 0) && (
            <div className={styles.searchResults}>
              <div className={styles.searchResultMessage}>{searchMessage}</div>
              {searchResults.map(provider => (
                <Link key={provider.id} to="/login" className={styles.searchProvider}>
                  <div className={styles.searchProviderAvatar}>{provider.officeName[0]}</div>
                  <div className={styles.searchProviderInfo}>
                    <strong>{provider.officeName}</strong>
                    <span>{provider.area} · ⭐ {provider.rating} · {provider.licenceCategory.replace(/_/g, ' ')}</span>
                  </div>
                  <ArrowRight size={16} />
                </Link>
              ))}
            </div>
          )}

          {/* Feature cards */}
          <div className={styles.cards}>
            {SERVICE_CARDS.map(card => (
              <Link
                to="/login"
                key={card.title}
                className={`${styles.card} ${card.dark ? styles.cardDark : styles.cardLight}`}
              >
                <div className={styles.cardBg}>{card.icon}</div>
                <div className={styles.cardBadge}>{card.badge}</div>
                <div className={styles.cardBody}>
                  <h3>{card.title}</h3>
                  <p>{card.desc}</p>
                  <ul>
                    {card.items.map(i => <li key={i}>{i}</li>)}
                  </ul>
                  <span className={styles.cardCta}>
                    {card.cta} <ArrowRight size={14} />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* POPULAR SERVICES */}
      <section className={styles.services}>
        <div className="container">
          <p className={styles.servicesLabel}>Popular Services</p>
          <div className={styles.serviceChips}>
            {['New Building Permit', 'Renovation Permit', 'Compound / Boundary Wall Permit',
              'Completion Certificate', 'Occupancy Certificate'].map(s => (
              <button key={s} className={styles.chip}>{s}</button>
            ))}
          </div>

        </div>
      </section>

      {/* STATS */}
      <section className={styles.statsSection}>
        <div className="container">
          <div className={styles.statsGrid}>
            {STATS.map(s => (
              <div key={s.label} className={styles.statItem}>
                <div className={styles.statValue}>{s.value}</div>
                <div className={styles.statLabel}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className={styles.howSection}>
        <div className="container">
          <div className={styles.sectionHeader}>
            <p className={styles.sectionTag}><Zap size={14} /> How It Works</p>
            <h2 className={styles.sectionTitle}>Get your permit in 3 simple steps</h2>
          </div>
          <div className={styles.stepsGrid}>
            {STEPS.map((step, i) => (
              <div key={step.num} className={styles.stepCard}>
                <div className={styles.stepNum}>{step.num}</div>
                <h3>{step.title}</h3>
                <p>{step.desc}</p>
                {i < STEPS.length - 1 && <div className={styles.stepArrow}><ChevronRight size={20} /></div>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PORTALS CTA */}
      <section className={styles.ctaSection}>
        <div className="container">
          <div className={styles.ctaGrid}>
            {/* Customer CTA */}
            <div className={styles.ctaCard}>
              <div className={styles.ctaIcon} style={{ background: '#fff7ed' }}>
                <Phone size={28} style={{ color: 'var(--primary)' }} />
              </div>
              <h3>Are you a Customer?</h3>
              <p>Apply for building permits, track your application status, and get approvals — all online.</p>
              <ul className={styles.ctaList}>
                {['New Building Permit', 'Renovation Permit', 'Compound / Boundary Wall', 'Completion & Occupancy Certificates'].map(f => (
                  <li key={f}><CheckCircle2 size={15} />{f}</li>
                ))}
              </ul>
              <Link to="/get-started" className={`btn btn-primary ${styles.ctaBtn}`}>
                Sign Up as Customer <ArrowRight size={16} />
              </Link>
            </div>

            {/* Provider CTA */}
            <div className={`${styles.ctaCard} ${styles.ctaCardDark}`}>
              <div className={styles.ctaIcon} style={{ background: 'rgba(255,255,255,0.1)' }}>
                <Shield size={28} style={{ color: 'white' }} />
              </div>
              <h3>Are you a Service Provider?</h3>
              <p>Join our network of licensed approvers. Get verified and start processing permit applications.</p>
              <ul className={styles.ctaList}>
                {['Review permit applications', 'Manage approvals online', 'Build your reputation', 'Earn with every approval'].map(f => (
                  <li key={f}><CheckCircle2 size={15} />{f}</li>
                ))}
              </ul>
              <Link to="/login?role=provider" className={`btn ${styles.ctaBtnWhite}`}>
                Login as Provider <ArrowRight size={16} />
              </Link>
              <p className={styles.ctaNote}>
                <Star size={12} /> Provider accounts are added by our admin team only.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className={styles.footer}>
        <div className="container">
          <div className={styles.footerTop}>
            <div className={styles.footerBrand}>
              <div className={styles.footerLogo}><FileCheck2 size={20} /></div>
              <div>
                <div className={styles.footerBrandName}>LEO</div>
                <div className={styles.footerBrandSub}>Building Permit Services</div>
              </div>
            </div>
            <div className={styles.footerLinks}>
              <div className={styles.footerGroup}>
                <h4>Services</h4>
                <a href="#">New Building Permit</a>
                <a href="#">Renovation Permit</a>
                <a href="#">Compound Wall Permit</a>
                <a href="#">Completion Certificate</a>
                <a href="#">Occupancy Certificate</a>
              </div>
              <div className={styles.footerGroup}>
                <h4>Portals</h4>
                <Link to="/login">Customer Login</Link>
                <Link to="/login?role=provider">Provider Login</Link>
                <Link to="/admin">Admin Portal</Link>
              </div>
              <div className={styles.footerGroup}>
                <h4>Support</h4>
                <a href="#">Help Center</a>
                <a href="#">Contact Us</a>
                <a href="#">Privacy Policy</a>
                <a href="#">Terms of Service</a>
              </div>
            </div>
          </div>
          <div className={styles.footerBottom}>
            <p>© 2024 LEO. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
