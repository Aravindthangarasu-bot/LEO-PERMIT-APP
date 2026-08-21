import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import { data } from './data/resource';
import { storage } from './storage/resource';

/**
 * The Architect: This file weaves together Authentication (Cognito), 
 * Database (DynamoDB), and Storage (S3) into a single unified cloud backend.
 * @see https://docs.amplify.aws/gen2/build-a-backend/
 */
const backend = defineBackend({
  auth,
  data,
  storage,
});

// Map standard AWS branches to clean environment names
const branchEnvMap: Record<string, string> = {
  main: 'PROD',
  develop: 'QA',
  staging: 'STAGE'
};

// Determine the clean environment name (fallback to SANDBOX for local terminal)
const envName = branchEnvMap[process.env.AWS_BRANCH || ''] || 'SANDBOX';

// ---------------------------------------------------------
// CDK ESCAPE HATCH: Enforce Strict Table Naming
// ---------------------------------------------------------
const { cfnResources } = backend.data.resources;
const { amplifyDynamoDbTables } = cfnResources;

if (amplifyDynamoDbTables) {
  for (const [logicalId, table] of Object.entries(amplifyDynamoDbTables)) {
    // Force name: e.g., Leo-User-PROD, Leo-PermitApplication-QA
    table.tableName = `Leo-${logicalId}-${envName}`;
  }
}

// ---------------------------------------------------------
// CDK ESCAPE HATCH: Enforce Strict Bucket Naming
// ---------------------------------------------------------
const { bucket } = backend.storage.resources;
if (bucket) {
  // S3 bucket names must be lowercase and globally unique.
  // e.g. leo-permits-storage-prod
  bucket.bucketName = `leo-permits-storage-${envName.toLowerCase()}`;
}
