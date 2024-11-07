import { prisma } from '@/lib/db/prisma';
import { NextAuthOptions, Session } from 'next-auth';                                                 
import { PrismaAdapter } from '@auth/prisma-adapter';
import NextAuth from 'next-auth/next';
import { Adapter } from 'next-auth/adapters';
import Google from 'next-auth/providers/google';
import { env } from '@/lib/env';
import { mergeAnonymousCartIntoUserCart } from '@/lib/db/cart';

export const authOptions: NextAuthOptions = {
    adapter: PrismaAdapter(prisma) as Adapter,
    providers: [
        Google({
            clientId: env.GOOGLE_CLIENT_ID,
            clientSecret: env.GOOGLE_CLIENT_SECRET
        })
    ],
    callbacks: {
        session({session, user}) {
            session.user.id = user.id
            return session
        },
    },
    events: {
        async signIn({user}) {
            mergeAnonymousCartIntoUserCart(user.id)
        },
    }
};

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }