
import { db } from '../db';
import { issueTagsTable, issueTagsJunctionTable } from '../db/schema';
import { type DeleteInput } from '../schema';
import { eq } from 'drizzle-orm';

export async function deleteIssueTag(input: DeleteInput): Promise<{ success: boolean }> {
  try {
    // First, delete all junction table entries for this tag (cascade deletion)
    await db.delete(issueTagsJunctionTable)
      .where(eq(issueTagsJunctionTable.tag_id, input.id))
      .execute();

    // Then delete the tag itself
    await db.delete(issueTagsTable)
      .where(eq(issueTagsTable.id, input.id))
      .execute();

    return { success: true };
  } catch (error) {
    console.error('Issue tag deletion failed:', error);
    throw error;
  }
}
