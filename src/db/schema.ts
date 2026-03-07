import {
  pgTable,
  text,
  uuid,
  integer,
  jsonb,
  timestamp,
  boolean,
} from "drizzle-orm/pg-core";

export const projects = pgTable("projects", {
  id: uuid("id").defaultRandom().primaryKey(),
  clerkUserId: text("clerk_user_id").notNull(),
  name: text("name").notNull(),
  status: text("status", {
    enum: ["not_started", "in_progress", "frogged", "completed"],
  })
    .default("not_started")
    .notNull(),
  currentRow: integer("current_row").default(0).notNull(),
  totalRows: integer("total_rows").default(0).notNull(),
  ravelryMetadata: jsonb("ravelry_metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const documents = pgTable("documents", {
  id: uuid("id").defaultRandom().primaryKey(),
  projectId: uuid("project_id")
    .references(() => projects.id, { onDelete: "cascade" })
    .notNull(),
  blobUrl: text("blob_url").notNull(),
  filename: text("filename").notNull(),
  pageCount: integer("page_count").default(0).notNull(),
  rulerPositions: jsonb("ruler_positions").default({}).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const annotations = pgTable("annotations", {
  id: uuid("id").defaultRandom().primaryKey(),
  documentId: uuid("document_id")
    .references(() => documents.id, { onDelete: "cascade" })
    .notNull(),
  pageNumber: integer("page_number").notNull(),
  fabricJson: jsonb("fabric_json"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const notes = pgTable("notes", {
  id: uuid("id").defaultRandom().primaryKey(),
  projectId: uuid("project_id")
    .references(() => projects.id, { onDelete: "cascade" })
    .notNull(),
  content: jsonb("content"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const timerSessions = pgTable("timer_sessions", {
  id: uuid("id").defaultRandom().primaryKey(),
  projectId: uuid("project_id")
    .references(() => projects.id, { onDelete: "cascade" })
    .notNull(),
  startedAt: timestamp("started_at").notNull(),
  endedAt: timestamp("ended_at"),
});

export const progressPhotos = pgTable("progress_photos", {
  id: uuid("id").defaultRandom().primaryKey(),
  projectId: uuid("project_id")
    .references(() => projects.id, { onDelete: "cascade" })
    .notNull(),
  blobUrl: text("blob_url").notNull(),
  caption: text("caption"),
  takenAt: timestamp("taken_at").defaultNow().notNull(),
});

export const shareTokens = pgTable("share_tokens", {
  id: uuid("id").defaultRandom().primaryKey(),
  projectId: uuid("project_id")
    .references(() => projects.id, { onDelete: "cascade" })
    .notNull(),
  token: text("token").unique().notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const customGlossary = pgTable("custom_glossary", {
  id: uuid("id").defaultRandom().primaryKey(),
  clerkUserId: text("clerk_user_id").notNull(),
  abbreviation: text("abbreviation").notNull(),
  description: text("description").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const bookmarks = pgTable("bookmarks", {
  id: uuid("id").defaultRandom().primaryKey(),
  documentId: uuid("document_id")
    .references(() => documents.id, { onDelete: "cascade" })
    .notNull(),
  clerkUserId: text("clerk_user_id").notNull(),
  pageNumber: integer("page_number").notNull(),
  yPosition: integer("y_position"),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
