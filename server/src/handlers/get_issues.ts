
import { db } from '../db';
import { issuesTable, usersTable, issueTagsTable, issueTagsJunctionTable } from '../db/schema';
import { type IssueWithRelations, type IssueFilter } from '../schema';
import { eq, and, inArray, type SQL } from 'drizzle-orm';

export async function getIssues(filter?: IssueFilter): Promise<IssueWithRelations[]> {
  try {
    // Build conditions array for filtering
    const conditions: SQL<unknown>[] = [];

    if (filter?.assignee_id !== undefined) {
      conditions.push(eq(issuesTable.assignee_id, filter.assignee_id));
    }

    if (filter?.status !== undefined) {
      conditions.push(eq(issuesTable.status, filter.status));
    }

    // Get base issues with filtering
    const issues = conditions.length > 0
      ? await db.select().from(issuesTable)
          .where(conditions.length === 1 ? conditions[0] : and(...conditions))
          .execute()
      : await db.select().from(issuesTable).execute();

    // If filtering by tag_id, filter issues that have that tag
    let filteredIssues = issues;
    if (filter?.tag_id !== undefined) {
      const issueIdsWithTag = await db.select({ issue_id: issueTagsJunctionTable.issue_id })
        .from(issueTagsJunctionTable)
        .where(eq(issueTagsJunctionTable.tag_id, filter.tag_id))
        .execute();
      
      const taggedIssueIds = new Set(issueIdsWithTag.map(row => row.issue_id));
      filteredIssues = issues.filter(issue => taggedIssueIds.has(issue.id));
    }

    if (filteredIssues.length === 0) {
      return [];
    }

    // Fetch all creators in one query
    const creatorIds = [...new Set(filteredIssues.map(issue => issue.creator_id))];
    const creators = await db.select().from(usersTable)
      .where(inArray(usersTable.id, creatorIds))
      .execute();
    
    // Fetch all assignees in one query
    const assigneeIds = [...new Set(filteredIssues.map(issue => issue.assignee_id).filter(id => id !== null))] as number[];
    const assignees = assigneeIds.length > 0 
      ? await db.select().from(usersTable)
          .where(inArray(usersTable.id, assigneeIds))
          .execute()
      : [];

    // Fetch all tags for the filtered issues
    const issueIds = filteredIssues.map(issue => issue.id);
    const tagJunctions = await db.select({
        issue_id: issueTagsJunctionTable.issue_id,
        tag_id: issueTagsTable.id,
        tag_name: issueTagsTable.name,
        tag_created_at: issueTagsTable.created_at
      })
      .from(issueTagsJunctionTable)
      .innerJoin(issueTagsTable, eq(issueTagsJunctionTable.tag_id, issueTagsTable.id))
      .where(inArray(issueTagsJunctionTable.issue_id, issueIds))
      .execute();

    // Create lookup maps
    const creatorMap = new Map(creators.map(creator => [creator.id, creator]));
    const assigneeMap = new Map(assignees.map(assignee => [assignee.id, assignee]));
    
    // Group tags by issue_id
    const tagsByIssueId = new Map<number, Array<{ id: number; name: string; created_at: Date }>>();
    for (const junction of tagJunctions) {
      if (!tagsByIssueId.has(junction.issue_id)) {
        tagsByIssueId.set(junction.issue_id, []);
      }
      tagsByIssueId.get(junction.issue_id)!.push({
        id: junction.tag_id,
        name: junction.tag_name,
        created_at: junction.tag_created_at
      });
    }

    // Build the result with relations
    return filteredIssues.map(issue => ({
      id: issue.id,
      title: issue.title,
      description: issue.description,
      status: issue.status,
      assignee_id: issue.assignee_id,
      creator_id: issue.creator_id,
      created_at: issue.created_at,
      updated_at: issue.updated_at,
      creator: creatorMap.get(issue.creator_id)!,
      assignee: issue.assignee_id ? (assigneeMap.get(issue.assignee_id) || creatorMap.get(issue.assignee_id) || null) : null,
      tags: tagsByIssueId.get(issue.id) || []
    }));
  } catch (error) {
    console.error('Failed to get issues:', error);
    throw error;
  }
}
