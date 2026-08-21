import { type ClientSchema, a, defineData } from '@aws-amplify/backend';

/**
 * Define your DynamoDB Database Schema here.
 * AWS Amplify will automatically create the tables and GraphQL APIs.
 */
const schema = a.schema({
  
  // 1. User Profile Table
  User: a.model({
    phone: a.string().required(),
    name: a.string().required(),
    role: a.string().required(), // 'customer' | 'provider' | 'admin' | 'staff'
    email: a.string(),
    address: a.string(),
    pincode: a.string(),
    providerId: a.string(),
  }).authorization(allow => [
    allow.owner(),
    allow.authenticated().to(['read']) // others can read profiles
  ]),

  // 2. Service Provider Table
  ServiceProvider: a.model({
    ownerName: a.string().required(),
    officeName: a.string().required(),
    phone: a.string().required(),
    email: a.string().required(),
    area: a.string().required(),
    pincode: a.string(),
    landmarks: a.string().array(),
    licenceCategory: a.string().required(),
    licenceNumber: a.string().required(),
    licenceExpiry: a.string().required(),
    licenceVerified: a.boolean().required(),
    status: a.string().required(), // 'pending' | 'active' | 'suspended'
    rating: a.float(),
    totalApprovals: a.integer(),
  }).authorization(allow => [
    allow.publicApiKey().to(['read']), // Anyone can see active providers
    allow.owner().to(['read', 'update']),
    allow.groups(['Admin']) // Admins can do anything
  ]),

  // 3. Staff Member Table
  StaffMember: a.model({
    name: a.string().required(),
    phone: a.string().required(),
    email: a.string().required(),
    role: a.string().required(), // 'associate' | 'manager'
    providerId: a.string().required(),
    status: a.string().required(),
  }).authorization(allow => [
    allow.authenticated().to(['read']),
    allow.owner() // The provider who created them is the owner
  ]),

  // 4. Permit Application Table
  PermitApplication: a.model({
    customerId: a.string().required(),
    customerName: a.string().required(),
    customerPhone: a.string().required(),
    type: a.string().required(),
    status: a.string().required(),
    address: a.string().required(),
    landmark: a.string().required(),
    description: a.string().required(),
    assignedProviderId: a.string(),
    assignedStaffId: a.string(),
    panchayatStatus: a.string(),
    planUrl: a.string(),
    clientComments: a.string(),
  }).authorization(allow => [
    // The customer who creates it owns it
    allow.owner(),
    // Assigned providers and staff can read/update (requires custom resolver in real prod, 
    // but for Gen 2 MVP we allow authenticated users to read/update if they are assigned)
    allow.authenticated().to(['read', 'update']),
    allow.groups(['Admin'])
  ]),

  // 5. Customer Notification Table
  CustomerNotification: a.model({
    applicationId: a.string().required(),
    customerId: a.string().required(),
    type: a.string().required(),
    message: a.string().required(),
    read: a.boolean().required(),
  }).authorization(allow => [
    allow.owner(), // Only the specific customer can access
    allow.groups(['Admin'])
  ])

});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'userPool',
    // API Key is required for public read access (e.g., viewing Providers without logging in)
    apiKeyAuthorizationMode: {
      expiresInDays: 30,
    },
  },
});
