import fs from 'fs';
import path from 'path';

// Seed configuration
const NUM_USERS = 0;
const NUM_PROVIDERS = 0;

// Helper to generate UUIDs
function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

// Data sets
const firstNames = ['Arjun', 'Rahul', 'Priya', 'Meera', 'Karthik', 'Suresh', 'Divya', 'Anjali', 'Vijay', 'Sneha', 'Manoj', 'Deepa', 'Sandeep', 'Rajan', 'Anita'];
const lastNames = ['Kumar', 'Sharma', 'Menon', 'Nair', 'Pillai', 'Iyer', 'Babu', 'Thomas', 'Joseph', 'Varghese'];
const providerPrefixes = ['Kerala', 'South', 'BuildRight', 'Quick', 'Safe', 'Prime', 'Elite', 'Urban', 'Metro', 'Grand'];
const providerSuffixes = ['Constructions', 'Engineers', 'Planners', 'Architects', 'Builders', 'Solutions', 'Associates', 'Drafting'];
const areas = ['Kochi', 'Trivandrum', 'Calicut', 'Thrissur', 'Kottayam', 'Chennai', 'Coimbatore', 'Madurai', 'Salem', 'Trichy'];
const pincodes = ['682001', '695001', '673001', '680001', '686001', '600001', '641001', '625001', '636001', '620001'];

function randomChoice(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

function randomPhone() {
    return '91' + Math.floor(6000000000 + Math.random() * 3999999999).toString();
}

function escapeSql(str) {
    return str.replace(/'/g, "''");
}

let sql = '';

console.log(`Generating E2E Test Users...`);
sql += `-- ===============================\n`;
sql += `-- SEED DATA: E2E TEST USERS\n`;
sql += `-- ===============================\n`;
const customer1Id = generateUUID();
const customer2Id = generateUUID();
const adminId = generateUUID();
sql += `INSERT INTO users (id, phone, name, role, email, pincode) VALUES ('${customer1Id}', '9999900000', 'Ravi Kumar', 'customer', 'ravi@example.com', '682001');\n`;
sql += `INSERT INTO users (id, phone, name, role, email, pincode) VALUES ('${customer2Id}', '9999900001', 'Priya Sharma', 'customer', 'priya@example.com', '678001');\n`;
sql += `INSERT INTO users (id, phone, name, role, email, pincode) VALUES ('${adminId}', '7777700000', 'Super Admin', 'admin', 'admin.leopermit@gmail.com', '682001');\n`;

const provider1Id = generateUUID();
const provider2Id = generateUUID();
sql += `INSERT INTO service_providers (id, owner_name, office_name, phone, email, area, pincode, licence_category, licence_number, licence_expiry, status, rating, licence_verified) VALUES ('${provider1Id}', 'Arjun', 'Arjun Constructions', '8888800000', 'arjun@example.com', 'Kochi', '682001', 'Class A', 'LIC-001', '2028-12-31', 'active', 4.5, true);\n`;
sql += `INSERT INTO service_providers (id, owner_name, office_name, phone, email, area, pincode, licence_category, licence_number, licence_expiry, status, rating, licence_verified) VALUES ('${provider2Id}', 'BuildRight', 'BuildRight Engineers', '8888800001', 'build@example.com', 'Kochi', '682001', 'Class B', 'LIC-002', '2028-12-31', 'active', 4.2, true);\n`;
sql += `INSERT INTO service_providers (id, owner_name, office_name, phone, email, area, pincode, licence_category, licence_number, licence_expiry, status, rating, licence_verified) VALUES ('${generateUUID()}', 'Quick', 'QuickApprove Solutions', '8888800002', 'quick@example.com', 'Kochi', '682001', 'Class C', 'LIC-003', '2028-12-31', 'pending', 3.5, false);\n`;
sql += `INSERT INTO service_providers (id, owner_name, office_name, phone, email, area, pincode, licence_category, licence_number, licence_expiry, status, rating, licence_verified) VALUES ('${generateUUID()}', 'Kerala', 'Kerala Plan Experts', '8888800003', 'kerala@example.com', 'Kochi', '682001', 'Class A', 'LIC-004', '2028-12-31', 'active', 4.8, true);\n`;

sql += `INSERT INTO staff_members (id, name, phone, email, role, provider_id, status) VALUES ('${generateUUID()}', 'Rajan Menon', '8777700001', 'manager.leopermit@gmail.com', 'manager', '${provider1Id}', 'active');\n`;

console.log(`Generating ${NUM_USERS} Random Users...`);
sql += `-- ===============================\n`;
sql += `-- SEED DATA: USERS\n`;
sql += `-- ===============================\n`;
for (let i = 0; i < NUM_USERS; i++) {
    const id = generateUUID();
    const name = `${randomChoice(firstNames)} ${randomChoice(lastNames)}`;
    const phone = randomPhone();
    const role = Math.random() > 0.8 ? 'staff' : 'customer'; // 20% staff, 80% customer
    const email = `${name.replace(' ', '.').toLowerCase()}@example.com`;
    const pincode = randomChoice(pincodes);

    sql += `INSERT INTO users (id, phone, name, role, email, pincode) VALUES ('${id}', '${phone}', '${escapeSql(name)}', '${role}', '${escapeSql(email)}', '${pincode}');\n`;
}

console.log(`Generating ${NUM_PROVIDERS} Service Providers...`);
sql += `\n-- ===============================\n`;
sql += `-- SEED DATA: SERVICE PROVIDERS\n`;
sql += `-- ===============================\n`;
for (let i = 0; i < NUM_PROVIDERS; i++) {
    const id = generateUUID();
    const ownerName = `${randomChoice(firstNames)} ${randomChoice(lastNames)}`;
    const officeName = `${randomChoice(providerPrefixes)} ${randomChoice(providerSuffixes)}`;
    const phone = '918' + String(i).padStart(9, '0');
    const email = `contact${i}@${officeName.replace(' ', '').toLowerCase()}.in`;
    const area = randomChoice(areas);
    const pincode = randomChoice(pincodes);
    const licenceCat = randomChoice(['Class A', 'Class B', 'Class C']);
    const status = Math.random() > 0.1 ? 'active' : 'pending'; // 90% active
    const rating = (Math.random() * 2 + 3).toFixed(1); // 3.0 to 5.0

    sql += `INSERT INTO service_providers (id, owner_name, office_name, phone, email, area, pincode, licence_category, licence_number, licence_expiry, status, rating, licence_verified) VALUES ('${id}', '${escapeSql(ownerName)}', '${escapeSql(officeName)}', '${phone}', '${escapeSql(email)}', '${escapeSql(area)}', '${pincode}', '${licenceCat}', 'LIC-${Math.floor(Math.random() * 99999)}', '2028-12-31', '${status}', ${rating}, true);\n`;
}

const outPath = path.join(process.cwd(), 'supabase', 'seed.sql');
fs.writeFileSync(outPath, sql, 'utf8');
console.log(`Successfully wrote the core login accounts to supabase/seed.sql`);
