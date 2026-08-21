/**
 * Security rules — all data access is validated against the logged-in user.
 * Never trust URL params or client-side navigation alone.
 */
import type { User, PermitApplication, StaffMember, ServiceProvider } from '../types';

// ── ACCESS RESULT ─────────────────────────────────────────────────────────────
export type AccessResult = { allowed: true } | { allowed: false; reason: string };

const DENY = (reason: string): AccessResult => ({ allowed: false, reason });
const ALLOW: AccessResult = { allowed: true };

// ── CUSTOMER ──────────────────────────────────────────────────────────────────
/** Customer can only access their own applications. */
export function canCustomerAccessApp(user: User, app: PermitApplication): AccessResult {
  if (user.role !== 'customer') return DENY('Not a customer account.');
  if (app.customerPhone !== user.phone && app.customerId !== user.id)
    return DENY('This application does not belong to your account.');
  return ALLOW;
}

// ── PROVIDER ─────────────────────────────────────────────────────────────────
/** Provider can only access applications assigned to their provider account. */
export function canProviderAccessApp(
  user: User,
  app: PermitApplication,
  providers: ServiceProvider[],
): AccessResult {
  if (user.role !== 'provider') return DENY('Not a provider account.');
  const provider = providers.find(p => p.phone === user.phone);
  if (!provider) return DENY('Provider account not found.');
  if (app.assignedProviderId !== provider.id)
    return DENY('This application is not assigned to your provider account.');
  return ALLOW;
}

/** Provider can only manage staff belonging to their own account. */
export function canProviderManageStaff(
  user: User,
  staffMember: StaffMember,
  providers: ServiceProvider[],
): AccessResult {
  if (user.role !== 'provider') return DENY('Not a provider account.');
  const provider = providers.find(p => p.phone === user.phone);
  if (!provider) return DENY('Provider account not found.');
  if (staffMember.providerId !== provider.id)
    return DENY('This staff member does not belong to your provider account.');
  return ALLOW;
}

// ── STAFF ─────────────────────────────────────────────────────────────────────
/**
 * Staff can only access an application if:
 *   1. The application is assigned to their provider
 *   2. The application is specifically assigned to them
 */
export function canStaffAccessApp(
  user: User,
  app: PermitApplication,
  staffList: StaffMember[],
): AccessResult {
  if (user.role !== 'staff') return DENY('Not a staff account.');
  const me = staffList.find(s => s.phone === user.phone);
  if (!me) return DENY('Staff account not found.');
  if (me.status === 'inactive') return DENY('Your staff account is inactive. Contact your manager.');

  // Must belong to the same provider
  if (app.assignedProviderId !== me.providerId)
    return DENY('This application belongs to a different service provider.');

  // Must be assigned specifically to this staff member
  if (app.assignedStaffId !== me.id)
    return DENY('This application has not been assigned to you.');

  return ALLOW;
}

/** Staff can only see staff members from their own provider. */
export function canStaffViewColleague(
  user: User,
  colleague: StaffMember,
  staffList: StaffMember[],
): AccessResult {
  if (user.role !== 'staff') return DENY('Not a staff account.');
  const me = staffList.find(s => s.phone === user.phone);
  if (!me) return DENY('Staff account not found.');
  if (colleague.providerId !== me.providerId) return DENY('Not in your organisation.');
  return ALLOW;
}

// ── FILTERS ─────────────────────────────────────────────────────────────────

/** Returns only the applications a customer is allowed to see. */
export function filterAppsForCustomer(user: User, apps: PermitApplication[]): PermitApplication[] {
  return apps.filter(a => a.customerPhone === user.phone || a.customerId === user.id);
}

/** Returns only the applications a provider is allowed to see. */
export function filterAppsForProvider(user: User, apps: PermitApplication[], providers: ServiceProvider[]): PermitApplication[] {
  const provider = providers.find(p => p.phone === user.phone);
  if (!provider) return [];
  return apps.filter(a => a.assignedProviderId === provider.id);
}

/** Returns only the applications a staff member is allowed to see. */
export function filterAppsForStaff(user: User, apps: PermitApplication[], staffList: StaffMember[]): PermitApplication[] {
  const me = staffList.find(s => s.phone === user.phone);
  if (!me || me.status === 'inactive') return [];
  // Staff see only apps assigned to their provider AND specifically to them
  return apps.filter(a => a.assignedProviderId === me.providerId && a.assignedStaffId === me.id);
}

/** Returns only staff members belonging to the logged-in provider. */
export function filterStaffForProvider(user: User, staffList: StaffMember[], providers: ServiceProvider[]): StaffMember[] {
  const provider = providers.find(p => p.phone === user.phone);
  if (!provider) return [];
  return staffList.filter(s => s.providerId === provider.id);
}

/** Returns only the provider's own profile data. */
export function getProviderProfile(user: User, providers: ServiceProvider[]): ServiceProvider | null {
  return providers.find(p => p.phone === user.phone) ?? null;
}

/** Returns the staff member's own profile. */
export function getStaffProfile(user: User, staffList: StaffMember[]): StaffMember | null {
  return staffList.find(s => s.phone === user.phone) ?? null;
}
