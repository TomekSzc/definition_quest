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
      // wymagane – length = cardCount/2
      { "term": "France", "definition": "Paris" }
    ]
  }
  ```
- **Parametry:**
  - Wymagane: `boardId`, `pairs`
  - Brak opcjonalnych

## 3. Wykorzystywane typy

- **Command model**:
  ```ts
  export interface CreateNextLevelCmd {
    boardId: string;
    pairs: PairCreateCmd[]; // length validated server-side
  }
  ```
- Re-use istniejących DTO: `PairDTO`, `BoardDetailDTO` (z `src/types.ts`).

## 4. Szczegóły odpowiedzi

- **Status:** `201 Created`
- **Body:** `BoardDetailDTO` dla nowo utworzonego poziomu (wraz z wstawionymi `pairs`).
- **Nagłówki:**
  - `Location: /boards/<newBoardId>`

## 5. Przepływ danych

1. **Auth middleware** wstrzykuje `supabase` oraz `currentUser.id` do `locals`.
2. **Route handler**
   1. Parse & validate JSON (Zod) ➜ `CreateNextLevelCmd`.
   2. Query `boards` by `id = boardId`:
      - `select owner_id, title, card_count, is_public, tags, archived`.
      - 404 gdy brak rekordu.
   3. Sprawdź właściciela: `owner_id === auth.uid()` → 401 if false.
   4. Sprawdź `archived` → 400 “BOARD_ARCHIVED”.
   5. Oblicz `nextLevel = MAX(level where owner_id+title) + 1` przy pomocy pojedynczego `select max(level)`.
   6. Walidacje biznesowe:
      - `pairs.length === card_count / 2`.
      - unikalność `term` wśród przesłanych par.
   7. **Transakcja-pseudo** (sekwencyjne zapytania – JS klient nie ma tx):
      1. Insert do `boards` (nowy uuid, odziedziczone pola, `level = nextLevel`).
      2. Bulk insert `pairs` (funkcja `insertPairsForBoard`).
   8. Select inserted pairs ➜ `fetchInsertedPairs`.
   9. Złożenie obiektu `BoardDetailDTO`, status 201.

## 6. Względy bezpieczeństwa

- **RLS**: table `boards` – właściciel pełny dostęp; insert wymaga zgodności `owner_id` z `auth.uid()` – spełniamy.
- **Input sanitization**: Zod string trim, max length zgodnie z DB (np. 65535), blokada SQL-injection zapewniona przez parametrized supabase js.
- **Rate limiting**: (do rozważenia) Cloudflare / middleware.

## 7. Obsługa błędów

| Sytuacja                         | Kod | Body.example                                     |
| -------------------------------- | --- | ------------------------------------------------ |
| Nieautoryzowany                  | 401 | `{ "error": "UNAUTHENTICATED" }`                 |
| Board nie istnieje               | 404 | `{ "error": "BOARD_NOT_FOUND" }`                 |
| Brak dostępu                     | 401 | `{ "error": "NOT_OWNER" }`                       |
| Board zarchiwizowany             | 400 | `{ "error": "BOARD_ARCHIVED" }`                  |
| Błędne dane (np. zła liczba par) | 400 | `{ "error": "INVALID_INPUT", "details": "..." }` |
| Duplikat term                    | 400 | `{ "error": "DUPLICATE_TERM" }`                  |
| DB violation (unique)            | 500 | `{ "error": "DB_ERROR" }`                        |

## 8. Rozważania dotyczące wydajności

- Jedno dodatkowe zapytanie `max(level)` jest indeksowane (`owner_id,title` w UNIQUE) – dodamy composite index `(owner_id,title,level)` jeśli zauważymy seq scan.
- Bulk insert par w 1 request (`insertPairsForBoard`) – unika pętli.
- Brak potrzeby kalkulacji `search_vector` – generowane przez DB.

## 9. Etapy wdrożenia

1. **Typy**: dodać `CreateNextLevelCmd` do `src/types.ts`.
2. **Walidacja**: utworzyć `src/lib/validation/board-level.ts` z Zod schema.
3. **Service**: w `board.service.ts` dodać `createBoardNextLevel(supabase, ownerId, cmd)` korzystając z istniejących helperów.
4. **API route**: utworzyć plik `src/pages/api/boards/level.ts`:
   - `export const POST` handler
   - `prerender = false`
5. **Middleware**: upewnić się iż `locals.supabase` dostępny (już jest).
6. **Docs**: zaktualizować OpenAPI / readme.
