import { Link } from 'react-router-dom';
import { Building2, User, Shield, ArrowRight, CheckCircle2 } from 'lucide-react';
import Navbar from '../../components/Navbar/Navbar';
import styles from './GetStartedPage.module.css';

export default function GetStartedPage() {
  return (
    <div className={styles.page}>
      <Navbar />
      <div className={styles.body}>
        <div className={styles.header}>
          <h1 className={styles.title}>Get Started with LEO</h1>
          <p className={styles.sub}>Choose how you'd like to join our platform</p>
        </div>

        <div className={styles.cards}>

          {/* Customer Card */}
          <Link to="/signup" className={styles.card}>
            <div className={styles.cardIcon} style={{ background: '#fff7ed', color: 'var(--primary)' }}>
              <User size={36} />
            </div>
            <h2>I'm a Customer</h2>
            <p>Apply for building permits, track your applications and get approvals online.</p>
            <ul className={styles.featureList}>
              {['Submit permit applications', 'Upload documents digitally', 'Choose your service provider', 'Track real-time status'].map(f => (
                <li key={f}><CheckCircle2 size={14} />{f}</li>
              ))}
            </ul>
            <div className={styles.cta}>
              Sign up as Customer <ArrowRight size={16} />
            </div>
          </Link>

          {/* Provider Card */}
          <Link to="/provider-register" className={`${styles.card} ${styles.cardDark}`}>
            <div className={styles.cardIcon} style={{ background: 'rgba(255,255,255,0.12)', color: 'white' }}>
              <Shield size={36} />
            </div>
            <h2>I'm a Service Provider</h2>
            <p>Register as a KPBR-licensed permit approver. Your application will be reviewed and activated by our team.</p>
            <ul className={styles.featureList}>
              {['Register your licence details', 'Get verified by our team', 'Receive permit applications', 'Earn with every approval'].map(f => (
                <li key={f}><CheckCircle2 size={14} />{f}</li>
              ))}
            </ul>
            <div className={styles.cta}>
              Apply as Provider <ArrowRight size={16} />
            </div>
            <p className={styles.note}>
              <Building2 size={12} /> Accounts are activated after licence verification by our admin team.
            </p>
          </Link>

        </div>

        <p className={styles.loginLine}>
          Already have an account? <Link to="/login">Log in here</Link>
        </p>
      </div>
    </div>
  );
}
