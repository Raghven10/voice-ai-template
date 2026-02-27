
import {
    pgTable, uuid, text, timestamp, varchar, boolean, jsonb, vector,
    primaryKey, uniqueIndex, index, integer, json
} from "drizzle-orm/pg-core";

// import {
//     roleEnum,
//     conversationStatusEnum,
//     supportLevelEnum,
//     messageKindEnum,
//     ticketStatusEnum,
//     ticketPriorityEnum,
//     escalationStatusEnum,
// } from "./enums";

import { pgEnum } from "drizzle-orm/pg-core";

export const roleEnum = pgEnum("role_enum", [
    "user",
    "executive",
    "developer",
    "sysadmin",
]);

export const conversationStatusEnum = pgEnum("conversation_status_enum", [
    "active",
    "escalated",
    "resolved",
    "closed",
    "abandoned",
]);

export const supportLevelEnum = pgEnum("support_level_enum", [
    "ai",
    "human_executive",
    "developer",
    "sysadmin",
]);

export const messageKindEnum = pgEnum("message_kind_enum", [
    "user",
    "ai",
    "executive",
    "developer",
    "sysadmin",
    "system",
]);

export const ticketStatusEnum = pgEnum("ticket_status_enum", [
    "open",
    "in_progress",
    "waiting",
    "resolved",
    "closed",
]);

export const ticketPriorityEnum = pgEnum("ticket_priority_enum", [
    "low",
    "medium",
    "high",
    "urgent",
]);

export const escalationStatusEnum = pgEnum("escalation_status_enum", [
    "pending",
    "accepted",
    "completed",
    "canceled",
]);



export const users = pgTable("users", {
    id: uuid("id").primaryKey().defaultRandom(),
    authSub: varchar("auth_sub", { length: 255 }).notNull(),
    email: varchar("email", { length: 320 }).notNull().unique(),  // FK will work now
    displayName: varchar("display_name", { length: 200 }),
    primaryRole: roleEnum("primary_role").default("user").notNull(),
    activeRoleId: uuid("active_role_id"), // FK to roles.id
    selectedVoiceId: uuid("selected_voice_id").references(() => customVoices.id), // Null = default voice
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
    uniqAuthSub: uniqueIndex("users_auth_sub_uidx").on(t.authSub),
    emailIdx: index("users_email_idx").on(t.email),
}));

