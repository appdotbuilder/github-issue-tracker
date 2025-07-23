
import { db } from '../db';
import { issueTagsTable } from '../db/schema';
import { type UpdateIssueTagInput, type IssueTag } from '../schema';
import { eq, and, ne } from 'drizzle-orm';

export const updateIssueTag = async (input: UpdateIssueTagInput): Promise<IssueTag> => {
  try {
    // Check if the tag exists
    const existingTag = await db.select()
      .from(issueTagsTable)
      .where(eq(issueTagsTable.id, input.id))
      .execute();

    if (existingTag.length === 0) {
      throw new Error(`Tag with id ${input.id} not found`);
    }

    // Check if another tag with the same name exists (excluding current tag)
    const duplicateTag = await db.select()
      .from(issueTagsTable)
      .where(and(
        eq(issueTagsTable.name, input.name),
        ne(issueTagsTable.id, input.id)
      ))
      .execute();

    if (duplicateTag.length > 0) {
      throw new Error(`Tag with name "${input.name}" already exists`);
    }

    // Update the tag
    const result = await db.update(issueTagsTable)
      .set({
        name: input.name
      })
      .where(eq(issueTagsTable.id, input.id))
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Tag update failed:', error);
    throw error;
  }
};
