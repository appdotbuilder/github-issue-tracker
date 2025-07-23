
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { issueTagsTable } from '../db/schema';
import { type CreateIssueTagInput } from '../schema';
import { createIssueTag } from '../handlers/create_issue_tag';
import { eq } from 'drizzle-orm';

// Simple test input
const testInput: CreateIssueTagInput = {
  name: 'Test Tag'
};

describe('createIssueTag', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create an issue tag', async () => {
    const result = await createIssueTag(testInput);

    // Basic field validation
    expect(result.name).toEqual('Test Tag');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save issue tag to database', async () => {
    const result = await createIssueTag(testInput);

    // Query using proper drizzle syntax
    const tags = await db.select()
      .from(issueTagsTable)
      .where(eq(issueTagsTable.id, result.id))
      .execute();

    expect(tags).toHaveLength(1);
    expect(tags[0].name).toEqual('Test Tag');
    expect(tags[0].created_at).toBeInstanceOf(Date);
  });

  it('should enforce unique tag names', async () => {
    // Create first tag
    await createIssueTag(testInput);

    // Attempt to create duplicate tag should fail
    await expect(createIssueTag(testInput)).rejects.toThrow(/unique/i);
  });

  it('should handle different tag names', async () => {
    const inputs = [
      { name: 'Bug' },
      { name: 'Feature' },
      { name: 'Enhancement' }
    ];

    const results = await Promise.all(
      inputs.map(input => createIssueTag(input))
    );

    expect(results).toHaveLength(3);
    expect(results[0].name).toEqual('Bug');
    expect(results[1].name).toEqual('Feature');
    expect(results[2].name).toEqual('Enhancement');

    // Verify all tags are in database
    const allTags = await db.select()
      .from(issueTagsTable)
      .execute();

    expect(allTags).toHaveLength(3);
  });
});
