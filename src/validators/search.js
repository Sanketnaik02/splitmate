import { z } from 'zod';

export const splitmateIdSchema = z
  .string({ required_error: 'SplitMate ID is required' })
  .trim()
  .min(1, 'SplitMate ID is required')
  .regex(/^SM\d{5}$/i, 'Invalid SplitMate ID format (e.g. SM00001)');
