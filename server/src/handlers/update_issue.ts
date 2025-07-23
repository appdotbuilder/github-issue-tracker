
import { db } from '../db';
import { issuesTable, issueTagsJunctionTable, usersTable, issueTagsTable } from '../db/schema';
import { type UpdateIssueInput, type IssueWithRelations } from '../schema';
import { eq } from 'drizzle-orm';

export async function updateIssue(input: UpdateIssueInput): Promise<IssueWithRelations> {
  try {
    // Check if issue exists
    const existingIssue = await db.select()
      .from(issuesTable)
      .where(eq(issuesTable.id, input.id))
      .execute();

    if (existingIssue.length === 0) {
      throw new Error(`Issue with id ${input.id} not found`);
    }

    // If assignee_id is provided and not null, verify assignee exists
    if (input.assignee_id !== undefined && input.assignee_id !== null) {
      const assigneeExists = await db.select()
        .from(usersTable)
        .where(eq(usersTable.id, input.assignee_id))
        .execute();

      if (assigneeExists.length === 0) {
        throw new Error(`User with id ${input.assignee_id} not found`);
      }
    }

    // If tag_ids are provided, verify all tags exist
    if (input.tag_ids && input.tag_ids.length > 0) {
      for (const tagId of input.tag_ids) {
        const tagExists = await db.select()
          .from(issueTagsTable)
          .where(eq(issueTagsTable.id, tagId))
          .execute();

        if (tagExists.length === 0) {
          throw new Error(`Tag with id ${tagId} not found`);
        }
      }
    }

    // Build update object with only provided fields
    const updateData: any = {
      updated_at: new Date()
    };

    if (input.title !== undefined) {
      updateData.title = input.title;
    }
    if (input.description !== undefined) {
      updateData.description = input.description;
    }
    if (input.status !== undefined) {
      updateData.status = input.status;
    }
    if (input.assignee_id !== undefined) {
      updateData.assignee_id = input.assignee_id;
    }

    // Update the issue
    const updatedIssue = await db.update(issuesTable)
      .set(updateData)
      .where(eq(issuesTable.id, input.id))
      .returning()
      .execute();

    // Handle tag updates if provided
    if (input.tag_ids !== undefined) {
      // Delete existing tag associations
      await db.delete(issueTagsJunctionTable)
        .where(eq(issueTagsJunctionTable.issue_id, input.id))
        .execute();

      // Add new tag associations
      if (input.tag_ids.length > 0) {
        const junctionData = input.tag_ids.map(tagId => ({
          issue_id: input.id,
          tag_id: tagId
        }));

        await db.insert(issueTagsJunctionTable)
          .values(junctionData)
          .execute();
      }
    }

    const issue = updatedIssue[0];

    // Get creator
    const creatorResult = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, issue.creator_id))
      .execute();

    // Get assignee if exists
    let assigneeResult = null;
    if (issue.assignee_id) {
      const assigneeQuery = await db.select()
        .from(usersTable)
        .where(eq(usersTable.id, issue.assignee_id))
        .execute();
      assigneeResult = assigneeQuery[0] || null;
    }

    // Get tags
    const tagsResult = await db.select({
      id: issueTagsTable.id,
      name: issueTagsTable.name,
      created_at: issueTagsTable.created_at
    })
      .from(issueTagsJunctionTable)
      .innerJoin(issueTagsTable, eq(issueTagsTable.id, issueTagsJunctionTable.tag_id))
      .where(eq(issueTagsJunctionTable.issue_id, input.id))
      .execute();

    return {
      id: issue.id,
      title: issue.title,
      description: issue.description,
      status: issue.status,
      assignee_id: issue.assignee_id,
      creator_id: issue.creator_id,
      created_at: issue.created_at,
      updated_at: issue.updated_at,
      assignee: assigneeResult,
      creator: creatorResult[0],
      tags: tagsResult
    };
  } catch (error) {
    console.error('Issue update failed:', error);
    throw error;
  }
}
