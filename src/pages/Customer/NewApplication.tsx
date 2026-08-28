import { useState, Fragment, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle2, AlertCircle, Star, MapPin, AlertTriangle } from 'lucide-react';
import { PERMIT_TYPES, REQUIRED_DOCS } from '../../data/mockData';
import { getLicenceById, canHandleBuilding, getIneligibilityReason } from '../../data/licenceData';
import { useAppStore, isLicenceExpired } from '../../context/AppStoreContext';
import { useAuth } from '../../context/AuthContext';
import DocumentUpload, { type UploadedFile } from '../../components/DocumentUpload/DocumentUpload';
import { CustomerApplicationSchema, sanitizeInput } from '../../utils/validation';
import styles from './Customer.module.css';
import { lookupPincode, normalizeLocation, rankProvidersByFairness, type PincodeLocation } from '../../utils/pincode';

const STEPS = ['Select Service', 'Property Details', 'Documents', 'Choose Provider'];

export default function NewApplication() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { addApplication, applications, providers, getAppsForUser } = useAppStore();
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    type: searchParams.get('type') ?? '',
    description: '',
    address: '',
    pincode: '',
    area: '',
    taluk: '',
    district: '',
    landmark: '',
    buildingArea: '',
    floors: '',
    heightM: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [selectedProvider, setSelectedProvider] = useState('');
  const [secondarySearchText, setSecondarySearchText] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [pincodeLocation, setPincodeLocation] = useState<PincodeLocation | null>(null);
  const [pincodeOptions, setPincodeOptions] = useState<PincodeLocation[]>([]);
  const [pincodeLookupState, setPincodeLookupState] = useState<'idle' | 'loading' | 'not_found' | 'error'>('idle');
  const [providerPage, setProviderPage] = useState(1);
  const [providerSearch, setProviderSearch] = useState('');
  const [searchDistrict, setSearchDistrict] = useState('');
  const [searchTaluk, setSearchTaluk] = useState('');

  const [uploadedDocs, setUploadedDocs] = useState<Record<string, UploadedFile | null>>(
    () => Object.fromEntries(REQUIRED_DOCS.map(d => [d, null]))
  );
  const [newAppId, setNewAppId] = useState('');
  const walletDocuments = (user ? getAppsForUser(user) : []).flatMap(application =>
    application.documents
      .filter(document => Boolean(document.url))
      .map(document => ({ ...document, applicationId: application.id }))
  );

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    let val = e.target.value;
    if (k === 'pincode' || k === 'floors' || k === 'buildingArea' || k === 'heightM') {
      val = val.replace(/[^\d.]/g, ''); // Numbers only
    } else {
      val = sanitizeInput(val); // XSS sanitization
    }
    setForm(f => ({ ...f, [k]: val }));
    if (k === 'pincode' || k === 'buildingArea' || k === 'floors' || k === 'heightM') {
      setSelectedProvider('');
    }
    setErrors(current => {
      const next = { ...current };
      delete next.submission;
      delete next.provider;
      return next;
    });
  };

  useEffect(() => {
    let cancelled = false;
    if (!/^\d{6}$/.test(form.pincode)) {
      setPincodeLocation(null);
      setPincodeOptions([]);
      setPincodeLookupState('idle');
      return;
    }
    setPincodeLookupState('loading');
    lookupPincode(form.pincode).then(result => {
      if (cancelled) return;
      setPincodeLocation(result?.primary ?? null);
      setPincodeOptions(result?.options ?? []);
      setPincodeLookupState(result ? 'idle' : 'not_found');
      if (result) setForm(current => ({ ...current, area: result.primary.city, taluk: result.primary.taluk, district: result.primary.district }));
    }).catch(() => {
      if (!cancelled) setPincodeLookupState('error');
    });
    return () => { cancelled = true; };
  }, [form.pincode]);

  useEffect(() => {
    setProviderPage(1);
  }, [form.pincode, form.buildingArea, form.floors, form.heightM, providerSearch]);

  // Only show active providers with a valid (non-expired) licence
  const activeProviders = providers.filter(p => p.status === 'active' && !isLicenceExpired(p));
  const buildingArea = parseFloat(form.buildingArea) || undefined;
  const floors       = parseInt(form.floors) || undefined;
  const heightM      = parseFloat(form.heightM) || undefined;

  const normalizedPincode = form.pincode.trim();
  const exactProviders = activeProviders.filter(provider =>
    /^\d{6}$/.test(normalizedPincode) &&
    [{ pincode: provider.pincode, city: provider.city, taluk: provider.taluk, district: provider.district }, ...(provider.serviceAreas ?? [])]
      .some(area => area.pincode === normalizedPincode &&
        (!area.city || normalizeLocation(area.city) === normalizeLocation(pincodeLocation?.city) || normalizeLocation(area.city) === normalizeLocation(pincodeLocation?.district)) &&
        (!area.taluk || normalizeLocation(area.taluk) === normalizeLocation(pincodeLocation?.taluk)) &&
        (!area.district || normalizeLocation(area.district) === normalizeLocation(pincodeLocation?.district)))
  );
  const searchNeedle = normalizeLocation(providerSearch);
  const searchDist = normalizeLocation(searchDistrict);
  const searchTal = normalizeLocation(searchTaluk);
  
  const searchedProviders = (searchNeedle || searchDist || searchTal) ? activeProviders.filter(provider => {
    const matchesSearch = searchNeedle ? [provider.officeName, provider.city, provider.taluk, provider.district, provider.area, provider.pincode, ...(provider.serviceAreas ?? []).flatMap(area => [area.city, area.taluk, area.district, area.pincode])].some(value => normalizeLocation(value).includes(searchNeedle)) : true;
    const matchesDistrict = searchDist ? [provider.district, ...(provider.serviceAreas ?? []).map(a => a.district)].some(value => normalizeLocation(value) === searchDist) : true;
    const matchesTaluk = searchTal ? [provider.taluk, ...(provider.serviceAreas ?? []).map(a => a.taluk)].some(value => normalizeLocation(value) === searchTal) : true;
    return matchesSearch && matchesDistrict && matchesTaluk;
  }) : [];
  const providerPool = (searchNeedle || searchDist || searchTal) ? searchedProviders : exactProviders;
  const displayProviders = providerPool.map(p => {
    const licence = getLicenceById(p.licenceCategory ?? '');
    const eligible = licence ? canHandleBuilding(licence, buildingArea, floors, heightM) : true;
    const reason   = licence ? getIneligibilityReason(licence, buildingArea, floors, heightM) : null;
    return { ...p, licence, eligible, reason };
  });
  const eligibleProviders   = rankProvidersByFairness(displayProviders.filter(p => p.eligible), applications);
  const ineligibleProviders = displayProviders.filter(p => !p.eligible);
  const providersPerPage = 8;
  const providerPageCount = Math.max(1, Math.ceil(eligibleProviders.length / providersPerPage));
  const visibleProviders = eligibleProviders.slice((providerPage - 1) * providersPerPage, providerPage * providersPerPage);

  const secondaryProviders = secondarySearchText.length >= 3 
    ? rankProvidersByFairness(
        activeProviders.filter(p => 
          (p.taluk && p.taluk.toLowerCase().includes(secondarySearchText.toLowerCase())) ||
          (p.district && p.district.toLowerCase().includes(secondarySearchText.toLowerCase())) ||
          (p.city && p.city.toLowerCase().includes(secondarySearchText.toLowerCase()))
        ).map(p => {
          const licence = getLicenceById(p.licenceCategory ?? '');
          const eligible = licence ? canHandleBuilding(licence, buildingArea, floors, heightM) : true;
          return { ...p, licence, eligible };
        }).filter(p => p.eligible),
        applications
      )
    : [];

  const validate = (s: number) => {
    const e: Record<string, string> = {};
    
    const validateField = (field: string, value: string) => {
      const schema = CustomerApplicationSchema.shape[field as keyof typeof CustomerApplicationSchema.shape];
      if (schema) {
        const res = schema.safeParse(value);
        if (!res.success) return res.error.issues[0].message;
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

    if (s === 4) {
      if (eligibleProviders.length > 0 && !eligibleProviders.some(provider => provider.id === selectedProvider)) {
        e.provider = 'Please select a service provider';
      } else if (eligibleProviders.length === 0 && selectedProvider && !secondaryProviders.some(p => p.id === selectedProvider)) {
        e.provider = 'Please select a valid service provider from the search results';
      }
    }
    
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleNext = () => { if (validate(step)) setStep(s => s + 1); };

  const handleSubmit = async () => {
    if (!validate(4)) return;
    const provider = providers.find(p => p.id === selectedProvider);
    
    const phoneStr = user?.phone ?? 'GUEST';
    const appId = `APP-${phoneStr}-${Date.now().toString(36).toUpperCase()}`;
    
    setSubmitting(true);
    setErrors(current => ({ ...current, submission: '' }));
    const saved = await addApplication({
      id: appId,
      customerId: user?.id ?? 'guest',
      customerName: user?.name ?? 'Customer',
      customerPhone: user?.phone ?? '',
      type: form.type as any,
      status: 'pending',
      submittedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      address: form.address,
      city: form.area,
      taluk: form.taluk,
      district: form.district,
      landmark: form.landmark,
      description: form.description,
      documents: Object.entries(uploadedDocs)
        .filter(([, f]) => f !== null)
        .map(([name, f]) => ({
          id: f!.id,
          name,
          type: f!.mimeType.split('/').pop() ?? 'file',
          uploadedAt: new Date().toISOString(),
          uploadedBy: 'customer' as const,
          status: 'pending' as const,
          url: f!.url,
          sizeBytes: f!.sizeBytes,
        })),
      assignedProviderId: provider?.id,
      assignedProviderName: provider?.officeName ?? provider?.name,
    });
    setSubmitting(false);
    if (!saved) {
      setErrors(current => ({ ...current, submission: 'Failed to submit the application. Please try again.' }));
      return;
    }
    setNewAppId(appId);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className={`page-enter ${styles.page}`}>
        <div className={styles.successWrap}>
          <div className={styles.successIcon}><CheckCircle2 size={56} /></div>
          <h2>Application Submitted!</h2>
          <p>{selectedProvider
            ? "Your application has been sent to the selected provider. You'll receive an SMS update once they review your documents."
            : "Your application has been submitted for admin review. You'll receive an update after a qualified provider is assigned."}</p>
          <div className={styles.appNumBox}><span>Application ID</span><strong>{newAppId}</strong></div>
          <div className={styles.successBtns}>
            <button className="btn btn-primary" onClick={() => navigate('/customer/applications')}>View My Applications</button>
            <button className="btn btn-outline" onClick={() => { setSubmitted(false); setStep(1); setForm({ type: '', description: '', address: '', pincode: '', area: '', taluk: '', district: '', landmark: '', buildingArea: '', floors: '', heightM: '' }); setSelectedProvider(''); setProviderSearch(''); }}>New Application</button>
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
                <input className="form-input" type="text" maxLength={6} placeholder="6-digit pincode" value={form.pincode} onChange={set('pincode')} />
                {errors.pincode && <p className={styles.fieldError}><AlertCircle size={13} /> {errors.pincode}</p>}
              </div>
              <div className="form-group">
                <label className="form-label">City / Area</label>
                {pincodeOptions.length > 1 ? (
                  <select className="form-input" value={pincodeLocation?.office ?? ''} onChange={event => {
                    const selected = pincodeOptions.find(option => option.office === event.target.value);
                    if (selected) { setPincodeLocation(selected); setForm(current => ({ ...current, area: selected.city, taluk: selected.taluk, district: selected.district })); }
                  }}>
                    {pincodeOptions.map(option => <option key={option.office} value={option.office}>{option.city} ({option.taluk})</option>)}
                  </select>
                ) : <input className="form-input" type="text" placeholder="Resolved from pincode" value={form.area} readOnly />}
                {pincodeLookupState === 'loading' && <p className={styles.hintText}>Looking up pincode location…</p>}
                {pincodeLocation && <p className={styles.hintText}>{pincodeLocation.city}, {pincodeLocation.district} · Taluk: {pincodeLocation.taluk}</p>}
                {pincodeLookupState === 'not_found' && <p className={styles.fieldError}>Pincode location could not be found.</p>}
                {pincodeLookupState === 'error' && <p className={styles.fieldError}>Pincode lookup unavailable. You can continue with the entered pincode.</p>}
              </div>
              <div className="form-group">
                <label className="form-label">Taluk</label>
                <input className="form-input" type="text" placeholder="Resolved from pincode" value={form.taluk} readOnly />
              </div>
              <div className="form-group">
                <label className="form-label">District</label>
                <input className="form-input" type="text" placeholder="Resolved from pincode" value={form.district} readOnly />
              </div>
              <div className="form-group">
                <label className="form-label"><MapPin size={13} /> Landmark of Proposed Site</label>
                <input className="form-input" type="text" placeholder="e.g. Near Thrissur Railway Station" value={form.landmark} onChange={set('landmark')} />
                {errors.landmark && <p className={styles.fieldError}><AlertCircle size={13} /> {errors.landmark}</p>}
                <p className={styles.hintText}>Used as a reference for the property location.</p>
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
              <div key={doc}>
                <DocumentUpload
                  label={doc}
                  value={uploadedDocs[doc]}
                  onChange={file => setUploadedDocs(prev => ({ ...prev, [doc]: file }))}
                  hint="PDF, JPG or PNG · max 5 MB"
                />
                {!uploadedDocs[doc] && walletDocuments.map(document => (
                  <button
                    key={`${doc}_${document.id}`}
                    type="button"
                    onClick={() => setUploadedDocs(previous => ({ ...previous, [doc]: { id: document.id, name: document.name, sizeBytes: document.sizeBytes ?? 0, mimeType: document.type === 'pdf' ? 'application/pdf' : `image/${document.type}`, url: document.url! } }))}
                    style={{ margin: '-4px 0 16px', border: '1px solid #86efac', background: '#f0fdf4', color: '#166534', padding: '7px 10px', fontSize: 12, cursor: 'pointer' }}
                  >
                    Use saved copy from wallet ({document.applicationId})
                  </button>
                ))}
              </div>
            ))}
            <p className={styles.docDisclaimer}>* You can also upload documents later. Your application will be marked as "Documents Pending" until all documents are received.</p>
          </div>
        )}

        {/* STEP 4 — Choose Provider */}
        {step === 4 && (
          <div>
            <h3 className={styles.stepTitle}>Step 4: Choose Service Provider</h3>
            <p className={styles.docsNote}>
              Providers serving pincode <strong>{form.pincode}</strong>
              {(buildingArea || floors || heightM) && (
                <> and filtered by your building specs:
                  {buildingArea && <strong> {buildingArea} m²</strong>}
                  {floors && <strong> / {floors} floors</strong>}
                  {heightM && <strong> / {heightM} m</strong>}
                </>
              )}
            </p>
            {errors.provider && <p className={styles.fieldError}><AlertCircle size={13} /> {errors.provider}</p>}
            {errors.submission && <p className={styles.fieldError}><AlertCircle size={13} /> {errors.submission}</p>}

            <div className="form-group" style={{ marginTop: 16 }}>
              <label className="form-label">Search wider area for providers</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 8 }}>
                <input className="form-input" type="search" placeholder="Search by name, pincode..." value={providerSearch} onChange={e => setProviderSearch(e.target.value)} />
                <select className="form-input" value={searchDistrict} onChange={e => { setSearchDistrict(e.target.value); setSearchTaluk(''); }}>
                  <option value="">All Districts</option>
                  {Array.from(new Set(activeProviders.flatMap(p => [p.district, ...(p.serviceAreas || []).map(a => a.district)]).filter(Boolean))).map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
                <select className="form-input" value={searchTaluk} onChange={e => setSearchTaluk(e.target.value)} disabled={!searchDistrict}>
                  <option value="">All Talukas</option>
                  {Array.from(new Set(activeProviders.flatMap(p => [
                    { t: p.taluk, d: p.district },
                    ...(p.serviceAreas || []).map(a => ({ t: a.taluk, d: a.district }))
                  ]).filter(x => x.t && normalizeLocation(x.d) === normalizeLocation(searchDistrict)).map(x => x.t))).map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              {(providerSearch || searchDistrict || searchTaluk) && <p className={styles.hintText}>Showing providers matching your search. Verify the selected provider's service area before submitting.</p>}
            </div>

            {/* Eligible providers */}
            {eligibleProviders.length === 0 && ineligibleProviders.length === 0 && (
                <div style={{ padding: '40px 20px', background: 'var(--surface)', borderRadius: 12, marginTop: 20 }}>
                  <div style={{ textAlign: 'center' }}>
                    <AlertTriangle size={32} style={{ color: 'var(--primary)', marginBottom: 12 }} />
                    <h4 style={{ color: 'var(--text)' }}>No Providers Found for This Pincode</h4>
                    <p style={{ color: 'var(--text-muted)', maxWidth: 500, margin: '0 auto 16px' }}>
                      We couldn't find any active service providers for pincode <strong>{form.pincode}</strong>.
                    </p>
                  </div>
                  
                  <div style={{ maxWidth: 500, margin: '24px auto', background: 'var(--bg-color)', padding: 20, borderRadius: 8 }}>
                    <h5 style={{ marginBottom: 12 }}>Search Nearby Areas</h5>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="Enter Taluk, District, or City name..." 
                      value={secondarySearchText}
                      onChange={e => setSecondarySearchText(e.target.value)}
                    />
                    
                    {secondarySearchText.length > 0 && secondarySearchText.length < 3 && (
                      <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>Type at least 3 characters to search...</p>
                    )}
                    
                    {secondaryProviders.length > 0 && (
                      <div className={styles.providerList} style={{ marginTop: 16 }}>
                        {secondaryProviders.map(p => (
                          <button
                            key={p.id}
                            className={`${styles.providerSelectCard} ${selectedProvider === p.id ? styles.providerSelectActive : ''}`}
                            onClick={() => setSelectedProvider(p.id)}
                            style={{ textAlign: 'left' }}
                          >
                            <div className={styles.providerSelectAvatar}>{p.officeName[0]}</div>
                            <div className={styles.providerSelectInfo}>
                              <div className={styles.providerSelectName}>{p.officeName}</div>
                              <div className={styles.providerSelectMeta}>
                                <MapPin size={12} /> {p.city || p.area} ({p.taluk || p.district})
                              </div>
                            </div>
                            {selectedProvider === p.id && <CheckCircle2 size={22} className={styles.tileCheck} />}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <div style={{ textAlign: 'center', marginTop: 24, borderTop: '1px solid var(--border)', paddingTop: 20 }}>
                    <p style={{ color: 'var(--text-muted)', maxWidth: 500, margin: '0 auto 16px', fontSize: 14 }}>
                      <strong>Alternatively, you can skip selection.</strong> Our team will review your application and manually assign a qualified service provider.
                    </p>
                    <button className="btn btn-outline" onClick={() => setSelectedProvider('')}>Clear Selection (Submit to Admin)</button>
                  </div>
                </div>
              )}

              {eligibleProviders.length > 0 && (
              <div className={styles.providerList}>
                {visibleProviders.map(p => (
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
                {providerPageCount > 1 && (
                  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12, marginTop: 16 }}>
                    <button type="button" className="btn btn-outline" disabled={providerPage === 1} onClick={() => setProviderPage(page => page - 1)}>Previous</button>
                    <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>Page {providerPage} of {providerPageCount}</span>
                    <button type="button" className="btn btn-outline" disabled={providerPage === providerPageCount} onClick={() => setProviderPage(page => page + 1)}>Next</button>
                  </div>
                )}
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
            : <button className="btn btn-primary" onClick={handleSubmit} disabled={submitting}>{submitting ? 'Submitting…' : 'Submit Application'}</button>
          }
        </div>
      </div>
    </div>
  );
}

