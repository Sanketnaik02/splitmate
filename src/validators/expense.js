import { z } from 'zod';

export const addExpenseSchema = z.object({
  description: z
    .string({ required_error: 'Description is required' })
    .trim()
    .min(3, 'Description must be at least 3 characters')
    .max(100, 'Description must be under 100 characters'),
  amount: z
    .number({ required_error: 'Amount is required', invalid_type_error: 'Amount must be a number' })
    .positive('Amount must be greater than 0'),
  category: z
    .string({ required_error: 'Category is required' })
    .min(1, 'Category is required'),
  paid_by_member_id: z
    .string({ required_error: 'Select who paid' })
    .min(1, 'Select who paid'),
});
