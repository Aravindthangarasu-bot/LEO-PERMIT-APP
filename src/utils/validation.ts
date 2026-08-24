import { z } from 'zod';
import DOMPurify from 'dompurify';

// ── SANITIZATION UTILITIES ───────────────────────────────────────────────────

/**
 * Strips HTML tags, prevents XSS, and escapes characters.
 */
export const sanitizeInput = (value: string | undefined | null): string => {
  if (!value) return '';
  return DOMPurify.sanitize(value, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });
};

// ── REUSABLE ZOD SCHEMAS ─────────────────────────────────────────────────────

// Phone: Exactly 10 digits, starting with 6-9
export const phoneSchema = z.string()
  .min(10, 'Must be a valid 10-digit Indian mobile number')
  .max(10, 'Must be a valid 10-digit Indian mobile number')
  .regex(/^[6-9]\d{9}$/, 'Must be a valid 10-digit Indian mobile number');

// Email: Standard email validation
export const emailSchema = z.string().email('Must be a valid email address');

// Pincode: Exactly 6 digits
export const pincodeSchema = z.string()
  .min(6, 'Must be a valid 6-digit pincode')
  .max(6, 'Must be a valid 6-digit pincode')
  .regex(/^\d{6}$/, 'Must be a valid 6-digit pincode');

// Name: 3 to 100 characters, no dangerous scripts
export const nameSchema = z.string()
  .min(3, 'Min 3 characters required')
  .max(100, 'Cannot exceed 100 characters')
  .refine(val => sanitizeInput(val).trim() === val.trim(), 'Invalid characters detected');

// Address/Description: 10 to 500 characters
export const addressSchema = z.string()
  .min(10, 'Min 10 characters required')
  .max(500, 'Cannot exceed 500 characters')
  .refine(val => sanitizeInput(val).trim() === val.trim(), 'Invalid characters detected');

// OTP: Exactly 6 digits
export const otpSchema = z.string()
  .min(6, 'Must be a valid 6-digit OTP')
  .max(6, 'Must be a valid 6-digit OTP')
  .regex(/^\d{6}$/, 'Must be a valid 6-digit OTP');

// ── FORM SPECIFIC SCHEMAS ────────────────────────────────────────────────────

export const ProviderRegistrationSchema = z.object({
  ownerName: nameSchema,
  officeName: z.string().min(1, 'Required').max(150, 'Cannot exceed 150 characters').refine(val => sanitizeInput(val).trim() === val.trim()),
  phone: phoneSchema,
  email: emailSchema,
  officeAddress: addressSchema,
  area: z.string().min(1, 'Required'),
  pincode: pincodeSchema,
  licenceCategory: z.string().min(1, 'Required'),
  licenceNumber: z.string().min(1, 'Required').refine(val => sanitizeInput(val).trim() === val.trim()),
  licenceExpiry: z.string().refine(val => {
    const date = new Date(val);
    return !isNaN(date.getTime()) && date > new Date();
  }, 'Licence must be valid and not expired'),
});

export const CustomerApplicationSchema = z.object({
  permitType: z.string().min(1, 'Required'),
  description: z.string().min(10, 'Min 10 characters').max(1000, 'Max 1000 characters').refine(val => sanitizeInput(val).trim() === val.trim()),
  address: addressSchema.max(300, 'Cannot exceed 300 characters'),
  area: z.string().min(1, 'Required'),
  landmark: z.string().min(1, 'Required'),
  pincode: pincodeSchema,
});

export const StaffManagementSchema = z.object({
  name: nameSchema,
  phone: phoneSchema,
  email: emailSchema,
  role: z.string().min(1, 'Required'),
});
