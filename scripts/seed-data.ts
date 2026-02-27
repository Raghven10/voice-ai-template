import * as dotenv from "dotenv";
dotenv.config({ path: ".env" });

import { db } from "../db/db";
import { applications, users } from "../db/schema";
import { eq } from "drizzle-orm";

async function seed() {
    console.log("Seeding data...");

    // 1. Create a developer user if not exists
    const devEmail = "dev@example.com";
    let dev = await db.query.users.findFirst({
        where: eq(users.email, devEmail)
    });

    if (!dev) {
        [dev] = await db.insert(users).values({
            email: devEmail,
            authSub: "seed-dev-auth-sub",
            displayName: "Lead Developer",
            primaryRole: "developer"
        }).returning();
        console.log("Created developer user:", dev.email);
    } else {
        console.log("Developer user already exists.");
    }

    // 2. Create some applications
    const appsToCreate = [
        { name: "Inventory Management", slug: "inventory-app", description: "System for tracking warehouse stock." },
        { name: "Employee Portal", slug: "employee-portal", description: "HR and payroll management system." },
        { name: "Customer Dashboard", slug: "customer-dash", description: "External portal for client analytics." }
    ];

    for (const appData of appsToCreate) {
        const existingApp = await db.query.applications.findFirst({
            where: eq(applications.slug, appData.slug)
        });

        if (!existingApp) {
            await db.insert(applications).values(appData);
            console.log("Created application:", appData.name);
        } else {
            console.log("Application already exists:", appData.name);
        }
    }

    console.log("Seeding complete!");
    process.exit(0);
}

seed().catch(err => {
    console.error("Seed failed:", err);
    process.exit(1);
});
