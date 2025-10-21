/**
 * Shared utilities for API responses.
 * These helpers ensure consistent response formats across all endpoints.
 */

import type { ZodError } from "zod";

/**
 * Maps business error codes to HTTP responses.
 * 
 * @param errorCode - Error code from business logic
 * @returns Object with response body and status code, or null if not mapped
 */
export function getErrorMapping(errorCode: string): { response: Record<string, unknown>; status: number } | null {
  const errorMap: Record<string, { response: Record<string, unknown>; status: number }> = {
    QUOTA_EXCEEDED: {
      response: {
        error: "quota_exceeded",
        message: "Daily AI generation limit reached. Try again tomorrow.",
      },
      status: 429,
    },
    INPUT_TEXT_TOO_LONG: {
      response: {
        error: "input_too_long",
        message: "Input text exceeds 5,000 character limit.",
      },
      status: 400,
    },
    INPUT_TEXT_EMPTY: {
      response: {
        error: "input_empty",
        message: "Input text cannot be empty.",
      },
      status: 400,
    },
    INVALID_CARD_COUNT: {
      response: {
        error: "invalid_card_count",
        message: "Card count must be 16 or 24.",
      },
      status: 400,
    },
    DUPLICATE_BOARD: {
      response: {
        error: "duplicate_board",
        message: "A board with the same title and level already exists.",
      },
      status: 409,
    },
    INVALID_INPUT: {
      response: {
        error: "invalid_input",
        message: "Request body validation failed.",
      },
      status: 400,
    },
    BOARD_NOT_FOUND: {
      response: {
        error: "board_not_found",
        message: "Board does not exist or access denied.",
      },
      status: 404,
    },
    BOARD_PRIVATE: {
      response: {
        error: "board_private",
        message: "This board is private and you are not the owner.",
      },
      status: 401,
    },
    NOT_OWNER: {
      response: {
        error: "not_owner",
        message: "You are not the owner of this board.",
      },
      status: 401,
    },
    BOARD_ARCHIVED: {
      response: {
        error: "board_archived",
        message: "Board is archived and cannot be modified.",
      },
      status: 400,
    },
    UNAUTHORIZED: {
      response: {
        error: "unauthorized",
        message: "Authentication required.",
      },
      status: 401,
    },
    SERVER_ERROR: {
      response: {
        error: "server_error",
        message: "Internal server error.",
      },
      status: 500,
    },
    VALIDATION_FAILED: {
      response: {
        error: "validation_failed",
        message: "Request validation failed.",
      },
      status: 400,
    },
  };

  return errorMap[errorCode] || null;
}

/**
 * Formats Zod validation errors into a consistent format.
 * 
 * @param zodError - Zod validation error object
 * @returns Array of formatted error objects with field and message
 */
export function formatValidationErrors(zodError: ZodError) {
  return zodError.errors.map((e) => ({
    field: e.path.join("."),
    message: e.message,
  }));
}

/**
 * Helper function to create consistent error responses.
 * 
 * @param response - Error response body (object or string)
 * @param status - HTTP status code
 * @param headers - Optional headers (defaults to JSON content type)
 * @returns Response object
 */
export function createErrorResponse(
  response: Record<string, unknown> | string,
  status: number,
  headers?: HeadersInit
): Response {
  const body = typeof response === "string" ? { error: response } : response;
  const defaultHeaders = { "Content-Type": "application/json" };
  
  return new Response(
    JSON.stringify(body),
    {
      status,
      headers: headers || defaultHeaders,
    }
  );
}

/**
 * Helper function to create consistent success responses.
 * 
 * @param data - Response data
 * @param status - HTTP status code (defaults to 200)
 * @param headers - Optional headers (defaults to JSON content type)
 * @returns Response object
 */
export function createSuccessResponse(
  data: unknown,
  status: number = 200,
  headers?: HeadersInit
): Response {
  const defaultHeaders = { "Content-Type": "application/json" };
  
  return new Response(
    JSON.stringify(data),
    {
      status,
      headers: headers || defaultHeaders,
    }
  );
}

