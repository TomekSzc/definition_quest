# Przewodnik po Middleware Uwierzytelniania

## Przegląd

Middleware uwierzytelniania automatycznie obsługuje walidację JWT dla wszystkich endpointów API, z wyjątkiem tych jawnie oznaczonych jako publiczne (logowanie, rejestracja).

## Jak to działa

### 1. **Automatyczne uwierzytelnianie**

Wszystkie endpointy pod `/api/*` są automatycznie chronione, z wyjątkiem tych wymienionych w `PUBLIC_ENDPOINTS`.

```typescript
// src/middleware/index.ts
const PUBLIC_ENDPOINTS = [
  "/api/auth/signIn.temporary",
  "/api/auth/login.temporary",
  // Dodaj tutaj inne publiczne endpointy
];
```

### 2. **Użytkownik dostępny w Locals**

Uwierzytelniony użytkownik jest automatycznie dodawany do `context.locals.user`:

```typescript
export const POST: APIRoute = async ({ locals }) => {
  // Użytkownik jest już uwierzytelniony przez middleware
  const user = locals.user;

  if (!user) {
    return createErrorResponse("Unauthorized", 401);
  }

  // Użyj user.id bezpośrednio
  const result = await someService(locals.supabase, user.id);

  return createSuccessResponse(result);
};
```

### 3. **Brak potrzeby ręcznych sprawdzeń autoryzacji**

❌ **STARY SPOSÓB** (przed middleware):

```typescript
export const POST: APIRoute = async ({ request, locals }) => {
  // Ręczne sprawdzenie uwierzytelnienia
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

  // ... reszta kodu
};
```

✅ **NOWY SPOSÓB** (z middleware):

```typescript
export const POST: APIRoute = async ({ locals }) => {
  const user = locals.user;

  if (!user) {
    return createErrorResponse("Unauthorized", 401);
  }

  // ... reszta kodu
};
```

## Dodawanie publicznych endpointów

Aby uczynić endpoint publicznym (dostępnym bez uwierzytelnienia):

```typescript
// src/middleware/index.ts
const PUBLIC_ENDPOINTS = [
  "/api/auth/signIn.temporary",
  "/api/auth/login.temporary",
  "/api/boards", // Przykład: publiczna lista tablic
  // Dodaj tutaj swój endpoint
];
```

## Używanie współdzielonych funkcji pomocniczych odpowiedzi

Importuj z `src/lib/utils/api-response.ts`:

### Odpowiedzi błędów

```typescript
import { createErrorResponse, getErrorMapping } from "../../../../lib/utils/api-response";

// Prosty błąd
return createErrorResponse("Not found", 404);

// Złożony obiekt błędu
return createErrorResponse(
  {
    error: "validation_failed",
    details: [{ field: "email", message: "Invalid format" }],
  },
  400
);

// Mapowanie błędów biznesowych
if (error instanceof Error) {
  const errorMapping = getErrorMapping(error.message);
  if (errorMapping) {
    return createErrorResponse(errorMapping.response, errorMapping.status);
  }
}
```

### Odpowiedzi sukcesu

```typescript
import { createSuccessResponse } from "../../../../lib/utils/api-response";

// Prosty sukces (200 OK)
return createSuccessResponse({ id: "123", name: "Board" });

// Niestandardowy kod statusu (201 Created)
return createSuccessResponse({ id: "123" }, 201);

// Niestandardowe nagłówki
return createSuccessResponse({ data: "..." }, 200, { "Cache-Control": "max-age=3600" });
```

## Przykład: Kompletny chroniony endpoint

```typescript
import type { APIRoute } from "astro";
import { createErrorResponse, createSuccessResponse } from "../../../../lib/utils/api-response";
import { myService } from "../../../../lib/services/my.service";

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // 1. Użytkownik jest już uwierzytelniony przez middleware
    const user = locals.user;

    if (!user) {
      return createErrorResponse("Unauthorized", 401);
    }

    // 2. Parsuj i waliduj żądanie
    const body = await request.json();

    // ... logika walidacji

    // 3. Wykonaj logikę biznesową
    const result = await myService(locals.supabase, user.id, body);

    // 4. Zwróć sukces
    return createSuccessResponse(result);
  } catch (error) {
    console.error("Error in endpoint:", error);
    return createErrorResponse("Internal server error", 500);
  }
};
```

## Bezpieczeństwo typów

`user` jest właściwie otypowany w `src/env.d.ts`:

```typescript
import type { User } from "@supabase/supabase-js";

declare global {
  namespace App {
    interface Locals {
      supabase: SupabaseClient<Database>;
      user?: User; // Uwierzytelniony użytkownik (dostępny w chronionych endpointach)
    }
  }
}
```

## Korzyści

✅ **DRY**: Brak powtarzania logiki uwierzytelniania w każdym endpoincie  
✅ **Spójność**: Takie samo sprawdzenie uwierzytelnienia wszędzie  
✅ **Bezpieczeństwo typów**: Użytkownik właściwie otypowany w locals  
✅ **Łatwość utrzymania**: Logika uwierzytelniania w jednym miejscu  
✅ **Elastyczność**: Łatwe dodawanie/usuwanie publicznych endpointów  
✅ **Czystość**: Endpointy skupiają się na logice biznesowej
