import type { ApplicationStatus } from '../../types';

export const STATUS_CONFIG: Record<ApplicationStatus, { label: string; color: string; bg: string; dot: string }> = {
  pending:                  { label: 'Pending',             color: '#f97316', bg: '#fff7ed',  dot: 'yellow' },
  under_review:             { label: 'Under Review',        color: '#3b82f6', bg: '#dbeafe',  dot: 'blue'   },
  documents_required:       { label: 'Docs Required',       color: '#f59e0b', bg: '#fef3c7',  dot: 'yellow' },
  site_visit_scheduled:     { label: 'Site Visit Scheduled',color: '#8b5cf6', bg: '#ede9fe',  dot: 'blue'   },
  site_visit_confirmed:     { label: 'Site Visit Confirmed',color: '#7c3aed', bg: '#ede9fe',  dot: 'blue'   },
  plan_preparation:         { label: 'Plan Preparation',    color: '#0891b2', bg: '#cffafe',  dot: 'blue'   },
  plan_uploaded:            { label: 'Plan Uploaded',       color: '#0284c7', bg: '#e0f2fe',  dot: 'blue'   },
  client_review:            { label: 'Awaiting Your Review',color: '#f59e0b', bg: '#fef3c7',  dot: 'yellow' },
  plan_revision_requested:  { label: 'Revision Requested',  color: '#ea580c', bg: '#ffedd5',  dot: 'yellow' },
  panchayat_review:         { label: 'Authority Review',    color: '#0369a1', bg: '#e0f2fe',  dot: 'blue'   },
  panchayat_approved:       { label: 'Authority Approved',  color: '#16a34a', bg: '#dcfce7',  dot: 'green'  },
  panchayat_rejected:       { label: 'Authority Rejected',  color: '#dc2626', bg: '#fee2e2',  dot: 'red'    },
  approved:                 { label: 'Approved',             color: '#16a34a', bg: '#dcfce7',  dot: 'green'  },
  rejected:                 { label: 'Rejected',             color: '#dc2626', bg: '#fee2e2',  dot: 'red'    },
  terminated:               { label: 'Terminated',           color: '#6b7280', bg: '#f3f4f6',  dot: 'red'    },
};

export const ALL_STATUS_FILTERS = Object.keys(STATUS_CONFIG) as ApplicationStatus[];

export const COMMON_STATUS_FILTERS: ApplicationStatus[] = [
  'pending', 'under_review', 'documents_required', 'site_visit_scheduled',
  'client_review', 'panchayat_review', 'approved', 'rejected', 'terminated'
];

export const LIFECYCLE_STAGES = [
  { status: 'pending',              label: 'Application Submitted'  },
  { status: 'under_review',         label: 'Documents Verified'     },
  { status: 'site_visit_scheduled', label: 'Site Visit Scheduled'   },
  { status: 'plan_preparation',     label: 'Plan Preparation'       },
  { status: 'client_review',        label: 'Client Review'          },
  { status: 'panchayat_review',     label: 'Authority Review'       },
  { status: 'panchayat_approved',   label: 'Final Approval'         },
];
