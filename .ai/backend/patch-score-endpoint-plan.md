# API Endpoint Implementation Plan: Update Board Score (`PATCH /boards/:boardId/scores`)

## 1. Przegląd punktu końcowego

Punkt końcowy pozwala zalogowanemu użytkownikowi **ustawić** lub **zaktualizować** czas ukończenia gry w milisekundach dla wskazanej tablicy. PATCH ma semantykę "modyfikuj istniejący zasób", ale w naszym przypadku zachowuje się jak _upsert_: jeśli rekord jeszcze nie istnieje – zostanie utworzony.

W odróżnieniu od `POST` nie zwraca statusu 201 – zawsze 200 OK, niezależnie od tego, czy nastąpiło wstawienie, czy aktualizacja.

## 2. Szczegóły żądania

- **Metoda HTTP:** `PATCH`
- **URL:** `/boards/:boardId/scores`
  - `:boardId` (`uuid`) – identyfikator tablicy – wymagany (sprawdzane przez endpoint)
- **Request Body (JSON):**

  ```jsonc
  { "elapsedMs": 93400 }
  ```

  - `elapsedMs` `number` – liczba całkowita > 0 – czas w milisekundach – wymagany

- **Nagłówki:**
  - `Authorization: Bearer <JWT>` — token Supabase (wymagany)

## 3. Wykorzystywane typy

- **Command Model**: `ScoreSubmitCmd` (z `src/types.ts`)
  ```ts
  export interface ScoreSubmitCmd {
    elapsedMs: number; // validated > 0 on server
  }
  ```
- **Schemat walidacji**: `SubmitScoreSchema` (z `src/lib/validation/scores.ts`)
  - Waliduje `elapsedMs` jako dodatnią liczbę całkowitą
- **Odpowiedź** (inline object, nie dedykowany typ DTO):
  ```ts
  {
    id: string; // uuid rekordu w scores
    elapsedMs: number;
  }
  ```

## 4. Szczegóły odpowiedzi

| Kod | Scenariusz                              | Body                                                 |
| --- | --------------------------------------- | ---------------------------------------------------- |
| 200 | Rekord utworzony **lub** zaktualizowany | `{ id: string, elapsedMs: number }`                  |
| 400 | Brak boardId w params                   | `{ error: "INVALID_BOARD_ID" }`                      |
| 400 | Niepoprawny JSON w body                 | `{ error: "INVALID_JSON" }`                          |
| 400 | Błędne dane wejściowe (walidacja Zod)   | `{ error: "invalid_input", details: [...] }`         |
| 401 | Brak / nieważny JWT                     | `{ error: "unauthorized", message: "..." }`          |
| 404 | Tablica nie istnieje lub brak dostępu   | `{ error: "board_not_found", message: "..." }`       |
| 500 | Inny błąd serwera                       | `{ error: "server_error", message: "..." }`          |

## 5. Przepływ danych

### Route `src/pages/api/boards/[boardId]/scores.ts`

1. **Funkcja wspólna `handleUpsert`** obsługuje obie metody `POST` i `PATCH`:
   - Parametr `httpMethod: "POST" | "PATCH"` określa sposób zwracania kodu statusu

2. **Walidacja parametrów i użytkownika**:
   ```ts
   if (!boardId) throw new HttpError("invalid_board_id", 400, { error: "INVALID_BOARD_ID" });
   if (!user) throw new HttpError("unauthorized", 401, { error: "UNAUTHORIZED" });
   ```

3. **Parsowanie i walidacja body**:
   ```ts
   const body = await request.json().catch(() => undefined);
   if (!body) throw new HttpError("invalid_json", 400, { error: "INVALID_JSON" });
   
   const parseResult = SubmitScoreSchema.safeParse(body);
   if (!parseResult.success) {
     const details = formatValidationErrors(parseResult.error);
     throw new ValidationError("invalid_input", details);
   }
   ```

4. **Wywołanie serwisu**:
   ```ts
   const result = await upsertScore(locals.supabase, user.id, boardId, elapsedMs);
   // result: { id: string, elapsedMs: number, isNew: boolean }
   ```

5. **Logika serwisu `upsertScore`** (`src/lib/services/score.service.ts`):
   - Sprawdza istnienie i dostępność tablicy (publiczna LUB użytkownik jest właścicielem)
   - Sprawdza czy rekord score już istnieje dla pary (user_id, board_id)
   - Generuje nowy UUID lub używa istniejącego
   - Wykonuje upsert z `onConflict: "user_id,board_id"`
   - Zwraca `{ id, elapsedMs, isNew }`

6. **Ustalenie kodu statusu**:
   ```ts
   let status: number;
   if (httpMethod === "POST") {
     status = result.isNew ? 201 : 200;
   } else {
     // PATCH – 200 OK for both insert & update (idempotent semantics)
     status = 200;
   }
   ```

