import {integer, json, pgTable, varchar} from "drizzle-orm/pg-core";

export const usersTable = pgTable("users", {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    name: varchar({ length: 255 }).notNull(),
    credits: integer().notNull(),
    email: varchar({ length: 255 }).notNull().unique(),
});


export const consultationTable = pgTable("consultations", {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    sessionId: varchar({ length: 255 }).notNull(),
    notes: varchar().notNull(),
    selectedDoctor: json(),
    conversation: json(),
    report: json(),
    createdAt: varchar().notNull(),
    createdBy: varchar().references(()=>usersTable.email)
})