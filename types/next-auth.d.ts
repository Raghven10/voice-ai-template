import NextAuth, { DefaultSession } from "next-auth"

declare module "next-auth" {
    interface Session {
        user: {
            id: string;
            role: string;
            roles: {
                id: string;
                name: string;
            }[];
            activeRole?: {
                id: string;
                name: string;
            };
            image?: string | null;
        } & DefaultSession["user"]
    }

    interface User {
        id: string;
        role: string;
        roles: {
            id: string;
            name: string;
        }[];
        activeRole?: {
            id: string;
            name: string;
        };
    }
}
