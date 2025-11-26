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
   - `PairCreateCmd` – payload wejściowy
   - `PairDTO` – model wyjściowy
2. **Nowe/Zaktualizowane schematy walidacyjne** (w `src/lib/validation/pairs.ts`):
   - `CreatePairSchema` – `z.object({ term, definition })`
3. **Błędy biznesowe** (mapowane w `api-response.ts` – dopisać jeśli brak):
   - `CARD_LIMIT_REACHED`
   - `DUPLICATE_PAIR`

## 4. Szczegóły odpowiedzi

| Kod | Znaczenie                              | Body                 |
| --- | -------------------------------------- | -------------------- |
| 201 | Para utworzona                         | `PairDTO`            |
| 400 | Walidacja danych / limit kart          | `{ error, message }` |
| 401 | Brak autoryzacji / brak właścicielstwa | `{ error, message }` |
| 404 | Tablica nie istnieje                   | `{ error, message }` |
| 409 | Duplikat termu                         | `{ error, message }` |
| 500 | Inny błąd serwera                      | `{ error, message }` |

## 5. Przepływ danych

1. Klient wysyła POST z JWT w cookie.
2. Middleware `src/middleware/index.ts` uwierzytelnia i wstawia `supabase` + `user` do `locals`.
3. Handler `/src/pages/api/boards/[boardId]/pairs/index.ts`:
   1. Parsuje `boardId` z URL.
   2. Waliduje body przez `CreatePairSchema` → `PairCreateCmd`.
   3. Wywołuje nową funkcję serwisową `addPairToBoard()` z `board.service.ts`.
4. `addPairToBoard()`:
   1. Pobiera wiersz tablicy (`owner_id, card_count, archived`) i liczbę par `COUNT(*)` z `pairs` dla `board_id`.
   2. Sprawdza:
      - istnienie tablicy → `BOARD_NOT_FOUND`.
      - właścicielstwo → `NOT_OWNER`.
      - `archived = false` → `BOARD_ARCHIVED`.
      - `pairsCount < card_count / 2` → w przeciwnym razie `CARD_LIMIT_REACHED`.
   3. Próbuje wstawić nową parę (uuid v4) do `pairs` z klauzulą `returning`.
      - Konflikt unikalności `(board_id, term)` → przechwyć kod Supabase `23505` i zmapuj na `DUPLICATE_PAIR`.
   4. Zwraca `PairDTO`.
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
| Tablica zarchiwizowana           | 400 | BOARD_ARCHIVED       |
| Limit kart osiągnięty            | 400 | CARD_LIMIT_REACHED   |
| Duplikat termu                   | 409 | DUPLICATE_PAIR       |
| Nieprawidłowe body               | 400 | VALIDATION_FAILED    |
| Brak JWT                         | 401 | UNAUTHORIZED         |
| Inne                             | 500 | SERVER_ERROR         |

## 8. Rozważania dotyczące wydajności

- Zapytania pojedyncze (SELECT COUNT, INSERT) – niska złożoność.
- Index BTREE na `(board_id)` w `pairs` wspiera szybkie zliczanie.
- Wstawianie pojedynczych wierszy pomijalne – brak specjalnych optymalizacji.

## 9. Etapy wdrożenia

1. **Validation**: w `validation/pairs.ts` dodać `CreatePairSchema` + `type CreatePairInput`.
2. **Service**: w `board.service.ts` zaimplementować `addPairToBoard(supabase, userId, boardId, input)`.
3. **Error map**: w `utils/api-response.ts` dodać mapowania `CARD_LIMIT_REACHED`, `DUPLICATE_PAIR`.
4. **Route**:
   - Utworzyć plik `src/pages/api/boards/[boardId]/pairs/index.ts`.
   - Eksportować `export const POST` z obsługą `prerender = false`.
   - Pobierać `supabase` i `user` z `locals`.
   - Stosować schemat walidacji, serwis i utilsy odp.
5. **Doc**: zaktualizować OpenAPI / README.
