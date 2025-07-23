
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, issuesTable, issueTagsTable, issueTagsJunctionTable } from '../db/schema';
import { type DeleteInput } from '../schema';
import { deleteIssueTag } from '../handlers/delete_issue_tag';
import { eq } from 'drizzle-orm';

describe('deleteIssueTag', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete an issue tag', async () => {
    // Create a test tag
    const [tag] = await db.insert(issueTagsTable)
      .values({ name: 'Test Tag' })
      .returning()
      .execute();

    const input: DeleteInput = {
      id: tag.id
    };

    const result = await deleteIssueTag(input);

    expect(result.success).toBe(true);

    // Verify the tag was deleted
    const tags = await db.select()
      .from(issueTagsTable)
      .where(eq(issueTagsTable.id, tag.id))
      .execute();

    expect(tags).toHaveLength(0);
  });

  it('should cascade delete junction table entries', async () => {
    // Create test user
    const [user] = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password: 'password123'
      })
      .returning()
      .execute();

    // Create test tag
    const [tag] = await db.insert(issueTagsTable)
      .values({ name: 'Test Tag' })
      .returning()
      .execute();

    // Create test issue
    const [issue] = await db.insert(issuesTable)
      .values({
        title: 'Test Issue',
        description: 'Test description',
        creator_id: user.id
      })
      .returning()
      .execute();

    // Create junction table entry
    await db.insert(issueTagsJunctionTable)
      .values({
        issue_id: issue.id,
        tag_id: tag.id
      })
      .execute();

    // Delete the tag
    const input: DeleteInput = {
      id: tag.id
    };

    const result = await deleteIssueTag(input);

    expect(result.success).toBe(true);

    // Verify the tag was deleted
    const tags = await db.select()
      .from(issueTagsTable)
      .where(eq(issueTagsTable.id, tag.id))
      .execute();

    expect(tags).toHaveLength(0);

    // Verify junction table entries were also deleted
    const junctions = await db.select()
      .from(issueTagsJunctionTable)
      .where(eq(issueTagsJunctionTable.tag_id, tag.id))
      .execute();

    expect(junctions).toHaveLength(0);

    // Verify the issue still exists (should not be affected)
    const issues = await db.select()
      .from(issuesTable)
      .where(eq(issuesTable.id, issue.id))
      .execute();

    expect(issues).toHaveLength(1);
  });

  it('should handle multiple junction entries for the same tag', async () => {
    // Create test user
    const [user] = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password: 'password123'
      })
      .returning()
      .execute();

    // Create test tag
    const [tag] = await db.insert(issueTagsTable)
      .values({ name: 'Test Tag' })
      .returning()
      .execute();

    // Create multiple test issues
    const [issue1] = await db.insert(issuesTable)
      .values({
        title: 'Test Issue 1',
        description: 'Test description 1',
        creator_id: user.id
      })
      .returning()
      .execute();

    const [issue2] = await db.insert(issuesTable)
      .values({
        title: 'Test Issue 2',
        description: 'Test description 2',
        creator_id: user.id
      })
      .returning()
      .execute();

    // Create multiple junction table entries for the same tag
    await db.insert(issueTagsJunctionTable)
      .values([
        { issue_id: issue1.id, tag_id: tag.id },
        { issue_id: issue2.id, tag_id: tag.id }
      ])
      .execute();

    // Delete the tag
    const input: DeleteInput = {
      id: tag.id
    };

    const result = await deleteIssueTag(input);

    expect(result.success).toBe(true);

    // Verify all junction table entries were deleted
    const junctions = await db.select()
      .from(issueTagsJunctionTable)
      .where(eq(issueTagsJunctionTable.tag_id, tag.id))
      .execute();

    expect(junctions).toHaveLength(0);

    // Verify the tag was deleted
    const tags = await db.select()
      .from(issueTagsTable)
      .where(eq(issueTagsTable.id, tag.id))
      .execute();

    expect(tags).toHaveLength(0);
  });
});
