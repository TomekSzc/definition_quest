import { z } from "zod";

/**
 * Validation schema for generating a board from raw text using AI.
 * Enforces business rules:
 * - title: 1–120 characters
 * - inputText: ≤ 5,000 characters
 * - cardCount: exactly 16 or 24
 * - tags: optional, max 10 items, each ≤ 20 characters
 */
export const GenerateBoardSchema = z.object({
  title: z
    .string()
    .min(1, "Title must be at least 1 character")
    .max(120, "Title must not exceed 120 characters")
    .trim(),
  
  inputText: z
    .string()
    .min(1, "Input text cannot be empty")
    .max(5000, "Input text must not exceed 5,000 characters"),
  
  cardCount: z
    .union([z.literal(16), z.literal(24)], {
      errorMap: () => ({ message: "Card count must be either 16 or 24" }),
    }),
  
  isPublic: z.boolean({
    required_error: "isPublic field is required",
    invalid_type_error: "isPublic must be a boolean",
  }),
  
  tags: z
    .array(
      z
        .string()
        .max(20, "Each tag must not exceed 20 characters")
        .trim()
    )
    .max(10, "Maximum 10 tags allowed")
    .optional(),
});

export type GenerateBoardInput = z.infer<typeof GenerateBoardSchema>;

