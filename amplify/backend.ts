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

// ---------------------------------------------------------
// CDK ESCAPE HATCH: Enforce Strict Bucket Naming
// ---------------------------------------------------------
const { bucket } = backend.storage.resources;
if (bucket) {
  const cfnBucket = bucket.node.defaultChild as any;
  if (cfnBucket) {
    const branchEnvMap: Record<string, string> = {
      main: 'prod',
      develop: 'qa',
      staging: 'stage'
    };
    const envName = branchEnvMap[process.env.AWS_BRANCH || ''] || 'sandbox';
    cfnBucket.bucketName = `leo-permits-storage-${envName}`;
  }
}
