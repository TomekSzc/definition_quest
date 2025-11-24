import { z } from "zod";

/**
 * Schema for POST /boards/level
 * Ensures:
 * • boardId is uuid
 * • pairs length 1-12 (for 16|24 cards => 8|12 pairs) – actual equality to cardCount/2 checked in service
 * • term uniqueness (case-insens.)
 */
export const CreateNextLevelSchema = z
  .object({
    boardId: z.string().uuid(),
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
      .max(12, "A maximum of 12 pairs are allowed"),
  })
  .refine(
    (data) => {
      const terms = data.pairs.map((p) => p.term.toLowerCase());
      return new Set(terms).size === terms.length;
    },
    {
      message: "Each pair term must be unique",
      path: ["pairs"],
    }
  );

export type CreateNextLevelInput = z.infer<typeof CreateNextLevelSchema>;
