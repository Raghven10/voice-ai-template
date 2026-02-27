import { db } from "@/db/db";
import { applications, tickets, conversations, messages, users, customVoices, escalations, voiceAgents, agentDocuments } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { sendNotification } from "@/lib/notifications";

export class VoiceHelpdeskLogic {
    // 1. Greet the user
    static getGreeting(): string {
        return "नमस्ते! AI Helpdesk में आपका स्वागत है। आज आप किस एप्लिकेशन के बारे में सहायता चाहते हैं?";
    }

    // 2. Lookup application by name/slug
    static async lookupApplication(name: string) {
        const app = await db.query.applications.findFirst({
            where: (apps, { or, eq, ilike }) =>
                or(ilike(apps.name, `%${name}%`), ilike(apps.slug, `%${name}%`))
        });
        return app;
    }

    // 3. Get previous queries/tickets for user and app
    static async getPreviousQueries(userEmail: string, appName: string) {
        // Find user first
        const user = await db.query.users.findFirst({
            where: eq(users.email, userEmail)
        });
        if (!user) return [];

        // Find app
        const app = await this.lookupApplication(appName);
        if (!app) return [];

        // Find tickets
        const previousTickets = await db.query.tickets.findMany({
            where: and(
                eq(tickets.createdByUserId, user.id),
                eq(tickets.applicationId, app.id)
            ),
            orderBy: [desc(tickets.createdAt)],
            limit: 3
        });

        return previousTickets;
    }

    // 4. Create a new ticket and notify developer
    static async createTicket(userEmail: string, appName: string, description: string, conversationId?: string) {
        const user = await db.query.users.findFirst({
            where: eq(users.email, userEmail)
        });
        if (!user) throw new Error("User not found");

        const app = await this.lookupApplication(appName);
        if (!app) throw new Error("Application not found");

        // Create ticket
        const [ticket] = await db.insert(tickets).values({
            applicationId: app.id,
            createdByUserId: user.id,
            title: `Issue with ${app.name}`,
            description: description,
            status: "open",
            priority: "medium",
            conversationId: conversationId as any,
        }).returning();

        // Notify related developer (mock logic: find first user with role 'developer')
        const developer = await db.query.users.findFirst({
            where: eq(users.primaryRole, "developer")
        });

        if (developer) {
            await db.update(tickets).set({ assignedUserId: developer.id }).where(eq(tickets.id, ticket.id));

            // Create notification
            await sendNotification({
                userId: developer.id,
                title: "New Ticket Assigned",
                message: `A new ticket regarding ${app.name} has been assigned to you. Description: ${description}`,
                ticketId: ticket.id,
                type: "info"
            });
        }

        return ticket;
    }

    // 5. Persist message to DB
    static async logMessage(conversationId: string, role: 'user' | 'ai', text: string) {
        await db.insert(messages).values({
            conversationId: conversationId as any,
            senderKind: role === 'user' ? 'user' : 'ai',
            text: text,
            isFinal: true
        });
    }

    // 6. Start conversation session
    static async startConversation(roomName: string, userEmail: string) {
        const user = await db.query.users.findFirst({
            where: eq(users.email, userEmail)
        });

        const [convo] = await db.insert(conversations).values({
            livekitRoomName: roomName,
            userId: user?.id,
            status: "active"
        }).returning();

        return convo;
    }
    // 7. Get Active Voice Config
    static async getActiveVoiceConfig(userEmail: string) {
        const user = await db.query.users.findFirst({
            where: eq(users.email, userEmail)
        });

        // Since we didn't define relations explicitly in schema with relations(), let's manual query if needed
        // Or simpler: just query users and if selectedVoiceId, query customVoices.
        if (user && user.selectedVoiceId) {
            const voice = await db.query.customVoices.findFirst({
                where: eq(customVoices.id, user.selectedVoiceId)
            });
            if (voice) {
                return {
                    type: 'xtts',
                    voiceId: voice.id,
                    embeddingPath: voice.embeddingPath,
                    model: 'tts_models/multilingual/multi-dataset/xtts_v2'
                };
            }
        }

        // Default to Dedicated Piper Service (True Hindi)
        return {
            type: 'piper',
            voiceId: 'hi_IN-pratham-medium',
            model: 'piper'
        };
    }

    // 8. Search Documentation
    static async searchDocumentation(appName: string, query: string) {
        const app = await this.lookupApplication(appName);
        if (!app) return "Application not found.";

        const { RAGService } = await import("./services/rag.ts");
        const results = await RAGService.search(app.id, query, 3);
        if (!results || results.length === 0) return "No relevant documentation found for this query. We can raise a ticket instead.";

        return "Found the following documentation:\n\n" + results.map((r: any) => `[From: ${r.title}]\n${r.text}`).join("\n\n");
    }

    // 10. Get Agent Config by ID
    static async getAgentConfig(agentId: string) {
        const agent = await db.query.voiceAgents.findFirst({
            where: eq(voiceAgents.id, agentId),
        });
        if (!agent) return null;

        // Fetch linked document IDs
        const linkedDocs = await db.query.agentDocuments.findMany({
            where: eq(agentDocuments.agentId, agentId),
        });

        return {
            ...agent,
            knowledgeBaseDocIds: linkedDocs.map((d) => d.documentId),
        };
    }

    // 11. Get greeting text for a given language code
    static getGreetingForAgent(language: string): string {
        const greetings: Record<string, string> = {
            hi: "नमस्ते! AI Helpdesk में आपका स्वागत है। आज आप किस एप्लिकेशन के बारे में सहायता चाहते हैं?",
            en: "Hello! Welcome to the AI Helpdesk. Which application do you need help with today?",
            mr: "नमस्कार! AI Helpdesk मध्ये आपले स्वागत आहे. आज आपल्याला कोणत्या अ‍ॅप्लिकेशनसाठी मदत हवी आहे?",
            bn: "নমস্কার! AI Helpdesk-এ আপনাকে স্বাগতম। আজ কোন অ্যাপ্লিকেশনের জন্য সাহায্য করতে পারি?",
            te: "నమస్కారం! AI Helpdesk కి స్వాగతం. ఈరోజు మీకు ఏ అప్లికేషన్‌కు సహాయం కావాలి?",
            ta: "வணக்கம்! AI Helpdesk-ற்கு வரவேற்கிறோம். இன்று எந்த பயன்பாட்டிற்கு உதவி வேண்டும்?",
        };
        return greetings[language] ?? greetings["en"];
    }

    // 9. Escalate Issue
    static async escalateIssue(conversationId: string, level: "human_executive" | "developer" | "sysadmin", reason: string) {
        const [escalation] = await db.insert(escalations).values({
            conversationId: conversationId as any,
            fromLevel: "ai",
            toLevel: level,
            reason: reason,
            status: "pending"
        }).returning();

        // Notify the relevant role
        // For 'human_executive', the primaryRole might be 'executive'
        const roleQueryMap = {
            "human_executive": "executive",
            "developer": "developer",
            "sysadmin": "sysadmin"
        };
        const targetRole = roleQueryMap[level] || "sysadmin";

        const handler = await db.query.users.findFirst({
            where: eq(users.primaryRole, targetRole as any)
        });

        if (handler) {
            await sendNotification({
                userId: handler.id,
                title: "Issue Escalated by AI",
                message: `An issue has been escalated to you. Reason: ${reason}`,
                type: "warning"
            });
        }

        return `Issue escalated to the ${level} team. Reference ID: ${escalation.id.substring(0, 8)}. A human agent will look into this shortly.`;
    }
}
