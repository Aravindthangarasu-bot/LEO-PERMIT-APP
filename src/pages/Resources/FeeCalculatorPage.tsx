import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Calculator, MapPin, Loader2, CheckCircle2, Info } from 'lucide-react';
import Navbar from '../../components/Navbar/Navbar';
import { detectUserRegion } from '../../utils/regionDetection';
import { getStateResource, ALL_STATES, type FeeStructure, type PermitFeeSlabs } from '../../data/stateResources';
import styles from './Resources.module.css';

type BuildingType = 'residential' | 'commercial' | 'industrial';

interface CalcInputs {
  buildingType: BuildingType;
  plinthAreaSqft: string;
  floors: string;
  zone: string;
  estimatedCost: string;
}

interface FeeBreakdown {
  scrutinyFee: number;
  permitFee: number;
  developmentCharge: number;
  laborCess: number;
  zoneSurcharge: number;
  total: number;
}

function getPermitFeeFromSlabs(areaSqm: number, slabs: PermitFeeSlabs[]): number {
  let total = 0;
  let remaining = areaSqm;
  let prevLimit = 0;

  for (const slab of slabs) {
    if (remaining <= 0) break;
    const slabSize = Math.min(remaining, slab.upToArea - prevLimit);
    total += slabSize * slab.ratePerSqm;
    remaining -= slabSize;
    prevLimit = slab.upToArea;
    if (slab.upToArea === Infinity) break;
  }
  return total;
}

function calculateFees(inputs: CalcInputs, fee: FeeStructure): FeeBreakdown | null {
  const areaSqft = parseFloat(inputs.plinthAreaSqft);
  const floors = parseInt(inputs.floors) || 1;
  const cost = parseFloat(inputs.estimatedCost) || 0;

  if (!areaSqft || areaSqft <= 0) return null;

  const totalAreaSqft = areaSqft * floors;
  const totalAreaSqm = totalAreaSqft * 0.0929;

  const zone = fee.zones.find(z => z.zone === inputs.zone) || fee.zones[0];
  const multiplier = zone.multiplier;

  const slabs = inputs.buildingType === 'residential'
    ? fee.permitFeeResidential
    : fee.permitFeeCommercial;

  const scrutinyFee = totalAreaSqm * fee.scrutinyFeeRate * multiplier;
  const permitFee = getPermitFeeFromSlabs(totalAreaSqm, slabs) * multiplier;
  const developmentCharge = cost > 0 ? (cost * fee.developmentChargeRate) / 100 : 0;
  const laborCess = cost > 0 ? (cost * fee.laborCessRate) / 100 : 0;
  const zoneSurcharge = (scrutinyFee + permitFee) * (multiplier - 1) * 0.1;

  const total = scrutinyFee + permitFee + developmentCharge + laborCess;

  return { scrutinyFee, permitFee, developmentCharge, laborCess, zoneSurcharge, total };
}

function fmt(n: number) {
  return '₹' + Math.round(n).toLocaleString('en-IN');
}

