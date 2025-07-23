
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { getUsers } from '../handlers/get_users';
import { type RegisterUserInput } from '../schema';

describe('getUsers', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no users exist', async () => {
    const result = await getUsers();
    expect(result).toEqual([]);
  });

  it('should return all users', async () => {
    // Create test users
    const testUsers: RegisterUserInput[] = [
      { email: 'user1@example.com', password: 'password123' },
      { email: 'user2@example.com', password: 'password456' },
      { email: 'user3@example.com', password: 'password789' }
    ];

    // Insert users directly into database
    for (const user of testUsers) {
      await db.insert(usersTable)
        .values({
          email: user.email,
          password: user.password
        })
        .execute();
    }

    const result = await getUsers();

    expect(result).toHaveLength(3);
    expect(result[0].email).toEqual('user1@example.com');
    expect(result[1].email).toEqual('user2@example.com'); 
    expect(result[2].email).toEqual('user3@example.com');

    // Verify all users have required fields
    result.forEach(user => {
      expect(user.id).toBeDefined();
      expect(user.email).toBeDefined();
      expect(user.password).toBeDefined();
      expect(user.created_at).toBeInstanceOf(Date);
    });
  });

  it('should return users ordered by id', async () => {
    // Create test users in specific order
    const user1 = await db.insert(usersTable)
      .values({
        email: 'first@example.com',
        password: 'password1'
      })
      .returning()
      .execute();

    const user2 = await db.insert(usersTable)
      .values({
        email: 'second@example.com',
        password: 'password2'
      })
      .returning()
      .execute();

    const result = await getUsers();

    expect(result).toHaveLength(2);
    expect(result[0].id).toBeLessThan(result[1].id);
    expect(result[0].email).toEqual('first@example.com');
    expect(result[1].email).toEqual('second@example.com');
  });
});
