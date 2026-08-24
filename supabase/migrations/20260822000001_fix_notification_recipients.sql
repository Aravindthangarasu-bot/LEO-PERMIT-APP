ALTER TABLE customer_notifications
DROP CONSTRAINT IF EXISTS customer_notifications_customer_id_fkey;

ALTER TABLE customer_notifications
RENAME COLUMN customer_id TO user_id;

ALTER TABLE customer_notifications
RENAME TO notifications;

ALTER TABLE notifications
ADD COLUMN IF NOT EXISTS title TEXT;

COMMENT ON COLUMN notifications.user_id IS
'Recipient profile ID from users, service_providers, or staff_members.';