export default function FeeCalculatorPage() {
  const [state, setState] = useState('Kerala');
  const [detectedState, setDetectedState] = useState('');
  const [detecting, setDetecting] = useState(true);

  const [inputs, setInputs] = useState<CalcInputs>({
    buildingType: 'residential',
    plinthAreaSqft: '',
    floors: '1',
    zone: '',
    estimatedCost: '',
  });
  const [result, setResult] = useState<FeeBreakdown | null>(null);

  useEffect(() => {
    detectUserRegion().then(region => {
      const s = ALL_STATES.includes(region.state) ? region.state : 'Kerala';
      setState(s);
      setDetectedState(region.city ? `${region.city}, ${region.state}` : region.state);
      setDetecting(false);
    });
  }, []);

  const resource = getStateResource(state);
  const feeStruct = resource.feeStructure;

  // Reset zone when state changes
  useEffect(() => {
    setInputs(prev => ({ ...prev, zone: feeStruct.zones[0]?.zone || '' }));
    setResult(null);
  }, [state]);

  const handleChange = (field: keyof CalcInputs, val: string) => {
    setInputs(prev => ({ ...prev, [field]: val }));
    setResult(null);
  };

  const handleCalculate = (e: React.FormEvent) => {
    e.preventDefault();
    const fees = calculateFees(inputs, feeStruct);
    setResult(fees);
  };

  const areaSqft = parseFloat(inputs.plinthAreaSqft) || 0;
  const areaSqm = (areaSqft * (parseInt(inputs.floors) || 1) * 0.0929).toFixed(1);

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
              <div className={styles.heroIcon}><Calculator size={26} color="white" /></div>
              <h1 className={styles.heroTitle}>Building Permit Fee Calculator</h1>
              <p className={styles.heroSub}>
                Estimate your building permit fees based on your state's latest schedule. Auto-detected based on your location.
              </p>
            </div>
          </div>

          <div className={styles.regionBar}>
            <MapPin size={16} color="rgba(255,255,255,0.7)" />
            <span className={styles.regionLabel}>Fee schedule for:</span>
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
            <span className={styles.detectedBadge} style={{ marginLeft: 'auto' }}>
              Schedule updated: {feeStruct.lastUpdated}
            </span>
          </div>
        </div>
      </div>

      <div className={styles.content}>
        <h2 className={styles.sectionTitle}>Permit Fee Estimator</h2>
        <p className={styles.sectionSub}>
          Enter your building details to get an itemized fee estimate as per {state} building rules.
        </p>

        <div className={styles.calcGrid}>
          {/* FORM */}
          <form className={styles.calcForm} onSubmit={handleCalculate}>
            <h3 className={styles.calcFormTitle}>Building Details</h3>

            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 8 }}>
                Building Type *
              </label>
              <div style={{ display: 'flex', gap: 10 }}>
                {(['residential', 'commercial', 'industrial'] as BuildingType[]).map(type => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => handleChange('buildingType', type)}
                    style={{
                      flex: 1,
                      padding: '10px 8px',
                      border: `2px solid ${inputs.buildingType === type ? '#2563eb' : '#e2e8f0'}`,
                      borderRadius: 8,
                      background: inputs.buildingType === type ? '#eff6ff' : 'white',
                      color: inputs.buildingType === type ? '#1d4ed8' : '#64748b',
                      fontWeight: 700,
                      fontSize: 12,
                      cursor: 'pointer',
                      textTransform: 'capitalize',
                      transition: 'all 0.15s',
                    }}
                  >
                    {type === 'residential' ? '🏠' : type === 'commercial' ? '🏢' : '🏭'} {type}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 8 }}>
                  Plinth Area (sq.ft) *
                </label>
                <input
                  type="number"
                  placeholder="e.g. 1200"
                  value={inputs.plinthAreaSqft}
                  onChange={e => handleChange('plinthAreaSqft', e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: 8, fontSize: 14, boxSizing: 'border-box', outline: 'none' }}
                  required
                  min="1"
                />
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 8 }}>
                  Number of Floors *
                </label>
                <select
                  value={inputs.floors}
                  onChange={e => handleChange('floors', e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: 8, fontSize: 14, boxSizing: 'border-box', outline: 'none', background: 'white' }}
                >
                  {[1,2,3,4,5,6,7,8,9,10].map(n => <option key={n} value={n}>{n} Floor{n>1?'s':''}</option>)}
                </select>
              </div>
            </div>

            {areaSqft > 0 && (
              <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: '8px 12px', marginBottom: 16, fontSize: 12, color: '#15803d', display: 'flex', gap: 6, alignItems: 'center' }}>
                <Info size={13} />
                Total built-up area: <strong>{(areaSqft * (parseInt(inputs.floors) || 1)).toLocaleString('en-IN')} sq.ft</strong> ({areaSqm} sq.m)
              </div>
            )}

            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 8 }}>
                Local Body / Zone *
              </label>
              <select
                value={inputs.zone}
                onChange={e => handleChange('zone', e.target.value)}
                style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: 8, fontSize: 14, outline: 'none', background: 'white' }}
                required
              >
                {feeStruct.zones.map(z => (
                  <option key={z.zone} value={z.zone}>{z.zone} (×{z.multiplier})</option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: 24 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 8 }}>
                Estimated Construction Cost (₹) <span style={{ fontWeight: 400, color: '#94a3b8' }}>— for cess calculation</span>
              </label>
              <input
                type="number"
                placeholder="e.g. 3500000"
                value={inputs.estimatedCost}
                onChange={e => handleChange('estimatedCost', e.target.value)}
                style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: 8, fontSize: 14, boxSizing: 'border-box', outline: 'none' }}
                min="0"
              />
              <p style={{ fontSize: 11, color: '#94a3b8', margin: '4px 0 0' }}>
                Leave blank to skip development charge and labour cess calculation.
              </p>
            </div>

            <button
              type="submit"
              style={{
                width: '100%', padding: '14px', background: '#2563eb', color: 'white',
                border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
              }}
            >
              <Calculator size={18} /> Calculate Fees
            </button>
          </form>

          {/* RESULT */}
          <div className={styles.calcResult}>
            <p className={styles.calcResultTitle}>
              📋 Fee Breakdown — {state}
            </p>

            {!result ? (
              <div className={styles.calcEmptyState}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>🧮</div>
                Fill in the details and click Calculate to see your fee estimate.
              </div>
            ) : (
              <>
                <div className={styles.calcResultRow}>
                  <span className={styles.calcResultLabel}>Scrutiny Fee</span>
                  <span className={styles.calcResultValue}>{fmt(result.scrutinyFee)}</span>
                </div>
                <div className={styles.calcResultRow}>
                  <span className={styles.calcResultLabel}>Permit Fee</span>
                  <span className={styles.calcResultValue}>{fmt(result.permitFee)}</span>
                </div>
                {result.developmentCharge > 0 && (
                  <div className={styles.calcResultRow}>
                    <span className={styles.calcResultLabel}>Development Charge</span>
                    <span className={styles.calcResultValue}>{fmt(result.developmentCharge)}</span>
                  </div>
                )}
                {result.laborCess > 0 && (
                  <div className={styles.calcResultRow}>
                    <span className={styles.calcResultLabel}>Labour Cess (1%)</span>
                    <span className={styles.calcResultValue}>{fmt(result.laborCess)}</span>
                  </div>
                )}

                <div className={styles.calcTotal}>
                  <span className={styles.calcTotalLabel}>Total Estimated Fee</span>
                  <span className={styles.calcTotalValue}>{fmt(result.total)}</span>
                </div>

                <p className={styles.calcDisclaimer}>
                  * This is an estimate only. Actual fees are determined by your local body at the time of application.
                  Additional charges (water connection, road cutting, etc.) may apply. Fee schedule: {feeStruct.lastUpdated}.
                </p>
              </>
            )}
          </div>
        </div>

        {/* Rate table */}
        <h2 className={styles.sectionTitle} style={{ marginBottom: 6 }}>Current Fee Schedule — {state}</h2>
        <p className={styles.sectionSub}>Permit fee slabs as per the latest schedule (last updated: {feeStruct.lastUpdated})</p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 40 }}>
          {[
            { label: '🏠 Residential', slabs: feeStruct.permitFeeResidential },
            { label: '🏢 Commercial', slabs: feeStruct.permitFeeCommercial },
          ].map(({ label, slabs }) => (
            <div key={label} style={{ background: 'white', borderRadius: 12, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
              <div style={{ background: '#f8fafc', padding: '14px 18px', borderBottom: '1px solid #e2e8f0', fontWeight: 700, fontSize: 14 }}>{label}</div>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={{ padding: '10px 16px', textAlign: 'left', fontSize: 12, color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Plinth Area</th>
                    <th style={{ padding: '10px 16px', textAlign: 'right', fontSize: 12, color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Rate / sq.m</th>
                  </tr>
                </thead>
                <tbody>
                  {slabs.map((slab, i, arr) => (
                    <tr key={i} style={{ borderTop: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '10px 16px', fontSize: 13, color: '#0f172a' }}>
                        {i === 0 ? `Up to ${slab.upToArea} sq.m` :
                          slab.upToArea === Infinity ? `Above ${arr[i-1].upToArea} sq.m` :
                          `${arr[i-1].upToArea}–${slab.upToArea} sq.m`}
                      </td>
                      <td style={{ padding: '10px 16px', fontSize: 13, fontWeight: 700, color: '#2563eb', textAlign: 'right' }}>
                        ₹{slab.ratePerSqm}/sq.m
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
