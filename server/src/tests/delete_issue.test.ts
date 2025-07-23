
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, issuesTable, issueTagsTable, issueTagsJunctionTable } from '../db/schema';
import { type DeleteInput } from '../schema';
import { deleteIssue } from '../handlers/delete_issue';
import { eq } from 'drizzle-orm';

const testDeleteInput: DeleteInput = {
  id: 1
};

describe('deleteIssue', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete an issue successfully', async () => {
    // Create prerequisite user
    const user = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password: 'password123'
      })
      .returning()
      .execute();

    // Create test issue
    const issue = await db.insert(issuesTable)
      .values({
        title: 'Test Issue',
        description: 'Issue to be deleted',
        status: 'not started',
        creator_id: user[0].id
      })
      .returning()
      .execute();

    // Delete the issue
    const result = await deleteIssue({ id: issue[0].id });

    expect(result.success).toBe(true);

    // Verify issue was deleted from database
    const remainingIssues = await db.select()
      .from(issuesTable)
      .where(eq(issuesTable.id, issue[0].id))
      .execute();

    expect(remainingIssues).toHaveLength(0);
  });

  it('should delete issue and its tag associations', async () => {
    // Create prerequisite user
    const user = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password: 'password123'
      })
      .returning()
      .execute();

    // Create test tags
    const tag1 = await db.insert(issueTagsTable)
      .values({ name: 'Bug' })
      .returning()
      .execute();

    const tag2 = await db.insert(issueTagsTable)
      .values({ name: 'Feature' })
      .returning()
      .execute();

    // Create test issue
    const issue = await db.insert(issuesTable)
      .values({
        title: 'Test Issue with Tags',
        description: 'Issue with tag associations',
        status: 'in progress',
        creator_id: user[0].id
      })
      .returning()
      .execute();

    // Create tag associations
    await db.insert(issueTagsJunctionTable)
      .values([
        { issue_id: issue[0].id, tag_id: tag1[0].id },
        { issue_id: issue[0].id, tag_id: tag2[0].id }
      ])
      .execute();

    // Verify associations exist before deletion
    const associationsBefore = await db.select()
      .from(issueTagsJunctionTable)
      .where(eq(issueTagsJunctionTable.issue_id, issue[0].id))
      .execute();

    expect(associationsBefore).toHaveLength(2);

    // Delete the issue
    const result = await deleteIssue({ id: issue[0].id });

    expect(result.success).toBe(true);

    // Verify issue was deleted
    const remainingIssues = await db.select()
      .from(issuesTable)
      .where(eq(issuesTable.id, issue[0].id))
      .execute();

    expect(remainingIssues).toHaveLength(0);

    // Verify tag associations were deleted
    const associationsAfter = await db.select()
      .from(issueTagsJunctionTable)
      .where(eq(issueTagsJunctionTable.issue_id, issue[0].id))
      .execute();

    expect(associationsAfter).toHaveLength(0);

    // Verify tags themselves still exist
    const remainingTags = await db.select()
      .from(issueTagsTable)
      .execute();

    expect(remainingTags).toHaveLength(2);
  });

  it('should return false when trying to delete non-existent issue', async () => {
    const result = await deleteIssue({ id: 999 });

    expect(result.success).toBe(false);
  });

  it('should handle deletion of issue without tag associations', async () => {
    // Create prerequisite user
    const user = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password: 'password123'
      })
      .returning()
      .execute();

    // Create test issue without tags
    const issue = await db.insert(issuesTable)
      .values({
        title: 'Issue Without Tags',
        description: 'No tag associations',
        status: 'done',
        creator_id: user[0].id
      })
      .returning()
      .execute();

    // Delete the issue
    const result = await deleteIssue({ id: issue[0].id });

    expect(result.success).toBe(true);

    // Verify issue was deleted
    const remainingIssues = await db.select()
      .from(issuesTable)
      .where(eq(issuesTable.id, issue[0].id))
      .execute();

    expect(remainingIssues).toHaveLength(0);
  });
});
