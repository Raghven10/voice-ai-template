import NextAuth, {NextAuthOptions} from "next-auth"
import KeycloakProvider from "next-auth/providers/keycloak"
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import {db} from "@/db/db.ts";




export const authOptions: NextAuthOptions = {
    providers: [
        KeycloakProvider({
            clientId: process.env.KEYCLOAK_CLIENT_ID!,
            clientSecret: process.env.KEYCLOAK_CLIENT_SECRET!,
            issuer: process.env.KEYCLOAK_ISSUER, // e.g. "http://localhost:8080/realms/myrealm"
        }),
    ],
    callbacks: {
        async signIn({ user, account, profile }) {
            try {
                if (!user || !account || !profile) return false;
                const authSub = profile.sub as string;
                // check if user exists in DB
                const existingUser = await db.query.users.findFirst({
                    where: eq(users.email, user.email!),
                });

                // if not, create with default role "user"
                if (!existingUser) {
                    await db.insert(users).values({
                        authSub, // ✅ required
                        email: user.email ?? null,
                        displayName: user.name ?? null,
                        // role will default to "user"
                    });
                }
                return true;
            } catch (err) {
                console.error("SignIn error:", err);
                return false;
            }
        },
        async jwt({ token, account, profile }) {
            if (account) {
                token.accessToken = account.access_token
                token.idToken = account.id_token
                token.refreshToken = account.refresh_token
            }
            return token
        },
        async session({ session, token }) {
            if (session.user?.email) {
                const [dbUser] = await db
                    .select()
                    .from(users)
                    .where(eq(users.email, session.user.email))
                    .limit(1);

                if (dbUser) {
                    session.user.id = dbUser.id;
                    session.user.role = dbUser.primaryRole;
                }
            }
            return session;
        }
    },
};
const handler = NextAuth(authOptions);
export { handler as GET, handler as POST }
