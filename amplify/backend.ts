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
// CDK ESCAPE HATCH: Enforce Strict Bucket Naming
// ---------------------------------------------------------
const { bucket } = backend.storage.resources;
if (bucket) {
  // We must target the underlying L1 CloudFormation resource because the L2 bucketName is read-only
  const cfnBucket = bucket.node.defaultChild as any;
  if (cfnBucket) {
    cfnBucket.bucketName = `leo-permits-storage-${envName.toLowerCase()}`;
  }
}
