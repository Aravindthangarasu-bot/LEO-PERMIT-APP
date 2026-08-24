export interface PincodeLocation {
  city: string;
  district: string;
  taluk: string;
  state: string;
}

export async function lookupPincode(pincode: string): Promise<PincodeLocation | null> {
  if (!/^\d{6}$/.test(pincode)) return null;
  const response = await fetch(`https://api.postalpincode.in/pincode/${pincode}`);
  if (!response.ok) throw new Error('Pincode lookup failed');
  const payload = await response.json() as Array<{ Status?: string; PostOffice?: Array<{ District?: string; Block?: string; Taluk?: string; Name?: string; State?: string }> }>;
  const office = payload[0]?.PostOffice?.[0];
  if (payload[0]?.Status !== 'Success' || !office) return null;
  return { city: office.Name ?? '', district: office.District ?? '', taluk: office.Block || office.Taluk || '', state: office.State ?? '' };
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