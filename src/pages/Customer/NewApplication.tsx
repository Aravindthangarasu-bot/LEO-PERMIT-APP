import { useState, Fragment } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle2, AlertCircle, Star, MapPin, AlertTriangle } from 'lucide-react';
import { PERMIT_TYPES, REQUIRED_DOCS } from '../../data/mockData';
import { getLicenceById, canHandleBuilding, getIneligibilityReason } from '../../data/licenceData';
import { useAppStore, isLicenceExpired } from '../../context/AppStoreContext';
import { useAuth } from '../../context/AuthContext';
import DocumentUpload, { type UploadedFile } from '../../components/DocumentUpload/DocumentUpload';
import { CustomerApplicationSchema, sanitizeInput } from '../../utils/validation';
import styles from './Customer.module.css';

const STEPS = ['Select Service', 'Property Details', 'Documents', 'Choose Provider'];

export default function NewApplication() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { addApplication, providers } = useAppStore();
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    type: searchParams.get('type') ?? '',
    description: '',
    address: '',
    pincode: '',
    area: '',
    landmark: '',
    buildingArea: '',
    floors: '',
    heightM: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [selectedProvider, setSelectedProvider] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const [uploadedDocs, setUploadedDocs] = useState<Record<string, UploadedFile | null>>(
    () => Object.fromEntries(REQUIRED_DOCS.map(d => [d, null]))
  );
  const [newAppId, setNewAppId] = useState('');

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    let val = e.target.value;
    if (k === 'pincode' || k === 'floors' || k === 'buildingArea' || k === 'heightM') {
      val = val.replace(/[^\d.]/g, ''); // Numbers only
    } else {
      val = sanitizeInput(val); // XSS sanitization
    }
    setForm(f => ({ ...f, [k]: val }));
  };

  // Only show active providers with a valid (non-expired) licence
  const activeProviders = providers.filter(p => p.status === 'active' && !isLicenceExpired(p));
  const buildingArea = parseFloat(form.buildingArea) || undefined;
  const floors       = parseInt(form.floors) || undefined;
  const heightM      = parseFloat(form.heightM) || undefined;

  const areaMatched = activeProviders.filter(p =>
    p.area.toLowerCase().includes(form.area.toLowerCase()) ||
    p.landmarks.some(l => l.toLowerCase().includes(form.landmark.toLowerCase())) ||
    form.landmark.toLowerCase().includes(p.area.toLowerCase()) ||
    form.area === ''
  );
  const baseProviders = areaMatched.length > 0 ? areaMatched : activeProviders;
  const displayProviders = baseProviders.map(p => {
    const licence = getLicenceById(p.licenceCategory ?? '');
    const eligible = licence ? canHandleBuilding(licence, buildingArea, floors, heightM) : true;
    const reason   = licence ? getIneligibilityReason(licence, buildingArea, floors, heightM) : null;
    return { ...p, licence, eligible, reason };
  });
  const eligibleProviders   = displayProviders.filter(p => p.eligible);
  const ineligibleProviders = displayProviders.filter(p => !p.eligible);

  const validate = (s: number) => {
    const e: Record<string, string> = {};
    
    const validateField = (field: string, value: string) => {
      const schema = CustomerApplicationSchema.shape[field as keyof typeof CustomerApplicationSchema.shape];
      if (schema) {
        const res = schema.safeParse(value);
        if (!res.success) return res.error.errors[0].message;
      }
      return null;
    };

    if (s === 1) {
      const typeErr = validateField('permitType', form.type);
      if (typeErr) e.type = typeErr;
      const descErr = validateField('description', form.description);
      if (descErr) e.description = descErr;
    }
    
    if (s === 2) {
      const addrErr = validateField('address', form.address);
      if (addrErr) e.address = addrErr;
      const areaErr = validateField('area', form.area);
      if (areaErr) e.area = areaErr;
      const pinErr = validateField('pincode', form.pincode);
      if (pinErr) e.pincode = pinErr;
      const landErr = validateField('landmark', form.landmark);
      if (landErr) e.landmark = landErr;
    }

    if (s === 4 && !selectedProvider) e.provider = 'Please select a service provider';
    
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleNext = () => { if (validate(step)) setStep(s => s + 1); };

  const handleSubmit = () => {
    if (!validate(4)) return;
    const provider = providers.find(p => p.id === selectedProvider);
    const appId = `APP-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    setNewAppId(appId);
    addApplication({
      id: appId,
      customerId: user?.id ?? 'guest',
      customerName: user?.name ?? 'Customer',
      customerPhone: user?.phone ?? '',
      type: form.type as any,
      status: 'pending',
      submittedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      address: form.address,
      landmark: form.landmark,
      description: form.description,
      documents: Object.entries(uploadedDocs)
        .filter(([, f]) => f !== null)
        .map(([name, f]) => ({
          id: f!.id,
          name,
          type: f!.mimeType.split('/').pop() ?? 'file',
          uploadedAt: new Date().toISOString(),
          status: 'pending' as const,
          url: f!.url,
          sizeBytes: f!.sizeBytes,
        })),
      assignedProviderId: provider?.id,
      assignedProviderName: provider?.officeName ?? provider?.name,
    });
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className={`page-enter ${styles.page}`}>
        <div className={styles.successWrap}>
          <div className={styles.successIcon}><CheckCircle2 size={56} /></div>
          <h2>Application Submitted!</h2>
          <p>Your application has been sent to the selected provider. You'll receive an SMS update once they review your documents.</p>
          <div className={styles.appNumBox}><span>Application ID</span><strong>{newAppId}</strong></div>
          <div className={styles.successBtns}>
            <button className="btn btn-primary" onClick={() => navigate('/customer/applications')}>View My Applications</button>
            <button className="btn btn-outline" onClick={() => { setSubmitted(false); setStep(1); setForm({ type: '', description: '', address: '', pincode: '', area: '', landmark: '', buildingArea: '', floors: '', heightM: '' }); setSelectedProvider(''); }}>New Application</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`page-enter ${styles.page}`}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>New Application</h1>
          <p className={styles.pageSub}>Complete all 4 steps to submit your application</p>
        </div>
      </div>

      {/* Stepper */}
      <div className={styles.stepper}>
        {STEPS.map((s, i) => (
          <Fragment key={s}>
            <div className={`${styles.step} ${step > i + 1 ? styles.stepDone : step === i + 1 ? styles.stepActive : ''}`}>
              <div className={styles.stepCircle}>{step > i + 1 ? <CheckCircle2 size={16} /> : i + 1}</div>
              <span>{s}</span>
            </div>
            {i < STEPS.length - 1 && <div className={`${styles.stepLine} ${step > i + 1 ? styles.stepLineDone : ''}`} />}
          </Fragment>
        ))}
      </div>

      <div className={`card ${styles.formCard}`}>

        {/* STEP 1 — Select Service */}
        {step === 1 && (
          <div>
            <h3 className={styles.stepTitle}>Step 1: Select Service</h3>
            <div className={styles.serviceGrid}>
              {PERMIT_TYPES.map(p => (
                <button
                  key={p.value}
                  className={`${styles.serviceSelectTile} ${form.type === p.value ? styles.serviceSelectActive : ''}`}
                  onClick={() => setForm(f => ({ ...f, type: p.value }))}
                >
                  <span className={styles.tileEmoji}>{p.icon}</span>
                  <span>{p.label}</span>
                  {form.type === p.value && <CheckCircle2 size={16} className={styles.tileCheck} />}
                </button>
              ))}
            </div>
            {errors.type && <p className={styles.fieldError}><AlertCircle size={13} /> {errors.type}</p>}

            <div className="form-group" style={{ marginTop: 24 }}>
              <label className="form-label">Project Description</label>
              <textarea className="form-input" rows={3} placeholder="e.g. Property at 45 MG Road, Thrissur — applying for new 2-storey house construction on 5 cents plot near railway station." value={form.description} onChange={set('description')} style={{ resize: 'vertical' }} />
              {errors.description && <p className={styles.fieldError}><AlertCircle size={13} /> {errors.description}</p>}
            </div>
          </div>
        )}

        {/* STEP 2 — Property Details */}
        {step === 2 && (
          <div>
            <h3 className={styles.stepTitle}>Step 2: Property Details</h3>
            <div className={styles.formGrid2}>
              <div className="form-group">
                <label className="form-label">Property Address</label>
                <textarea className="form-input" rows={2} placeholder="Door no., Street, City" value={form.address} onChange={set('address')} />
                {errors.address && <p className={styles.fieldError}><AlertCircle size={13} /> {errors.address}</p>}
              </div>
              <div className="form-group">
                <label className="form-label">Pincode</label>
                <input className="form-input" type="text" maxLength={6} placeholder="6-digit pincode" value={form.pincode} onChange={e => setForm(f => ({ ...f, pincode: e.target.value.replace(/\D/g, '') }))} />
              </div>
              <div className="form-group">
                <label className="form-label">City / Area</label>
                <input className="form-input" type="text" placeholder="e.g. Thrissur" value={form.area} onChange={set('area')} />
              </div>
              <div className="form-group">
                <label className="form-label"><MapPin size={13} /> Landmark of Proposed Site</label>
                <input className="form-input" type="text" placeholder="e.g. Near Thrissur Railway Station" value={form.landmark} onChange={set('landmark')} />
                {errors.landmark && <p className={styles.fieldError}><AlertCircle size={13} /> {errors.landmark}</p>}
                <p className={styles.hintText}>Used to match you with the nearest service provider.</p>
              </div>
            </div>

            {/* Building specs — used to filter providers by KPBR licence limits */}
            <div className={styles.specsBox}>
              <h4 className={styles.specsTitle}>Building Specifications <span>(used to match eligible providers)</span></h4>
              <div className={styles.specsGrid}>
                <div className="form-group">
                  <label className="form-label">Total Built-up Area (m²)</label>
                  <input className="form-input" type="number" placeholder="e.g. 250" min="1"
                    value={form.buildingArea} onChange={set('buildingArea')} />
                </div>
                <div className="form-group">
                  <label className="form-label">Number of Floors</label>
                  <input className="form-input" type="number" placeholder="e.g. 2" min="1" max="20"
                    value={form.floors} onChange={set('floors')} />
                </div>
                <div className="form-group">
                  <label className="form-label">Building Height (m)</label>
                  <input className="form-input" type="number" placeholder="e.g. 7.5" min="1"
                    value={form.heightM} onChange={set('heightM')} />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3 — Documents */}
        {step === 3 && (
          <div>
            <h3 className={styles.stepTitle}>Step 3: Upload Documents</h3>
            <p className={styles.docsNote}>The following documents are required for all Kerala permit services.</p>
            {REQUIRED_DOCS.map(doc => (
              <DocumentUpload
                key={doc}
                label={doc}
                value={uploadedDocs[doc]}
                onChange={file => setUploadedDocs(prev => ({ ...prev, [doc]: file }))}
                hint="PDF, JPG or PNG · max 5 MB"
              />
            ))}
            <p className={styles.docDisclaimer}>* You can also upload documents later. Your application will be marked as "Documents Pending" until all documents are received.</p>
          </div>
        )}

        {/* STEP 4 — Choose Provider */}
        {step === 4 && (
          <div>
            <h3 className={styles.stepTitle}>Step 4: Choose Service Provider</h3>
            <p className={styles.docsNote}>
              Providers are matched by your landmark: <strong>{form.landmark || form.area || 'All areas'}</strong>
              {(buildingArea || floors || heightM) && (
                <> and filtered by your building specs:
                  {buildingArea && <strong> {buildingArea} m²</strong>}
                  {floors && <strong> / {floors} floors</strong>}
                  {heightM && <strong> / {heightM} m</strong>}
                </>
              )}
            </p>
            {errors.provider && <p className={styles.fieldError}><AlertCircle size={13} /> {errors.provider}</p>}

            {/* Eligible providers */}
            {eligibleProviders.length > 0 && (
              <div className={styles.providerList}>
                {eligibleProviders.map(p => (
                  <button
                    key={p.id}
                    className={`${styles.providerSelectCard} ${selectedProvider === p.id ? styles.providerSelectActive : ''}`}
                    onClick={() => setSelectedProvider(p.id)}
                  >
                    <div className={styles.providerSelectAvatar}>{p.officeName[0]}</div>
                    <div className={styles.providerSelectInfo}>
                      <div className={styles.providerSelectName}>{p.officeName}</div>
                      <div className={styles.providerSelectMeta}>
                        <MapPin size={12} /> {p.area}
                        <span style={{ marginLeft: 12 }}><Star size={12} style={{ fill: '#f59e0b', color: '#f59e0b' }} /> {p.rating || 'New'}</span>
                        <span style={{ marginLeft: 12 }}>✅ {p.totalApprovals} approvals</span>
                      </div>
                      <div className={styles.licenceLine}>
                        🏛️ <strong>{p.licence?.label}</strong>
                        {p.licence && !p.licence.unlimited && (
                          <span className={styles.licenceLimits}> · max {p.licence.maxArea} m² / {p.licence.maxFloors} floors</span>
                        )}
                        {p.licence?.unlimited && <span className={styles.licenceUnlimited}> · No size limit</span>}
                      </div>
                      <div className={styles.providerLandmarks}>
                        {p.landmarks.slice(0, 2).map(l => <span key={l} className={styles.landmarkTag}>{l}</span>)}
                      </div>
                    </div>
                    {selectedProvider === p.id && <CheckCircle2 size={22} className={styles.tileCheck} />}
                  </button>
                ))}
              </div>
            )}

            {/* Ineligible providers — shown greyed with reason */}
            {ineligibleProviders.length > 0 && (
              <div style={{ marginTop: 20 }}>
                <div className={styles.ineligibleHeader}>
                  <AlertTriangle size={14} />
                  <span>The following providers cannot handle your building size (KPBR licence limits):</span>
                </div>
                <div className={styles.providerList}>
                  {ineligibleProviders.map(p => (
                    <div key={p.id} className={styles.providerIneligible}>
                      <div className={styles.providerSelectAvatar} style={{ opacity: 0.4 }}>{p.officeName[0]}</div>
                      <div className={styles.providerSelectInfo} style={{ opacity: 0.5 }}>
                        <div className={styles.providerSelectName}>{p.officeName}</div>
                        <div className={styles.licenceLine}>🏛️ <strong>{p.licence?.label}</strong></div>
                      </div>
                      <span className={styles.ineligibleTag}><AlertTriangle size={11} /> {p.reason}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <div className={styles.stepActions}>
          {step > 1 && <button className="btn btn-outline" onClick={() => setStep(s => s - 1)}>Back</button>}
          {step < 4
            ? <button className="btn btn-primary" onClick={handleNext}>Continue →</button>
            : <button className="btn btn-primary" onClick={handleSubmit}>Submit Application</button>
          }
        </div>
      </div>
    </div>
  );
}