7. **Odpowiedź**: `createSuccessResponse({ id: result.id, elapsedMs: result.elapsedMs }, status)`

## 6. Względy bezpieczeństwa

- **Uwierzytelnienie:** 
  - JWT Supabase sprawdzany przez middleware Astro
  - Użytkownik dostępny przez `locals.user`
  - Brak użytkownika → 401 UNAUTHORIZED

- **Autoryzacja:**
  - Serwis `upsertScore` sprawdza dostęp do tablicy w warstwie aplikacji:
    - Tablica musi istnieć (`boards.id`)
    - Dostęp mają: właściciel ALBO tablica jest publiczna (`is_public=true`)
  - Polityki RLS na `scores`:
    - `owner_full_access` – użytkownik może INSERT/UPDATE tylko swoich rekordów
    - Constraint `(user_id, board_id)` zapewnia unikalne wyniki per użytkownik per tablica

- **Walidacja:**
  - `SubmitScoreSchema` (Zod) – `elapsedMs` musi być dodatnią liczbą całkowitą
  - Walidacja boardId (nie może być pusty)
  - Walidacja poprawności JSON body

## 7. Obsługa błędów

| Błąd                         | Detekcja                              | Klasa / Kod biznesowy | Kod HTTP |
| ---------------------------- | ------------------------------------- | --------------------- | -------- |
| Brak boardId                 | `!boardId`                            | `HttpError`           | 400      |
| Nieautoryzowany              | `!user`                               | `HttpError`           | 401      |
| Niepoprawny JSON             | `request.json()` fail                 | `HttpError`           | 400      |
| Błędne body (walidacja Zod)  | `SubmitScoreSchema.safeParse` fail    | `ValidationError`     | 400      |
| Tablica nie istnieje         | Serwis: query `boards` empty          | `Error("BOARD_NOT_FOUND")` | 404      |
| Brak dostępu do prywatnej    | Serwis: nie owner i !is_public        | `Error("BOARD_NOT_FOUND")` | 404      |
| Błąd DB                      | `error` z Supabase                    | `Error("SERVER_ERROR")`    | 500      |

**Przepływ obsługi błędów w catch**:
1. `error instanceof HttpError` → zwraca `error.response` i `error.status`
2. `error instanceof Error` → próbuje `getErrorMapping(error.message)` dla błędów biznesowych
3. Default → zwraca `{ error: "SERVER_ERROR" }` z kodem 500

## 8. Rozważania dotyczące wydajności

- Serwis wykonuje **3 zapytania DB**:
  1. SELECT z `boards` (weryfikacja istnienia i dostępu)
  2. SELECT z `scores` (sprawdzenie czy rekord istnieje – dla statusu `isNew`)
  3. UPSERT do `scores` z `onConflict: "user_id,board_id"`
- Indeksy `(user_id, board_id)` w tabeli `scores` zapewniają wydajność upsert
- Constraint unikalny `(user_id, board_id)` zapewnia, że jeden użytkownik ma tylko jeden wynik dla danej tablicy

## 9. Status wdrożenia

✅ **Zaimplementowano w pełni**

### Zrealizowane komponenty:

1. **Route** `src/pages/api/boards/[boardId]/scores.ts`:
   - Wspólna funkcja `handleUpsert` dla POST i PATCH
   - Eksporty: `export const POST: APIRoute` i `export const PATCH: APIRoute`

2. **Serwis** `src/lib/services/score.service.ts`:
   - Funkcja `upsertScore` z pełną logiką biznesową
   - Weryfikacja dostępu do tablicy
   - Sprawdzanie istnienia rekordu dla zwracania `isNew`

3. **Walidacja** `src/lib/validation/scores.ts`:
   - Schema `SubmitScoreSchema` z Zod
   - Waliduje `elapsedMs` jako dodatnią liczbę całkowitą

4. **Typy** `src/types.ts`:
   - `ScoreSubmitCmd` jako command model

5. **Utils**:
   - `HttpError` i `ValidationError` w `src/lib/utils/http-error.ts`
   - Funkcje `createSuccessResponse`, `createErrorResponse`, `getErrorMapping`, `formatValidationErrors` w `src/lib/utils/api-response.ts`

### Różnice względem oryginalnego planu:

- Dodano walidację `boardId` (sprawdzanie czy nie jest pusty)
- Dodano walidację JSON body przed parsowaniem Zod
- Serwis wykonuje dodatkowe zapytanie (sprawdzanie istniejącego rekordu) dla określenia `isNew`
- Odpowiedzi błędów zawierają dodatkowo pole `message` (dzięki `getErrorMapping`)
- Nie utworzono dedykowanego typu `SubmitScoreDTO` – odpowiedź jest inline object
