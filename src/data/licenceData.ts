// KPBR 2019 – Licence-Wise Building Permit Limits (Appendix H2)

export interface LicenceCategory {
  id: string;
  label: string;
  /** null = unlimited / "as applicable under KPBR" */
  maxArea: number | null;
  maxFloors: number | null;
  maxHeightM: number | null;
  description: string;
  unlimited: boolean;
}

export const KPBR_LICENCE_CATEGORIES: LicenceCategory[] = [
  {
    id: 'architect',
    label: 'Architect',
    maxArea: null,
    maxFloors: null,
    maxHeightM: null,
    unlimited: true,
    description: 'All building plans and information connected with building permit',
  },
  {
    id: 'institution_architecture',
    label: 'Institution (Architecture)',
    maxArea: null,
    maxFloors: null,
    maxHeightM: null,
    unlimited: true,
    description: 'All building plans and information connected with building permit',
  },
  {
    id: 'institution_civil',
    label: 'Institution (Civil Engineering)',
    maxArea: null,
    maxFloors: null,
    maxHeightM: null,
    unlimited: true,
    description: 'All building plans and information connected with building permit',
  },
  {
    id: 'engineer_a',
    label: 'Engineer – A',
    maxArea: null,
    maxFloors: null,
    maxHeightM: null,
    unlimited: true,
    description: 'All building plans and information connected with building permit',
  },
  {
    id: 'engineer_b',
    label: 'Engineer – B',
    maxArea: 1000,
    maxFloors: 4,
    maxHeightM: 14.5,
    unlimited: false,
    description: 'Up to 1,000 m² · Up to 4 floors · Up to 14.5 m height',
  },
  {
    id: 'building_designer_b',
    label: 'Building Designer – B',
    maxArea: 1000,
    maxFloors: 4,
    maxHeightM: 14.5,
    unlimited: false,
    description: 'Up to 1,000 m² · Up to 4 floors · Up to 14.5 m height',
  },
  {
    id: 'building_designer_a',
    label: 'Building Designer – A',
    maxArea: 500,
    maxFloors: 3,
    maxHeightM: 11,
    unlimited: false,
    description: 'Structural design & calculations up to 500 m² · Up to 3 storeys · Up to 11 m',
  },
  {
    id: 'supervisor_senior',
    label: 'Supervisor – Senior',
    maxArea: 1000,
    maxFloors: 4,
    maxHeightM: 14.5,
    unlimited: false,
    description: 'Up to 1,000 m² total built-up area · Up to 4 floors · Up to 14.5 m height',
  },
  {
    id: 'supervisor_a',
    label: 'Supervisor – A',
    maxArea: 750,
    maxFloors: 3,
    maxHeightM: 11,
    unlimited: false,
    description: 'Up to 750 m² total built-up area · Up to 3 floors · Up to 11 m height',
  },
  {
    id: 'supervisor_b',
    label: 'Supervisor – B',
    maxArea: 300,
    maxFloors: 2,
    maxHeightM: 7.5,
    unlimited: false,
    description: 'Up to 300 m² · Up to 2 floors · Up to 7.5 m height',
  },
];

export function getLicenceById(id: string): LicenceCategory | undefined {
  return KPBR_LICENCE_CATEGORIES.find(l => l.id === id);
}

/** Returns true if this licence can handle the given building specs */
export function canHandleBuilding(
  licence: LicenceCategory,
  areaM2?: number,
  floors?: number,
  heightM?: number,
): boolean {
  if (licence.unlimited) return true;
  if (areaM2  && licence.maxArea    && areaM2  > licence.maxArea)    return false;
  if (floors  && licence.maxFloors  && floors  > licence.maxFloors)  return false;
  if (heightM && licence.maxHeightM && heightM > licence.maxHeightM) return false;
  return true;
}

/** Returns the reason a provider is ineligible, or null if eligible */
export function getIneligibilityReason(
  licence: LicenceCategory,
  areaM2?: number,
  floors?: number,
  heightM?: number,
): string | null {
  if (licence.unlimited) return null;
  if (areaM2  && licence.maxArea    && areaM2  > licence.maxArea)
    return `Licence limited to ${licence.maxArea} m². Building is ${areaM2} m².`;
  if (floors  && licence.maxFloors  && floors  > licence.maxFloors)
    return `Licence limited to ${licence.maxFloors} floors. Building has ${floors} floors.`;
  if (heightM && licence.maxHeightM && heightM > licence.maxHeightM)
    return `Licence limited to ${licence.maxHeightM} m height. Building is ${heightM} m.`;
  return null;
}

// ── EXPIRY NOTIFICATION LOGIC ─────────────────────────────────────────────────

export type ExpiryUrgency = 'info' | 'warning' | 'critical' | 'daily';

export interface ExpiryNotification {
  urgency: ExpiryUrgency;
  daysLeft: number;
  message: string;
}

export function getExpiryNotification(expiryDateStr: string): ExpiryNotification | null {
  const expiry = new Date(expiryDateStr);
  const today  = new Date();
  today.setHours(0, 0, 0, 0);
  const daysLeft = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (daysLeft <= 0)   return { urgency: 'critical', daysLeft, message: `⛔ Licence expired ${Math.abs(daysLeft)} day(s) ago. Renew immediately.` };
  if (daysLeft <= 10)  return { urgency: 'daily',    daysLeft, message: `🚨 URGENT: Licence expires in ${daysLeft} day(s). Renew now!` };
  if (daysLeft <= 30)  return { urgency: 'critical', daysLeft, message: `🔴 Licence expires in ${daysLeft} days. Please renew soon.` };
  if (daysLeft <= 60)  return { urgency: 'warning',  daysLeft, message: `🟡 Licence expires in ${daysLeft} days. Plan your renewal.` };
  if (daysLeft <= 90)  return { urgency: 'info',     daysLeft, message: `🔵 Licence expires in ${daysLeft} days. Renewal reminder.` };
  return null;
}
