
"use client";

import { ForgotPasswordForm } from '@/features/auth/components';

/**
 * Renders the "Forgot Password" page for the PassForge application.
 * This page allows users to request a password reset link by providing their email address.
 * It primarily displays the `ForgotPasswordForm` component which handles the form submission and logic.
 *
 * @returns {JSX.Element} The forgot password page component.
 */
export default function ForgotPasswordPage(): JSX.Element {
  return <ForgotPasswordForm />;
}
