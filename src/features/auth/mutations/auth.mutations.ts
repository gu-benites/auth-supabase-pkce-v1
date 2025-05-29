
"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type { 
  emailSchema as EmailSchemaType, 
  passwordSchema as PasswordSchemaType,
  loginPasswordSchema as LoginPasswordSchemaType
} from "@/features/auth/schemas"; // Assuming barrel export from schemas

// Import specific schemas
import { emailSchema as forgotPasswordEmailSchema } from "@/features/auth/schemas/forgot-password.schema";
import { passwordSchema as updateUserPasswordSchema } from "@/features/auth/schemas/update-password.schema";
import { emailSchema as signInEmailSchema, loginPasswordSchema as signInPasswordSchema } from "@/features/auth/schemas/login.schema";
import { 
  emailSchema as signUpEmailSchema, 
  passwordSchema as signUpPasswordSchema,
  firstNameSchema,
  lastNameSchema
} from "@/features/auth/schemas/register.schema";


export async function requestPasswordReset(prevState: any, formData: FormData) {
  const email = formData.get("email") as string;

  const validation = forgotPasswordEmailSchema.safeParse(email);
  if (!validation.success) {
    return {
      success: false,
      message: validation.error.errors.map((e) => e.message).join(", "),
      errorFields: { email: validation.error.errors.map((e) => e.message).join(", ") }
    };
  }

  const supabase = await createClient();
  const origin = headers().get("origin");

  if (!origin) {
    return {
      success: false,
      message: "Could not determine application origin. Password reset failed.",
    };
  }

  const redirectTo = `${origin}/auth/confirm?next=/reset-password`;

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo,
  });

  if (error) {
    return {
      success: false,
      message: `Password reset request failed: ${error.message}`,
    };
  }

  return {
    success: true,
    message: "If an account exists for this email, a password reset link has been sent.",
  };
}

export async function updateUserPassword(prevState: any, formData: FormData) {
  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (password !== confirmPassword) {
    return {
      success: false,
      message: "Passwords do not match.",
      errorFields: { confirmPassword: "Passwords do not match."}
    };
  }

  const passwordValidation = updateUserPasswordSchema.safeParse(password);
  if (!passwordValidation.success) {
    return {
      success: false,
      message: passwordValidation.error.errors.map((e) => e.message).join(", "),
      errorFields: { password: passwordValidation.error.errors.map((e) => e.message).join(", ") }
    };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return {
        success: false,
        message: "User not authenticated. Please try the password reset process again."
    }
  }

  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    return {
      success: false,
      message: `Failed to update password: ${error.message}`,
    };
  }

  return {
    success: true,
    message: "Your password has been updated successfully. You can now log in with your new password.",
  };
}

export async function signInWithPassword(prevState: any, formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const emailValidation = signInEmailSchema.safeParse(email);
  if (!emailValidation.success) {
    return {
      success: false,
      message: "Invalid email address.",
      errorFields: { email: emailValidation.error.errors.map((e) => e.message).join(", ") }
    };
  }

  const passwordValidation = signInPasswordSchema.safeParse(password);
   if (!passwordValidation.success) {
    return {
      success: false,
      message: "Password is required.",
      errorFields: { password: passwordValidation.error.errors.map((e) => e.message).join(", ") }
    };
  }

  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return {
      success: false,
      message: error.message || "Invalid login credentials.",
    };
  }

  if (!data.user) {
     return {
      success: false,
      message: "Login failed. Please check your credentials.",
    };
  }

  // redirect("/some-protected-route"); // Example redirect, adjust as needed
  return {
    success: true,
    message: "Logged in successfully! Redirecting...",
  };
}

export async function signUpNewUser(prevState: any, formData: FormData) {
  const firstName = formData.get("firstName") as string;
  const lastName = formData.get("lastName") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  let errorFields: Record<string, string> = {};
  let overallMessage = "";

  const firstNameValidation = firstNameSchema.safeParse(firstName);
  if (!firstNameValidation.success) {
    errorFields.firstName = firstNameValidation.error.errors.map((e) => e.message).join(", ");
  }

  const lastNameValidation = lastNameSchema.safeParse(lastName);
  if (!lastNameValidation.success) {
    errorFields.lastName = lastNameValidation.error.errors.map((e) => e.message).join(", ");
  }

  const emailValidation = signUpEmailSchema.safeParse(email);
  if (!emailValidation.success) {
    errorFields.email = emailValidation.error.errors.map((e) => e.message).join(", ");
  }

  const passwordValidation = signUpPasswordSchema.safeParse(password);
  if (!passwordValidation.success) {
    errorFields.password = passwordValidation.error.errors.map((e) => e.message).join(", ");
  }

  if (password !== confirmPassword) {
    errorFields.confirmPassword = "Passwords do not match.";
  }

  if (Object.keys(errorFields).length > 0) {
    overallMessage = "Please correct the errors in the form.";
     if (Object.keys(errorFields).length === 1 && errorFields.confirmPassword) {
        overallMessage = "Passwords do not match.";
    } else if (Object.keys(errorFields).length === 1) {
        overallMessage = Object.values(errorFields)[0];
    }
    return {
      success: false,
      message: overallMessage,
      errorFields
    };
  }
  
  const supabase = await createClient();
  const origin = headers().get("origin");

  if (!origin) {
    return {
      success: false,
      message: "Could not determine application origin. Sign up failed.",
    };
  }

  const emailRedirectTo = `${origin}/auth/confirm?next=/login`; // Redirect to login after email confirmation

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo,
      data: { // This data is stored in user_metadata
        first_name: firstName,
        last_name: lastName,
      }
    },
  });

  if (error) {
    return {
      success: false,
      message: `Sign up failed: ${error.message}`,
    };
  }

  if (!data.user && !data.session) {
     return {
      success: false,
      message: "Sign up successful, but no user data returned. Please check your email to confirm.",
    };
  }

  return {
    success: true,
    message: "Sign up successful! Please check your email to confirm your account before logging in.",
  };
}
