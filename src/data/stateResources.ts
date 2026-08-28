// State-wise building rules, government orders, and fee structures

export interface StateResource {
  state: string;
  shortName: string;
  flag: string;
  buildingRules: RuleDocument[];
  govtOrders: GovtOrder[];
  feeStructure: FeeStructure;
}

export interface RuleDocument {
  title: string;
  year?: string;
  category: string;
  url: string;
  description: string;
  isOfficial: boolean;
}

export interface GovtOrder {
  goNumber: string;
  date: string;
  subject: string;
  department: string;
  url: string;
  category: 'building' | 'heritage' | 'coastal' | 'general' | 'fee';
}

export interface FeeStructure {
  currency: string;
  lastUpdated: string;
  scrutinyFeeRate: number;  // per sq.m
  permitFeeResidential: PermitFeeSlabs[];
  permitFeeCommercial: PermitFeeSlabs[];
  developmentChargeRate: number; // % of estimated cost
  laborCessRate: number;         // % of estimated cost
  zones: ZoneFee[];
}

export interface PermitFeeSlabs {
  upToArea: number;  // sq.m (Infinity for last slab)
  ratePerSqm: number;
}

export interface ZoneFee {
  zone: string;
  multiplier: number;
}

// ─── KERALA ─────────────────────────────────────────────────────────────────
const KERALA: StateResource = {
  state: 'Kerala',
  shortName: 'KL',
  flag: '🏝️',
  buildingRules: [
    {
      title: 'Kerala Municipal Building Rules (KMBR) 2019',
      year: '2019',
      category: 'Primary Rules',
      url: 'https://lsgkerala.gov.in/pages/kmbr',
      description: 'The primary building rules governing all municipal areas in Kerala. Covers FAR, setbacks, height, and occupancy.',
      isOfficial: true,
    },
    {
      title: 'Kerala Panchayat Building Rules (KPBR) 2019',
      year: '2019',
      category: 'Primary Rules',
      url: 'https://lsgkerala.gov.in/pages/kpbr',
      description: 'Building rules for all Gram Panchayat areas in Kerala. Required for provider licensing.',
      isOfficial: true,
    },
    {
      title: 'Kerala Building Tax Rules',
      year: '2023',
      category: 'Taxation',
      url: 'https://revenue.kerala.gov.in',
      description: 'Rules governing building tax assessment and collection in Kerala.',
      isOfficial: true,
    },
    {
      title: 'Coastal Regulation Zone (CRZ) Notification',
      year: '2019',
      category: 'Special Zones',
      url: 'https://moef.gov.in/en/division/environment-divisions/cl-ii/crz-notification-2019/',
      description: 'Central government CRZ notification applicable to all coastal areas including Kerala coastline.',
      isOfficial: true,
    },
    {
      title: 'Kerala Heritage Zone Regulations',
      category: 'Heritage',
      url: 'https://heritage.kerala.gov.in',
      description: 'Special building regulations for heritage zones and listed structures in Kerala.',
      isOfficial: true,
    },
    {
      title: 'Fire and Life Safety Standards (NBC 2016)',
      year: '2016',
      category: 'Safety',
      url: 'https://bis.gov.in/product/NationalBuildingCode2016',
      description: 'National Building Code 2016 — fire safety, structural design, and electrical standards.',
      isOfficial: true,
    },
  ],
  govtOrders: [
    { goNumber: 'GO(P) No. 123/2022/LSGD', date: '2022-08-15', subject: 'Amendment to Kerala Municipal Building Rules — Green Building Norms', department: 'Local Self Government', url: 'https://lsgkerala.gov.in', category: 'building' },
    { goNumber: 'GO(MS) No. 47/2023/Rev', date: '2023-03-10', subject: 'Revision of Building Permit Fee Schedule — Municipal Areas', department: 'Revenue', url: 'https://revenue.kerala.gov.in', category: 'fee' },
    { goNumber: 'GO(P) No. 11/2023/LSGD', date: '2023-01-20', subject: 'Online Building Permit System — Mandatory Implementation', department: 'Local Self Government', url: 'https://lsgkerala.gov.in', category: 'general' },
    { goNumber: 'GO(MS) No. 55/2022/Env', date: '2022-06-05', subject: 'EIA Notification — Construction Projects above 20,000 sq.m', department: 'Environment', url: 'https://environment.kerala.gov.in', category: 'general' },
    { goNumber: 'GO(P) No. 78/2021/Heritage', date: '2021-09-12', subject: 'Heritage Zone Demarcation — Fort Kochi and Mattancherry', department: 'Culture & Heritage', url: 'https://heritage.kerala.gov.in', category: 'heritage' },
    { goNumber: 'GO(MS) No. 15/2023/FishDept', date: '2023-02-18', subject: 'Coastal Buffer Zone — Construction Restrictions', department: 'Fisheries', url: 'https://fisheries.kerala.gov.in', category: 'coastal' },
  ],
  feeStructure: {
    currency: 'INR',
    lastUpdated: '2023-03-10',
    scrutinyFeeRate: 2.5,
    permitFeeResidential: [
      { upToArea: 50, ratePerSqm: 15 },
      { upToArea: 100, ratePerSqm: 20 },
      { upToArea: 200, ratePerSqm: 30 },
      { upToArea: 500, ratePerSqm: 45 },
      { upToArea: Infinity, ratePerSqm: 60 },
    ],
    permitFeeCommercial: [
      { upToArea: 100, ratePerSqm: 35 },
      { upToArea: 300, ratePerSqm: 55 },
      { upToArea: 1000, ratePerSqm: 80 },
      { upToArea: Infinity, ratePerSqm: 120 },
    ],
    developmentChargeRate: 0.5,
    laborCessRate: 1.0,
    zones: [
      { zone: 'Corporation (Mayor Council)', multiplier: 1.5 },
      { zone: 'Municipality', multiplier: 1.0 },
      { zone: 'Gram Panchayat', multiplier: 0.7 },
      { zone: 'Hill Station / Eco-sensitive', multiplier: 2.0 },
    ],
  },
};

