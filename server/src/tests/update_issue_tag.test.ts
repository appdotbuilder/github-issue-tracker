
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { issueTagsTable } from '../db/schema';
import { type UpdateIssueTagInput } from '../schema';
import { updateIssueTag } from '../handlers/update_issue_tag';
import { eq } from 'drizzle-orm';

describe('updateIssueTag', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update an existing tag', async () => {
    // Create initial tag
    const initialTag = await db.insert(issueTagsTable)
      .values({
        name: 'Initial Tag'
      })
      .returning()
      .execute();

    const testInput: UpdateIssueTagInput = {
      id: initialTag[0].id,
      name: 'Updated Tag'
    };

    const result = await updateIssueTag(testInput);

    expect(result.id).toEqual(initialTag[0].id);
    expect(result.name).toEqual('Updated Tag');
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save updated tag to database', async () => {
    // Create initial tag
    const initialTag = await db.insert(issueTagsTable)
      .values({
        name: 'Initial Tag'
      })
      .returning()
      .execute();

    const testInput: UpdateIssueTagInput = {
      id: initialTag[0].id,
      name: 'Database Updated Tag'
    };

    await updateIssueTag(testInput);

    // Verify the tag was updated in database
    const updatedTags = await db.select()
      .from(issueTagsTable)
      .where(eq(issueTagsTable.id, initialTag[0].id))
      .execute();

    expect(updatedTags).toHaveLength(1);
    expect(updatedTags[0].name).toEqual('Database Updated Tag');
    expect(updatedTags[0].id).toEqual(initialTag[0].id);
  });

  it('should throw error when tag does not exist', async () => {
    const testInput: UpdateIssueTagInput = {
      id: 999,
      name: 'Non-existent Tag'
    };

    await expect(updateIssueTag(testInput)).rejects.toThrow(/tag with id 999 not found/i);
  });

  it('should throw error when tag name already exists', async () => {
    // Create two tags
    const tag1 = await db.insert(issueTagsTable)
      .values({
        name: 'Existing Tag'
      })
      .returning()
      .execute();

    const tag2 = await db.insert(issueTagsTable)
      .values({
        name: 'Another Tag'
      })
      .returning()
      .execute();

    // Try to update tag2 with tag1's name
    const testInput: UpdateIssueTagInput = {
      id: tag2[0].id,
      name: 'Existing Tag'
    };

    await expect(updateIssueTag(testInput)).rejects.toThrow(/tag with name "existing tag" already exists/i);
  });

  it('should allow updating tag with same name', async () => {
    // Create initial tag
    const initialTag = await db.insert(issueTagsTable)
      .values({
        name: 'Same Name'
      })
      .returning()
      .execute();

    // Update with the same name should work
    const testInput: UpdateIssueTagInput = {
      id: initialTag[0].id,
      name: 'Same Name'
    };

    const result = await updateIssueTag(testInput);

    expect(result.id).toEqual(initialTag[0].id);
    expect(result.name).toEqual('Same Name');
  });
});