// Master table for roles
export const roles = pgTable("roles", {
    id: uuid("id").primaryKey().defaultRandom(),
    name: varchar("name", { length: 50 }).notNull().unique(),
    description: text("description"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// Junction table for user-roles (many-to-many)
export const userRoles = pgTable("user_roles", {
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    roleId: uuid("role_id").notNull().references(() => roles.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
    pk: primaryKey({ columns: [t.userId, t.roleId], name: "user_roles_pk" }),
    userIdx: index("user_roles_user_idx").on(t.userId),
    roleIdx: index("user_roles_role_idx").on(t.roleId),
}));

// Applications catalog
export const applications = pgTable("applications", {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: varchar("slug", { length: 80 }).notNull(),
    name: varchar("name", { length: 160 }).notNull(),
    description: text("description"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
    uniqSlug: uniqueIndex("applications_slug_uidx").on(t.slug),
}));

// Which apps a user can query (optional but useful in multi-app helpdesk)
export const userAppAccess = pgTable("user_app_access", {
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    applicationId: uuid("application_id").notNull().references(() => applications.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
    pk: primaryKey({ columns: [t.userId, t.applicationId], name: "user_app_access_pk" }),
    accessIdx: index("user_app_access_idx").on(t.userId, t.applicationId),
}));

// LiveKit-backed voice conversation
export const conversations = pgTable("conversations", {
    id: uuid("id").primaryKey().defaultRandom(),
    // Useful to correlate with LiveKit room
    livekitRoomSid: varchar("livekit_room_sid", { length: 128 }),
    livekitRoomName: varchar("livekit_room_name", { length: 255 }),
    userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
    applicationId: uuid("application_id").references(() => applications.id, { onDelete: "set null" }),
    status: conversationStatusEnum("status").default("active").notNull(),
    currentLevel: supportLevelEnum("current_level").default("ai").notNull(),
    startedAt: timestamp("started_at", { withTimezone: true }).defaultNow().notNull(),
    endedAt: timestamp("ended_at", { withTimezone: true }),
    metadata: jsonb("metadata"), // anything session-specific (device, locale, etc.)
}, (t) => ({
    userIdx: index("convo_user_idx").on(t.userId),
    appIdx: index("convo_app_idx").on(t.applicationId),
    roomSidIdx: index("convo_room_sid_idx").on(t.livekitRoomSid),
}));

// Conversation messages (voice transcript chunks, AI replies, human messages)
export const messages = pgTable("messages", {
    id: uuid("id").primaryKey().defaultRandom(),
    conversationId: uuid("conversation_id").notNull()
        .references(() => conversations.id, { onDelete: "cascade" }),
    senderKind: messageKindEnum("sender_kind").notNull(), // user/ai/executive/developer/sysadmin/system
    senderUserId: uuid("sender_user_id").references(() => users.id, { onDelete: "set null" }), // for human roles
    // transcript & content
    text: text("text"),              // ASR text or AI reply text
    content: jsonb("content"),       // rich payload (tools called, citations, actions)
    mediaUrl: varchar("media_url", { length: 2048 }), // optional URL to audio blob if stored
    isFinal: boolean("is_final").default(true).notNull(), // final vs partial transcript
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
    convoIdx: index("msg_convo_idx").on(t.conversationId),
    senderIdx: index("msg_sender_idx").on(t.senderKind, t.senderUserId),
}));

// Escalation events (AI → human → developer → sysadmin)
export const escalations = pgTable("escalations", {
    id: uuid("id").primaryKey().defaultRandom(),
    conversationId: uuid("conversation_id").notNull()
        .references(() => conversations.id, { onDelete: "cascade" }),
    fromLevel: supportLevelEnum("from_level").notNull(),
    toLevel: supportLevelEnum("to_level").notNull(),
    reason: text("reason"),
    status: escalationStatusEnum("status").default("pending").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    resolvedAt: timestamp("resolved_at", { withTimezone: true }),
}, (t) => ({
    convoIdx: index("escalation_convo_idx").on(t.conversationId),
}));

// Assignment of an escalation to a specific human (executive/dev/sysadmin)
export const assignments = pgTable("assignments", {
    id: uuid("id").primaryKey().defaultRandom(),
    escalationId: uuid("escalation_id").notNull()
        .references(() => escalations.id, { onDelete: "cascade" }),
    assigneeUserId: uuid("assignee_user_id").notNull()
        .references(() => users.id, { onDelete: "restrict" }),
    acceptedAt: timestamp("accepted_at", { withTimezone: true }),
    releasedAt: timestamp("released_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
    escalIdx: index("assignment_escal_idx").on(t.escalationId),
    assigneeIdx: index("assignment_assignee_idx").on(t.assigneeUserId),
}));

// Ticket raised from a conversation (optionally across apps)
export const tickets = pgTable("tickets", {
    id: uuid("id").primaryKey().defaultRandom(),
    conversationId: uuid("conversation_id")
        .references(() => conversations.id, { onDelete: "set null" }),
    applicationId: uuid("application_id")
        .references(() => applications.id, { onDelete: "set null" }),
    title: varchar("title", { length: 200 }).notNull(),
    description: text("description"),
    status: ticketStatusEnum("status").default("open").notNull(),
    priority: ticketPriorityEnum("priority").default("medium").notNull(),
    createdByUserId: uuid("created_by_user_id")
        .references(() => users.id, { onDelete: "set null" }),
    assignedUserId: uuid("assigned_user_id")
        .references(() => users.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
    appIdx: index("ticket_app_idx").on(t.applicationId),
    assigneeIdx: index("ticket_assignee_idx").on(t.assignedUserId),
    statusIdx: index("ticket_status_idx").on(t.status),
}));

export const sessionTable = pgTable("sessions", {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    sessionId: varchar({ length: 255 }).notNull(),
    notes: varchar().notNull(),
    selectedAgent: json(),
    conversation: json(),
    report: json(),
    createdAt: varchar().notNull(),
    createdBy: uuid("created_by").notNull().references(() => users.id), // FK to UUID
});


// RAG: Help Manual Documents
export const documents = pgTable("documents", {
    id: uuid("id").primaryKey().defaultRandom(),
    applicationId: uuid("application_id")
        .references(() => applications.id, { onDelete: "cascade" }),
    userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 255 }).notNull(),
    content: text("content"),
    filePath: varchar("file_path", { length: 512 }), // path to source file if local
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
    appIdx: index("doc_app_idx").on(t.applicationId),
    userIdx: index("doc_user_idx").on(t.userId),
}));

