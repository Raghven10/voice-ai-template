
import "dotenv/config";
import { db } from "../db/db";
import { sql } from "drizzle-orm";

async function main() {
    console.log("Resetting document_chunks table...");
    try {
        // Drop the table to allow clean recreation with vector column
        await db.execute(sql`DROP TABLE IF EXISTS document_chunks CASCADE;`);
        console.log("Success: document_chunks table dropped.");
    } catch (error) {
        console.error("Error resetting table:", error);
    }
    process.exit(0);
}

main();