// ─── TAMIL NADU ──────────────────────────────────────────────────────────────
const TAMIL_NADU: StateResource = {
  state: 'Tamil Nadu',
  shortName: 'TN',
  flag: '🏛️',
  buildingRules: [
    {
      title: 'Tamil Nadu Combined Development & Building Rules (TNCDBR) 2019',
      year: '2019',
      category: 'Primary Rules',
      url: 'https://www.tn.gov.in/acts_rules/acts_rules',
      description: 'Unified building rules for all urban local bodies in Tamil Nadu.',
      isOfficial: true,
    },
    {
      title: 'CMDA Development Regulations — Chennai',
      category: 'Metropolitan Area',
      url: 'https://www.cmdachennai.gov.in/',
      description: 'Chennai Metropolitan Development Authority regulations for Chennai metro area.',
      isOfficial: true,
    },
    {
      title: 'Tamil Nadu Fire Service Act & Rules',
      category: 'Safety',
      url: 'https://www.tnfiredept.gov.in/',
      description: 'Fire safety regulations applicable to all buildings in Tamil Nadu.',
      isOfficial: true,
    },
    {
      title: 'DTCP Building Rules — Panchayat Areas',
      category: 'Rural Areas',
      url: 'https://www.dtcp.tn.gov.in/',
      description: 'Director of Town and Country Planning rules for non-municipal areas.',
      isOfficial: true,
    },
  ],
  govtOrders: [
    { goNumber: 'GO(Ms) No. 178/MA&WS', date: '2022-10-12', subject: 'Amendment to TNCDBR 2019 — Solar Panels Mandatory for Buildings > 100 sqm', department: 'Municipal Administration', url: 'https://www.tn.gov.in', category: 'building' },
    { goNumber: 'GO(Ms) No. 45/MA&WS', date: '2023-03-15', subject: 'Revision of Building Permit Fees — All ULBs', department: 'Municipal Administration', url: 'https://www.tn.gov.in', category: 'fee' },
    { goNumber: 'GO(Ms) No. 22/Env', date: '2023-01-05', subject: 'Environmental Clearance Requirements for Construction', department: 'Environment', url: 'https://www.tn.gov.in', category: 'general' },
  ],
  feeStructure: {
    currency: 'INR',
    lastUpdated: '2023-03-15',
    scrutinyFeeRate: 3.0,
    permitFeeResidential: [
      { upToArea: 60, ratePerSqm: 18 },
      { upToArea: 120, ratePerSqm: 25 },
      { upToArea: 300, ratePerSqm: 40 },
      { upToArea: Infinity, ratePerSqm: 65 },
    ],
    permitFeeCommercial: [
      { upToArea: 100, ratePerSqm: 40 },
      { upToArea: 500, ratePerSqm: 70 },
      { upToArea: Infinity, ratePerSqm: 100 },
    ],
    developmentChargeRate: 0.75,
    laborCessRate: 1.0,
    zones: [
      { zone: 'Corporation', multiplier: 1.5 },
      { zone: 'Municipality', multiplier: 1.0 },
      { zone: 'Town Panchayat', multiplier: 0.8 },
      { zone: 'Village Panchayat', multiplier: 0.6 },
    ],
  },
};

