
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type LoginUserInput } from '../schema';
import { loginUser } from '../handlers/login_user';

const testUser = {
  email: 'test@example.com',
  password: 'password123'
};

const testLoginInput: LoginUserInput = {
  email: 'test@example.com',
  password: 'password123'
};

describe('loginUser', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should login user with correct credentials', async () => {
    // Create test user first
    await db.insert(usersTable)
      .values(testUser)
      .execute();

    const result = await loginUser(testLoginInput);

    expect(result.email).toEqual('test@example.com');
    expect(result.password).toEqual('password123');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should throw error for non-existent user', async () => {
    const invalidInput: LoginUserInput = {
      email: 'nonexistent@example.com',
      password: 'password123'
    };

    await expect(loginUser(invalidInput)).rejects.toThrow(/invalid email or password/i);
  });

  it('should throw error for incorrect password', async () => {
    // Create test user first
    await db.insert(usersTable)
      .values(testUser)
      .execute();

    const invalidInput: LoginUserInput = {
      email: 'test@example.com',
      password: 'wrongpassword'
    };

    await expect(loginUser(invalidInput)).rejects.toThrow(/invalid email or password/i);
  });

  it('should throw error for empty email', async () => {
    const invalidInput: LoginUserInput = {
      email: '',
      password: 'password123'
    };

    await expect(loginUser(invalidInput)).rejects.toThrow(/invalid email or password/i);
  });
});
