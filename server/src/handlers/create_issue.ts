
import { db } from '../db';
import { issuesTable, issueTagsJunctionTable, usersTable, issueTagsTable } from '../db/schema';
import { type CreateIssueInput, type IssueWithRelations } from '../schema';
import { eq } from 'drizzle-orm';

export async function createIssue(input: CreateIssueInput, creatorId: number): Promise<IssueWithRelations> {
  try {
    // Verify creator exists
    const creator = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, creatorId))
      .execute();

    if (creator.length === 0) {
      throw new Error('Creator not found');
    }

    // Verify assignee exists if provided
    let assignee = null;
    if (input.assignee_id) {
      const assigneeResult = await db.select()
        .from(usersTable)
        .where(eq(usersTable.id, input.assignee_id))
        .execute();

      if (assigneeResult.length === 0) {
        throw new Error('Assignee not found');
      }
      assignee = assigneeResult[0];
    }

    // Verify tags exist if provided
    let tags: any[] = [];
    if (input.tag_ids && input.tag_ids.length > 0) {
      const tagResults = await db.select()
        .from(issueTagsTable)
        .execute();

      const existingTagIds = tagResults.map(tag => tag.id);
      const invalidTagIds = input.tag_ids.filter(id => !existingTagIds.includes(id));

      if (invalidTagIds.length > 0) {
        throw new Error(`Tags not found: ${invalidTagIds.join(', ')}`);
      }

      tags = tagResults.filter(tag => input.tag_ids!.includes(tag.id));
    }

    // Insert the issue
    const issueResult = await db.insert(issuesTable)
      .values({
        title: input.title,
        description: input.description,
        status: input.status || 'not started',
        assignee_id: input.assignee_id || null,
        creator_id: creatorId
      })
      .returning()
      .execute();

    const newIssue = issueResult[0];

    // Create junction table entries for tags if provided
    if (input.tag_ids && input.tag_ids.length > 0) {
      const junctionValues = input.tag_ids.map(tagId => ({
        issue_id: newIssue.id,
        tag_id: tagId
      }));

      await db.insert(issueTagsJunctionTable)
        .values(junctionValues)
        .execute();
    }

    // Return the complete issue with relations
    return {
      ...newIssue,
      assignee,
      creator: creator[0],
      tags
    };
  } catch (error) {
    console.error('Issue creation failed:', error);
    throw error;
  }
}
