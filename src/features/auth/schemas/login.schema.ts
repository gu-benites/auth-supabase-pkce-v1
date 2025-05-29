import { z } from "zod";
import { emailSchema } from "./auth.common.schemas";

export const loginPasswordSchema = z.string().min(1, {message: "Password is required."});

export { emailSchema };
