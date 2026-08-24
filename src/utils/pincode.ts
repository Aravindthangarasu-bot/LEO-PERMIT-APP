export interface PincodeLocation {
  office: string;
  city: string;
  district: string;
  taluk: string;
  state: string;
}

export interface PincodeLookupResult {
  primary: PincodeLocation;
  options: PincodeLocation[];
}

const DOCUMENT_OVERRIDES: Record<string, PincodeLookupResult> = {
  '641402': {
    primary: { office: 'Sulur SO', city: 'Sulur', district: 'Coimbatore', taluk: 'Palladam', state: 'Tamil Nadu' },
    options: [
      { office: 'Sulur SO', city: 'Sulur', district: 'Coimbatore', taluk: 'Palladam', state: 'Tamil Nadu' },
      { office: 'Appanaickenpatti BO', city: 'Appanaickenpatti', district: 'Coimbatore', taluk: 'Palladam', state: 'Tamil Nadu' },
      { office: 'Kalingal BO', city: 'Kalingal', district: 'Coimbatore', taluk: 'Palladam', state: 'Tamil Nadu' },
      { office: 'Kannampalayam BO', city: 'Kannampalayam', district: 'Coimbatore', taluk: 'Mettupalayam', state: 'Tamil Nadu' },
      { office: 'Muthugoundenpudur BO', city: 'Muthugoundenpudur', district: 'Coimbatore', taluk: 'Mettupalayam', state: 'Tamil Nadu' },
      { office: 'Rasipalayam BO', city: 'Rasipalayam', district: 'Coimbatore', taluk: 'Palladam', state: 'Tamil Nadu' },
    ],
  },
};

export async function lookupPincode(pincode: string): Promise<PincodeLookupResult | null> {
  if (!/^\d{6}$/.test(pincode)) return null;
  if (DOCUMENT_OVERRIDES[pincode]) return DOCUMENT_OVERRIDES[pincode];
  const response = await fetch(`https://api.postalpincode.in/pincode/${pincode}`);
  if (!response.ok) throw new Error('Pincode lookup failed');
  const payload = await response.json() as Array<{ Status?: string; PostOffice?: Array<{ District?: string; Block?: string; Taluk?: string; Name?: string; State?: string }> }>;
  const offices = payload[0]?.PostOffice ?? [];
  if (payload[0]?.Status !== 'Success' || offices.length === 0) return null;
  const options = offices.map(office => ({
    office: office.Name ?? '', city: office.Name ?? '', district: office.District ?? '',
    taluk: office.Block || office.Taluk || '', state: office.State ?? '',
  }));
  return { primary: options.find(option => /HO|SO/.test(option.office)) ?? options[0], options };
}

export function normalizeLocation(value?: string): string {
  return (value ?? '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');
}

export function rankProvidersByFairness<T extends { id: string }>(providers: T[], applications: Array<{ assignedProviderId?: string }>): T[] {
  const assignments = new Map<string, number>();
  for (const application of applications) {
    if (application.assignedProviderId) assignments.set(application.assignedProviderId, (assignments.get(application.assignedProviderId) ?? 0) + 1);
  }
  return [...providers].sort((left, right) => (assignments.get(left.id) ?? 0) - (assignments.get(right.id) ?? 0));
}