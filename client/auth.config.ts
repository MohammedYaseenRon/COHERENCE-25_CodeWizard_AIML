import type { NextAuthConfig } from 'next-auth';
import { NextResponse } from 'next/server';

export const authConfig = {
  pages: {
    signIn: '/login',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub as string;
        session.user.role = token.role as "hr" | "candidate";
      }
      return session;
    },
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const userRole = auth?.user?.role;
      const pathname = nextUrl.pathname;
    
      if (pathname === '/') {
        return true;
      }

      if (!isLoggedIn) {
        return false;
      }

      // Admin-only routes
      const adminRoutes = [
        '/dashboard',
        '/analytics',
        '/resume',
        '/jobs',
        '/candidates',
        '/messages',
      ];

      if (adminRoutes.some(route => pathname.startsWith(route))) {
        if (userRole !== 'hr') {
          return NextResponse.redirect(new URL('/', nextUrl));
        }
      }

      return true;
    },
  },
  providers: [],
} satisfies NextAuthConfig; 