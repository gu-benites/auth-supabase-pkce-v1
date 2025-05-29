
import { z } from "zod";
import { emailSchema, passwordSchema } from "./auth.common.schemas";

export const firstNameSchema = z.string().min(1, { message: "First name is required." }).max(50, { message: "First name must be 50 characters or less." });
export const lastNameSchema = z.string().min(1, { message: "Last name is required." }).max(50, { message: "Last name must be 50 characters or less." });

export { emailSchema, passwordSchema };
