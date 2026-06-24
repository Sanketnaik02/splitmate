import { z } from 'zod';

export const loginSchema = z.object({
  email: z
    .string({ required_error: 'Email is required' })
    .trim()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
  password: z
    .string({ required_error: 'Password is required' })
    .min(1, 'Password is required'),
});

export const signupSchema = z.object({
  name: z
    .string({ required_error: 'Please enter your name' })
    .trim()
    .min(1, 'Please enter your name'),
  email: z
    .string({ required_error: 'Please enter your email address' })
    .trim()
    .min(1, 'Please enter your email address')
    .email('Please enter a valid email address'),
  password: z
    .string({ required_error: 'Password is required' })
    .min(6, 'Password must be at least 6 characters'),
});
