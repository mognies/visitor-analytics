import {
  sqliteTable,
  text,
  integer,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

export const pathDurations = sqliteTable(
  "path_durations",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    path: text("path").notNull(),
    duration: integer("duration").notNull(), // in milliseconds
    timestamp: integer("timestamp").notNull(),
    visitorId: text("visitor_id").notNull(),
    pageVisitId: text("page_visit_id").notNull(),
    createdAt: integer("created_at")
      .notNull()
      .$defaultFn(() => Date.now()),
  },
  (table) => ({
    uniqueVisit: uniqueIndex("path_durations_unique_visit").on(
      table.visitorId,
      table.path,
      table.timestamp,
    ),
  }),
);

export const pages = sqliteTable("pages", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  url: text("url").notNull().unique(),
  path: text("path").notNull(),
  title: text("title"),
  summary: text("summary"),
  importedAt: integer("imported_at")
    .notNull()
    .$defaultFn(() => Date.now()),
  baseUrl: text("base_url").notNull(), // The base URL used for import
});

export const pageBlocks = sqliteTable("page_blocks", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  pageId: integer("page_id").notNull(),
  blockName: text("block_name").notNull(),
  blockSummary: text("block_summary").notNull(),
  blockDom: text("block_dom").notNull(),
  createdAt: integer("created_at")
    .notNull()
    .$defaultFn(() => Date.now()),
});

export const blockDurations = sqliteTable(
  "block_durations",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    blockId: text("block_id").notNull(),
    path: text("path").notNull(),
    duration: integer("duration").notNull(), // in milliseconds
    timestamp: integer("timestamp").notNull(),
    visitorId: text("visitor_id").notNull(),
    pageVisitId: text("page_visit_id").notNull(),
    createdAt: integer("created_at")
      .notNull()
      .$defaultFn(() => Date.now()),
  },
  (table) => ({
    uniqueBlockVisit: uniqueIndex("block_durations_unique_visit").on(
      table.visitorId,
      table.blockId,
      table.path,
      table.timestamp,
    ),
  }),
);

export const crawlJobs = sqliteTable("crawl_jobs", {
  id: text("id").primaryKey(), // Firecrawl job ID
  baseUrl: text("base_url").notNull(),
  status: text("status").notNull(), // pending, scraping, completed, failed
  maxPages: integer("max_pages"),
  completed: integer("completed"),
  total: integer("total"),
  createdAt: integer("created_at")
    .notNull()
    .$defaultFn(() => Date.now()),
  completedAt: integer("completed_at"),
});

export type PathDuration = typeof pathDurations.$inferSelect;
export type NewPathDuration = typeof pathDurations.$inferInsert;
export type Page = typeof pages.$inferSelect;
export type NewPage = typeof pages.$inferInsert;
export type PageBlock = typeof pageBlocks.$inferSelect;
export type NewPageBlock = typeof pageBlocks.$inferInsert;
export type BlockDuration = typeof blockDurations.$inferSelect;
export type NewBlockDuration = typeof blockDurations.$inferInsert;
export type CrawlJob = typeof crawlJobs.$inferSelect;
export type NewCrawlJob = typeof crawlJobs.$inferInsert;
