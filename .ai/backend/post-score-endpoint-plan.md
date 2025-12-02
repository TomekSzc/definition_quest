# API Endpoint Implementation Plan: Submit Board Score (`POST/PATCH /boards/:boardId/scores`)

## 1. Przegląd punktu końcowego

Punkt końcowy pozwala zalogowanemu użytkownikowi **zapisać** czas ukończenia gry w milisekundach dla wskazanej tablicy. Dla MVP przechowujemy **wyłącznie ostatni zgłoszony czas** – każdorazowe wywołanie nadpisuje poprzednią wartość.

**Implementacja obsługuje zarówno POST, jak i PATCH** przez współdzieloną funkcję `handleUpsert`, różniąc się jedynie semantyką kodów HTTP:

- **POST**: zwraca `201` dla nowego rekordu, `200` dla aktualizacji
- **PATCH**: zawsze zwraca `200` (semantyka idempotentna)

## 2. Szczegóły żądania

- **Metoda HTTP:** `POST` lub `PATCH`
- **URL:** `/boards/:boardId/scores`
  - `:boardId` (`uuid`) – identyfikator tablicy – wymagany
- **Request Body (JSON):**

  ```jsonc
  { "elapsedMs": 93400 }
  ```

  - `elapsedMs` `number` > 0 – czas w milisekundach – wymagany

- **Nagłówki:**
  - `Authorization: Bearer <JWT>` — token Supabase (wymagany)

## 3. Wykorzystywane typy

- **Command Model**: `ScoreSubmitCmd` (zdefiniowany w `src/types.ts`)
  ```ts
  export interface ScoreSubmitCmd {
    elapsedMs: number; // validated > 0 on server
  }
  ```
- **Validation Schema**: `SubmitScoreSchema` (z `src/lib/validation/scores.ts`)
- **DTO Odpowiedzi** (inline):
  ```ts
  {
    id: string; // uuid rekordu w scores
    elapsedMs: number;
  }
  ```

## 4. Szczegóły odpowiedzi

| Kod | Scenariusz                            | Body                                | Uwagi                                  |
| --- | ------------------------------------- | ----------------------------------- | -------------------------------------- |
| 201 | Rekord utworzony (POST)               | `{ id: string, elapsedMs: number }` | Tylko POST zwraca 201 dla nowych       |
| 200 | Rekord zaktualizowany (POST/PATCH)    | `{ id: string, elapsedMs: number }` | POST dla update; PATCH zawsze          |
| 400 | Błędne dane wejściowe                 | `{ error: "INVALID_INPUT", ... }`   | Szczegóły walidacji w `details`        |
| 400 | Błędny JSON                           | `{ error: "INVALID_JSON" }`         | Body nie jest poprawnym JSON           |
| 400 | Błędny boardId                        | `{ error: "INVALID_BOARD_ID" }`     | Brak parametru boardId                 |
| 401 | Brak / nieważny JWT                   | `{ error: "UNAUTHORIZED" }`         | Brak `locals.user`                     |
| 404 | Tablica nie istnieje lub brak dostępu | `{ error: "BOARD_NOT_FOUND" }`      | Board nieistnieje lub prywatny         |
| 500 | Inny błąd serwera                     | `{ error: "SERVER_ERROR" }`         | Nieobsłużony błąd lub błąd bazy danych |

## 5. Przepływ danych

1. **Route** `src/pages/api/boards/[boardId]/scores.ts` eksportuje `POST` i `PATCH`, oba wywołują `handleUpsert(ctx, method)`.

2. **handleUpsert**:
   - Pobiera `boardId` z params, sprawdza czy istnieje ⇒ `400` jeśli brak.
   - Pobiera `user` z `locals`. Brak użytkownika ⇒ `401`.
   - Parsuje JSON body ⇒ `400` (`INVALID_JSON`) w przypadku błędu.
   - Waliduje przez `SubmitScoreSchema.safeParse(body)`:
     - Niepowodzenie ⇒ `ValidationError` z detalami (`formatValidationErrors`).
   - Wywołuje `upsertScore(supabase, userId, boardId, elapsedMs)`.
   - Określa status HTTP:
     - **POST**: `201` jeśli `result.isNew === true`, `200` w przeciwnym razie.
     - **PATCH**: zawsze `200`.
   - Zwraca `createSuccessResponse({ id, elapsedMs }, status)`.

3. **upsertScore** (serwis w `src/lib/services/score.service.ts`):
   - **Krok 1**: Sprawdza istnienie i dostępność tablicy:
     ```ts
     const { data: boardRow } = await supabase
       .from("boards")
       .select("id, owner_id, is_public")
       .eq("id", boardId)
       .maybeSingle();
     ```

     - Brak rekordu ⇒ `throw new Error("BOARD_NOT_FOUND")`.
     - Jeśli tablica prywatna (`!is_public`) i `owner_id !== userId` ⇒ `throw new Error("BOARD_NOT_FOUND")`.
   - **Krok 2**: Sprawdza czy istnieje score dla pary (user, board):
     ```ts
     const { data: existingScore } = await supabase
       .from("scores")
       .select("id")
       .eq("user_id", userId)
       .eq("board_id", boardId)
       .maybeSingle();
     ```

     - Jeśli istnieje, używa jego `id`; w przeciwnym razie generuje nowe UUID.
   - **Krok 3**: Wykonuje upsert:
     ```ts
     const { data: upserted } = await supabase
       .from("scores")
       .upsert(
         {
           id: newId,
           user_id: userId,
           board_id: boardId,
           elapsed_ms: elapsedMs,
         },
         {
           onConflict: "user_id,board_id",
           ignoreDuplicates: false,
         }
       )
       .select("id, elapsed_ms")
       .single();
     ```
   - **Zwraca**: `{ id, elapsedMs, isNew: !existingScore }`.

