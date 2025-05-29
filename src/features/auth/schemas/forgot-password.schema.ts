/**
 * @fileOverview Zod schemas for the "Forgot Password" feature.
 * This file re-exports common schemas used for validating input in the forgot password form.
 */
import { emailSchema } from "./auth.common.schemas";

/**
 * Zod schema for validating the email input on the forgot password form.
 * @see {@link ./auth.common.schemas.ts#emailSchema}
 */
export { emailSchema };
