
import { db } from '../db';
import { issueTagsTable } from '../db/schema';
import { type IssueTag } from '../schema';

export async function getIssueTags(): Promise<IssueTag[]> {
  try {
    const results = await db.select()
      .from(issueTagsTable)
      .orderBy(issueTagsTable.name)
      .execute();

    return results;
  } catch (error) {
    console.error('Failed to fetch issue tags:', error);
    throw error;
  }
}
