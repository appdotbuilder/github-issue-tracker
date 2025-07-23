
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, issuesTable, issueTagsTable, issueTagsJunctionTable } from '../db/schema';
import { type CreateIssueInput } from '../schema';
import { createIssue } from '../handlers/create_issue';
import { eq } from 'drizzle-orm';

describe('createIssue', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let creatorId: number;
  let assigneeId: number;
  let tagId1: number;
  let tagId2: number;

  beforeEach(async () => {
    // Create test users
    const creatorResult = await db.insert(usersTable)
      .values({
        email: 'creator@example.com',
        password: 'password123'
      })
      .returning()
      .execute();
    creatorId = creatorResult[0].id;

    const assigneeResult = await db.insert(usersTable)
      .values({
        email: 'assignee@example.com',
        password: 'password123'
      })
      .returning()
      .execute();
    assigneeId = assigneeResult[0].id;

    // Create test tags
    const tag1Result = await db.insert(issueTagsTable)
      .values({
        name: 'bug'
      })
      .returning()
      .execute();
    tagId1 = tag1Result[0].id;

    const tag2Result = await db.insert(issueTagsTable)
      .values({
        name: 'urgent'
      })
      .returning()
      .execute();
    tagId2 = tag2Result[0].id;
  });

  it('should create an issue with minimal data', async () => {
    const input: CreateIssueInput = {
      title: 'Test Issue',
      description: 'This is a test issue',
      status: 'not started'
    };

    const result = await createIssue(input, creatorId);

    expect(result.title).toEqual('Test Issue');
    expect(result.description).toEqual('This is a test issue');
    expect(result.status).toEqual('not started');
    expect(result.assignee_id).toBeNull();
    expect(result.creator_id).toEqual(creatorId);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.assignee).toBeNull();
    expect(result.creator.id).toEqual(creatorId);
    expect(result.creator.email).toEqual('creator@example.com');
    expect(result.tags).toHaveLength(0);
  });

  it('should create an issue with assignee', async () => {
    const input: CreateIssueInput = {
      title: 'Assigned Issue',
      description: 'This issue has an assignee',
      status: 'in progress',
      assignee_id: assigneeId
    };

    const result = await createIssue(input, creatorId);

    expect(result.assignee_id).toEqual(assigneeId);
    expect(result.assignee).not.toBeNull();
    expect(result.assignee!.id).toEqual(assigneeId);
    expect(result.assignee!.email).toEqual('assignee@example.com');
  });

  it('should create an issue with tags', async () => {
    const input: CreateIssueInput = {
      title: 'Tagged Issue',
      description: 'This issue has tags',
      status: 'not started',
      tag_ids: [tagId1, tagId2]
    };

    const result = await createIssue(input, creatorId);

    expect(result.tags).toHaveLength(2);
    expect(result.tags.map(tag => tag.name)).toContain('bug');
    expect(result.tags.map(tag => tag.name)).toContain('urgent');
  });

  it('should save issue to database', async () => {
    const input: CreateIssueInput = {
      title: 'Database Test',
      description: 'Testing database persistence',
      status: 'done',
      assignee_id: assigneeId,
      tag_ids: [tagId1]
    };

    const result = await createIssue(input, creatorId);

    // Verify issue exists in database
    const issues = await db.select()
      .from(issuesTable)
      .where(eq(issuesTable.id, result.id))
      .execute();

    expect(issues).toHaveLength(1);
    expect(issues[0].title).toEqual('Database Test');
    expect(issues[0].description).toEqual('Testing database persistence');
    expect(issues[0].status).toEqual('done');
    expect(issues[0].assignee_id).toEqual(assigneeId);
    expect(issues[0].creator_id).toEqual(creatorId);

    // Verify junction table entries
    const junctionEntries = await db.select()
      .from(issueTagsJunctionTable)
      .where(eq(issueTagsJunctionTable.issue_id, result.id))
      .execute();

    expect(junctionEntries).toHaveLength(1);
    expect(junctionEntries[0].tag_id).toEqual(tagId1);
  });

  it('should throw error for non-existent creator', async () => {
    const input: CreateIssueInput = {
      title: 'Invalid Creator',
      description: 'This should fail',
      status: 'not started'
    };

    expect(createIssue(input, 999999)).rejects.toThrow(/creator not found/i);
  });

  it('should throw error for non-existent assignee', async () => {
    const input: CreateIssueInput = {
      title: 'Invalid Assignee',
      description: 'This should fail',
      status: 'not started',
      assignee_id: 999999
    };

    expect(createIssue(input, creatorId)).rejects.toThrow(/assignee not found/i);
  });

  it('should throw error for non-existent tags', async () => {
    const input: CreateIssueInput = {
      title: 'Invalid Tags',
      description: 'This should fail',
      status: 'not started',
      tag_ids: [999999, 888888]
    };

    expect(createIssue(input, creatorId)).rejects.toThrow(/tags not found/i);
  });

  it('should handle default status from handler logic', async () => {
    const input: CreateIssueInput = {
      title: 'Default Status Test',
      description: 'Testing handler default logic',
      status: 'not started'
    };

    const result = await createIssue(input, creatorId);

    expect(result.status).toEqual('not started');
  });
});
