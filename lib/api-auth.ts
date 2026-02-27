
import { db } from "@/db/db";
import { apiKeys } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function authenticateApiKey(req: Request) {
    const key = req.headers.get("X-API-KEY");
    if (!key) return null;

    const apiKeyRecord = await db.query.apiKeys.findFirst({
        where: eq(apiKeys.key, key)
    });

    if (!apiKeyRecord) return null;

    // Update last used
    // await db.update(apiKeys).set({ lastUsedAt: new Date() }).where(eq(apiKeys.id, apiKeyRecord.id));

    return apiKeyRecord;
}
