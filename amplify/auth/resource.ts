import { defineAuth } from '@aws-amplify/backend';

/**
 * Define and configure your auth resource
 * @see https://docs.amplify.aws/gen2/build-a-backend/auth
 */
export const auth = defineAuth({
  loginWith: {
    // We use phone number for OTP logins
    phone: true,
  },
  userAttributes: {
    // Map standard attributes
    phoneNumber: {
      mutable: true,
      required: true,
    },
    // We can store the user's name directly in Cognito
    givenName: {
      mutable: true,
      required: false,
    },
  },
  groups: ['Admin', 'Customer', 'Provider', 'Staff'],
});
