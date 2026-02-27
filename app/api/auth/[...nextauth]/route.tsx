import NextAuth, { NextAuthOptions } from "next-auth"
import KeycloakProvider from "next-auth/providers/keycloak"
import { users, roles, userRoles } from "@/db/schema";
import { eq, count } from "drizzle-orm";
import { db } from "@/db/db.ts";




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

                // if not, create with logic: first user is sysadmin, others are user
                if (!existingUser) {
                    console.log("[NextAuth] User not found, creating new user...");
                    // Check if any users exist
                    const [userCount] = await db.select({ value: count() }).from(users);
                    const isFirstUser = userCount.value === 0;
                    console.log("[NextAuth] Is first user:", isFirstUser);

                    // Ensure basic roles exist
                    const defaultRoles = ["sysadmin", "admin", "dev_manager", "developer", "project_manager", "user"];
                    for (const roleName of defaultRoles) {
                        const existingRole = await db.query.roles.findFirst({
                            where: eq(roles.name, roleName)
                        });
                        if (!existingRole) {
                            console.log("[NextAuth] Creating role:", roleName);
                            await db.insert(roles).values({ name: roleName });
                        }
                    }

                    const roleToAssign = isFirstUser ? "sysadmin" : "user";
                    const dbRole = await db.query.roles.findFirst({
                        where: eq(roles.name, roleToAssign)
                    });

                    console.log("[NextAuth] Assigning role:", roleToAssign, "ID:", dbRole?.id);

                    const [newUser] = await db.insert(users).values({
                        authSub,
                        email: user.email!,
                        displayName: user.name ?? null,
                        primaryRole: roleToAssign as any,
                        activeRoleId: dbRole?.id || null
                    }).returning();

                    if (dbRole) {
                        await db.insert(userRoles).values({
                            userId: newUser.id,
                            roleId: dbRole.id
                        });
                    }
                    console.log("[NextAuth] New user created with ID:", newUser.id);
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
                // Fetch user with their active role
                const dbUser = await db.query.users.findFirst({
                    where: eq(users.email, session.user.email),
                });

                if (dbUser) {
                    session.user.id = dbUser.id;

                    // Fetch all assigned roles
                    const assignedRoles = await db
                        .select({
                            id: roles.id,
                            name: roles.name,
                            description: roles.description
                        })
                        .from(userRoles)
                        .innerJoin(roles, eq(userRoles.roleId, roles.id))
                        .where(eq(userRoles.userId, dbUser.id));

                    session.user.roles = assignedRoles;

                    // Fetch active role details
                    if (dbUser.activeRoleId) {
                        const activeRole = await db.query.roles.findFirst({
                            where: eq(roles.id, dbUser.activeRoleId)
                        });
                        session.user.activeRole = activeRole || null;
                        session.user.role = activeRole?.name || "user"; // for backward compatibility
                    } else {
                        session.user.activeRole = assignedRoles[0] || null;
                        session.user.role = assignedRoles[0]?.name || "user";
                    }
                }
            }
            return session;
        }
    },
};
const handler = NextAuth(authOptions);
export { handler as GET, handler as POST }
