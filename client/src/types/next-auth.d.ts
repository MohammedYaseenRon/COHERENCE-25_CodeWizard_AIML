import { DefaultSession, DefaultUser } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      name: string;
      email: string;
      role: 'hr' | 'candidate';
    } & DefaultSession['user'];
  }

  interface User extends DefaultUser {
    id: string;
    role: 'hr' | 'candidate';
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: "hr" | "candidate";
  }
}