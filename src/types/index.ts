export type UserRole = 'customer' | 'provider' | 'admin' | 'staff';

export interface User {
  id: string;
  name: string;
  phone: string;
  role: UserRole;
  email?: string;
  address?: string;
  pincode?: string;
  city?: string;
  taluk?: string;
  avatar?: string;
  providerId?: string; // for staff members
}

export interface PermitApplication {
  id: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  type: PermitType;
  status: ApplicationStatus;
  submittedAt: string;
  updatedAt: string;
  address: string;
  landmark: string;
  description: string;
  documents: Document[];
  assignedProviderId?: string;
  assignedProviderName?: string;
  // Who is servicing: 'provider' = provider self-servicing, 'staff' = assigned to staff
  servicedBy?: 'provider' | 'staff';
  // Staff assignment
  assignedStaffId?: string | null;
  assignedStaffName?: string | null;
  assignedStaffPhone?: string | null;
  notes?: string;
  approvalNumber?: string;
  // Site visit
  siteVisitRequired?: boolean | null;
  siteVisitDates?: string[];
  selectedSiteVisitDate?: string;
  siteVisitLocation?: string;
  siteVisitLocationConfirmed?: boolean;
  // Plan
  planUrl?: string;
  planRevisions?: PlanRevision[];
  clientComments?: string;
  // Panchayat
  panchayatStatus?: 'pending' | 'approved' | 'rejected';
  panchayatApprovedDocs?: Document[];
  // Termination
  terminatedBy?: 'client' | 'provider';
  terminationReason?: string;
  activityLog?: ActivityLogEntry[];
}

export interface ActivityLogEntry {
  id: string;
  userId: string;
  userName: string;
  userRole: string;
  type: 'status_change' | 'comment' | 'document_upload';
  content: string;
  timestamp: string;
}

export interface PlanRevision {
  id: string;
  version: number;
  uploadedAt: string;
  uploadedBy?: 'provider' | 'staff';
  comments?: string;
}

export type PermitType =
  | 'new_building_permit'
  | 'renovation_permit'
  | 'compound_wall_permit'
  | 'completion_certificate'
  | 'occupancy_certificate'
  | 'site_plan'
  | 'document_upload'
  | 'estimate_request'
  | 'bank_loan_estimate'
  | 'structural_drawing'
  | 'plumbing_drawing'
  | 'electrical_drawing'
  | 'layout_approval';

export type ApplicationStatus =
  | 'pending'
  | 'under_review'
  | 'documents_required'
  | 'site_visit_scheduled'
  | 'site_visit_confirmed'
  | 'plan_preparation'
  | 'plan_uploaded'
  | 'client_review'
  | 'plan_revision_requested'
  | 'panchayat_review'
  | 'panchayat_approved'
  | 'panchayat_rejected'
  | 'approved'
  | 'rejected'
  | 'terminated';

export interface Document {
  id: string;
  name: string;
  type: string;
  uploadedAt: string;
  uploadedBy?: 'customer' | 'provider' | 'staff';
  status: 'pending' | 'verified' | 'rejected';
  url?: string;      // blob URL for in-session viewing
  sizeBytes?: number;
}

export interface ServiceProvider {
  id: string;
  // Personal & Business Details
  ownerName: string;
  officeName: string;
  phone: string;
  email: string;
  officeAddress: string;
  area: string;
  pincode?: string;
  city?: string;
  taluk?: string;
  latitude?: number;
  longitude?: number;
  landmarks: string[];
  // Licence
  licenceCategory: string;
  licenceNumber: string;
  licenceExpiry: string;
  licenceImageUrl?: string;
  licenceVerified: boolean;
  licenceVerificationStatus: 'pending' | 'processing' | 'verified' | 'failed';
  licenceVerificationNote?: string;
  // Optional
  photoUrl?: string;
  aboutUs?: string;
  projectsCompleted?: string;
  // System
  name: string; // = officeName for backward compat
  status: 'pending' | 'active' | 'suspended';
  joinedAt: string;
  rating: number;
  totalApprovals: number;
  documents: Document[];
  specializations: PermitType[];
}

export interface DashboardStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  underReview: number;
}

export interface StaffMember {
  id: string;
  name: string;
  phone: string;
  email: string;
  role: 'associate' | 'manager';
  providerId: string;
  status: 'active' | 'inactive';
  joinedAt: string;
}

export interface AppNotification {
  id: string;
  applicationId?: string;
  userId: string;
  type: 'assigned' | 'provider_registration' | 'staff_assigned' | 'status_change' | 'acknowledgement' | 'comment' | 'document_upload' | 'application_update';
  title?: string;
  message: string;
  contactName?: string;
  contactPhone?: string;
  timestamp: string;
  read: boolean;
}

export interface ApplicationUpdate {
  applicationId: string;
  actor: Pick<User, 'id' | 'name' | 'role' | 'phone'>;
  recipientIds?: string[];
  title: string;
  summary: string;
  type?: AppNotification['type'];
  contactName?: string;
  contactPhone?: string;
}

