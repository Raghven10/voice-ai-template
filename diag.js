
const { drizzle } = require("drizzle-orm/node-postgres");
const { Pool } = require("pg");
const { users, roles, userRoles } = require("./db/schema");
const { eq, count } = require("drizzle-orm");
const dotenv = require("dotenv");

dotenv.config();

async function run() {
    console.log("Starting diagnostic...");
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
    });
    const db = drizzle(pool);

    try {
        console.log("Checking roles...");
        const allRoles = await db.select().from(roles);
        console.log("Current roles:", allRoles);

        if (allRoles.length === 0) {
            console.log("Creating default roles...");
            const defaultRoles = ["sysadmin", "admin", "dev_manager", "developer", "project_manager", "user"];
            for (const roleName of defaultRoles) {
                await db.insert(roles).values({ name: roleName }).onConflictDoNothing();
            }
            console.log("Default roles created.");
        }

        const userCount = await db.select({ value: count() }).from(users);
        console.log("User count:", userCount[0].value);

    } catch (err) {
        console.error("Diagnostic failed:", err);
    } finally {
        await pool.end();
    }
}

run();
