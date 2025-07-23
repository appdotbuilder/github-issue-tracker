
import { db } from '../db';
import { issuesTable, issueTagsJunctionTable } from '../db/schema';
import { type DeleteInput } from '../schema';
import { eq } from 'drizzle-orm';

export async function deleteIssue(input: DeleteInput): Promise<{ success: boolean }> {
  try {
    // First, delete all tag associations for this issue
    await db.delete(issueTagsJunctionTable)
      .where(eq(issueTagsJunctionTable.issue_id, input.id))
      .execute();

    // Then delete the issue itself
    const result = await db.delete(issuesTable)
      .where(eq(issuesTable.id, input.id))
      .returning()
      .execute();

    // Return success based on whether any rows were deleted
    return { success: result.length > 0 };
  } catch (error) {
    console.error('Issue deletion failed:', error);
    throw error;
  }
}
