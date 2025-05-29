
"use client";

import { LoginForm } from '@/features/auth/components';

/**
 * Renders the login page for the PassForge application.
 * This page allows users to sign in using their email and password.
 * It primarily displays the `LoginForm` component which handles the form submission and authentication logic.
 *
 * @returns {JSX.Element} The login page component.
 */
export default function LoginPage(): JSX.Element {
  return <LoginForm />;
}
