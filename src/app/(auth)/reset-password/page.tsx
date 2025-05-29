
"use client";

import { ResetPasswordForm } from '@/features/auth/components';

/**
 * Renders the "Reset Password" page for the PassForge application.
 * Users arrive at this page after clicking a password reset link in their email.
 * It allows them to set a new password.
 * It primarily displays the `ResetPasswordForm` component which handles the form submission and password update logic.
 *
 * @returns {JSX.Element} The reset password page component.
 */
export default function ResetPasswordPage(): JSX.Element {
  return <ResetPasswordForm />;
}
