
import { serial, text, pgTable, timestamp, integer, pgEnum, varchar, unique } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Issue status enum
export const issueStatusEnum = pgEnum('issue_status', ['not started', 'in progress', 'done']);

// Users table
export const usersTable = pgTable('users', {
  id: serial('id').primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  password: text('password').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Issue tags table
export const issueTagsTable = pgTable('issue_tags', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 50 }).notNull().unique(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Issues table
export const issuesTable = pgTable('issues', {
  id: serial('id').primaryKey(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description').notNull(),
  status: issueStatusEnum('status').notNull().default('not started'),
  assignee_id: integer('assignee_id'),
  creator_id: integer('creator_id').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Junction table for issues and tags (many-to-many)
export const issueTagsJunctionTable = pgTable('issue_tags_junction', {
  id: serial('id').primaryKey(),
  issue_id: integer('issue_id').notNull(),
  tag_id: integer('tag_id').notNull(),
}, (table) => ({
  uniqueIssueTag: unique().on(table.issue_id, table.tag_id),
}));

// Relations
export const usersRelations = relations(usersTable, ({ many }) => ({
  createdIssues: many(issuesTable, { relationName: 'creator' }),
  assignedIssues: many(issuesTable, { relationName: 'assignee' }),
}));

export const issuesRelations = relations(issuesTable, ({ one, many }) => ({
  creator: one(usersTable, {
    fields: [issuesTable.creator_id],
    references: [usersTable.id],
    relationName: 'creator',
  }),
  assignee: one(usersTable, {
    fields: [issuesTable.assignee_id],
    references: [usersTable.id],
    relationName: 'assignee',
  }),
  issueTagsJunction: many(issueTagsJunctionTable),
}));

export const issueTagsRelations = relations(issueTagsTable, ({ many }) => ({
  issueTagsJunction: many(issueTagsJunctionTable),
}));

export const issueTagsJunctionRelations = relations(issueTagsJunctionTable, ({ one }) => ({
  issue: one(issuesTable, {
    fields: [issueTagsJunctionTable.issue_id],
    references: [issuesTable.id],
  }),
  tag: one(issueTagsTable, {
    fields: [issueTagsJunctionTable.tag_id],
    references: [issueTagsTable.id],
  }),
}));

// TypeScript types for the table schemas
export type User = typeof usersTable.$inferSelect;
export type NewUser = typeof usersTable.$inferInsert;

export type Issue = typeof issuesTable.$inferSelect;
export type NewIssue = typeof issuesTable.$inferInsert;

export type IssueTag = typeof issueTagsTable.$inferSelect;
export type NewIssueTag = typeof issueTagsTable.$inferInsert;

export type IssueTagsJunction = typeof issueTagsJunctionTable.$inferSelect;
export type NewIssueTagsJunction = typeof issueTagsJunctionTable.$inferInsert;

// Export all tables and relations for proper query building
export const tables = {
  users: usersTable,
  issues: issuesTable,
  issueTags: issueTagsTable,
  issueTagsJunction: issueTagsJunctionTable,
};
