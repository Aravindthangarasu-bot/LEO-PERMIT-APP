export type UserRole = 'customer' | 'provider' | 'admin' | 'staff';

export interface User {
  id: string;
  name: string;
  phone: string;
  role: UserRole;
  email?: string;
  address?: string;
  pincode?: string;
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
  // Staff assignment
  assignedStaffId?: string;
  assignedStaffName?: string;
  assignedStaffPhone?: string;
  notes?: string;
  approvalNumber?: string;
  // Site visit
  siteVisitDates?: string[];
  selectedSiteVisitDate?: string;
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
}

export interface PlanRevision {
  id: string;
  version: number;
  uploadedAt: string;
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

export interface CustomerNotification {
  id: string;
  applicationId: string;
  customerId: string;
  type: 'assigned' | 'staff_assigned' | 'status_change' | 'acknowledgement';
  message: string;
  contactName?: string;
  contactPhone?: string;
  timestamp: string;
  read: boolean;
}