// ─── KARNATAKA ───────────────────────────────────────────────────────────────
const KARNATAKA: StateResource = {
  state: 'Karnataka',
  shortName: 'KA',
  flag: '🏙️',
  buildingRules: [
    {
      title: 'Karnataka Municipal Corporations Act — Building Bye-Laws',
      year: '2020',
      category: 'Primary Rules',
      url: 'https://bbmp.gov.in/rules-regulations',
      description: 'Building bye-laws for BBMP and other municipal corporations in Karnataka.',
      isOfficial: true,
    },
    {
      title: 'BDA Master Plan 2031 — Development Regulations',
      category: 'Metropolitan Area',
      url: 'https://www.bdabangalore.org/masterplan2031.html',
      description: 'Bangalore Development Authority regulations for Bangalore urban area.',
      isOfficial: true,
    },
    {
      title: 'Karnataka Town & Country Planning Act — Building Regulations',
      category: 'Town Planning',
      url: 'https://uddhd.karnataka.gov.in/',
      description: 'Urban Development Department building regulations for Karnataka.',
      isOfficial: true,
    },
  ],
  govtOrders: [
    { goNumber: 'GO UDD 234 MNY 2022', date: '2022-11-20', subject: 'Amendment to Building Bye-Laws — Green Building Requirements', department: 'Urban Development', url: 'https://uddhd.karnataka.gov.in', category: 'building' },
    { goNumber: 'GO UDD 45 MNY 2023', date: '2023-02-10', subject: 'Khata Regularization Scheme — Building Permit Amnesty', department: 'Urban Development', url: 'https://bbmp.gov.in', category: 'general' },
  ],
  feeStructure: {
    currency: 'INR',
    lastUpdated: '2022-11-20',
    scrutinyFeeRate: 3.5,
    permitFeeResidential: [
      { upToArea: 60, ratePerSqm: 20 },
      { upToArea: 150, ratePerSqm: 35 },
      { upToArea: 300, ratePerSqm: 50 },
      { upToArea: Infinity, ratePerSqm: 75 },
    ],
    permitFeeCommercial: [
      { upToArea: 100, ratePerSqm: 50 },
      { upToArea: 500, ratePerSqm: 90 },
      { upToArea: Infinity, ratePerSqm: 130 },
    ],
    developmentChargeRate: 1.0,
    laborCessRate: 1.0,
    zones: [
      { zone: 'BBMP Jurisdiction', multiplier: 2.0 },
      { zone: 'Other Corporations', multiplier: 1.5 },
      { zone: 'Municipalities', multiplier: 1.0 },
      { zone: 'Gram Panchayat', multiplier: 0.6 },
    ],
  },
};

