# API Endpoint Implementation Plan: GET /api/boards/[id]

## 1. Przegląd punktu końcowego

Endpoint zwraca pełne dane tablicy (board) – metadane, listę par (term-definition) – oraz ostatni wynik (score) aktualnie zalogowanego użytkownika, jeśli istnieje. Dostęp:

- Anonimowy & dowolny użytkownik do publicznych tablic (`is_public = true`, `archived = false`)
- Właściciel do swoich prywatnych tablic (`is_public = false`).

## 2. Szczegóły żądania

- **Metoda HTTP**: `GET`
- **URL**: `/api/boards/:id`
  - `id` – `uuid` (path param)
- **Nagłówki**:
  - `Authorization: Bearer <jwt>` – opcjonalnie (potrzebne do odczytu prywatnych boardów i pobrania własnego wyniku)
- **Body**: brak

## 3. Wykorzystywane typy

- `BoardDetailDTO` – istniejący: metadane + `pairs`
- `MyScoreDTO` – istniejący ale zawiera `boardTitle`; dla tego endpointu potrzebujemy tylko `lastTime`. Proponujemy **nowy DTO**:
  ```ts
  export interface BoardMyScoreDTO {
    lastTime: number; // elapsed_ms
  }
  ```
- **Response DTO** (nowy):
  ```ts
  export type BoardViewDTO = BoardDetailDTO & {
    myScore?: BoardMyScoreDTO; // undefined jeśli brak wyniku lub user anonimowy
  };
  ```

## 4. Szczegóły odpowiedzi

| Kod | Znaczenie                                    | Treść                |
| --- | -------------------------------------------- | -------------------- |
| 200 | OK                                           | `BoardViewDTO`       |
| 400 | Nieprawidłowe id (nie-uuid)                  | `{ error, details }` |
| 401 | Brak autoryzacji do prywatnej tablicy        | `{ error }`          |
| 404 | Tablica nie istnieje lub jest zarchiwizowana | `{ error }`          |
| 500 | Błąd serwera                                 | `{ error }`          |

## 5. Przepływ danych

1. **Middleware** wstawia `locals.supabase`, `locals.user` (może być `undefined`).
2. **Walidacja** param `id` przez Zod → `uuid()`.
3. **Service layer** (`board.service.ts`)
   - `fetchBoardById(supabase, id, userId?)`
     1. Pobiera tablicę (`boards`), joins:
        - `pairs(id, term, definition)` – ordered by `created_at`
        - `scores(lastTime: elapsed_ms)` – lewy join (bez `!inner`); dodatkowe `.eq("scores.user_id", userId)` nie wyklucza rekordu gdy wpisu brak
     2. Filtry:
        - `id` = param
        - `archived` = `false`
        - Jeśli `is_public = false` → dodatkowo `owner_id = userId` (w kodzie lub polegać na RLS?)
     3. RLS już ograniczy SELECT, ale kontrola w kodzie pozwala odróżnić 401 od 404.
4. **Route handler** buduje `BoardViewDTO` i zwraca.

## 6. Względy bezpieczeństwa

- **Autoryzacja**: sprawdź zgodność `owner_id === userId` gdy `is_public = false`.
- **RLS** na `boards`, `pairs`, `scores` – dodatkowa linia obrony.
- **Brak ujawniania prywatnych boardów**: dla anonimowego/obcego użytkownika prywatna tablica zwraca 404.
- **SQL-injection** – zapytania budowane przez Supabase query builder (bezpieczne).
- **Rate-limiting / DoS** – ogólna strategia na poziomie platformy (poza zakresem endpointu).

## 7. Obsługa błędów

| Scenariusz                         | Kod | Komentarz            |
| ---------------------------------- | --- | -------------------- |
| Param `id` nie jest uuid           | 400 | Zod validation error |
| Board nie istnieje lub archived    | 404 |                      |
| Board prywatny, user niewłaściciel | 401 |                      |
| Błąd DB                            | 500 | log + generic msg    |

## 8. Rozważania dotyczące wydajności

- Jeden SELECT z embedowanymi relacjami (`select(..., pairs(...), scores(...))` + opcjonalne `.eq("scores.user_id", userId)`) – minimalna liczba roundtrips; LEFT JOIN gwarantuje zwrot tablicy nawet bez wyników.
- Indexy istnieją (`PK`, `board_id` w `pairs`, `scores`).
- W razie problemów: rozdzielić zapytania i/lub paginować pairs (niepotrzebne przy max 24 kartach).

## 9. Etapy wdrożenia

1. **Types & Validation**
   - Dodać `BoardMyScoreDTO`, `BoardViewDTO` w `src/types.ts`.
   - Utworzyć `BoardIdParamSchema = z.object({ id: z.string().uuid() })` w `src/lib/validation/boards.ts`.
2. **Service**
   - Dodać `fetchBoardById` w `board.service.ts` (opis jak wyżej).
3. **Route**
   - Utworzyć plik `src/pages/api/boards/[id].ts`.
   - Handler `GET`:
     1. Walidacja param.
     2. Pobranie `user` z `locals`.
     3. Wywołanie serwisu.
     4. Mapowanie do DTO + `createSuccessResponse` (200).
   - `export const prerender = false`.
4. **Error mapping**
   - Uzupełnić `api-response.ts` o mapowanie np. `BOARD_NOT_FOUND`, `BOARD_PRIVATE`.
5. **Tests (w przyszości zostaną dodane, przy pierwszym wdrożeniu nie)** – unit test serwisu & e2e zestaw Supertest.
6. **Docs** – zaktualizować OpenAPI / README.