## 6. Względy bezpieczeństwa

- **Uwierzytelnienie:** JWT Supabase weryfikowany przez middleware Astro (`locals.user`).
- **Autoryzacja:**
  - **Warstwa aplikacji**: Serwis `upsertScore` jawnie sprawdza:
    - Czy tablica istnieje.
    - Czy tablica jest publiczna (`is_public = true`) **lub** użytkownik jest właścicielem (`owner_id = userId`).
  - **RLS (Row-Level Security)**:
    - `boards` – polityka SELECT dla publicznych tablic lub właściciela.
    - `scores` – polityka INSERT/UPDATE ograniczona do własnych rekordów użytkownika (constraint `user_id = auth.uid()`).
- **Walidacja:** Schemat `SubmitScoreSchema` (zod) wymusza:
  - `elapsedMs` jest liczbą całkowitą większą od 0.
- **Ochrona przed IDOR**: Użytkownik może zapisać score tylko dla siebie (user_id pochodzi z JWT, nie z body).

## 7. Obsługa błędów

Implementacja wykorzystuje dedykowane klasy błędów (`HttpError`, `ValidationError`) oraz utility `getErrorMapping`:

| Błąd                        | Detekcja                            | Kod | Szczegóły                                             |
| --------------------------- | ----------------------------------- | --- | ----------------------------------------------------- |
| Błędny boardId              | `!params.boardId`                   | 400 | `HttpError("invalid_board_id")`                       |
| Nieautoryzowany             | `!locals.user`                      | 401 | `HttpError("unauthorized")`                           |
| Błędny JSON                 | `request.json()` throw              | 400 | `HttpError("invalid_json")`                           |
| Błędne body (walidacja)     | `SubmitScoreSchema.safeParse` fail  | 400 | `ValidationError` z `formatValidationErrors(zod.err)` |
| Tablica nie istnieje        | `!boardRow` w serwisie              | 404 | `throw new Error("BOARD_NOT_FOUND")` → mapped to 404  |
| Brak dostępu (prywatna)     | `!is_public && owner_id !== userId` | 404 | `throw new Error("BOARD_NOT_FOUND")` → mapped to 404  |
| Błąd DB (checking existing) | `existingError` w serwisie          | 500 | `throw new Error("SERVER_ERROR")` → mapped to 500     |
| Błąd DB (upsert)            | `upsertError` w serwisie            | 500 | `throw new Error("SERVER_ERROR")` → mapped to 500     |
| Inny nieobsłużony błąd      | Catch-all w route                   | 500 | Zwraca `{ error: "SERVER_ERROR" }`                    |

**Struktura obsługi błędów w route**:

```ts
try {
  // ... business logic
} catch (error) {
  if (error instanceof HttpError) {
    return createErrorResponse(error.response || error.message, error.status);
  }
  if (error instanceof Error) {
    const mapped = getErrorMapping(error.message);
    if (mapped) {
      return createErrorResponse(mapped.response, mapped.status);
    }
  }
  return createErrorResponse({ error: "SERVER_ERROR" }, 500);
}
```

## 8. Rozważania dotyczące wydajności

- **Upsert** wykonuje aktualizację/insert w pojedynczym zapytaniu.
- **Trade-off**: Dodatkowe zapytanie SELECT sprawdzające istniejący score (dla określenia `isNew`):
  - Potrzebne do zwrócenia odpowiedniego kodu HTTP dla POST (`201` vs `200`).
  - PATCH zawsze zwraca `200`, więc dla PATCH można rozważyć pominięcie tego kroku (obecnie nie jest optymalizowane).
- **Indeksy**:
  - Unikalny constraint `(user_id, board_id)` w tabeli `scores` zapewnia szybkie wyszukiwanie i zapobiega duplikatom.
  - Indeks na `board_id` w `boards` dla szybkiej weryfikacji istnienia.
- **Minimalizacja round-tripów**: Wszystkie operacje DB wykonywane sekwencyjnie, ale możliwa optymalizacja dla PATCH (pominięcie sprawdzania istniejącego rekordu).

## 9. Etapy wdrożenia (zrealizowane)

1. ✅ **Validation schema** `src/lib/validation/scores.ts`:
   - `SubmitScoreSchema` waliduje `elapsedMs` jako dodatni integer.

2. ✅ **Service** `src/lib/services/score.service.ts`:
   - Funkcja `upsertScore(supabase, userId, boardId, elapsedMs)`:
     - Weryfikuje istnienie i dostępność tablicy.
     - Sprawdza istniejący score (dla określenia `isNew`).
     - Wykonuje upsert z pre-generowanym UUID.
     - Zwraca `{ id, elapsedMs, isNew }`.

3. ✅ **API Route** `src/pages/api/boards/[boardId]/scores.ts`:
   - Eksportuje **POST** i **PATCH** przez współdzieloną funkcję `handleUpsert`.
   - POST: zwraca `201` dla nowego, `200` dla aktualizacji.
   - PATCH: zawsze zwraca `200` (semantyka idempotentna).
   - Wykorzystuje `HttpError`, `ValidationError`, i utility z `api-response.ts`.

4. ✅ **Command Model & DTO** w `src/types.ts`:
   - `ScoreSubmitCmd` zdefiniowany.
   - Response inline: `{ id: string, elapsedMs: number }`.

5. **Frontend**: wysyła `POST` lub `PATCH`; otrzymuje zwrotnie ostatni zapisany czas.

6. **Przyszłość**:
   - Dodać kolumnę `best_elapsed_ms` dla przechowywania najlepszego czasu (obecnie tylko ostatni).
   - Rozbudować logikę leaderboard (sortowanie po najlepszym czasie).
