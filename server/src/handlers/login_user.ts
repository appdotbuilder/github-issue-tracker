
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type LoginUserInput, type User } from '../schema';
import { eq } from 'drizzle-orm';

export const loginUser = async (input: LoginUserInput): Promise<User> => {
  try {
    // Find user by email
    const users = await db.select()
      .from(usersTable)
      .where(eq(usersTable.email, input.email))
      .execute();

    if (users.length === 0) {
      throw new Error('Invalid email or password');
    }

    const user = users[0];

    // Verify password (in a real app, this would use bcrypt.compare)
    if (user.password !== input.password) {
      throw new Error('Invalid email or password');
    }

    // Return user data (password should be excluded in real app)
    return {
      id: user.id,
      email: user.email,
      password: user.password,
      created_at: user.created_at
    };
  } catch (error) {
    console.error('User login failed:', error);
    throw error;
  }
};
