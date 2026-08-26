ALTER TABLE permit_applications
ADD COLUMN IF NOT EXISTS site_visit_required BOOLEAN,
ADD COLUMN IF NOT EXISTS site_visit_location TEXT,
ADD COLUMN IF NOT EXISTS site_visit_location_confirmed BOOLEAN DEFAULT false;