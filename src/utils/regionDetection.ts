// Region detection using IP geolocation
// Caches result in localStorage for 24 hours

const CACHE_KEY = 'leo_user_region';
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

export interface RegionInfo {
  state: string;
  stateCode: string;
  city: string;
  country: string;
}

const CACHED_REGION_FALLBACK: RegionInfo = {
  state: 'Kerala',
  stateCode: 'KL',
  city: '',
  country: 'IN',
};

// Normalize state names from IP API to our standard names
const STATE_NAME_MAP: Record<string, string> = {
  'Kerala': 'Kerala',
  'Tamil Nadu': 'Tamil Nadu',
  'Karnataka': 'Karnataka',
  'Andhra Pradesh': 'Andhra Pradesh',
  'Telangana': 'Telangana',
  'Maharashtra': 'Maharashtra',
  'Delhi': 'Delhi',
  'National Capital Territory of Delhi': 'Delhi',
  'Goa': 'Goa',
  'Gujarat': 'Gujarat',
  'Rajasthan': 'Rajasthan',
  'Uttar Pradesh': 'Uttar Pradesh',
  'West Bengal': 'West Bengal',
  'Odisha': 'Odisha',
  'Madhya Pradesh': 'Madhya Pradesh',
  'Punjab': 'Punjab',
  'Haryana': 'Haryana',
  'Bihar': 'Bihar',
  'Jharkhand': 'Jharkhand',
  'Himachal Pradesh': 'Himachal Pradesh',
  'Uttarakhand': 'Uttarakhand',
  'Chhattisgarh': 'Chhattisgarh',
  'Assam': 'Assam',
};

export async function detectUserRegion(): Promise<RegionInfo> {
  // Check cache first
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      const { data, timestamp } = JSON.parse(cached);
      if (Date.now() - timestamp < CACHE_TTL) {
        return data;
      }
    }
  } catch {}

  // Fetch from IP geolocation
  try {
    const response = await fetch('https://ipapi.co/json/', { signal: AbortSignal.timeout(4000) });
    if (response.ok) {
      const json = await response.json();
      const rawState = json.region || '';
      const state = STATE_NAME_MAP[rawState] || rawState || 'Kerala';
      const result: RegionInfo = {
        state,
        stateCode: json.region_code || 'KL',
        city: json.city || '',
        country: json.country_code || 'IN',
      };
      // Cache result
      localStorage.setItem(CACHE_KEY, JSON.stringify({ data: result, timestamp: Date.now() }));
      return result;
    }
  } catch {}

  return CACHED_REGION_FALLBACK;
}

export function clearRegionCache() {
  localStorage.removeItem(CACHE_KEY);
}
