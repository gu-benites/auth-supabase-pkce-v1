
"use client";

import { RegisterForm } from "@/features/auth/components";

/**
 * Renders the registration page for the PassForge application.
 * This page allows new users to create an account.
 * It primarily displays the `RegisterForm` component which handles the form submission and user creation logic.
 *
 * @returns {JSX.Element} The registration page component.
 */
export default function RegisterPage(): JSX.Element {
  return <RegisterForm />;
}
