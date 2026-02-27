
const { Client } = require("pg");
const dotenv = require("dotenv");

dotenv.config();

async function seed() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
    });

    try {
        await client.connect();
        console.log("Connected to database.");

        const defaultRoles = ["sysadmin", "admin", "dev_manager", "developer", "project_manager", "user"];

        for (const roleName of defaultRoles) {
            console.log(`Inserting role: ${roleName}`);
            await client.query(
                "INSERT INTO roles (id, name, created_at, updated_at) VALUES (gen_random_uuid(), $1, NOW(), NOW()) ON CONFLICT (name) DO NOTHING",
                [roleName]
            );
        }

        console.log("Roles seeded successfully.");

        const res = await client.query("SELECT * FROM roles");
        console.log("Current roles in DB:", res.rows);

    } catch (err) {
        console.error("Seeding failed:", err);
    } finally {
        await client.end();
    }
}

seed();
