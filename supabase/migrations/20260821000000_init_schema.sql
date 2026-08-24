-- 1. Users Table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'CUSTOMER',
    email TEXT,
    address TEXT,
    pincode TEXT,
    provider_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Service Providers Table
CREATE TABLE service_providers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_name TEXT NOT NULL,
    office_name TEXT NOT NULL,
    phone TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    area TEXT NOT NULL,
    pincode TEXT NOT NULL,
    landmarks TEXT[] DEFAULT '{}',
    licence_category TEXT NOT NULL,
    licence_number TEXT NOT NULL,
    licence_expiry TEXT NOT NULL,
    licence_verified BOOLEAN DEFAULT false,
    status TEXT DEFAULT 'PENDING',
    rating NUMERIC DEFAULT 0,
    total_approvals INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add foreign key reference back from users to service_providers
ALTER TABLE users ADD CONSTRAINT fk_user_provider FOREIGN KEY (provider_id) REFERENCES service_providers(id);

-- 3. Staff Members Table
CREATE TABLE staff_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    phone TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL,
    provider_id UUID NOT NULL REFERENCES service_providers(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'ACTIVE',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Permit Applications Table
CREATE TABLE permit_applications (
    id TEXT PRIMARY KEY,
    customer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    type TEXT NOT NULL,
    status TEXT DEFAULT 'PENDING',
    address TEXT NOT NULL,
    landmark TEXT NOT NULL,
    description TEXT,
    assigned_provider_id UUID REFERENCES service_providers(id) ON DELETE SET NULL,
    assigned_staff_id UUID REFERENCES staff_members(id) ON DELETE SET NULL,
    panchayat_status TEXT DEFAULT 'NOT_SUBMITTED',
    plan_url TEXT,
    client_comments TEXT,
    notes TEXT,
    site_visit_dates JSONB,
    selected_site_visit_date TEXT,
    approval_number TEXT,
    documents JSONB DEFAULT '[]'::jsonb,
    plan_revisions JSONB DEFAULT '[]'::jsonb,
    activity_log JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Customer Notifications Table
CREATE TABLE customer_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id TEXT NOT NULL REFERENCES permit_applications(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    message TEXT NOT NULL,
    read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==========================================
-- PERMISSIONS & ACCESS FOR LOCAL ENVIRONMENT
-- ==========================================
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;

