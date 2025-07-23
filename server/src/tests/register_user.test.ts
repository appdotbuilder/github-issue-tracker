
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type RegisterUserInput } from '../schema';
import { registerUser } from '../handlers/register_user';
import { eq } from 'drizzle-orm';

// Test input
const testInput: RegisterUserInput = {
  email: 'test@example.com',
  password: 'password123'
};

describe('registerUser', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a new user', async () => {
    const result = await registerUser(testInput);

    // Basic field validation
    expect(result.email).toEqual('test@example.com');
    expect(result.password).toBeDefined();
    expect(result.password).not.toEqual('password123'); // Should be hashed
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save user to database', async () => {
    const result = await registerUser(testInput);

    // Verify user was saved to database
    const users = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, result.id))
      .execute();

    expect(users).toHaveLength(1);
    expect(users[0].email).toEqual('test@example.com');
    expect(users[0].password).toBeDefined();
    expect(users[0].password).not.toEqual('password123'); // Should be hashed
    expect(users[0].created_at).toBeInstanceOf(Date);
  });

  it('should hash the password', async () => {
    const result = await registerUser(testInput);

    // Password should be hashed, not plain text
    expect(result.password).not.toEqual('password123');
    expect(result.password.length).toBeGreaterThan(20); // Hashed passwords are much longer
    
    // Verify the hashed password can be verified
    const isValid = await Bun.password.verify('password123', result.password);
    expect(isValid).toBe(true);
  });

  it('should reject duplicate email addresses', async () => {
    // Create first user
    await registerUser(testInput);

    // Try to create second user with same email
    await expect(registerUser(testInput)).rejects.toThrow(/already exists/i);
  });

  it('should handle different email formats', async () => {
    const testInputs = [
      { email: 'user1@domain.com', password: 'password123' },
      { email: 'user2@different-domain.org', password: 'password456' },
      { email: 'user.with.dots@example.co.uk', password: 'password789' }
    ];

    for (const input of testInputs) {
      const result = await registerUser(input);
      expect(result.email).toEqual(input.email);
      expect(result.id).toBeDefined();
    }

    // Verify all users were saved
    const allUsers = await db.select().from(usersTable).execute();
    expect(allUsers).toHaveLength(3);
  });
});
