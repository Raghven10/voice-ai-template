
import "dotenv/config";
import { db } from "../db/db";
import { sql } from "drizzle-orm";

async function main() {
    console.log("Enabling pgvector extension...");
    try {
        await db.execute(sql`CREATE EXTENSION IF NOT EXISTS vector;`);
        console.log("Success: vector extension enabled.");
    } catch (error) {
        console.error("Error enabling vector extension:", error);
    }
    process.exit(0);
}

main();
