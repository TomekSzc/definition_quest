import { z } from "zod";

/**
 * Validation schema for partially updating a term/definition pair.
 * At least one of the two fields must be present.
 */
export const PatchPairSchema = z
  .object({
    term: z
      .string()
      .min(1, "Term must be at least 1 character")
      .max(255, "Term must not exceed 255 characters")
      .trim()
      .optional(),
    definition: z
      .string()
      .min(1, "Definition must be at least 1 character")
      .max(255, "Definition must not exceed 255 characters")
      .trim()
      .optional(),
  })
  .refine((data) => data.term !== undefined || data.definition !== undefined, {
    message: "At least one of term or definition must be provided",
    path: ["root"],
  });

export type PatchPairInput = z.infer<typeof PatchPairSchema>;

export const CreatePairSchema = z.object({
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
});

export type CreatePairInput = z.infer<typeof CreatePairSchema>;