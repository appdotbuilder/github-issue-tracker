
import { db } from '../db';
import { issueTagsTable } from '../db/schema';
import { type CreateIssueTagInput, type IssueTag } from '../schema';

export const createIssueTag = async (input: CreateIssueTagInput): Promise<IssueTag> => {
  try {
    // Insert issue tag record
    const result = await db.insert(issueTagsTable)
      .values({
        name: input.name
      })
      .returning()
      .execute();

    const issueTag = result[0];
    return issueTag;
  } catch (error) {
    console.error('Issue tag creation failed:', error);
    throw error;
  }
};
