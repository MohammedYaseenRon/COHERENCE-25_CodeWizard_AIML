'use server';

import { signIn } from '../../auth';
import { AuthError } from 'next-auth';
import { connectToDatabase } from '@/lib/mongodb';
import User from '@/models/User';
import bcrypt from 'bcryptjs';
import { redirect } from 'next/navigation';

// Authentication function for login
export async function authenticate(
  prevState: string | undefined,
  formData: FormData,
) {
  try {
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const redirectTo = formData.get('redirectTo') as string || '/dashboard';

    await signIn('credentials', {
      email,
      password,
      redirectTo,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case 'CredentialsSignin':
          return 'Invalid credentials. Please check your email and password.';
        default:
          return 'Something went wrong during authentication.';
      }
    }
    throw error;
  }
}

// Sign up function
export async function signUp(
  prevState: { message: string; success: boolean } | undefined,
  formData: FormData,
) {
  try {
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const confirmPassword = formData.get('confirmPassword') as string;
    const name = formData.get('name') as string;
    const role = formData.get('role') as 'hr' | 'candidate';

    // Validation
    if (!email || !password || !name || !role) {
      return { message: 'All fields are required.', success: false };
    }

    if (password !== confirmPassword) {
      return { message: 'Passwords do not match.', success: false };
    }

    if (password.length < 6) {
      return { message: 'Password must be at least 6 characters long.', success: false };
    }

    // Connect to database
    await connectToDatabase();

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return { message: 'User with this email already exists.', success: false };
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const user = new User({
      email: email.toLowerCase(),
      password: hashedPassword,
      name,
      role,
    });

    await user.save();

    return { message: 'Account created successfully! You can now log in.', success: true };
  } catch (error) {
    console.error('Sign up error:', error);
    return { message: 'An error occurred during sign up. Please try again.', success: false };
  }
}

// Helper function to get user by email
export async function getUserByEmail(email: string) {
  try {
    await connectToDatabase();
    const user = await User.findOne({ email: email.toLowerCase() });
    return user;
  } catch (error) {
    console.error('Error fetching user:', error);
    return null;
  }
}