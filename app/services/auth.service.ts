// Better Auth handles authentication directly
// This service file is no longer needed but kept for reference
// All auth operations should use the Better Auth client from @/app/lib/auth-client

export const AuthService = {
  // Use Better Auth's signIn.email() instead
  login: () => {
    throw new Error("Use Better Auth client: signIn.email()");
  },
  // Use Better Auth's signUp.email() instead
  register: () => {
    throw new Error("Use Better Auth client: signUp.email()");
  },
};
