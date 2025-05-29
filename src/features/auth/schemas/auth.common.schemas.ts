import { z } from "zod";

export const emailSchema = z.string().email({ message: "Invalid email address. Please enter a valid email." });

export const passwordSchema = z
  .string()
  .min(1, { message: "Password cannot be empty." })
  .min(8, { message: "Password must be at least 8 characters long." });
