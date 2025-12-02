# API Endpoint Implementation: GET /api/boards/[id]

> **Status**: ✅ Zaimplementowany  
> **Plik**: `src/pages/api/boards/[id].ts`  
> **Ostatnia aktualizacja**: 2025-12-01

## 1. Przegląd punktu końcowego

Endpoint zwraca pełne dane tablicy (board) – metadane, listę par (term-definition) – oraz ostatni wynik (score) aktualnie zalogowanego użytkownika, jeśli istnieje. Dostęp:

- Anonimowy & dowolny użytkownik do publicznych tablic (`is_public = true`, `archived = false`)
- Właściciel do swoich prywatnych tablic (`is_public = false`).

**Powiązane endpointy w tym samym pliku:**

- `PATCH /api/boards/:id` - aktualizacja metadanych tablicy (title, isPublic, tags)
- `DELETE /api/boards/:id` - soft-delete (archiwizacja) tablicy

## 2. Szczegóły żądania

- **Metoda HTTP**: `GET`
- **URL**: `/api/boards/:id`
  - `id` – `uuid` (path param)
- **Nagłówki**:
  - `Authorization: Bearer <jwt>` – opcjonalnie (potrzebne do odczytu prywatnych boardów i pobrania własnego wyniku)
- **Body**: brak

## 3. Wykorzystywane typy

**Zaimplementowano w `src/types.ts` (linie 152-158):**

```typescript
export interface BoardMyScoreDTO {
  lastTime: ScoreRow["elapsed_ms"];
}

export type BoardViewDTO = BoardDetailDTO & {
  myScore?: BoardMyScoreDTO;
};
```

**Powiązane typy:**

- `BoardDetailDTO` (linie 82-84) – rozszerza `BoardSummaryDTO` o `pairs: PairDTO[]`
- `PairDTO` (linie 61-65) – zawiera `id`, `term`, `definition`
- `BoardSummaryDTO` (linie 67-80) – wszystkie metadane tablicy

## 4. Szczegóły odpowiedzi

| Kod | Znaczenie                                    | Treść                |
| --- | -------------------------------------------- | -------------------- |
| 200 | OK                                           | `BoardViewDTO`       |
| 400 | Nieprawidłowe id (nie-uuid)                  | `{ error, details }` |
| 401 | Brak autoryzacji do prywatnej tablicy        | `{ error }`          |
| 404 | Tablica nie istnieje lub jest zarchiwizowana | `{ error }`          |
| 500 | Błąd serwera                                 | `{ error }`          |

## 5. Przepływ danych (rzeczywista implementacja)

### Route handler (`src/pages/api/boards/[id].ts`, linie 29-65)

1. **Walidacja parametru**
   - Użycie `BoardIdParamSchema.safeParse(params)` (linia 32)
   - W przypadku błędu: zwrócenie 400 z `ValidationError`

2. **Pobranie użytkownika**
   - `userId = locals.user?.id` (linia 39) – może być `undefined` dla anonimowych

3. **Wywołanie serwisu**
   - `fetchBoardById(locals.supabase, id, userId)` (linia 42)

4. **Zwrócenie odpowiedzi**
   - Użycie `createSuccessResponse(board)` (linia 44) – zwraca status 200 z `BoardViewDTO`

### Service layer (`src/lib/services/board.service.ts`, linie 418-487)

1. **Zapytanie do bazy** (linie 424-439)

   ```typescript
   let request = supabase
     .from("boards")
     .select(
       `id, owner_id, title, card_count, level, is_public, archived, tags, created_at, updated_at,
              pairs(id, term, definition),
              scores(elapsed_ms)`
     )
     .eq("id", boardId)
     .eq("archived", false);

   if (userId) {
     request = request.eq("scores.user_id", userId);
   }
   ```

   - Wykorzystanie **embedowanych relacji** Supabase (left join dla pairs i scores)
   - Filtrowanie scores po `user_id` tylko gdy użytkownik jest zalogowany

2. **Kontrola dostępu** (linie 446-453)
   - Sprawdzenie czy board istnieje → `BOARD_NOT_FOUND`
   - Sprawdzenie czy prywatny board należy do użytkownika → `BOARD_PRIVATE`

3. **Mapowanie do DTO** (linie 463-486)
   - Konwersja pairs do `PairDTO[]`
   - Konwersja scores do `BoardMyScoreDTO` (tylko jeśli istnieje wynik)
   - Połączenie w `BoardViewDTO`

## 6. Względy bezpieczeństwa

**✅ Zaimplementowane zabezpieczenia:**

- **Autoryzacja na poziomie kodu** (board.service.ts:450-453)
  - Sprawdzenie `owner_id === userId` gdy `is_public = false`
  - Zwracanie `BOARD_PRIVATE` (401) dla nieautoryzowanych użytkowników

