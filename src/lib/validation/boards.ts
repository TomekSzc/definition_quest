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

// NEW CODE: Validation schema for explicitly creating a board with pre-defined pairs
// Business rules (mirrors CreateBoardCmd docs):
// • title: 1–255 characters
// • cardCount: 16 or 24 (represents size of a single level)
// • pairs: 1–100 unique term/definition objects, each field 1–255 chars
// • pairs.length may exceed cardCount/2 (they will be sliced into multiple levels)
// • isPublic: boolean flag (default handled server-side)
// • tags: optional array ≤ 10 items, each 1–20 chars, unique
export const CreateBoardSchema = z.object({
  title: z
    .string()
    .min(1, "Title must be at least 1 character")
    .max(255, "Title must not exceed 255 characters")
    .trim(),

  cardCount: z.union([z.literal(16), z.literal(24)], {
    errorMap: () => ({ message: "cardCount must be either 16 or 24" }),
  }),

  pairs: z
    .array(
      z.object({
        term: z
          .string()
          .min(1, "Term must be at least 1 character")
          .max(255, "Term must not exceed 255 characters")
          .trim(),
        definition: z
          .string()
          .min(1, "Definition must be at least 1 character")
          .max(255, "Definition must not exceed 255 characters")
          .trim(),
      })
    )
    .min(1, "At least one pair is required")
    .max(100, "A maximum of 100 pairs can be supplied"),

  isPublic: z.boolean({
    required_error: "isPublic field is required",
    invalid_type_error: "isPublic must be a boolean",
  }),

  tags: z
    .array(
      z
        .string()
        .min(1, "Tags cannot be empty")
        .max(20, "Each tag must not exceed 20 characters")
        .trim()
    )
    .max(10, "A maximum of 10 tags are allowed")
    .optional(),
}).refine((data) => {
  // Ensure term uniqueness (case-insensitive)
  const terms = data.pairs.map((p) => p.term.toLowerCase());
  return new Set(terms).size === terms.length;
}, {
  message: "Each pair term must be unique",
  path: ["pairs"],
});

export type CreateBoardInput = z.infer<typeof CreateBoardSchema>;

