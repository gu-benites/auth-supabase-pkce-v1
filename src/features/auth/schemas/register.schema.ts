/**
 * @fileOverview Zod schemas for the "User Registration" feature.
 * This file re-exports common schemas and defines specific ones for validating input in the registration form.
 */
import { z } from "zod";
import { emailSchema, passwordSchema, firstNameSchema, lastNameSchema } from "./auth.common.schemas";

/**
 * Zod schema for validating the first name input on the registration form.
 * @see {@link ./auth.common.schemas.ts#firstNameSchema}
 */
export { firstNameSchema };
/**
 * Zod schema for validating the last name input on the registration form.
 * @see {@link ./auth.common.schemas.ts#lastNameSchema}
 */
export { lastNameSchema };
/**
 * Zod schema for validating the email input on the registration form.
 * @see {@link ./auth.common.schemas.ts#emailSchema}
 */
export { emailSchema };
/**
 * Zod schema for validating the password input on the registration form.
 * @see {@link ./auth.common.schemas.ts#passwordSchema}
 */
export { passwordSchema };
