import { z } from 'zod';

export const updateProfileSchema = z.object({
  display_name: z
    .string({ required_error: 'Name is required' })
    .trim()
    .min(1, 'Name is required')
    .max(50, 'Name must be under 50 characters'),
  phone: z
    .string()
    .trim()
    .max(20, 'Phone number is too long')
    .optional()
    .or(z.literal('')),
  default_currency: z
    .string()
    .trim()
    .max(10, 'Invalid currency code')
    .optional()
    .or(z.literal('')),
});
