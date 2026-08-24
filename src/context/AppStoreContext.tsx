import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { mockProviders } from '../data/mockData';
import type { PermitApplication, ServiceProvider, Document, AppNotification, DashboardStats, StaffMember, ActivityLogEntry, User, ApplicationUpdate } from '../types';
import {
  filterAppsForCustomer,
  filterAppsForProvider,
  filterAppsForStaff,
  filterStaffForProvider,
  getProviderProfile,
  getStaffProfile,
} from '../utils/security';

// Supabase Client
import { supabase } from '../supabaseClient';

// ============================================================================
// FEATURE FLAG: Toggle between Mock Data (false) and Supabase (true)
// ============================================================================
export const USE_SUPABASE = true;

// Mock staff for demo
const MOCK_STAFF: StaffMember[] = [
  { id: 's1', name: 'Rajan Menon',  phone: '8777700001', email: 'rajan@arjun.in',  role: 'manager',   providerId: 'p1', status: 'active', joinedAt: '2023-06-01T00:00:00Z' },
  { id: 's2', name: 'Meena Nair',   phone: '8777700002', email: 'meena@arjun.in',  role: 'associate', providerId: 'p1', status: 'active', joinedAt: '2023-08-15T00:00:00Z' },
];

interface AppStoreContextValue {
  applications: PermitApplication[];
  addApplication: (app: PermitApplication) => Promise<boolean>;
  updateApplication: (id: string, patch: Partial<PermitApplication>) => Promise<boolean>;
  providers: ServiceProvider[];
  addProvider: (p: ServiceProvider) => void;
  updateProviderStatus: (id: string, status: ServiceProvider['status']) => void;
  staff: StaffMember[];
  addStaff: (s: StaffMember) => Promise<{ ok: true } | { ok: false; error: string }>;
  updateStaffStatus: (id: string, status: StaffMember['status']) => Promise<void>;
  notifications: AppNotification[];
  addNotification: (n: AppNotification) => void;
  markNotificationRead: (id: string) => void;
  publishApplicationUpdate: (update: ApplicationUpdate) => void;
  
