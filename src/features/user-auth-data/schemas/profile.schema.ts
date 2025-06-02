// src/features/profile/schemas/profile.schema.ts
import { z } from 'zod';

const MAX_BIO_LENGTH = 180;

export const UserProfileSchema = z.object({
  id: z.string().uuid().describe("User's unique identifier, matches auth.users.id"),
  email: z.string().email().optional().nullable().describe("User's email address from auth.users"),
  firstName: z.string().min(1, "First name is required.").max(50, "First name must be 50 characters or less.").optional().nullable().describe("User's first name"),
  lastName: z.string().min(1, "Last name is required.").max(50, "Last name must be 50 characters or less.").optional().nullable().describe("User's last name"),
  gender: z.string().optional().nullable().describe("User's gender"),
  ageCategory: z.string().optional().nullable().describe("User's age category"),
  specificAge: z.number().int().optional().nullable().describe("User's specific age"),
  language: z.string().optional().nullable().default('en').describe("User's preferred language, defaults to 'en'"),
  avatarUrl: z.string().url("Invalid avatar URL.").optional().nullable().describe("URL of the user's avatar image"),
  bannerUrl: z.string().url("Invalid banner URL.").optional().nullable().describe("URL for the user's profile banner image"),
  bio: z.string().max(MAX_BIO_LENGTH, `Biography must be ${MAX_BIO_LENGTH} characters or less.`).optional().nullable().describe("User's biography"),
  role: z.enum(['user', 'premium', 'admin']).default('user').describe("User's role within the application"),
  stripeCustomerId: z.string().optional().nullable().describe("User's Stripe customer ID, if applicable"),
  subscriptionStatus: z.string().optional().nullable().describe("Status of the user's subscription"),
  subscriptionTier: z.string().optional().nullable().describe("Tier of the user's subscription"),
  subscriptionPeriod: z.enum(['monthly', 'annual']).optional().nullable().describe("Billing period of the subscription"),
  subscriptionStartDate: z.string().datetime({ offset: true }).optional().nullable().describe("Start date of the current subscription period"),
  subscriptionEndDate: z.string().datetime({ offset: true }).optional().nullable().describe("End date of the current subscription period"),
  createdAt: z.string().datetime({ offset: true }).describe("Timestamp of when the profile was created"),
  updatedAt: z.string().datetime({ offset: true }).describe("Timestamp of the last profile update"),
});

export type UserProfile = z.infer<typeof UserProfileSchema>;