// ─── OTHER STATES (abbreviated for brevity) ─────────────────────────────────
const ANDHRA_PRADESH: StateResource = {
  state: 'Andhra Pradesh',
  shortName: 'AP',
  flag: '🏗️',
  buildingRules: [
    { title: 'APCRDA Building Rules 2017', year: '2017', category: 'Primary Rules', url: 'https://crda.ap.gov.in/', description: 'Capital Region Development Authority building rules for AP.', isOfficial: true },
    { title: 'AP Municipal Administration — Building Permissions', category: 'Municipal', url: 'https://www.ap.gov.in/', description: 'Municipal building permission rules for AP municipalities.', isOfficial: true },
  ],
  govtOrders: [
    { goNumber: 'GO MS No. 119/MA&UD', date: '2022-07-15', subject: 'APCRDA Building Rules Amendment — FAR Revision', department: 'Municipal Administration', url: 'https://www.ap.gov.in', category: 'building' },
  ],
  feeStructure: {
    currency: 'INR', lastUpdated: '2022-07-15', scrutinyFeeRate: 2.0,
    permitFeeResidential: [{ upToArea: 100, ratePerSqm: 15 }, { upToArea: 300, ratePerSqm: 25 }, { upToArea: Infinity, ratePerSqm: 40 }],
    permitFeeCommercial: [{ upToArea: 200, ratePerSqm: 35 }, { upToArea: Infinity, ratePerSqm: 60 }],
    developmentChargeRate: 0.5, laborCessRate: 1.0,
    zones: [{ zone: 'APCRDA', multiplier: 1.5 }, { zone: 'Municipality', multiplier: 1.0 }, { zone: 'Panchayat', multiplier: 0.7 }],
  },
};

const TELANGANA: StateResource = {
  state: 'Telangana',
  shortName: 'TS',
  flag: '🕌',
  buildingRules: [
    { title: 'GHMC Building Regulations 2012 (Amended 2020)', year: '2020', category: 'Primary Rules', url: 'https://www.ghmc.gov.in/', description: 'GHMC building regulations for Hyderabad metropolitan area.', isOfficial: true },
    { title: 'Telangana Municipalities Act 2019 — Building Rules', year: '2019', category: 'Municipal', url: 'https://municipal.telangana.gov.in/', description: 'Building rules for all municipalities in Telangana.', isOfficial: true },
  ],
  govtOrders: [
    { goNumber: 'GO RT No. 205/MA&UD', date: '2022-09-01', subject: 'Revised Layout Regulations for Residential Colonies', department: 'Municipal Administration', url: 'https://municipal.telangana.gov.in', category: 'building' },
  ],
  feeStructure: {
    currency: 'INR', lastUpdated: '2022-09-01', scrutinyFeeRate: 2.5,
    permitFeeResidential: [{ upToArea: 100, ratePerSqm: 18 }, { upToArea: 300, ratePerSqm: 30 }, { upToArea: Infinity, ratePerSqm: 50 }],
    permitFeeCommercial: [{ upToArea: 200, ratePerSqm: 40 }, { upToArea: Infinity, ratePerSqm: 70 }],
    developmentChargeRate: 0.75, laborCessRate: 1.0,
    zones: [{ zone: 'GHMC', multiplier: 2.0 }, { zone: 'Municipality', multiplier: 1.0 }, { zone: 'Panchayat', multiplier: 0.7 }],
  },
};

