
import { z } from "zod";

// Mirrors Postgres enums for runtime validation
export const Role = z.enum(["user", "executive", "developer", "sysadmin"]);
export const SupportLevel = z.enum(["ai", "human_executive", "developer", "sysadmin"]);
export const ConversationStatus = z.enum(["active", "escalated", "resolved", "closed", "abandoned"]);
export const MessageKind = z.enum(["user", "ai", "executive", "developer", "sysadmin", "system"]);
export const TicketStatus = z.enum(["open", "in_progress", "waiting", "resolved", "closed"]);
export const TicketPriority = z.enum(["low", "medium", "high", "urgent"]);
export const EscalationStatus = z.enum(["pending", "accepted", "completed", "canceled"]);

// Users
export const UpsertUserSchema = z.object({
    authSub: z.string().min(1),
    email: z.string().email().optional(),
    displayName: z.string().min(1).max(200).optional(),
    primaryRole: Role.optional(), // convenience only; real roles from Keycloak token
});

// Applications
export const CreateApplicationSchema = z.object({
    slug: z.string().min(2).max(80).regex(/^[a-z0-9-]+$/),
    name: z.string().min(2).max(160),
    description: z.string().max(5000).optional(),
});

// Grant access for a user to an app
export const GrantAccessSchema = z.object({
    userId: z.string().uuid(),
    applicationId: z.string().uuid(),
});

// Start a conversation (after Auth.js session)
export const StartConversationSchema = z.object({
    userId: z.string().uuid().optional(), // may be null for unauthenticated pre-auth calls
    applicationId: z.string().uuid(),
    livekitRoomSid: z.string().optional(),
    livekitRoomName: z.string().optional(),
    metadata: z.record(z.any()).optional(),
});

// Append message (ASR partial/final, AI reply, human text)
export const CreateMessageSchema = z.object({
    conversationId: z.string().uuid(),
    senderKind: MessageKind,
    senderUserId: z.string().uuid().optional(), // required if human
    text: z.string().optional(),
    content: z.any().optional(),
    mediaUrl: z.string().url().optional(),
    isFinal: z.boolean().default(true),
}).refine(
    (d) => (d.senderKind === "user" || d.senderKind === "ai") || !!d.senderUserId,
    { message: "senderUserId is required for human senders", path: ["senderUserId"] }
);

// Update conversation status / level (usually on escalation)
export const UpdateConversationSchema = z.object({
    conversationId: z.string().uuid(),
    status: ConversationStatus.optional(),
    currentLevel: SupportLevel.optional(),
    endedAt: z.string().datetime().optional(),
});

// Create escalation
export const CreateEscalationSchema = z.object({
    conversationId: z.string().uuid(),
    fromLevel: SupportLevel,
    toLevel: SupportLevel,
    reason: z.string().max(5000).optional(),
});

// Assign escalation to a human
export const CreateAssignmentSchema = z.object({
    escalationId: z.string().uuid(),
    assigneeUserId: z.string().uuid(),
});

// Ticketing
export const CreateTicketSchema = z.object({
    conversationId: z.string().uuid().optional(),
    applicationId: z.string().uuid(),
    title: z.string().min(3).max(200),
    description: z.string().max(20000).optional(),
    priority: TicketPriority.default("medium"),
    assignedUserId: z.string().uuid().optional(),
});

export const UpdateTicketSchema = z.object({
    ticketId: z.string().uuid(),
    status: TicketStatus.optional(),
    priority: TicketPriority.optional(),
    title: z.string().min(3).max(200).optional(),
    description: z.string().max(20000).optional(),
    assignedUserId: z.string().uuid().optional(),
});
