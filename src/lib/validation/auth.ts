import { z } from "zod";

/**
 * Validation schemas for authentication endpoints.
 * Following the pattern from boards.ts
 */

/**
 * POST /api/auth/login
 * Login with email and password
 */
export const LoginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export type LoginInput = z.infer<typeof LoginSchema>;

/**
 * POST /api/auth/signUp
 * Register a new user with email, password, and display name
 */
export const SignUpSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  displayName: z.string().min(1, "Display name is required").max(40, "Display name must be 1-40 characters"),
});

export type SignUpInput = z.infer<typeof SignUpSchema>;

/**
 * POST /api/auth/forgot-password
 * Request a password reset link via email
 */
export const ForgotPasswordSchema = z.object({
  email: z.string().email("Invalid email format"),
});

export type ForgotPasswordInput = z.infer<typeof ForgotPasswordSchema>;

/**
 * POST /api/auth/reset-password
 * Reset password using the token from email link
 */
export const ResetPasswordSchema = z.object({
  newPassword: z.string().min(6, "Password must be at least 6 characters"),
});

export type ResetPasswordInput = z.infer<typeof ResetPasswordSchema>;

/**
 * POST /api/auth/refresh-token
 * Refresh access token using refresh token
 */
export const RefreshTokenSchema = z.object({
  refreshToken: z.string().min(1, "Refresh token is required"),
});

export type RefreshTokenInput = z.infer<typeof RefreshTokenSchema>;

/**
 * POST /api/auth/exchange-code
 * Exchange tokens from password reset email for session
 */
export const ExchangeCodeSchema = z.object({
  accessToken: z.string().min(1, "Access token is required"),
  refreshToken: z.string().min(1, "Refresh token is required"),
});

export type ExchangeCodeInput = z.infer<typeof ExchangeCodeSchema>;
