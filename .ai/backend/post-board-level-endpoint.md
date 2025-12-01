# API Endpoint Implementation Plan: POST /boards/level – Create Board Next Level

## 1. Przegląd punktu końcowego

Tworzy kolejny poziom (level) istniejącej talii fiszek (board) dla aktualnego właściciela. Nowy rekord w `boards` dziedziczy `title`, `card_count`, `is_public`, `tags` z dotychczasowych poziomów i dostaje `level` równy `MAX(level)+1`. W jednym żądaniu klient przekazuje pary term/definition dla całego poziomu.

## 2. Szczegóły żądania

- **Metoda HTTP:** POST
- **URL:** `/boards/level`
- **Headers:**
  - `Authorization: Bearer <access_token>` – wymagane (Supabase JWT)
  - `Content-Type: application/json`
- **Body JSON:**
  ```json
  {
    "boardId": "<uuid>", // wymagane
    "pairs": [
      // wymagane – min 1, max 12 par (walidacja Zod)
      // maksimum cardCount/2 sprawdzane w service layer
      { "term": "France", "definition": "Paris" }
    ]
  }
  ```
- **Parametry:**
  - Wymagane: `boardId` (UUID), `pairs` (array 1-12 elementów)
  - Każda para: `term` i `definition` (1-255 znaków, trimmed)
  - Brak opcjonalnych

## 3. Wykorzystywane typy

- **Command model** (z `src/types.ts`):
  ```ts
  export type CreateNextLevelCmd = Strict<{
    boardId: string;
    pairs: PairCreateCmd[]; // length validated: 1-12 (Zod), <= cardCount/2 (service)
  }>;
  
  export type PairCreateCmd = Strict<Omit<PairDTO, "id">>;
  ```
- **Validation schema** (z `src/lib/validation/board-level.ts`):
  ```ts
  export const CreateNextLevelSchema = z.object({
    boardId: z.string().uuid(),
    pairs: z.array(
      z.object({
        term: z.string().min(1).max(255).trim(),
        definition: z.string().min(1).max(255).trim(),
      })
    ).min(1).max(12)
  }).refine(/* unikalność term */);
  ```
- **Response**: `{ message: string }` (nie BoardDetailDTO)

## 4. Szczegóły odpowiedzi

- **Status:** `201 Created`
- **Body:** 
  ```json
  {
    "message": "Level {level} of {title} created"
  }
  ```
- **Nagłówki:**
  - `Content-Type: application/json`

## 5. Przepływ danych

1. **Auth middleware** wstrzykuje `supabase` oraz `user` do `locals`.
2. **Route handler**
   1. Sprawdza obecność `locals.user` → 401 gdy brak.
   2. Parse & validate JSON (Zod) ➜ `CreateNextLevelCmd`.
   3. Wywołuje `createBoardNextLevel` z serwisu.
3. **Service layer** (`createBoardNextLevel`):
   1. Query `boards` by `id = boardId`:
      - `select id, owner_id, title, card_count, is_public, tags, archived`.
      - Throw "BOARD_NOT_FOUND" gdy brak rekordu.
   2. Sprawdź właściciela: `owner_id === ownerId` → throw "NOT_OWNER" if false.
   3. Sprawdź `archived` → throw "BOARD_ARCHIVED".
   4. Walidacje biznesowe:
      - `pairs.length <= card_count / 2` (maksimum, nie dokładna równość).
      - Unikalność `term` wśród przesłanych par (walidowana przez Zod schema).
   5. Oblicz `nextLevel = MAX(level where owner_id+title) + 1` przy pomocy pojedynczego zapytania:
      - `select level order by level desc limit 1`.
   6. Insert do `boards` (nowy uuid, odziedziczone pola, `level = nextLevel`).
   7. Bulk insert `pairs` (funkcja `insertPairsForBoard`).
   8. Zwraca message string: `"Level {level} of {title} created"`.
4. **Route handler** zwraca 201 z `{ message }` w body.

## 6. Względy bezpieczeństwa

- **RLS**: table `boards` – właściciel pełny dostęp; insert wymaga zgodności `owner_id` z `auth.uid()` – spełniamy.
- **Input sanitization**: 
  - Zod string trim, max length 255 znaków dla term i definition.
  - Walidacja unikalności term (case-insensitive) w ramach przesłanych par.
  - Blokada SQL-injection zapewniona przez parametrized queries w supabase-js.
- **Ownership verification**: Warstwa serwisu weryfikuje owner_id przed każdą operacją.
- **Rate limiting**: (do rozważenia) Cloudflare / middleware.

## 7. Obsługa błędów

| Sytuacja                         | Kod | Body.example                                                                          |
| -------------------------------- | --- | ------------------------------------------------------------------------------------- |
| Nieautoryzowany                  | 401 | `{ "error": "Unauthorized" }`                                                         |
| Board nie istnieje               | 404 | `{ "error": "board_not_found", "message": "Board does not exist..." }`                |
| Brak dostępu                     | 401 | `{ "error": "not_owner", "message": "You are not the owner..." }`                     |
| Board zarchiwizowany             | 409 | `{ "error": "board_archived", "message": "Board is archived..." }`                    |
| Błędne dane (np. zła liczba par) | 400 | `{ "error": "invalid_input", "message": "Request body validation failed." }`          |
| Walidacja Zod (duplikat term)    | 400 | `{ "error": "Validation failed", "details": [{ "field": "pairs", "message": "..." }] }` |
| Błędny JSON                      | 400 | `{ "error": "Invalid JSON in request body" }`                                         |
| Nieprzewidziany błąd             | 500 | `{ "error": "Internal server error" }`                                                |

## 8. Rozważania dotyczące wydajności

- Jedno dodatkowe zapytanie `select level order by level desc limit 1` z filtrami `owner_id` i `title` – korzysta z istniejących indeksów.
- Bulk insert par w 1 request (`insertPairsForBoard`) – unika pętli N+1.
- Brak potrzeby kalkulacji `search_vector` – generowane automatycznie przez DB trigger.

## 9. Status wdrożenia

✅ **Zaimplementowane** – wszystkie etapy wykonane:

1. ✅ **Typy**: `CreateNextLevelCmd` dodany do `src/types.ts` (linia 115-118).
2. ✅ **Walidacja**: `CreateNextLevelSchema` w `src/lib/validation/board-level.ts`:
   - UUID dla boardId
   - 1-12 par (dla card_count 16/24)
   - Max 255 znaków dla term i definition
   - Unikalność term (case-insensitive)
3. ✅ **Service**: `createBoardNextLevel` w `src/lib/services/board.service.ts` (linia 147-227):
   - Weryfikacja ownership i statusu
   - Obliczanie następnego poziomu
   - Insert nowego board i par
   - Zwraca message string
4. ✅ **API route**: `src/pages/api/boards/level.ts`:
   - `export const POST` handler
   - `prerender = false`
   - Zwraca 201 z `{ message }` w body
5. ✅ **Middleware**: `locals.supabase` i `locals.user` dostępne.
6. ⏳ **Docs**: Do aktualizacji OpenAPI spec (jeśli istnieje).
