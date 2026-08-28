import { Link } from 'react-router-dom';
import { ArrowLeft, BookOpen, Users, Shield, HardHat, FileCheck2, FileText, Download, ChevronRight } from 'lucide-react';
import Navbar from '../../components/Navbar/Navbar';
import styles from './Resources.module.css';

const MANUALS = [
  {
    title: 'Citizen Application Guide',
    audience: 'For Citizens / Customers',
    color: '#2563eb',
    bg: '#eff6ff',
    Icon: Users,
    steps: [
      'Register using your mobile number via OTP',
      'Select the permit type you need (New Building, Renovation, etc.)',
      'Fill in property details: location, plot area, building dimensions',
      'Upload required documents: plot sketch, site plan, ownership proof, ID',
      'Submit the application and note your Reference Number',
      'Track your application status in "My Applications"',
      'Respond to any queries raised by the assigned officer',
      'Download the approved permit from the portal once issued',
    ],
    docs: [
      'Patta / Chitta (land ownership)',
      'Approved Plot Sketch / Survey sketch',
      'Site Plan and Floor Plan (signed by licensed engineer/architect)',
      'ID proof (Aadhaar)',
      'NOC from Fire Department (for commercial, above G+2)',
      'CRZ clearance (if coastal zone)',
    ],
  },
  {
    title: 'Licensed Provider Guide',
    audience: 'For Engineers & Architects',
    color: '#ea580c',
    bg: '#fff7ed',
    Icon: HardHat,
    steps: [
      'Register as a Provider using your professional credentials',
      'Upload your license number, council registration, and Aadhaar',
      'Wait for Admin verification (usually 2–3 working days)',
      'Once activated, you will receive application assignments',
      'Log in to Provider Portal to view assigned applications',
      'Conduct site visit and upload site visit report with photos',
      'Submit technical recommendations to the staff officer',
      'Track assigned applications and compliance status',
    ],
    docs: [
      'Kerala/State Council Registration Certificate',
      'Professional license (Civil Engineer / Architect)',
      'Aadhaar card',
      'Bank account details for payment',
      'Professional indemnity insurance (recommended)',
    ],
  },
  {
    title: 'Staff Officer Guide',
    audience: 'For Govt. Staff / Officers',
    color: '#7c3aed',
    bg: '#f5f3ff',
    Icon: Shield,
    steps: [
      'Login using your official mobile number provided by admin',
      'View applications assigned to you in the Staff Dashboard',
      'Review submitted documents and application details',
      'Assign the application to a licensed provider for site inspection',
      'Review the provider\'s site visit report and recommendations',
      'Raise queries to applicant if documents are incomplete',
      'Approve or reject the application with written reason',
      'Issue the permit digitally — applicant is notified automatically',
    ],
    docs: [],
  },
  {
    title: 'Admin Portal Guide',
    audience: 'For Portal Administrators',
    color: '#0f766e',
    bg: '#f0fdfa',
    Icon: FileCheck2,
    steps: [
      'Access Admin Portal using admin credentials',
      'Manage provider registrations — verify licenses and activate accounts',
      'Monitor all applications across the portal in "All Applications"',
      'Assign staff officers to applications from the admin panel',
      'View reports: approved/rejected/pending breakdowns by period',
      'Manage staff accounts and set role permissions',
      'Configure fee schedules and system settings',
      'Export application data for government reporting',
    ],
    docs: [],
  },
  {
    title: 'Document Checklist',
    audience: 'Required Documents by Permit Type',
    color: '#15803d',
    bg: '#f0fdf4',
    Icon: FileText,
    steps: [
      '🏠 New Building Permit: Ownership proof, Site plan, Floor plan, NOC from adjacent owners',
      '🔨 Renovation Permit: Existing building plan, Proposed changes plan, Structural certificate',
      '📋 Occupancy Certificate: As-built plan, Completion report from engineer, Fire NOC',
      '🏢 Commercial Permit: Business registration, Fire NOC, Lift NOC (if applicable)',
      '🌊 CRZ Zone: CRZ clearance from State Coastal Committee, Environmental report',
      '🏛️ Heritage Zone: Heritage Committee NOC, Colour and material scheme report',
    ],
    docs: [],
  },
  {
    title: 'FAQ & Troubleshooting',
    audience: 'Common questions and solutions',
    color: '#b45309',
    bg: '#fffbeb',
    Icon: BookOpen,
    steps: [
      '❓ Forgot OTP? — Request new OTP after 60 seconds on the login screen',
      '❓ Application rejected? — Check the rejection reason in "My Applications" details',
      '❓ Document upload failing? — Ensure files are under 5MB, JPG/PNG/PDF format',
      '❓ Wrong phone number registered? — Contact admin with your application reference',
      '❓ Provider not yet activated? — Admin reviews within 2–3 working days; check back later',
      '❓ Track application without login? — Use "Track Application" in the navbar with your reference number',
      '❓ Need refund? — Refunds are processed by the local body; contact them directly',
    ],
    docs: [],
  },
];

