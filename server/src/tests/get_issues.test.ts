
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, issuesTable, issueTagsTable, issueTagsJunctionTable } from '../db/schema';
import { type IssueFilter } from '../schema';
import { getIssues } from '../handlers/get_issues';

describe('getIssues', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no issues exist', async () => {
    const result = await getIssues();
    expect(result).toEqual([]);
  });

  it('should return issues with creator and no assignee', async () => {
    // Create test user
    const [creator] = await db.insert(usersTable)
      .values({
        email: 'creator@example.com',
        password: 'password123'
      })
      .returning()
      .execute();

    // Create test issue without assignee
    const [issue] = await db.insert(issuesTable)
      .values({
        title: 'Test Issue',
        description: 'Test description',
        status: 'not started',
        creator_id: creator.id,
        assignee_id: null
      })
      .returning()
      .execute();

    const result = await getIssues();

    expect(result).toHaveLength(1);
    expect(result[0].id).toEqual(issue.id);
    expect(result[0].title).toEqual('Test Issue');
    expect(result[0].description).toEqual('Test description');
    expect(result[0].status).toEqual('not started');
    expect(result[0].assignee_id).toBeNull();
    expect(result[0].creator_id).toEqual(creator.id);

    // Verify creator relation
    expect(result[0].creator).toBeDefined();
    expect(result[0].creator.id).toEqual(creator.id);
    expect(result[0].creator.email).toEqual('creator@example.com');

    // Verify assignee is null
    expect(result[0].assignee).toBeNull();

    // Verify tags array is empty
    expect(result[0].tags).toEqual([]);
  });

  it('should return issues with assignee and tags', async () => {
    // Create test users
    const [creator] = await db.insert(usersTable)
      .values({
        email: 'creator@example.com',
        password: 'password123'
      })
      .returning()
      .execute();

    const [assignee] = await db.insert(usersTable)
      .values({
        email: 'assignee@example.com',
        password: 'password456'
      })
      .returning()
      .execute();

    // Create test tags
    const [tag1] = await db.insert(issueTagsTable)
      .values({ name: 'bug' })
      .returning()
      .execute();

    const [tag2] = await db.insert(issueTagsTable)
      .values({ name: 'urgent' })
      .returning()
      .execute();

    // Create test issue with assignee
    const [issue] = await db.insert(issuesTable)
      .values({
        title: 'Bug Fix',
        description: 'Fix critical bug',
        status: 'in progress',
        creator_id: creator.id,
        assignee_id: assignee.id
      })
      .returning()
      .execute();

    // Create tag associations
    await db.insert(issueTagsJunctionTable)
      .values([
        { issue_id: issue.id, tag_id: tag1.id },
        { issue_id: issue.id, tag_id: tag2.id }
      ])
      .execute();

    const result = await getIssues();

    expect(result).toHaveLength(1);
    expect(result[0].id).toEqual(issue.id);
    expect(result[0].title).toEqual('Bug Fix');
    expect(result[0].status).toEqual('in progress');

    // Verify assignee relation
    expect(result[0].assignee).toBeDefined();
    expect(result[0].assignee?.id).toEqual(assignee.id);
    expect(result[0].assignee?.email).toEqual('assignee@example.com');

    // Verify creator relation
    expect(result[0].creator.id).toEqual(creator.id);
    expect(result[0].creator.email).toEqual('creator@example.com');

    // Verify tags
    expect(result[0].tags).toHaveLength(2);
    const tagNames = result[0].tags.map(tag => tag.name).sort();
    expect(tagNames).toEqual(['bug', 'urgent']);
  });

  it('should filter by assignee_id', async () => {
    // Create test users
    const [creator] = await db.insert(usersTable)
      .values({
        email: 'creator@example.com',
        password: 'password123'
      })
      .returning()
      .execute();

    const [assignee1] = await db.insert(usersTable)
      .values({
        email: 'assignee1@example.com',
        password: 'password456'
      })
      .returning()
      .execute();

    const [assignee2] = await db.insert(usersTable)
      .values({
        email: 'assignee2@example.com',
        password: 'password789'
      })
      .returning()
      .execute();

    // Create issues with different assignees
    await db.insert(issuesTable)
      .values([
        {
          title: 'Issue 1',
          description: 'First issue',
          creator_id: creator.id,
          assignee_id: assignee1.id
        },
        {
          title: 'Issue 2',
          description: 'Second issue',
          creator_id: creator.id,
          assignee_id: assignee2.id
        }
      ])
      .execute();

    const filter: IssueFilter = { assignee_id: assignee1.id };
    const result = await getIssues(filter);

    expect(result).toHaveLength(1);
    expect(result[0].title).toEqual('Issue 1');
    expect(result[0].assignee?.id).toEqual(assignee1.id);
  });

  it('should filter by status', async () => {
    // Create test user
    const [creator] = await db.insert(usersTable)
      .values({
        email: 'creator@example.com',
        password: 'password123'
      })
      .returning()
      .execute();

    // Create issues with different statuses
    await db.insert(issuesTable)
      .values([
        {
          title: 'Not Started Issue',
          description: 'Issue not started',
          status: 'not started',
          creator_id: creator.id
        },
        {
          title: 'In Progress Issue',
          description: 'Issue in progress',
          status: 'in progress',
          creator_id: creator.id
        },
        {
          title: 'Done Issue',
          description: 'Issue completed',
          status: 'done',
          creator_id: creator.id
        }
      ])
      .execute();

    const filter: IssueFilter = { status: 'in progress' };
    const result = await getIssues(filter);

    expect(result).toHaveLength(1);
    expect(result[0].title).toEqual('In Progress Issue');
    expect(result[0].status).toEqual('in progress');
  });

  it('should filter by tag_id', async () => {
    // Create test user
    const [creator] = await db.insert(usersTable)
      .values({
        email: 'creator@example.com',
        password: 'password123'
      })
      .returning()
      .execute();

    // Create test tags
    const [bugTag] = await db.insert(issueTagsTable)
      .values({ name: 'bug' })
      .returning()
      .execute();

    const [featureTag] = await db.insert(issueTagsTable)
      .values({ name: 'feature' })
      .returning()
      .execute();

    // Create issues
    const [issue1] = await db.insert(issuesTable)
      .values({
        title: 'Bug Issue',
        description: 'A bug to fix',
        creator_id: creator.id
      })
      .returning()
      .execute();

    const [issue2] = await db.insert(issuesTable)
      .values({
        title: 'Feature Issue',
        description: 'A new feature',
        creator_id: creator.id
      })
      .returning()
      .execute();

    // Tag the issues
    await db.insert(issueTagsJunctionTable)
      .values([
        { issue_id: issue1.id, tag_id: bugTag.id },
        { issue_id: issue2.id, tag_id: featureTag.id }
      ])
      .execute();

    const filter: IssueFilter = { tag_id: bugTag.id };
    const result = await getIssues(filter);

    expect(result).toHaveLength(1);
    expect(result[0].title).toEqual('Bug Issue');
    expect(result[0].tags).toHaveLength(1);
    expect(result[0].tags[0].name).toEqual('bug');
  });

  it('should apply multiple filters', async () => {
    // Create test users
    const [creator] = await db.insert(usersTable)
      .values({
        email: 'creator@example.com',
        password: 'password123'
      })
      .returning()
      .execute();

    const [assignee] = await db.insert(usersTable)
      .values({
        email: 'assignee@example.com',
        password: 'password456'
      })
      .returning()
      .execute();

    // Create test tag
    const [urgentTag] = await db.insert(issueTagsTable)
      .values({ name: 'urgent' })
      .returning()
      .execute();

    // Create matching and non-matching issues
    const [matchingIssue] = await db.insert(issuesTable)
      .values({
        title: 'Matching Issue',
        description: 'This should match all filters',
        status: 'in progress',
        creator_id: creator.id,
        assignee_id: assignee.id
      })
      .returning()
      .execute();

    await db.insert(issuesTable)
      .values({
        title: 'Non-matching Issue',
        description: 'This should not match',
        status: 'done',
        creator_id: creator.id,
        assignee_id: assignee.id
      })
      .execute();

    // Tag the matching issue
    await db.insert(issueTagsJunctionTable)
      .values({ issue_id: matchingIssue.id, tag_id: urgentTag.id })
      .execute();

    const filter: IssueFilter = {
      assignee_id: assignee.id,
      status: 'in progress',
      tag_id: urgentTag.id
    };
    const result = await getIssues(filter);

    expect(result).toHaveLength(1);
    expect(result[0].title).toEqual('Matching Issue');
    expect(result[0].status).toEqual('in progress');
    expect(result[0].assignee?.id).toEqual(assignee.id);
    expect(result[0].tags[0].name).toEqual('urgent');
  });
});
