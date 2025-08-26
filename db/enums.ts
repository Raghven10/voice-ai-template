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
