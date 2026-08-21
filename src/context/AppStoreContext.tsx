import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { mockApplications, mockProviders } from '../data/mockData';
import type { PermitApplication, ServiceProvider, StaffMember, CustomerNotification, User } from '../types';
import {
  filterAppsForCustomer,
  filterAppsForProvider,
  filterAppsForStaff,
  filterStaffForProvider,
  getProviderProfile,
  getStaffProfile,
} from '../utils/security';

// AWS Amplify Data Client
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../amplify/data/resource';
const client = generateClient<Schema>();

// ============================================================================
// FEATURE FLAG: Toggle between Mock Data (false) and AWS DynamoDB (true)
// ============================================================================
export const USE_AWS_DYNAMODB = true;

// Mock staff for demo
const MOCK_STAFF: StaffMember[] = [
  { id: 's1', name: 'Rajan Menon',  phone: '8777700001', email: 'rajan@arjun.in',  role: 'manager',   providerId: 'p1', status: 'active', joinedAt: '2023-06-01T00:00:00Z' },
  { id: 's2', name: 'Meena Nair',   phone: '8777700002', email: 'meena@arjun.in',  role: 'associate', providerId: 'p1', status: 'active', joinedAt: '2023-08-15T00:00:00Z' },
];

interface AppStoreContextValue {
  applications: PermitApplication[];
  addApplication: (app: PermitApplication) => void;
  updateApplication: (id: string, patch: Partial<PermitApplication>) => void;
  providers: ServiceProvider[];
  addProvider: (p: ServiceProvider) => void;
  updateProviderStatus: (id: string, status: ServiceProvider['status']) => void;
  staff: StaffMember[];
  addStaff: (s: StaffMember) => { ok: true } | { ok: false; error: string };
  updateStaffStatus: (id: string, status: StaffMember['status']) => void;
  notifications: CustomerNotification[];
  addNotification: (n: CustomerNotification) => void;
  markNotificationRead: (id: string) => void;
  
  // Secure role-filtered accessors
  getAppsForUser: (user: User) => PermitApplication[];
  getStaffForProvider: (user: User) => StaffMember[];
  getMyProviderProfile: (user: User) => ServiceProvider | null;
  getMyStaffProfile: (user: User) => StaffMember | null;
}

const AppStoreContext = createContext<AppStoreContextValue | null>(null);

export function isLicenceExpired(provider: ServiceProvider): boolean {
  return new Date(provider.licenceExpiry) < new Date();
}

