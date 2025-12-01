# API Endpoint Implementation Plan: POST /boards/:boardId/pairs

## 1. Przegląd punktu końcowego

Dodaje nową parę (term–definition) do wskazanego poziomu tablicy (board). Dostępne wyłącznie dla właściciela tablicy i tylko wtedy, gdy liczba istniejących par jest mniejsza niż `card_count / 2`. Operacja zwraca identyfikator oraz wprowadzone dane pary.

## 2. Szczegóły żądania

- Metoda HTTP: **POST**
- URL: `/boards/{boardId}/pairs`
  - `boardId` – UUID tablicy (parametr ścieżki, wymagany)
- **Headers:**
  - `Authorization: Bearer <access_token>` – wymagane (Supabase JWT)
  - `Content-Type: application/json`
- Body (`application/json`):

```jsonc
{
  "term": "string (1-255)",
  "definition": "string (1-255)",
}
```

## 3. Wykorzystywane typy

1. **DTO / Command models** (z `src/types.ts`)
   - `PairCreateCmd` – payload wejściowy (typ w API)
2. **Schematy walidacyjne** (w `src/lib/validation/pairs.ts`):
   - `CreatePairSchema` – `z.object({ term, definition })` z walidacją długości (1-255 znaków) i trimowaniem
   - `CreatePairInput` – typ wygenerowany przez Zod
3. **Błędy biznesowe** (mapowane w `src/lib/utils/api-response.ts`):
   - `CARD_LIMIT_REACHED` – kod 400
   - `DUPLICATE_PAIR` – kod 409
   - `BOARD_NOT_FOUND` – kod 404
   - `NOT_OWNER` – kod 401
   - `BOARD_ARCHIVED` – kod 409
   - `UNAUTHORIZED` – kod 401
   - `VALIDATION_FAILED` – kod 400

## 4. Szczegóły odpowiedzi

| Kod | Znaczenie                               | Body                 |
| --- | --------------------------------------- | -------------------- |
| 201 | Para utworzona                          | `PairDTO`            |
| 400 | Walidacja danych / limit kart           | `{ error, message }` |
| 401 | Brak autoryzacji / brak właścicielstwa  | `{ error, message }` |
| 404 | Tablica nie istnieje                    | `{ error, message }` |
| 409 | Duplikat termu / tablica zarchiwizowana | `{ error, message }` |
| 500 | Inny błąd serwera                       | `{ error, message }` |

## 5. Przepływ danych

1. Klient wysyła POST z JWT w cookie.
2. Middleware `src/middleware/index.ts` uwierzytelnia i wstawia `supabase` + `user` do `locals`.
3. Handler `/src/pages/api/boards/[boardId]/pairs/index.ts`:
   1. Sprawdza obecność użytkownika w `locals.user` → w przeciwnym razie `UNAUTHORIZED`.
   2. Waliduje parametr ścieżki `boardId` (UUID) przez `PathParamSchema`.
   3. Waliduje body JSON przez `CreatePairSchema` → `CreatePairInput`.
   4. Wywołuje funkcję serwisową `addPairToBoard()` z `services/board.service.ts`.
4. `addPairToBoard()`:
   1. Pobiera wiersz tablicy (`owner_id, card_count, archived`) dla `board_id`.
   2. Sprawdza:
      - istnienie tablicy → `BOARD_NOT_FOUND`.
      - właścicielstwo → `NOT_OWNER`.
      - `archived = false` → `BOARD_ARCHIVED`.
   3. Wykonuje osobne zapytanie zliczające istniejące pary (`SELECT count`) dla `board_id`.
   4. Sprawdza `pairsCount < card_count / 2` → w przeciwnym razie `CARD_LIMIT_REACHED`.
   5. Próbuje wstawić nową parę (uuid v4) do `pairs` z klauzulą `returning`.
      - Konflikt unikalności `(board_id, term)` → przechwyć kod Supabase `23505` i zmapuj na `DUPLICATE_PAIR`.
   6. Zwraca obiekt z `{ id, term, definition }`.
5. Handler opakowuje wynik w `createSuccessResponse(data, 201)`.
6. Przy błędach łapie wyjątki, mapuje przez `getErrorMapping()` i zwraca `createErrorResponse()`.

## 6. Względy bezpieczeństwa

- **Autentykacja**: wymagane JWT Supabase (middleware).
- **Autoryzacja**: potwierdzenie właścicielstwa tablicy przed wstawieniem.
- **RLS**: Polityka `owner_write` na `pairs` wymusza dodatkową ochronę – serwis nadal jawnie sprawdza właściciela, by zwrócić spójne błędy.
- **Walidacja wejścia**: Zod – minimalne/maksymalne długości, trymowanie białych znaków.
- **SQL Injection**: korzystamy z zapytań parametryzowanych Supabase JS.

## 7. Obsługa błędów

| Scenariusz                       | Kod | errorCode (business) |
| -------------------------------- | --- | -------------------- |
| Tablica nie istnieje             | 404 | BOARD_NOT_FOUND      |
| Użytkownik nie jest właścicielem | 401 | NOT_OWNER            |
| Tablica zarchiwizowana           | 409 | BOARD_ARCHIVED       |
| Limit kart osiągnięty            | 400 | CARD_LIMIT_REACHED   |
| Duplikat termu                   | 409 | DUPLICATE_PAIR       |
| Nieprawidłowe body               | 400 | VALIDATION_FAILED    |
| Brak JWT                         | 401 | UNAUTHORIZED         |
| Inne                             | 500 | SERVER_ERROR         |

## 8. Rozważania dotyczące wydajności

- Wykonywane są 3 osobne zapytania: SELECT board, SELECT count, INSERT pair.
- Indeks BTREE na `(board_id)` w `pairs` wspiera szybkie zliczanie.
- Wstawianie pojedynczych wierszy ma niską złożoność – brak specjalnych optymalizacji.
- W przyszłości możliwe użycie Postgres RPC dla transakcji atomowej (jeden round-trip).

## 9. Status implementacji

✅ **Zaimplementowano** – endpoint w pełni funkcjonalny.

Szczegóły implementacji:
1. **Validation** (`src/lib/validation/pairs.ts`):
   - `CreatePairSchema` – walidacja term i definition (1-255 znaków, trim).
   - `CreatePairInput` – typ wyeksportowany przez Zod.
2. **Service** (`src/lib/services/board.service.ts`):
   - `addPairToBoard(supabase, userId, boardId, input)` – pełna logika biznesowa.
3. **Error mapping** (`src/lib/utils/api-response.ts`):
   - Wszystkie kody błędów dodane i zmapowane.
4. **Route** (`src/pages/api/boards/[boardId]/pairs/index.ts`):
   - `export const POST` z `prerender = false`.
   - Walidacja parametrów ścieżki i body.
   - Obsługa błędów przez `ValidationError` i `getErrorMapping()`.

**Uwaga**: Ścieżka do serwisu to `src/lib/services/board.service.ts`, nie `src/lib/board.service.ts`.