// RAG: Document Chunks for vector search
export const documentChunks = pgTable("document_chunks", {
    id: uuid("id").primaryKey().defaultRandom(),
    documentId: uuid("document_id").notNull()
        .references(() => documents.id, { onDelete: "cascade" }),
    content: text("content").notNull(),
    embedding: vector("embedding", { dimensions: 384 }), // pgvector 384 dims for all-MiniLM-L6-v2
    chunkIndex: integer("chunk_index").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
    docIdx: index("chunk_doc_idx").on(t.documentId),
}));

// In-app notifications/alerts
export const notifications = pgTable("notifications", {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull()
        .references(() => users.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 255 }).notNull(),
    message: text("message").notNull(),
    type: varchar("type", { length: 50 }).default("info").notNull(), // info, success, warning, error
    ticketId: uuid("ticket_id")
        .references(() => tickets.id, { onDelete: "set null" }),
    isRead: boolean("is_read").default(false).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
    userIdx: index("notif_user_idx").on(t.userId),
    readIdx: index("notif_read_idx").on(t.isRead),
}));

// Custom cloned voices for users
export const customVoices = pgTable("custom_voices", {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 100 }).notNull(),
    embeddingPath: varchar("embedding_path", { length: 512 }).notNull(), // path to the latents/audio file
    previewUrl: varchar("preview_url", { length: 512 }),
    isPublic: boolean("is_public").default(false).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
    userIdx: index("custom_voice_user_idx").on(t.userId),
}));

export const apiKeys = pgTable("api_keys", {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 100 }).notNull(),
    key: varchar("key", { length: 255 }).notNull().unique(), // hashed or just unique
    lastUsedAt: timestamp("last_used_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
    userIdx: index("api_key_user_idx").on(t.userId),
    keyIdx: index("api_key_idx").on(t.key),
}));




// Configurable Voice Agents (ElevenLabs-style entities)
export const voiceAgents = pgTable("voice_agents", {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 150 }).notNull(),
    description: text("description"),
    // Core AI Config
    systemPrompt: text("system_prompt").default("You are a helpful assistant."),
    language: varchar("language", { length: 10 }).default("en"),
    // Voice Config
    baseVoiceId: varchar("base_voice_id", { length: 100 }).notNull(), // can be system 'af_heart' or custom ID
    voiceSettings: jsonb("voice_settings"), // stability, similarity, speed (if supported)
    // Dynamic Traits
    traits: jsonb("traits"), // e.g. [{ mood: 'angry', prompt: 'Talk aggressively', voiceOverride: '...' }]
    // knowledgeBaseId removed
    isPublic: boolean("is_public").default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
    userIdx: index("agent_user_idx").on(t.userId),
}));

export const agentDocuments = pgTable("agent_documents", {
    agentId: uuid("agent_id").notNull()
        .references(() => voiceAgents.id, { onDelete: "cascade" }),
    documentId: uuid("document_id").notNull()
        .references(() => documents.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
    pk: primaryKey({ columns: [t.agentId, t.documentId] }),
    agentIdx: index("agent_docs_agent_idx").on(t.agentId),
}));
