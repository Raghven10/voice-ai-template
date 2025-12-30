CREATE TYPE "public"."conversation_status_enum" AS ENUM('active', 'escalated', 'resolved', 'closed', 'abandoned');--> statement-breakpoint
CREATE TYPE "public"."escalation_status_enum" AS ENUM('pending', 'accepted', 'completed', 'canceled');--> statement-breakpoint
CREATE TYPE "public"."message_kind_enum" AS ENUM('user', 'ai', 'executive', 'developer', 'sysadmin', 'system');--> statement-breakpoint
CREATE TYPE "public"."role_enum" AS ENUM('user', 'executive', 'developer', 'sysadmin');--> statement-breakpoint
CREATE TYPE "public"."support_level_enum" AS ENUM('ai', 'human_executive', 'developer', 'sysadmin');--> statement-breakpoint
CREATE TYPE "public"."ticket_priority_enum" AS ENUM('low', 'medium', 'high', 'urgent');--> statement-breakpoint
CREATE TYPE "public"."ticket_status_enum" AS ENUM('open', 'in_progress', 'waiting', 'resolved', 'closed');--> statement-breakpoint
CREATE TABLE "applications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" varchar(80) NOT NULL,
	"name" varchar(160) NOT NULL,
	"description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "assignments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"escalation_id" uuid NOT NULL,
	"assignee_user_id" uuid NOT NULL,
	"accepted_at" timestamp with time zone,
	"released_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "consultations" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "consultations_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"sessionId" varchar(255) NOT NULL,
	"notes" varchar NOT NULL,
	"selectedDoctor" json,
	"conversation" json,
	"report" json,
	"createdAt" varchar NOT NULL,
	"created_by" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "conversations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"livekit_room_sid" varchar(128),
	"livekit_room_name" varchar(255),
	"user_id" uuid,
	"application_id" uuid,
	"status" "conversation_status_enum" DEFAULT 'active' NOT NULL,
	"current_level" "support_level_enum" DEFAULT 'ai' NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"ended_at" timestamp with time zone,
	"metadata" jsonb
);
--> statement-breakpoint
CREATE TABLE "escalations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"conversation_id" uuid NOT NULL,
	"from_level" "support_level_enum" NOT NULL,
	"to_level" "support_level_enum" NOT NULL,
	"reason" text,
	"status" "escalation_status_enum" DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"resolved_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"conversation_id" uuid NOT NULL,
	"sender_kind" "message_kind_enum" NOT NULL,
	"sender_user_id" uuid,
	"text" text,
	"content" jsonb,
	"media_url" varchar(2048),
	"is_final" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tickets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"conversation_id" uuid,
	"application_id" uuid,
	"title" varchar(200) NOT NULL,
	"description" text,
	"status" "ticket_status_enum" DEFAULT 'open' NOT NULL,
	"priority" "ticket_priority_enum" DEFAULT 'medium' NOT NULL,
	"created_by_user_id" uuid,
	"assigned_user_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_app_access" (
	"user_id" uuid NOT NULL,
	"application_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_app_access_pk" PRIMARY KEY("user_id","application_id")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"auth_sub" varchar(255) NOT NULL,
	"email" varchar(320) NOT NULL,
	"display_name" varchar(200),
	"primary_role" "role_enum" DEFAULT 'user' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "assignments" ADD CONSTRAINT "assignments_escalation_id_escalations_id_fk" FOREIGN KEY ("escalation_id") REFERENCES "public"."escalations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assignments" ADD CONSTRAINT "assignments_assignee_user_id_users_id_fk" FOREIGN KEY ("assignee_user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "consultations" ADD CONSTRAINT "consultations_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_application_id_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."applications"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "escalations" ADD CONSTRAINT "escalations_conversation_id_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_conversation_id_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_sender_user_id_users_id_fk" FOREIGN KEY ("sender_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_conversation_id_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_application_id_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."applications"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_assigned_user_id_users_id_fk" FOREIGN KEY ("assigned_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_app_access" ADD CONSTRAINT "user_app_access_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_app_access" ADD CONSTRAINT "user_app_access_application_id_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."applications"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "applications_slug_uidx" ON "applications" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "assignment_escal_idx" ON "assignments" USING btree ("escalation_id");--> statement-breakpoint
CREATE INDEX "assignment_assignee_idx" ON "assignments" USING btree ("assignee_user_id");--> statement-breakpoint
CREATE INDEX "convo_user_idx" ON "conversations" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "convo_app_idx" ON "conversations" USING btree ("application_id");--> statement-breakpoint
CREATE INDEX "convo_room_sid_idx" ON "conversations" USING btree ("livekit_room_sid");--> statement-breakpoint
CREATE INDEX "escalation_convo_idx" ON "escalations" USING btree ("conversation_id");--> statement-breakpoint
CREATE INDEX "msg_convo_idx" ON "messages" USING btree ("conversation_id");--> statement-breakpoint
CREATE INDEX "msg_sender_idx" ON "messages" USING btree ("sender_kind","sender_user_id");--> statement-breakpoint
CREATE INDEX "ticket_app_idx" ON "tickets" USING btree ("application_id");--> statement-breakpoint
CREATE INDEX "ticket_assignee_idx" ON "tickets" USING btree ("assigned_user_id");--> statement-breakpoint
CREATE INDEX "ticket_status_idx" ON "tickets" USING btree ("status");--> statement-breakpoint
CREATE INDEX "user_app_access_idx" ON "user_app_access" USING btree ("user_id","application_id");--> statement-breakpoint
CREATE UNIQUE INDEX "users_auth_sub_uidx" ON "users" USING btree ("auth_sub");--> statement-breakpoint
CREATE INDEX "users_email_idx" ON "users" USING btree ("email");