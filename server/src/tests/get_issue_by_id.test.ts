
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, issuesTable, issueTagsTable, issueTagsJunctionTable } from '../db/schema';
import { getIssueById } from '../handlers/get_issue_by_id';

describe('getIssueById', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return null when issue does not exist', async () => {
    const result = await getIssueById(999);
    expect(result).toBeNull();
  });

  it('should return issue with creator and no assignee', async () => {
    // Create a user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'creator@test.com',
        password: 'password123'
      })
      .returning()
      .execute();

    const creator = userResult[0];

    // Create an issue without assignee
    const issueResult = await db.insert(issuesTable)
      .values({
        title: 'Test Issue',
        description: 'Test description',
        status: 'not started',
        creator_id: creator.id,
        assignee_id: null
      })
      .returning()
      .execute();

    const issue = issueResult[0];

    const result = await getIssueById(issue.id);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(issue.id);
    expect(result!.title).toEqual('Test Issue');
    expect(result!.description).toEqual('Test description');
    expect(result!.status).toEqual('not started');
    expect(result!.assignee_id).toBeNull();
    expect(result!.creator_id).toEqual(creator.id);
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);

    // Check creator
    expect(result!.creator).not.toBeNull();
    expect(result!.creator.id).toEqual(creator.id);
    expect(result!.creator.email).toEqual('creator@test.com');
    expect(result!.creator.created_at).toBeInstanceOf(Date);

    // Check assignee is null
    expect(result!.assignee).toBeNull();

    // Check tags array is empty
    expect(result!.tags).toEqual([]);
  });

  it('should return issue with creator and assignee', async () => {
    // Create users
    const creatorResult = await db.insert(usersTable)
      .values({
        email: 'creator@test.com',
        password: 'password123'
      })
      .returning()
      .execute();

    const assigneeResult = await db.insert(usersTable)
      .values({
        email: 'assignee@test.com',
        password: 'password456'
      })
      .returning()
      .execute();

    const creator = creatorResult[0];
    const assignee = assigneeResult[0];

    // Create an issue with assignee
    const issueResult = await db.insert(issuesTable)
      .values({
        title: 'Assigned Issue',
        description: 'Issue with assignee',
        status: 'in progress',
        creator_id: creator.id,
        assignee_id: assignee.id
      })
      .returning()
      .execute();

    const issue = issueResult[0];

    const result = await getIssueById(issue.id);

    expect(result).not.toBeNull();
    expect(result!.assignee_id).toEqual(assignee.id);

    // Check assignee
    expect(result!.assignee).not.toBeNull();
    expect(result!.assignee!.id).toEqual(assignee.id);
    expect(result!.assignee!.email).toEqual('assignee@test.com');
    expect(result!.assignee!.created_at).toBeInstanceOf(Date);

    // Check creator
    expect(result!.creator.id).toEqual(creator.id);
    expect(result!.creator.email).toEqual('creator@test.com');
  });

  it('should return issue with tags', async () => {
    // Create a user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'creator@test.com',
        password: 'password123'
      })
      .returning()
      .execute();

    const creator = userResult[0];

    // Create tags
    const tag1Result = await db.insert(issueTagsTable)
      .values({ name: 'Bug' })
      .returning()
      .execute();

    const tag2Result = await db.insert(issueTagsTable)
      .values({ name: 'High Priority' })
      .returning()
      .execute();

    const tag1 = tag1Result[0];
    const tag2 = tag2Result[0];

    // Create an issue
    const issueResult = await db.insert(issuesTable)
      .values({
        title: 'Tagged Issue',
        description: 'Issue with tags',
        status: 'done',
        creator_id: creator.id,
        assignee_id: null
      })
      .returning()
      .execute();

    const issue = issueResult[0];

    // Link tags to issue
    await db.insert(issueTagsJunctionTable)
      .values([
        { issue_id: issue.id, tag_id: tag1.id },
        { issue_id: issue.id, tag_id: tag2.id }
      ])
      .execute();

    const result = await getIssueById(issue.id);

    expect(result).not.toBeNull();
    expect(result!.tags).toHaveLength(2);
    
    const tagNames = result!.tags.map(tag => tag.name).sort();
    expect(tagNames).toEqual(['Bug', 'High Priority']);
    
    result!.tags.forEach(tag => {
      expect(tag.id).toBeDefined();
      expect(tag.created_at).toBeInstanceOf(Date);
    });
  });

  it('should return complete issue with all relations', async () => {
    // Create users
    const creatorResult = await db.insert(usersTable)
      .values({
        email: 'creator@test.com',
        password: 'password123'
      })
      .returning()
      .execute();

    const assigneeResult = await db.insert(usersTable)
      .values({
        email: 'assignee@test.com',
        password: 'password456'
      })
      .returning()
      .execute();

    const creator = creatorResult[0];
    const assignee = assigneeResult[0];

    // Create a tag
    const tagResult = await db.insert(issueTagsTable)
      .values({ name: 'Feature' })
      .returning()
      .execute();

    const tag = tagResult[0];

    // Create an issue
    const issueResult = await db.insert(issuesTable)
      .values({
        title: 'Complete Issue',
        description: 'Issue with all relations',
        status: 'in progress',
        creator_id: creator.id,
        assignee_id: assignee.id
      })
      .returning()
      .execute();

    const issue = issueResult[0];

    // Link tag to issue
    await db.insert(issueTagsJunctionTable)
      .values({ issue_id: issue.id, tag_id: tag.id })
      .execute();

    const result = await getIssueById(issue.id);

    expect(result).not.toBeNull();
    
    // Check all fields are present
    expect(result!.id).toEqual(issue.id);
    expect(result!.title).toEqual('Complete Issue');
    expect(result!.description).toEqual('Issue with all relations');
    expect(result!.status).toEqual('in progress');
    expect(result!.creator_id).toEqual(creator.id);
    expect(result!.assignee_id).toEqual(assignee.id);
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
    
    // Check creator relation
    expect(result!.creator.id).toEqual(creator.id);
    expect(result!.creator.email).toEqual('creator@test.com');
    
    // Check assignee relation
    expect(result!.assignee).not.toBeNull();
    expect(result!.assignee!.id).toEqual(assignee.id);
    expect(result!.assignee!.email).toEqual('assignee@test.com');
    
    // Check tags relation
    expect(result!.tags).toHaveLength(1);
    expect(result!.tags[0].id).toEqual(tag.id);
    expect(result!.tags[0].name).toEqual('Feature');
    expect(result!.tags[0].created_at).toBeInstanceOf(Date);
  });
});
