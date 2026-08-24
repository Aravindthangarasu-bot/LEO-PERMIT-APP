ALTER TABLE permit_applications
ADD COLUMN serviced_by TEXT CHECK (serviced_by IN ('provider', 'staff'));