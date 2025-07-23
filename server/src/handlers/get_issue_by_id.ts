
import { db } from '../db';
import { issuesTable, usersTable, issueTagsTable, issueTagsJunctionTable } from '../db/schema';
import { type IssueWithRelations } from '../schema';
import { eq } from 'drizzle-orm';

export async function getIssueById(id: number): Promise<IssueWithRelations | null> {
  try {
    // Get the issue first
    const issueResult = await db.select()
      .from(issuesTable)
      .where(eq(issuesTable.id, id))
      .execute();

    if (issueResult.length === 0) {
      return null;
    }

    const issue = issueResult[0];

    // Get creator
    const creatorResult = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, issue.creator_id))
      .execute();

    if (creatorResult.length === 0) {
      throw new Error('Creator not found');
    }

    const creator = creatorResult[0];

    // Get assignee if exists
    let assignee = null;
    if (issue.assignee_id) {
      const assigneeResult = await db.select()
        .from(usersTable)
        .where(eq(usersTable.id, issue.assignee_id))
        .execute();
      
      if (assigneeResult.length > 0) {
        assignee = assigneeResult[0];
      }
    }

    // Get tags for this issue
    const tagsResult = await db.select({
      id: issueTagsTable.id,
      name: issueTagsTable.name,
      created_at: issueTagsTable.created_at,
    })
    .from(issueTagsTable)
    .innerJoin(issueTagsJunctionTable, eq(issueTagsTable.id, issueTagsJunctionTable.tag_id))
    .where(eq(issueTagsJunctionTable.issue_id, id))
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
      creator,
      assignee,
      tags: tagsResult
    };
  } catch (error) {
    console.error('Failed to get issue by ID:', error);
    throw error;
  }
}
