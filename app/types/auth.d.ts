// Better Auth type definitions
export interface User {
  id: string;
  name?: string | null;
  email: string;
  emailVerified?: Date | null;
  image?: string | null;
  password?: string | null;
  roleId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Role {
  id: string;
  name: string;
  description?: string | null;
  permissions: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Session {
  user: User;
  session: {
    id: string;
    sessionToken: string;
    userId: string;
    expires: Date;
  };
}
