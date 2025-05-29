import { z } from "zod";

/**
 * Zod schema for validating email addresses.
 * Ensures the string is a valid email format.
 */
export const emailSchema = z.string().email({ message: "Invalid email address. Please enter a valid email." });

/**
 * Zod schema for validating passwords during registration or update.
 * Ensures the password is not empty and meets a minimum length requirement.
 */
export const passwordSchema = z
  .string()
  .min(1, { message: "Password cannot be empty." })
  .min(8, { message: "Password must be at least 8 characters long." });

/**
 * Zod schema for validating first names.
 * Ensures the first name is not empty and does not exceed a maximum length.
 */
export const firstNameSchema = z.string().min(1, { message: "First name is required." }).max(50, { message: "First name must be 50 characters or less." });

/**
 * Zod schema for validating last names.
 * Ensures the last name is not empty and does not exceed a maximum length.
 */
export const lastNameSchema = z.string().min(1, { message: "Last name is required." }).max(50, { message: "Last name must be 50 characters or less." });
