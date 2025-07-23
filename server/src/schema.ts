
import { z } from 'zod';

// Issue status enum
export const issueStatusSchema = z.enum(['not started', 'in progress', 'done']);
export type IssueStatus = z.infer<typeof issueStatusSchema>;

// User schema
export const userSchema = z.object({
  id: z.number(),
  email: z.string().email(),
  password: z.string(),
  created_at: z.coerce.date()
});

export type User = z.infer<typeof userSchema>;

// Input schema for user registration
export const registerUserInputSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});

export type RegisterUserInput = z.infer<typeof registerUserInputSchema>;

// Input schema for user login
export const loginUserInputSchema = z.object({
  email: z.string().email(),
  password: z.string()
});

export type LoginUserInput = z.infer<typeof loginUserInputSchema>;

// Issue Tag schema
export const issueTagSchema = z.object({
  id: z.number(),
  name: z.string(),
  created_at: z.coerce.date()
});

export type IssueTag = z.infer<typeof issueTagSchema>;

// Input schema for creating tags
export const createIssueTagInputSchema = z.object({
  name: z.string().min(1).max(50)
});

export type CreateIssueTagInput = z.infer<typeof createIssueTagInputSchema>;

// Input schema for updating tags
export const updateIssueTagInputSchema = z.object({
  id: z.number(),
  name: z.string().min(1).max(50)
});

export type UpdateIssueTagInput = z.infer<typeof updateIssueTagInputSchema>;

// Issue schema
export const issueSchema = z.object({
  id: z.number(),
  title: z.string(),
  description: z.string(),
  status: issueStatusSchema,
  assignee_id: z.number().nullable(),
  creator_id: z.number(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Issue = z.infer<typeof issueSchema>;

// Issue with relations schema
export const issueWithRelationsSchema = z.object({
  id: z.number(),
  title: z.string(),
  description: z.string(),
  status: issueStatusSchema,
  assignee_id: z.number().nullable(),
  creator_id: z.number(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date(),
  assignee: userSchema.nullable(),
  creator: userSchema,
  tags: z.array(issueTagSchema)
});

export type IssueWithRelations = z.infer<typeof issueWithRelationsSchema>;

// Input schema for creating issues
export const createIssueInputSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string(),
  status: issueStatusSchema.default('not started'),
  assignee_id: z.number().nullable().optional(),
  tag_ids: z.array(z.number()).optional()
});

export type CreateIssueInput = z.infer<typeof createIssueInputSchema>;

// Input schema for updating issues
export const updateIssueInputSchema = z.object({
  id: z.number(),
  title: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  status: issueStatusSchema.optional(),
  assignee_id: z.number().nullable().optional(),
  tag_ids: z.array(z.number()).optional()
});

export type UpdateIssueInput = z.infer<typeof updateIssueInputSchema>;

// Filter schema for issues
export const issueFilterSchema = z.object({
  assignee_id: z.number().optional(),
  status: issueStatusSchema.optional(),
  tag_id: z.number().optional()
});

export type IssueFilter = z.infer<typeof issueFilterSchema>;

// Schema for deleting resources
export const deleteInputSchema = z.object({
  id: z.number()
});

export type DeleteInput = z.infer<typeof deleteInputSchema>;
