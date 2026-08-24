UPDATE users
SET email = 'admin.leopermit@gmail.com'
WHERE phone = '7777700000' AND role = 'admin';

UPDATE staff_members
SET email = 'manager.leopermit@gmail.com'
WHERE phone = '8777700001' AND role = 'manager';

INSERT INTO staff_members (id, name, phone, email, role, provider_id, status)
SELECT 'e41aa2b7-b3e8-4d60-8df8-1f5d9bc75e25', 'Office Support', '8777700002', 'office.leopermit@gmail.com', 'associate', id, 'active'
FROM service_providers
WHERE phone = '8888800000'
  AND NOT EXISTS (SELECT 1 FROM staff_members WHERE phone = '8777700002');