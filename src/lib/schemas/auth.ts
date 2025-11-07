import { z } from "zod";
import { SignUpSchema } from "../validation/auth";

// Extend backend SignUpSchema to include repeatPassword for client-side confirmation
export const ClientSignUpSchema = SignUpSchema.extend({
  repeatPassword: z.string().min(6, "Password must be at least 6 characters"),
}).refine((data) => data.password === data.repeatPassword, {
  path: ["repeatPassword"],
  message: "Passwords do not match",
});
