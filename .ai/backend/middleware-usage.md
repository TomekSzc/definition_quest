# Authentication Middleware Guide

## Overview

The authentication middleware automatically handles JWT validation for all API endpoints, except those explicitly marked as public (sign-in, sign-up).

## How It Works

### 1. **Automatic Authentication**

All endpoints under `/api/*` are automatically protected, except those listed in `PUBLIC_ENDPOINTS`.

```typescript
// src/middleware/index.ts
const PUBLIC_ENDPOINTS = [
  "/api/auth/signIn.temporary",
  "/api/auth/login.temporary",
  // Add other public endpoints here
];
```

### 2. **User Available in Locals**

Authenticated user is automatically added to `context.locals.user`:

```typescript
export const POST: APIRoute = async ({ locals }) => {
  // User is already authenticated by middleware
  const user = locals.user;

  if (!user) {
    return createErrorResponse("Unauthorized", 401);
  }

  // Use user.id directly
  const result = await someService(locals.supabase, user.id);

  return createSuccessResponse(result);
};
```

### 3. **No Manual Auth Checks Needed**

❌ **OLD WAY** (before middleware):

```typescript
export const POST: APIRoute = async ({ request, locals }) => {
  // Manual authentication check
  const {
    data: { user },
    error: authError,
  } = await locals.supabase.auth.getUser();

  if (authError || !user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  // ... rest of code
};
```

✅ **NEW WAY** (with middleware):

```typescript
export const POST: APIRoute = async ({ locals }) => {
  const user = locals.user;

  if (!user) {
    return createErrorResponse("Unauthorized", 401);
  }

  // ... rest of code
};
```

## Adding Public Endpoints

To make an endpoint public (accessible without authentication):

```typescript
// src/middleware/index.ts
const PUBLIC_ENDPOINTS = [
  "/api/auth/signIn.temporary",
  "/api/auth/login.temporary",
  "/api/boards", // Example: public boards listing
  // Add your endpoint here
];
```

## Using Shared Response Helpers

Import from `src/lib/utils/api-response.ts`:

### Error Responses

```typescript
import { createErrorResponse, getErrorMapping } from "../../../../lib/utils/api-response";

// Simple error
return createErrorResponse("Not found", 404);

// Complex error object
return createErrorResponse(
  {
    error: "validation_failed",
    details: [{ field: "email", message: "Invalid format" }],
  },
  400
);

// Business error mapping
if (error instanceof Error) {
  const errorMapping = getErrorMapping(error.message);
  if (errorMapping) {
    return createErrorResponse(errorMapping.response, errorMapping.status);
  }
}
```

### Success Responses

```typescript
import { createSuccessResponse } from "../../../../lib/utils/api-response";

// Simple success (200 OK)
return createSuccessResponse({ id: "123", name: "Board" });

// Custom status code (201 Created)
return createSuccessResponse({ id: "123" }, 201);

// Custom headers
return createSuccessResponse({ data: "..." }, 200, { "Cache-Control": "max-age=3600" });
```

## Example: Complete Protected Endpoint

```typescript
import type { APIRoute } from "astro";
import { createErrorResponse, createSuccessResponse } from "../../../../lib/utils/api-response";
import { myService } from "../../../../lib/services/my.service";

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // 1. User is already authenticated by middleware
    const user = locals.user;

    if (!user) {
      return createErrorResponse("Unauthorized", 401);
    }

    // 2. Parse and validate request
    const body = await request.json();

    // ... validation logic

    // 3. Execute business logic
    const result = await myService(locals.supabase, user.id, body);

    // 4. Return success
    return createSuccessResponse(result);
  } catch (error) {
    console.error("Error in endpoint:", error);
    return createErrorResponse("Internal server error", 500);
  }
};
```

## Type Safety

The `user` is properly typed in `src/env.d.ts`:

```typescript
import type { User } from "@supabase/supabase-js";

declare global {
  namespace App {
    interface Locals {
      supabase: SupabaseClient<Database>;
      user?: User; // Authenticated user (available in protected endpoints)
    }
  }
}
```

## Benefits

✅ **DRY**: No repeated auth logic in every endpoint  
✅ **Consistent**: Same auth check everywhere  
✅ **Type-safe**: User properly typed in locals  
✅ **Maintainable**: Auth logic in one place  
✅ **Flexible**: Easy to add/remove public endpoints  
✅ **Clean**: Endpoints focus on business logic