  addApplicationActivity: (appId: string, entry: Omit<ActivityLogEntry, 'id' | 'timestamp'>) => void;
  
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
  const [applications, setApplications] = useState<PermitApplication[]>([]);
  const [providers, setProviders]       = useState<ServiceProvider[]>(USE_SUPABASE ? [] : mockProviders);
  const [staff, setStaff]               = useState<StaffMember[]>(USE_SUPABASE ? [] : MOCK_STAFF);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  // ----------------------------------------------------------------------
  // SUPABASE REAL-TIME SYNC
  // ----------------------------------------------------------------------
  useEffect(() => {
    if (!USE_SUPABASE) return;

    const fetchNotifications = async () => {
      const { data: notifData } = await supabase.from('notifications').select('*');
      if (notifData) {
        setNotifications(notifData.map(n => ({
          id: n.id,
          applicationId: n.application_id,
          userId: n.user_id,
          type: n.type as any,
          title: n.title,
          message: n.message,
          contactName: n.contact_name,
          contactPhone: n.contact_phone,
          timestamp: n.created_at || new Date().toISOString(),
          read: n.read || false,
        })) as AppNotification[]);
      }
    };

    const fetchAllData = async () => {
      // 1. Fetch Users & Staff
      const { data: usersData } = await supabase.from('users').select('*');
      const { data: staffData } = await supabase.from('staff_members').select('*');
      if (staffData) setStaff(staffData.map(s => ({
        id: s.id, name: s.name, phone: s.phone, email: s.email, role: s.role, providerId: s.provider_id, status: s.status
      })) as StaffMember[]);

      // 2. Fetch Providers
      const { data: providerData } = await supabase.from('service_providers').select('*');
      if (providerData) setProviders(providerData.map(p => ({
        id: p.id, ownerName: p.owner_name, officeName: p.office_name, phone: p.phone, email: p.email,
        area: p.area, pincode: p.pincode, licenceCategory: p.licence_category, licenceNumber: p.licence_number,
        licenceExpiry: p.licence_expiry, status: p.status, rating: p.rating, totalApprovals: p.total_approvals,
        name: p.office_name,
        documents: [
          { id: `doc_${p.id}_1`, name: 'KPBR_Licence_Certificate.pdf', type: 'pdf', uploadedAt: p.created_at || new Date().toISOString(), status: 'pending', url: '/sample-licence.jpg' },
          { id: `doc_${p.id}_2`, name: 'Firm_Registration.pdf', type: 'pdf', uploadedAt: p.created_at || new Date().toISOString(), status: 'pending', url: '/sample-licence.jpg' }
        ],
        landmarks: [],
        officeAddress: p.office_address || '',
        joinedAt: p.created_at || new Date().toISOString(),
        specializations: [],
        licenceVerified: true,
        licenceVerificationStatus: 'verified'
      })) as ServiceProvider[]);

      // 3. Fetch Applications
      const { data: appsData } = await supabase.from('permit_applications').select('*');
      if (appsData) {
        setApplications(appsData.map(a => {
          const prov = providerData?.find(p => p.id === a.assigned_provider_id);
          return {
            id: a.id,
            customerId: a.customer_id,
            customerName: a.customer_name,
            customerPhone: a.customer_phone,
            type: a.type || 'new_building_permit',
            status: a.status || 'pending',
            address: a.address || '',
            landmark: a.landmark || '',
            description: a.description || '',
            assignedProviderId: a.assigned_provider_id,
            assignedProviderName: prov ? prov.office_name : undefined,
            assignedStaffId: a.assigned_staff_id,
            servicedBy: a.serviced_by,
            panchayatStatus: a.panchayat_status,
            planUrl: a.plan_url,
            clientComments: a.client_comments,
            notes: a.notes,
            siteVisitDates: a.site_visit_dates,
            selectedSiteVisitDate: a.selected_site_visit_date,
            approvalNumber: a.approval_number,
            documents: a.documents || [],
            planRevisions: a.plan_revisions || [],
            activityLog: a.activity_log || [],
            submittedAt: a.created_at,
            updatedAt: a.updated_at
          };
        }) as PermitApplication[]);
      }

      // 4. Fetch Notifications
      await fetchNotifications();
    };

    fetchAllData();

    const applicationChanges = supabase
      .channel('permit-application-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'permit_applications' }, fetchAllData)
      .subscribe();

    const notificationChanges = supabase
      .channel('notification-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, fetchNotifications)
      .subscribe();

    return () => {
      supabase.removeChannel(applicationChanges);
      supabase.removeChannel(notificationChanges);
    };
  }, []);

  // ----------------------------------------------------------------------
  // MUTATIONS (HYBRID LOGIC)
  // ----------------------------------------------------------------------

  const addApplication = async (app: PermitApplication) => {
    const submissionActivity: ActivityLogEntry = {
      id: `act_${Date.now()}_submission`,
      userId: app.customerId,
      userName: app.customerName,
      userRole: 'customer',
      type: 'status_change',
      content: 'Application submitted to the service provider.',
      timestamp: new Date().toISOString(),
    };
    const applicationWithActivity = { ...app, activityLog: [...(app.activityLog || []), submissionActivity] };
    if (USE_SUPABASE) {
      const { error } = await supabase.from('permit_applications').insert([{
        id: applicationWithActivity.id,
        customer_id: applicationWithActivity.customerId,
        customer_name: applicationWithActivity.customerName,
        customer_phone: applicationWithActivity.customerPhone,
        type: applicationWithActivity.type,
        status: applicationWithActivity.status,
        address: applicationWithActivity.address,
        landmark: applicationWithActivity.landmark,
        description: applicationWithActivity.description,
        assigned_provider_id: applicationWithActivity.assignedProviderId,
        assigned_staff_id: applicationWithActivity.assignedStaffId,
        serviced_by: applicationWithActivity.servicedBy,
        panchayat_status: applicationWithActivity.panchayatStatus,
        plan_url: applicationWithActivity.planUrl,
        client_comments: applicationWithActivity.clientComments,
        notes: applicationWithActivity.notes,
        site_visit_dates: applicationWithActivity.siteVisitDates,
        selected_site_visit_date: applicationWithActivity.selectedSiteVisitDate,
        approval_number: applicationWithActivity.approvalNumber,
        documents: applicationWithActivity.documents,
        plan_revisions: applicationWithActivity.planRevisions,
        activity_log: applicationWithActivity.activityLog
      }]);
      if (error) {
        console.error('Error inserting application:', error);
        return false;
      } else {
        setApplications(prev => [applicationWithActivity, ...prev]);
        if (app.assignedProviderId) {
          addNotification({
            id: `n_${Date.now()}_submission`,
            applicationId: app.id,
            userId: app.assignedProviderId,
            type: 'assigned',
            title: 'New application received',
            message: `${app.customerName} submitted ${app.id}. Review the property and documents to begin service.`,
            contactName: app.customerName,
            contactPhone: app.customerPhone,
            timestamp: new Date().toISOString(),
            read: false,
          });
        }
        return true;
      }
    } else {
      setApplications(prev => [applicationWithActivity, ...prev]);
      if (app.assignedProviderId) {
        addNotification({ id: `n_${Date.now()}_submission`, applicationId: app.id, userId: app.assignedProviderId, type: 'assigned', title: 'New application received', message: `${app.customerName} submitted ${app.id}. Review the property and documents to begin service.`, contactName: app.customerName, contactPhone: app.customerPhone, timestamp: new Date().toISOString(), read: false });
      }
      return true;
    }
  };

  const updateApplication = async (id: string, patch: Partial<PermitApplication>) => {
    if (USE_SUPABASE) {
      const updateData: any = {};
      if (patch.status !== undefined) updateData.status = patch.status;
      if (patch.assignedProviderId !== undefined) updateData.assigned_provider_id = patch.assignedProviderId;
      if (patch.assignedStaffId !== undefined) updateData.assigned_staff_id = patch.assignedStaffId;
      if (patch.servicedBy !== undefined) updateData.serviced_by = patch.servicedBy;
      if (patch.panchayatStatus !== undefined) updateData.panchayat_status = patch.panchayatStatus;
      if (patch.planUrl !== undefined) updateData.plan_url = patch.planUrl;
      if (patch.clientComments !== undefined) updateData.client_comments = patch.clientComments;
      if (patch.type !== undefined) updateData.type = patch.type;
      if (patch.description !== undefined) updateData.description = patch.description;
      if (patch.address !== undefined) updateData.address = patch.address;
      if (patch.landmark !== undefined) updateData.landmark = patch.landmark;
      if (patch.notes !== undefined) updateData.notes = patch.notes;
      if (patch.siteVisitDates !== undefined) updateData.site_visit_dates = patch.siteVisitDates;
      if (patch.selectedSiteVisitDate !== undefined) updateData.selected_site_visit_date = patch.selectedSiteVisitDate;
      if (patch.approvalNumber !== undefined) updateData.approval_number = patch.approvalNumber;
      if (patch.documents !== undefined) updateData.documents = patch.documents;
      if (patch.planRevisions !== undefined) updateData.plan_revisions = patch.planRevisions;
      if (patch.activityLog !== undefined) updateData.activity_log = patch.activityLog;

      updateData.updated_at = new Date().toISOString();

      const { error } = await supabase.from('permit_applications').update(updateData).eq('id', id);
      
      if (error) {
        console.error('Error updating application:', error);
        alert('Failed to update application. Please try again.');
        return false;
      } else {
        setApplications(prev => prev.map(a => a.id === id ? { ...a, ...patch, updatedAt: new Date().toISOString() } : a));
        return true;
      }
    } else {
      setApplications(prev => prev.map(a => a.id === id ? { ...a, ...patch, updatedAt: new Date().toISOString() } : a));
      return true;
    }
  };

  const addProvider = async (p: ServiceProvider) => {
    if (USE_SUPABASE) {
      const { error } = await supabase.from('service_providers').insert([{
        id: p.id,
        owner_name: p.ownerName,
        office_name: p.officeName,
        phone: p.phone,
        email: p.email,
        area: p.area,
        pincode: p.pincode,
        landmarks: p.landmarks,
        licence_category: p.licenceCategory,
        licence_number: p.licenceNumber,
        licence_expiry: p.licenceExpiry,
        status: p.status,
        rating: p.rating,
        total_approvals: p.totalApprovals
      }]);
      if (error) {
        console.error('Error inserting provider:', error);
        alert('Failed to register provider. Please try again.');
      } else {
        setProviders(prev => [p, ...prev]);
      }
    } else {
      setProviders(prev => [p, ...prev]);
    }
  };

  const updateProviderStatus = async (id: string, status: ServiceProvider['status']) => {
    if (USE_SUPABASE) {
      const { error } = await supabase.from('service_providers').update({ status, updated_at: new Date().toISOString() }).eq('id', id);
      if (error) {
        console.error('Error updating provider status:', error);
      } else {
        setProviders(prev => prev.map(p => p.id === id ? { ...p, status } : p));
      }
    } else {
      setProviders(prev => prev.map(p => p.id === id ? { ...p, status } : p));
    }
  };

  const addStaff = async (s: StaffMember): Promise<{ ok: true } | { ok: false; error: string }> => {
    // Phone validation logic is synchronous
    const phone = s.phone.replace(/\D/g, '');
    const usedByStaff = staff.find(existing => existing.phone === phone);
    const usedByProvider = providers.find(provider => provider.phone === phone);
    const usedByCustomer = applications.find(application => application.customerPhone === phone);
    
    if (usedByStaff || usedByProvider || usedByCustomer) {
      return { ok: false, error: 'Phone number already registered.' };
    }

    if (USE_SUPABASE) {
      const { error } = await supabase.from('staff_members').insert([{
        id: s.id,
        name: s.name,
        phone: s.phone,
        email: s.email,
        role: s.role,
        provider_id: s.providerId,
        status: s.status
      }]);
      if (error) {
        console.error('Error inserting staff:', error);
        return { ok: false, error: 'Database error. Please try again.' };
      } else {
        setStaff(prev => [s, ...prev]);
      }
    } else {
      setStaff(prev => [s, ...prev]);
    }
    return { ok: true };
  };

  const updateStaffStatus = async (id: string, status: StaffMember['status']) => {
    if (USE_SUPABASE) {
      const { error } = await supabase.from('staff_members').update({ status, updated_at: new Date().toISOString() }).eq('id', id);
      if (error) {
        console.error('Error updating staff status:', error);
      } else {
        setStaff(prev => prev.map(s => s.id === id ? { ...s, status } : s));
      }
    } else {
      setStaff(prev => prev.map(s => s.id === id ? { ...s, status } : s));
    }
  };

  const addNotification = async (n: AppNotification) => {
    if (USE_SUPABASE) {
      const { data, error } = await supabase.from('notifications').insert([{
        application_id: n.applicationId,
        user_id: n.userId,
        type: n.type,
        title: n.title,
        message: n.message,
        contact_name: n.contactName,
        contact_phone: n.contactPhone,
        read: n.read
      }]).select().single();
      
      if (error) {
        console.error('Error inserting notification:', error);
      } else if (data) {
        setNotifications(prev => [{ ...n, id: data.id }, ...prev]);
      }
    } else {
      setNotifications(prev => [n, ...prev]);
    }
  };

  const markNotificationRead = async (id: string) => {
    if (USE_SUPABASE) {
      const { error } = await supabase.from('notifications').update({ read: true, updated_at: new Date().toISOString() }).eq('id', id);
      if (error) {
        console.error('Error updating notification:', error);
      } else {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
      }
    } else {
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    }
  };

  const publishApplicationUpdate = (update: ApplicationUpdate) => {
    const app = applications.find(application => application.id === update.applicationId);
    if (!app) return;

    const recipientIds = new Set([
      app.customerId,
      app.assignedProviderId,
      app.assignedStaffId,
      ...(update.recipientIds || []),
    ].filter((id): id is string => Boolean(id) && id !== update.actor.id));

    const timestamp = new Date().toISOString();
    recipientIds.forEach((userId, index) => {
      addNotification({
        id: `n_${Date.now()}_${index}`,
        applicationId: app.id,
        userId,
        type: update.type ?? 'application_update',
        title: update.title,
        message: update.summary,
        contactName: update.contactName ?? update.actor.name,
        contactPhone: update.contactPhone ?? update.actor.phone,
        timestamp,
        read: false,
      });
    });

    addApplicationActivity(app.id, {
      userId: update.actor.id,
      userName: update.actor.name,
      userRole: update.actor.role,
      type: update.type === 'document_upload' ? 'document_upload' : 'status_change',
      content: update.summary,
    });
  };

  const addApplicationActivity = async (appId: string, entryData: Omit<ActivityLogEntry, 'id' | 'timestamp'>) => {
    const newEntry: ActivityLogEntry = {
      ...entryData,
      id: `act_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString()
    };
    
    // Optimistic update
    setApplications(prev => prev.map(a => {
      if (a.id === appId) {
        const newLog = [...(a.activityLog || []), newEntry];
        
        // Also fire off the DB update in the background
        if (USE_SUPABASE) {
          supabase.from('permit_applications')
            .update({ activity_log: newLog, updated_at: new Date().toISOString() })
            .eq('id', appId)
            .then(({ error }) => {
              if (error) console.error('Failed to save activity to DB:', error);
            });
        }
        
        return { ...a, activityLog: newLog, updatedAt: new Date().toISOString() };
      }
      return a;
    }));
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
      publishApplicationUpdate,
      addApplicationActivity,
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
