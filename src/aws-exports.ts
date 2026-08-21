/**
 * AWS Amplify Configuration Template
 * 
 * Instructions:
 * 1. Create your resources in the AWS Console (Cognito, API Gateway, S3).
 * 2. Replace the placeholder values below with your actual AWS resource IDs.
 * 3. IMPORTANT: Never commit this file with real production secrets if your repository is public.
 */

const awsmobile = {
  // Authentication: AWS Cognito
  aws_project_region: 'ap-south-1', // e.g., ap-south-1 (Mumbai)
  aws_cognito_region: 'ap-south-1',
  aws_user_pools_id: 'ap-south-1_xxxxxxxxx', // Replace with your User Pool ID
  aws_user_pools_web_client_id: 'xxxxxxxxxxxxxxxxxxxxxxxxxx', // Replace with App Client ID
  
  // API: AWS API Gateway + Lambda
  aws_cloud_logic_custom: [
    {
      name: 'PermitAPI',
      endpoint: 'https://xxxxxxx.execute-api.ap-south-1.amazonaws.com/prod',
      region: 'ap-south-1'
    }
  ],

  // Storage: AWS S3
  aws_user_files_s3_bucket: 'leo-permit-app-storage-xxxxxx', // Replace with your S3 Bucket Name
  aws_user_files_s3_bucket_region: 'ap-south-1'
};

export default awsmobile;
