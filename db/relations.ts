import { relations } from "drizzle-orm";
import {
    users, applications, userAppAccess, conversations,
    messages, escalations, assignments, tickets
} from "./schema";

export const userRelations = relations(users, ({ many }) => ({
    appAccess: many(userAppAccess),
    conversations: many(conversations),
    messages: many(messages),
    assignments: many(assignments),
    createdTickets: many(tickets, { relationName: "createdTickets" }),
    assignedTickets: many(tickets, { relationName: "assignedTickets" }),
}));

export const applicationRelations = relations(applications, ({ many }) => ({
    conversations: many(conversations),
    tickets: many(tickets),
    access: many(userAppAccess),
}));

export const userAppAccessRelations = relations(userAppAccess, ({ one }) => ({
    user: one(users, { fields: [userAppAccess.userId], references: [users.id] }),
    application: one(applications, { fields: [userAppAccess.applicationId], references: [applications.id] }),
}));

export const conversationRelations = relations(conversations, ({ one, many }) => ({
    user: one(users, { fields: [conversations.userId], references: [users.id] }),
    application: one(applications, { fields: [conversations.applicationId], references: [applications.id] }),
    messages: many(messages),
    escalations: many(escalations),
    tickets: many(tickets),
}));

export const messageRelations = relations(messages, ({ one }) => ({
    conversation: one(conversations, { fields: [messages.conversationId], references: [conversations.id] }),
    senderUser: one(users, { fields: [messages.senderUserId], references: [users.id] }),
}));

export const escalationRelations = relations(escalations, ({ one, many }) => ({
    conversation: one(conversations, { fields: [escalations.conversationId], references: [conversations.id] }),
    assignments: many(assignments),
}));

export const assignmentRelations = relations(assignments, ({ one }) => ({
    escalation: one(escalations, { fields: [assignments.escalationId], references: [escalations.id] }),
    assignee: one(users, { fields: [assignments.assigneeUserId], references: [users.id] }),
}));

export const ticketRelations = relations(tickets, ({ one }) => ({
    conversation: one(conversations, { fields: [tickets.conversationId], references: [conversations.id] }),
    application: one(applications, { fields: [tickets.applicationId], references: [applications.id] }),
    creator: one(users, { fields: [tickets.createdByUserId], references: [users.id] }),
    assignee: one(users, { fields: [tickets.assignedUserId], references: [users.id] }),
}));

