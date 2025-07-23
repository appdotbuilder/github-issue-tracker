
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, issuesTable, issueTagsTable, issueTagsJunctionTable } from '../db/schema';
import { type UpdateIssueInput } from '../schema';
import { updateIssue } from '../handlers/update_issue';
import { eq } from 'drizzle-orm';

describe('updateIssue', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let userId: number;
  let assigneeId: number;
  let issueId: number;
  let tagId: number;

  beforeEach(async () => {
    // Create test users
    const users = await db.insert(usersTable)
      .values([
        { email: 'creator@test.com', password: 'password123' },
        { email: 'assignee@test.com', password: 'password123' }
      ])
      .returning()
      .execute();
    
    userId = users[0].id;
    assigneeId = users[1].id;

    // Create test tag
    const tags = await db.insert(issueTagsTable)
      .values({ name: 'bug' })
      .returning()
      .execute();
    
    tagId = tags[0].id;

    // Create test issue
    const issues = await db.insert(issuesTable)
      .values({
        title: 'Original Title',
        description: 'Original description',
        status: 'not started',
        creator_id: userId,
        assignee_id: null
      })
      .returning()
      .execute();
    
    issueId = issues[0].id;
  });

  it('should update issue title', async () => {
    const input: UpdateIssueInput = {
      id: issueId,
      title: 'Updated Title'
    };

    const result = await updateIssue(input);

    expect(result.title).toEqual('Updated Title');
    expect(result.description).toEqual('Original description');
    expect(result.status).toEqual('not started');
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update issue description', async () => {
    const input: UpdateIssueInput = {
      id: issueId,
      description: 'Updated description'
    };

    const result = await updateIssue(input);

    expect(result.title).toEqual('Original Title');
    expect(result.description).toEqual('Updated description');
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update issue status', async () => {
    const input: UpdateIssueInput = {
      id: issueId,
      status: 'in progress'
    };

    const result = await updateIssue(input);

    expect(result.status).toEqual('in progress');
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update assignee', async () => {
    const input: UpdateIssueInput = {
      id: issueId,
      assignee_id: assigneeId
    };

    const result = await updateIssue(input);

    expect(result.assignee_id).toEqual(assigneeId);
    expect(result.assignee).not.toBeNull();
    expect(result.assignee?.id).toEqual(assigneeId);
    expect(result.assignee?.email).toEqual('assignee@test.com');
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should set assignee to null', async () => {
    // First set an assignee
    await db.update(issuesTable)
      .set({ assignee_id: assigneeId })
      .where(eq(issuesTable.id, issueId))
      .execute();

    const input: UpdateIssueInput = {
      id: issueId,
      assignee_id: null
    };

    const result = await updateIssue(input);

    expect(result.assignee_id).toBeNull();
    expect(result.assignee).toBeNull();
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update multiple fields at once', async () => {
    const input: UpdateIssueInput = {
      id: issueId,
      title: 'New Title',
      description: 'New description',
      status: 'done',
      assignee_id: assigneeId
    };

    const result = await updateIssue(input);

    expect(result.title).toEqual('New Title');
    expect(result.description).toEqual('New description');
    expect(result.status).toEqual('done');
    expect(result.assignee_id).toEqual(assigneeId);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update tags', async () => {
    const input: UpdateIssueInput = {
      id: issueId,
      tag_ids: [tagId]
    };

    const result = await updateIssue(input);

    expect(result.tags).toHaveLength(1);
    expect(result.tags[0].id).toEqual(tagId);
    expect(result.tags[0].name).toEqual('bug');
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should clear all tags when empty array provided', async () => {
    // First add a tag
    await db.insert(issueTagsJunctionTable)
      .values({ issue_id: issueId, tag_id: tagId })
      .execute();

    const input: UpdateIssueInput = {
      id: issueId,
      tag_ids: []
    };

    const result = await updateIssue(input);

    expect(result.tags).toHaveLength(0);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save updates to database', async () => {
    const input: UpdateIssueInput = {
      id: issueId,
      title: 'Database Test Title',
      status: 'in progress'
    };

    await updateIssue(input);

    const dbIssue = await db.select()
      .from(issuesTable)
      .where(eq(issuesTable.id, issueId))
      .execute();

    expect(dbIssue[0].title).toEqual('Database Test Title');
    expect(dbIssue[0].status).toEqual('in progress');
    expect(dbIssue[0].updated_at).toBeInstanceOf(Date);
  });

  it('should include creator and assignee relations', async () => {
    const input: UpdateIssueInput = {
      id: issueId,
      assignee_id: assigneeId
    };

    const result = await updateIssue(input);

    expect(result.creator).toBeDefined();
    expect(result.creator.id).toEqual(userId);
    expect(result.creator.email).toEqual('creator@test.com');

    expect(result.assignee).toBeDefined();
    expect(result.assignee?.id).toEqual(assigneeId);
    expect(result.assignee?.email).toEqual('assignee@test.com');
  });

  it('should throw error for non-existent issue', async () => {
    const input: UpdateIssueInput = {
      id: 99999,
      title: 'Will not work'
    };

    expect(updateIssue(input)).rejects.toThrow(/issue with id 99999 not found/i);
  });

  it('should throw error for non-existent assignee', async () => {
    const input: UpdateIssueInput = {
      id: issueId,
      assignee_id: 99999
    };

    expect(updateIssue(input)).rejects.toThrow(/user with id 99999 not found/i);
  });

  it('should throw error for non-existent tag', async () => {
    const input: UpdateIssueInput = {
      id: issueId,
      tag_ids: [99999]
    };

    expect(updateIssue(input)).rejects.toThrow(/tag with id 99999 not found/i);
  });
});
