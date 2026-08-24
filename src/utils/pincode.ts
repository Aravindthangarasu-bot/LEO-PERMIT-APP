import { PINCODE_DATA } from '../data/pincodeData';

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

// Corrections for known postal-API taluk/district errors.
// Add entries here when a user reports a wrong value.
const CORRECTIONS: Record<string, { taluk?: string; district?: string }> = {
  '641402': { taluk: 'Palladam', district: 'Coimbatore' },
};

type PostalOffice = { Name?: string; District?: string; Block?: string; Taluk?: string; State?: string };

async function fetchPostal(pincode: string): Promise<PostalOffice[]> {
  const res = await fetch(`https://api.postalpincode.in/pincode/${pincode}`);
  if (!res.ok) return [];
  const payload = await res.json() as Array<{ Status?: string; PostOffice?: PostalOffice[] }>;
  return payload[0]?.Status === 'Success' ? (payload[0].PostOffice ?? []) : [];
}

export async function lookupPincode(pincode: string): Promise<PincodeLookupResult | null> {
  if (!/^\d{6}$/.test(pincode)) return null;

  const local = PINCODE_DATA[pincode];
  const correction = CORRECTIONS[pincode];

  // Fetch postal API for district and taluk (not city – local PDF is authoritative for city)
  let apiOffices: PostalOffice[] = [];
  try { apiOffices = await fetchPostal(pincode); } catch { /* offline */ }

  const apiDistrict = correction?.district ?? apiOffices[0]?.District ?? '';

  // Build per-city taluk map from API response
  const apiTalukByCity = new Map<string, string>();
  for (const o of apiOffices) {
    if (o.Name) apiTalukByCity.set(o.Name, o.Block || o.Taluk || '');
  }
  const defaultTaluk = correction?.taluk ?? apiOffices[0]?.Block ?? apiOffices[0]?.Taluk ?? '';

  if (local) {
    const options: PincodeLocation[] = local.localities.map(city => ({
      office: city,
      city,
      district: apiDistrict,
      taluk: correction?.taluk ?? apiTalukByCity.get(city) ?? defaultTaluk,
      state: local.state,
    }));
    const primary = options.find(o => o.city === local.primary) ?? options[0];
    return { primary, options };
  }

  // Pincode not in local data (outside KL/TN) – use postal API entirely
  if (apiOffices.length === 0) return null;
  const options: PincodeLocation[] = apiOffices.map(o => ({
    office: o.Name ?? '',
    city: o.Name ?? '',
    district: correction?.district ?? o.District ?? '',
    taluk: correction?.taluk ?? o.Block ?? o.Taluk ?? '',
    state: o.State ?? '',
  }));
  const primary = options.find(o => /\bHO\b|\bSO\b/.test(o.office)) ?? options[0];
  return { primary, options };
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