const MAHARASHTRA: StateResource = {
  state: 'Maharashtra',
  shortName: 'MH',
  flag: '🏢',
  buildingRules: [
    { title: 'Unified Development Control Regulations (UDCPR) 2020', year: '2020', category: 'Primary Rules', url: 'https://udcpr.maharashtra.gov.in/', description: 'Unified DCR for all urban areas of Maharashtra.', isOfficial: true },
    { title: 'Maharashtra Regional & Town Planning Act', category: 'Planning', url: 'https://www.maharashtra.gov.in/', description: 'MRTP Act building regulations for non-municipal areas.', isOfficial: true },
  ],
  govtOrders: [
    { goNumber: 'GR No. TPB/4321/1234/CR-76/UD-11', date: '2023-01-15', subject: 'UDCPR Amendment — Affordable Housing FSI Incentives', department: 'Urban Development', url: 'https://udcpr.maharashtra.gov.in', category: 'building' },
  ],
  feeStructure: {
    currency: 'INR', lastUpdated: '2023-01-15', scrutinyFeeRate: 4.0,
    permitFeeResidential: [{ upToArea: 70, ratePerSqm: 25 }, { upToArea: 200, ratePerSqm: 45 }, { upToArea: Infinity, ratePerSqm: 80 }],
    permitFeeCommercial: [{ upToArea: 200, ratePerSqm: 60 }, { upToArea: Infinity, ratePerSqm: 110 }],
    developmentChargeRate: 1.0, laborCessRate: 1.0,
    zones: [{ zone: 'Mumbai / MMR', multiplier: 3.0 }, { zone: 'Pune / Nagpur', multiplier: 1.5 }, { zone: 'Other Cities', multiplier: 1.0 }, { zone: 'Rural', multiplier: 0.6 }],
  },
};

const DELHI: StateResource = {
  state: 'Delhi',
  shortName: 'DL',
  flag: '🏛️',
  buildingRules: [
    { title: 'Delhi Building Bye-Laws 2016 (Amended)', year: '2016', category: 'Primary Rules', url: 'https://dda.org.in/planning/building-bye-laws', description: 'Delhi Development Authority building bye-laws.', isOfficial: true },
    { title: 'MPD-2041 Master Plan Delhi', year: '2021', category: 'Master Plan', url: 'https://dda.org.in/master-plan-delhi-2041', description: 'Delhi master plan development controls and land use regulations.', isOfficial: true },
  ],
  govtOrders: [
    { goNumber: 'No. F.7(1)/DDA/MP/2022', date: '2022-08-05', subject: 'MPD-2041 Building Height Norms — Transit Oriented Development', department: 'DDA', url: 'https://dda.org.in', category: 'building' },
  ],
  feeStructure: {
    currency: 'INR', lastUpdated: '2022-08-05', scrutinyFeeRate: 5.0,
    permitFeeResidential: [{ upToArea: 50, ratePerSqm: 30 }, { upToArea: 150, ratePerSqm: 55 }, { upToArea: Infinity, ratePerSqm: 90 }],
    permitFeeCommercial: [{ upToArea: 200, ratePerSqm: 80 }, { upToArea: Infinity, ratePerSqm: 150 }],
    developmentChargeRate: 1.5, laborCessRate: 1.0,
    zones: [{ zone: 'NDMC / Lutyens', multiplier: 3.0 }, { zone: 'MCD Area', multiplier: 1.5 }, { zone: 'Rural / Lal Dora', multiplier: 0.8 }],
  },
};

// ─── MASTER MAP ───────────────────────────────────────────────────────────────
export const STATE_RESOURCES: Record<string, StateResource> = {
  'Kerala': KERALA,
  'Tamil Nadu': TAMIL_NADU,
  'Karnataka': KARNATAKA,
  'Andhra Pradesh': ANDHRA_PRADESH,
  'Telangana': TELANGANA,
  'Maharashtra': MAHARASHTRA,
  'Delhi': DELHI,
};

export const ALL_STATES = Object.keys(STATE_RESOURCES);

export function getStateResource(state: string): StateResource {
  return STATE_RESOURCES[state] || KERALA;
}
