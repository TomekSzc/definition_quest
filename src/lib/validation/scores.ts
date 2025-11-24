import { z } from "zod";

/**
 * Validation schema for submitting a board score (elapsed time in ms).
 * Business rules:
 *  - elapsedMs must be a positive integer (> 0)
 */
export const SubmitScoreSchema = z.object({
  elapsedMs: z
    .number({ required_error: "elapsedMs is required" })
    .int("elapsedMs must be an integer")
    .positive("elapsedMs must be greater than 0"),
});

export type SubmitScoreInput = z.infer<typeof SubmitScoreSchema>;
