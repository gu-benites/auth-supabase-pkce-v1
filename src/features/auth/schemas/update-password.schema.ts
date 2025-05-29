/**
 * @fileOverview Zod schemas for the "Update Password" feature (typically part of password reset).
 * This file re-exports common schemas used for validating new password input.
 */
import { passwordSchema } from "./auth.common.schemas";

/**
 * Zod schema for validating the new password input.
 * @see {@link ./auth.common.schemas.ts#passwordSchema}
 */
export { passwordSchema };
