import { z } from 'zod';

export const createGroupSchema = z.object({
  name: z
    .string({ required_error: 'Group name is required' })
    .trim()
    .min(3, 'Group name must be at least 3 characters')
    .max(50, 'Group name must be under 50 characters'),
  category: z.string().optional(),
  description: z.string().optional(),
});

export const addGroupMemberSchema = z.object({
  name: z
    .string({ required_error: 'Name is required' })
    .trim()
    .min(1, 'Name is required'),
});
