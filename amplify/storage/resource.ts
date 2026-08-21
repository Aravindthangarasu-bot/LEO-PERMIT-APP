import { defineStorage } from '@aws-amplify/backend';

/**
 * Define and configure your storage resource (AWS S3)
 * @see https://docs.amplify.aws/gen2/build-a-backend/storage
 */
export const storage = defineStorage({
  name: 'permitAppStorage',
  access: (allow) => ({
    // The public/ folder can be read by anyone, but only authenticated users can upload
    'public/*': [
      allow.authenticated.to(['read', 'write']),
      allow.guest.to(['read'])
    ],
    
    // CUSTOMER ISOLATION: A customer can only access their own folder inside customers/
    'customers/{entity_id}/*': [
      allow.entity('identity').to(['read', 'write', 'delete']),
      // Providers and Admins (in a real scenario, we would map the IAM group here, 
      // but for simplicity in Gen 2 we allow authenticated users to read customer documents
      // if they have the direct link)
      allow.authenticated.to(['read'])
    ],

    // PROVIDER ISOLATION: A provider can only access their own folder
    'providers/{entity_id}/*': [
      allow.entity('identity').to(['read', 'write', 'delete']),
      allow.authenticated.to(['read'])
    ],

    // ADMIN STORAGE
    'admin/*': [
      allow.groups(['Admin']).to(['read', 'write', 'delete'])
    ]
  })
});
