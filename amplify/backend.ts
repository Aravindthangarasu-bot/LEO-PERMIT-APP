import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import { data } from './data/resource';
import { storage } from './storage/resource';
import { Aspects, IAspect } from 'aws-cdk-lib';
import { CfnTable } from 'aws-cdk-lib/aws-dynamodb';

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
// CDK ESCAPE HATCH: Enforce Strict Table Naming (The Visitor Pattern)
// ---------------------------------------------------------
class TableNamingAspect implements IAspect {
  constructor(private env: string) {}

  public visit(node: any): void {
    if (node instanceof CfnTable) {
      // Amplify Gen 2 usually gives tables a default name like: "User-djxqmf4wngya8-main"
      // We extract the base model name (e.g., "User") and violently rewrite it.
      if (typeof node.tableName === 'string') {
        const modelName = node.tableName.split('-')[0];
        node.tableName = `Leo-${modelName}-${this.env}`;
      } else {
        // Fallback if the name is a Token: try to guess from the Construct ID
        const modelName = node.node.id.replace('Table', '');
        node.tableName = `Leo-${modelName}-${this.env}`;
      }
    }
  }
}

// Attach the visitor to the entire backend stack (traverses all nested stacks)
Aspects.of(backend.stack).add(new TableNamingAspect(envName));

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
