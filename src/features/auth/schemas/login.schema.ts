/**
 * @fileOverview Zod schemas for the "Login" feature.
 * Defines validation rules for login form inputs.
 */
import { z } from "zod";
import { emailSchema } from "./auth.common.schemas";

/**
 * Zod schema specifically for validating the password input on the login form.
 * Ensures the password field is not empty. Strength validation is handled by `passwordSchema`
 * during registration or password updates.
 */
export const loginPasswordSchema = z.string().min(1, {message: "Password is required."});

/**
 * Zod schema for validating the email input on the login form.
 * @see {@link ./auth.common.schemas.ts#emailSchema}
 */
export { emailSchema };
