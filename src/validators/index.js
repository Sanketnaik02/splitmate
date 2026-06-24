export { loginSchema, signupSchema } from './auth';
export { createGroupSchema, addGroupMemberSchema } from './group';
export { addExpenseSchema } from './expense';
export { updateProfileSchema } from './profile';
export { splitmateIdSchema } from './search';

/**
 * Validate data against a Zod schema using safeParse.
 *
 * @param {import('zod').ZodSchema} schema
 * @param {unknown} data
 * @returns {{ success: true, data: Record<string, unknown> } | { success: false, errors: Record<string, string> }}
 *
 * On success:  { success: true, data: <parsed data> }
 * On failure:  { success: false, errors: { fieldName: "user-friendly message", ... } }
 */
export function validate(schema, data) {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }

  const errors = {};
  for (const issue of result.error.issues) {
    const path = issue.path.join('.') || '_root';
    if (!errors[path]) {
      errors[path] = issue.message;
    }
  }

  return { success: false, errors };
}
