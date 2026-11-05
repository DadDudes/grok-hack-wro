import type { ZodError } from 'zod';

import type { FieldError } from './types.ts';

export function zodErrorDetails(error: ZodError): FieldError[] {
  return error.issues.map((issue) => ({
    path: issue.path.length > 0 ? issue.path.join('.') : '(root)',
    message: issue.message,
  }));
}
