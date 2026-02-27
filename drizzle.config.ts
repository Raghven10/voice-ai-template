import { defineConfig } from "drizzle-kit";

export default defineConfig({
    dialect: "postgresql",
    schema: "./db/schema.ts",
    out: "./drizzle",
    dbCredentials: {
        url: process.env.DATABASE_URL!,
    },
    tablesFilter: [
        "applications",
        "assignments",
        "conversations",
        "document_chunks",
        "documents",
        "escalations",
        "messages",
        "notifications",
        "roles",
        "sessions",
        "tickets",
        "user_app_access",
        "user_roles",
        "user_roles",
        "users",
        "custom_voices",
        "api_keys",
        "voice_agents"
    ],
});