export function AppStoreProvider({ children }: { children: ReactNode }) {
  // State
  const [applications, setApplications] = useState<PermitApplication[]>(USE_AWS_DYNAMODB ? [] : mockApplications);
  const [providers, setProviders]       = useState<ServiceProvider[]>(USE_AWS_DYNAMODB ? [] : mockProviders);
  const [staff, setStaff]               = useState<StaffMember[]>(USE_AWS_DYNAMODB ? [] : MOCK_STAFF);
  const [notifications, setNotifications] = useState<CustomerNotification[]>([]);

  // ----------------------------------------------------------------------
  // AWS DYNAMODB REAL-TIME SYNC
  // ----------------------------------------------------------------------
  useEffect(() => {
    if (!USE_AWS_DYNAMODB) return;

    // Observe Permit Applications
    const subApps = client.models.PermitApplication.observeQuery().subscribe({
      next: ({ items }) => {
        // Map AWS Schema to local types (handling Date formats etc if needed)
        setApplications(items as unknown as PermitApplication[]);
      },
      error: (err) => console.error('AWS Data Error (Apps):', err)
    });

    // Observe Service Providers
    const subProviders = client.models.ServiceProvider.observeQuery().subscribe({
      next: ({ items }) => setProviders(items as unknown as ServiceProvider[]),
      error: (err) => console.error('AWS Data Error (Providers):', err)
    });

    // Observe Staff Members
    const subStaff = client.models.StaffMember.observeQuery().subscribe({
      next: ({ items }) => setStaff(items as unknown as StaffMember[]),
      error: (err) => console.error('AWS Data Error (Staff):', err)
    });

    // Observe Notifications
    const subNotes = client.models.CustomerNotification.observeQuery().subscribe({
      next: ({ items }) => setNotifications(items as unknown as CustomerNotification[]),
      error: (err) => console.error('AWS Data Error (Notifications):', err)
    });

    return () => {
      subApps.unsubscribe();
      subProviders.unsubscribe();
      subStaff.unsubscribe();
      subNotes.unsubscribe();
    };
  }, []);

  // ----------------------------------------------------------------------
  // MUTATIONS (HYBRID LOGIC)
  // ----------------------------------------------------------------------

  const addApplication = async (app: PermitApplication) => {
    if (USE_AWS_DYNAMODB) {
      // Create in AWS DynamoDB
      await client.models.PermitApplication.create({
        customerId: app.customerId,
        customerName: app.customerName,
        customerPhone: app.customerPhone,
        type: app.type,
        status: app.status,
        address: app.address,
        landmark: app.landmark,
        description: app.description,
        assignedProviderId: app.assignedProviderId,
        assignedStaffId: app.assignedStaffId,
        panchayatStatus: app.panchayatStatus,
        planUrl: app.planUrl,
        clientComments: app.clientComments,
      });
    } else {
      setApplications(prev => [app, ...prev]);
    }
  };

  const updateApplication = async (id: string, patch: Partial<PermitApplication>) => {
    if (USE_AWS_DYNAMODB) {
      await client.models.PermitApplication.update({ id, ...patch });
    } else {
      setApplications(prev => prev.map(a => a.id === id ? { ...a, ...patch, updatedAt: new Date().toISOString() } : a));
    }
  };

  const addProvider = async (p: ServiceProvider) => {
    if (USE_AWS_DYNAMODB) {
      await client.models.ServiceProvider.create({
        ownerName: p.ownerName,
        officeName: p.officeName,
        phone: p.phone,
        email: p.email,
        area: p.area,
        licenceCategory: p.licenceCategory,
        licenceNumber: p.licenceNumber,
        licenceExpiry: p.licenceExpiry,
        licenceVerified: p.licenceVerified,
        status: p.status,
      });
    } else {
      setProviders(prev => [p, ...prev]);
    }
  };

  const updateProviderStatus = async (id: string, status: ServiceProvider['status']) => {
    if (USE_AWS_DYNAMODB) {
      await client.models.ServiceProvider.update({ id, status });
    } else {
      setProviders(prev => prev.map(p => p.id === id ? { ...p, status } : p));
    }
  };

  const addStaff = (s: StaffMember): { ok: true } | { ok: false; error: string } => {
    // Phone validation logic is synchronous
    const phone = s.phone.replace(/\D/g, '');
    const usedByStaff = staff.find(existing => existing.phone === phone);
    const usedByProvider = providers.find(provider => provider.phone === phone);
    const usedByCustomer = applications.find(application => application.customerPhone === phone);
    
    if (usedByStaff || usedByProvider || usedByCustomer) {
      return { ok: false, error: 'Phone number already registered.' };
    }

    if (USE_AWS_DYNAMODB) {
      // Fire and forget promise to not break synchronous return type of this function
      client.models.StaffMember.create({
        name: s.name,
        phone: s.phone,
        email: s.email,
        role: s.role,
        providerId: s.providerId,
        status: s.status,
      });
    } else {
      setStaff(prev => [s, ...prev]);
    }
    return { ok: true };
  };

  const updateStaffStatus = async (id: string, status: StaffMember['status']) => {
    if (USE_AWS_DYNAMODB) {
      await client.models.StaffMember.update({ id, status });
    } else {
      setStaff(prev => prev.map(s => s.id === id ? { ...s, status } : s));
    }
  };

  const addNotification = async (n: CustomerNotification) => {
    if (USE_AWS_DYNAMODB) {
      await client.models.CustomerNotification.create({
        applicationId: n.applicationId,
        customerId: n.customerId,
        type: n.type,
        message: n.message,
        read: n.read,
      });
    } else {
      setNotifications(prev => [n, ...prev]);
    }
  };

  const markNotificationRead = async (id: string) => {
    if (USE_AWS_DYNAMODB) {
      await client.models.CustomerNotification.update({ id, read: true });
    } else {
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    }
  };

  // ── SECURE ACCESSORS — always filter by the requesting user's identity ──────
  const getAppsForUser = (user: User) => {
    if (user.role === 'customer')  return filterAppsForCustomer(user, applications);
    if (user.role === 'provider')  return filterAppsForProvider(user, applications, providers);
    if (user.role === 'staff')     return filterAppsForStaff(user, applications, staff);
    if (user.role === 'admin')     return applications;
    return [];
  };

  const getStaffForProvider = (user: User) => filterStaffForProvider(user, staff, providers);
  const getMyProviderProfile = (user: User) => getProviderProfile(user, providers);
  const getMyStaffProfile    = (user: User) => getStaffProfile(user, staff);

  return (
    <AppStoreContext.Provider value={{
      applications, addApplication, updateApplication,
      providers, addProvider, updateProviderStatus,
      staff, addStaff, updateStaffStatus,
      notifications, addNotification, markNotificationRead,
      getAppsForUser, getStaffForProvider, getMyProviderProfile, getMyStaffProfile,
    }}>
      {children}
    </AppStoreContext.Provider>
  );
}

export function useAppStore() {
  const ctx = useContext(AppStoreContext);
  if (!ctx) throw new Error('useAppStore must be used inside AppStoreProvider');
  return ctx;
}