export default function UserManualsPage() {
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
              <h1 className={styles.heroTitle}>User Manuals & Guides</h1>
              <p className={styles.heroSub}>
                Step-by-step guides for citizens, providers, staff, and administrators.
                Everything you need to navigate the LEO Permit Portal.
              </p>
            </div>
          </div>

          {/* Quick nav */}
          <div style={{ display: 'flex', gap: 10, marginTop: 24, flexWrap: 'wrap' }}>
            {MANUALS.map(m => (
              <a
                key={m.title}
                href={`#${m.title.replace(/\s+/g, '-')}`}
                style={{
                  background: 'rgba(255,255,255,0.15)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  color: 'white',
                  padding: '6px 14px',
                  borderRadius: 20,
                  fontSize: 12,
                  fontWeight: 600,
                  textDecoration: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                  transition: 'background 0.15s',
                }}
              >
                <m.Icon size={13} /> {m.title}
              </a>
            ))}
          </div>
        </div>
      </div>

      <div className={styles.content}>
        <h2 className={styles.sectionTitle}>All Guides</h2>
        <p className={styles.sectionSub}>Select a guide below to jump to that section.</p>

        <div className={styles.manualsGrid}>
          {MANUALS.map(manual => (
            <div key={manual.title} id={manual.title.replace(/\s+/g, '-')} className={styles.manualCard}>
              <div className={styles.manualCardHeader}>
                <div className={styles.manualIcon} style={{ background: manual.bg, color: manual.color }}>
                  <manual.Icon size={22} />
                </div>
                <div>
                  <p className={styles.manualTitle}>{manual.title}</p>
                  <p className={styles.manualAudience}>{manual.audience}</p>
                </div>
              </div>
              <div className={styles.manualSteps}>
                {manual.steps.map((step, i) => (
                  <div key={i} className={styles.manualStep}>
                    <div className={styles.manualStepNum} style={{ background: manual.bg, color: manual.color }}>
                      {i + 1}
                    </div>
                    <span>{step}</span>
                  </div>
                ))}

                {manual.docs.length > 0 && (
                  <div style={{ marginTop: 16, padding: '12px', background: '#f8fafc', borderRadius: 8 }}>
                    <p style={{ fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Required Documents
                    </p>
                    {manual.docs.map((doc, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#64748b', marginBottom: 5 }}>
                        <ChevronRight size={12} color="#2563eb" style={{ flexShrink: 0 }} />
                        {doc}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Download section */}
        <div style={{ background: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)', borderRadius: 16, padding: '32px', color: 'white', marginTop: 40, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24, flexWrap: 'wrap' }}>
          <div>
            <h3 style={{ margin: '0 0 8px', fontSize: 22, fontWeight: 800 }}>Need Offline Copies?</h3>
            <p style={{ margin: 0, color: 'rgba(255,255,255,0.8)', fontSize: 14 }}>
              Print this page or save as PDF using your browser's print function (Ctrl+P).
            </p>
          </div>
          <button
            onClick={() => window.print()}
            style={{ background: 'white', color: '#1d4ed8', border: 'none', borderRadius: 10, padding: '12px 24px', fontSize: 14, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}
          >
            <Download size={16} /> Print / Save as PDF
          </button>
        </div>
      </div>
    </div>
  );
}
