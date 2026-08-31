const fs = require('fs');

function replace(file, search, replace) {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(search, replace);
  fs.writeFileSync(file, content);
}

replace('src/pages/Admin/AdminDashboard.tsx', /FileCheck2,\s*/, '');
replace('src/pages/Admin/AdminDashboard.tsx', /HardHat,\s*/, '');

replace('src/pages/Admin/ManageUsers.tsx', /Phone,\s*/, '');
replace('src/pages/Admin/ManageUsers.tsx', /Mail,\s*/, '');
replace('src/pages/Admin/ManageUsers.tsx', /MapPin,\s*/, '');

replace('src/pages/Customer/CustomerDashboard.tsx', /Clock,\s*/, '');
replace('src/pages/Customer/CustomerDashboard.tsx', /,\s*X/g, '');
replace('src/pages/Customer/CustomerDashboard.tsx', /,\s*LIFECYCLE_STAGES/g, '');

replace('src/pages/GetStarted/ProviderRegisterPage.tsx', /const selectedLicence = .*;\n/, '');
replace('src/pages/GetStarted/ProviderRegisterPage.tsx', /reviews:\s*0,\n/, '');

replace('src/pages/Landing/LandingPage.tsx', /,\s*Phone/g, '');

console.log('done');
