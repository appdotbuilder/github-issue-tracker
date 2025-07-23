
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { issueTagsTable } from '../db/schema';
import { getIssueTags } from '../handlers/get_issue_tags';

describe('getIssueTags', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no tags exist', async () => {
    const result = await getIssueTags();
    expect(result).toEqual([]);
  });

  it('should return all issue tags', async () => {
    // Create test tags
    await db.insert(issueTagsTable)
      .values([
        { name: 'Bug' },
        { name: 'Feature' },
        { name: 'Enhancement' }
      ])
      .execute();

    const result = await getIssueTags();

    expect(result).toHaveLength(3);
    expect(result[0].name).toEqual('Bug');
    expect(result[1].name).toEqual('Enhancement');
    expect(result[2].name).toEqual('Feature');
    
    // Verify all required fields are present
    result.forEach(tag => {
      expect(tag.id).toBeDefined();
      expect(typeof tag.id).toBe('number');
      expect(tag.name).toBeDefined();
      expect(typeof tag.name).toBe('string');
      expect(tag.created_at).toBeInstanceOf(Date);
    });
  });

  it('should return tags in alphabetical order', async () => {
    // Insert tags in non-alphabetical order
    await db.insert(issueTagsTable)
      .values([
        { name: 'Zebra' },
        { name: 'Alpha' },
        { name: 'Beta' }
      ])
      .execute();

    const result = await getIssueTags();

    expect(result).toHaveLength(3);
    expect(result[0].name).toEqual('Alpha');
    expect(result[1].name).toEqual('Beta');
    expect(result[2].name).toEqual('Zebra');
  });

  it('should handle single tag correctly', async () => {
    await db.insert(issueTagsTable)
      .values({ name: 'Single Tag' })
      .execute();

    const result = await getIssueTags();

    expect(result).toHaveLength(1);
    expect(result[0].name).toEqual('Single Tag');
    expect(result[0].id).toBeDefined();
    expect(result[0].created_at).toBeInstanceOf(Date);
  });
});