- **RLS (Row Level Security)** – dodatkowa ochrona na poziomie bazy danych
  - Polityki na tabelach `boards`, `pairs`, `scores`

- **Ochrona prywatnych boardów**
  - Dla anonimowego/obcego użytkownika prywatna tablica zwraca 401, a nie 404
  - Zapobiega ujawnieniu istnienia prywatnych tablic

- **Ochrona przed SQL-injection**
  - Wszystkie zapytania budowane przez Supabase query builder
  - Walidacja UUID przez Zod

- **Middleware** (`src/middleware/index.ts`)
  - Wstawia `locals.supabase` i `locals.user` dla każdego żądania
  - JWT token parsowany przez Supabase Auth

## 7. Obsługa błędów (rzeczywista implementacja)

### Tabela kodów błędów

| Scenariusz                         | Kod | Komunikat                                       | Źródło            |
| ---------------------------------- | --- | ----------------------------------------------- | ----------------- |
| Param `id` nie jest uuid           | 400 | Validation failed                               | Zod validation    |
| Board nie istnieje lub archived    | 404 | Board does not exist or access denied.          | `BOARD_NOT_FOUND` |
| Board prywatny, user niewłaściciel | 401 | This board is private and you are not the owner | `BOARD_PRIVATE`   |
| Błąd DB lub nieobsłużony           | 500 | Internal server error                           | catch-all         |

### Implementacja (route handler, linie 45-64)

```typescript
catch (error: unknown) {
  if (error instanceof ValidationError) {
    return createErrorResponse(error.response, error.status);
  }

  if (error instanceof Error) {
    if (error.message === "BOARD_NOT_FOUND" || error.message === "BOARD_PRIVATE") {
      const map = getErrorMapping(error.message);
      if (map) {
        return createErrorResponse(map.response, map.status);
      }
    }
    // ... fallback mapping
  }

  return createErrorResponse("Internal server error", 500);
}
```

### Mapowanie błędów (`src/lib/utils/api-response.ts`)

- `BOARD_NOT_FOUND` (linie 58-64) → 404
- `BOARD_PRIVATE` (linie 65-71) → 401

## 8. Rozważania dotyczące wydajności

**✅ Zaimplementowane optymalizacje:**

- **Jedno zapytanie z embedowanymi relacjami**
  - Użycie Supabase embedded resources: `pairs(...)`, `scores(...)`
  - LEFT JOIN gwarantuje zwrot tablicy nawet bez wyników w scores
  - Minimalna liczba roundtrips do bazy danych

- **Filtrowanie scores po stronie bazy**
  - Warunek `.eq("scores.user_id", userId)` wykonywany w bazie
  - Zwracany tylko wynik aktualnego użytkownika

- **Istniejące indeksy**
  - Primary key na `boards.id`
  - Foreign key index na `pairs.board_id`
  - Foreign key index na `scores.board_id` i `scores.user_id`

- **Skalowanie**
  - Pairs nie są paginowane (max 12 par na poziom, zgodnie z regułą `cardCount/2`)
  - W przypadku problemów można rozważyć rozdzielenie zapytań

## 9. Status wdrożenia

### ✅ Zaimplementowane komponenty

| Komponent         | Plik                                     | Status |
| ----------------- | ---------------------------------------- | ------ |
| Types             | `src/types.ts` (linie 152-158)           | ✅     |
| Validation schema | `src/lib/validation/boards.ts` (150-152) | ✅     |
| Service function  | `src/lib/services/board.service.ts`      | ✅     |
| Route handler     | `src/pages/api/boards/[id].ts`           | ✅     |
| Error mapping     | `src/lib/utils/api-response.ts`          | ✅     |

### 📝 Dodatkowe funkcjonalności w tym samym pliku

W pliku `src/pages/api/boards/[id].ts` zaimplementowano również:

1. **PATCH /api/boards/:id** (linie 72-119)
   - Aktualizacja metadanych: title, isPublic, tags
   - Wymaga autoryzacji (tylko właściciel)
   - Walidacja przez `PatchBoardSchema`
   - Serwis: `updateBoardMeta()`

2. **DELETE /api/boards/:id** (linie 126-165)
   - Soft-delete (ustawienie `archived = true`)
   - Wymaga autoryzacji (tylko właściciel)
   - Serwis: `archiveBoard()`

### 🔄 Możliwe ulepszenia

- **Testy**: Dodanie unit testów dla `fetchBoardById` i e2e testów dla endpointu
- **Cache**: Implementacja cache'owania dla publicznych tablic (np. Redis)
- **Dokumentacja API**: Aktualizacja specyfikacji OpenAPI/Swagger
