# API Endpoint Implementation Plan: PATCH `/boards/:boardId/pairs/:pairId`

## 1. Przegląd punktu końcowego

Modyfikuje pojedynczą parę _term/definition_ (`pairs`) należącą do konkretnej planszy (`boards`).  
Uprawniony jest wyłącznie właściciel planszy. Endpoint umożliwia częściową aktualizację pól `term`, `definition` lub obu naraz.

## 2. Szczegóły żądania

- **Metoda:** `PATCH`
- **URL:** `/boards/:boardId/pairs/:pairId`
  - `boardId` `uuid` – identyfikator planszy (path param, wymagany)
  - `pairId` `uuid` – identyfikator pary (path param, wymagany)
- **Nagłówki:**
  - `Authorization: Bearer <jwt>` – wymagany (Supabase Auth)
  - `Content-Type: application/json`
- **Body (JSON):**
  ```json
  {
    "term": "updated term", // opcjonalne, 1-255 znaków (trim)
    "definition": "updated definition" // opcjonalne, 1-255 znaków (trim)
  }
  ```
  Reguły:
  1. Co najmniej jedno z pól musi być obecne.
  2. Każde pole jest trimowane i walidowane (1-255 znaków).
  3. Żadne dodatkowe właściwości nie są dozwolone.

## 3. Wykorzystywane typy

| Cel               | Typ                                               | Plik                          |
| ----------------- | ------------------------------------------------- | ----------------------------- |
| Komenda wejściowa | `PairUpdateCmd`                                   | `src/types.ts`                |
| Walidacja         | `PatchPairSchema`                                 | `src/lib/validation/pairs.ts` |
| DTO odpowiedzi    | `PairDTO`                                         | `src/types.ts`                |
| Błędy HTTP        | `ValidationError`, `getErrorMapping`              | `src/lib/utils`               |

## 4. Szczegóły odpowiedzi

| Status  | Kiedy                                             | Body                                               |
| ------- | ------------------------------------------------- | -------------------------------------------------- |
| **200** | Aktualizacja udana                                | `PairDTO`                                          |
| 400     | Nieprawidłowe dane wejściowe                      | `{ error: "validation_failed", details: [...] }`   |
| 401     | Brak JWT / brak uprawnień                         | `{ error: "unauthorized" }`                        |
| 404     | `boardId` lub `pairId` nie istnieje / niedostępny | `{ error: "board_not_found" \| "pair_not_found" }` |
| 409     | Plansza zarchiwizowana                            | `{ error: "board_archived" }`                      |
| 500     | Błąd serwera                                      | `{ error: "server_error" }`                        |

## 5. Przepływ danych

1. Middleware wstrzykuje `supabase` i `user` do `locals`.
2. Endpoint `PATCH`:
   1. Wyciągnięcie `boardId`, `pairId` z `params`.
   2. Autoryzacja: wymagana aktywna sesja (`locals.user`).
   3. Walidacja UUID (Zod `uuid()`) przez `PathParamSchema`.
   4. Walidacja body → `PatchPairSchema`.
   5. Wywołanie **service** `updatePair(supabase, userId, boardId, pairId, updates)`.
   6. Zwrócenie `200` + zaktualizowana para.

### boardService.updatePair()

```ts
async function updatePair(
  supabase: SupabaseClient,
  userId: string,
  boardId: string,
  pairId: string,
  updates: { term?: string; definition?: string }
): Promise<PairDTO> {
  // 1. Verify board exists, ownership, and is not archived
  const { data: boardRow, error: boardErr } = await supabase
    .from("boards")
    .select("owner_id, archived")
    .eq("id", boardId)
    .maybeSingle();

  if (boardErr) throw boardErr;
  if (!boardRow) throw new Error("BOARD_NOT_FOUND");
  if (boardRow.archived) throw new Error("BOARD_ARCHIVED");
  if (boardRow.owner_id !== userId) throw new Error("NOT_OWNER");

  // 2. Update pair (only provided fields via spread)
  const { data: pairRow, error: pairErr } = await supabase
    .from("pairs")
    .update({ ...updates })
    .eq("id", pairId)
    .eq("board_id", boardId)
    .select("id, term, definition")
    .maybeSingle();

  if (pairErr) throw pairErr;
  if (!pairRow) throw new Error("PAIR_NOT_FOUND");

  return {
    id: pairRow.id,
    term: pairRow.term,
    definition: pairRow.definition,
  };
}
```

## 6. Względy bezpieczeństwa

- **Autoryzacja:** tylko właściciel planszy może modyfikować:
  - Sprawdzane w service layer przez porównanie `boardRow.owner_id !== userId`
  - Dodatkowo chronione przez RLS w Supabase
- **Walidacja wejścia:** 
  - Zod `PatchPairSchema` sprawdza typy i długość (1-255 znaków)
  - `.trim()` czyści białe znaki
  - `.refine()` wymusza przynajmniej jedno pole
- **SQL injection:** Supabase parametryzowane zapytania + walidacja UUID eliminuje ryzyko
- **Rate limiting:** obecnie nie zaimplementowane

## 7. Obsługa błędów

- **Błędy Zod** → `ValidationError` → 400 z `{ error: "validation_failed", details: [...] }`
- **BOARD_NOT_FOUND** → 404 z `{ error: "board_not_found", message: "..." }`
- **PAIR_NOT_FOUND** → 404 z `{ error: "pair_not_found", message: "..." }`
- **NOT_OWNER** → 401 z `{ error: "not_owner", message: "..." }`
- **BOARD_ARCHIVED** → 409 z `{ error: "board_archived", message: "..." }`
- **UNAUTHORIZED** → 401 z `{ error: "unauthorized", message: "..." }`
- **Niespodziewane błędy** → 500 z `{ error: "Internal server error" }`
- Wszystkie błędy biznesowe (Error messages) są mapowane przez `getErrorMapping()` do spójnych odpowiedzi HTTP.

## 8. Rozważania dotyczące wydajności

- Dwa oddzielne zapytania (SELECT board + UPDATE pair), niski koszt
- Indeks `BTREE(board_id)` + primary key `id` na `pairs` → szybkie wyszukiwanie
- Transakcja nie wymagana (operacje na dwóch tabelach, ale bez wymagań spójności transakcyjnej)
- Użycie `.maybeSingle()` zamiast `.single()` poprawia obsługę błędów

## 9. Stan implementacji

✅ **Zaimplementowano w pełni:**

1. **Validation** – `src/lib/validation/pairs.ts`:
   - `PatchPairSchema` z walidacją term/definition (1-255 znaków, trim)
   - `PairPathParamSchema` dla walidacji UUID
   - `.refine()` zapewnia, że co najmniej jedno pole jest obecne

2. **Service** – `src/lib/services/board.service.ts`:
   - `updatePair(supabase, userId, boardId, pairId, updates)`
   - Weryfikuje własność, status archived, istnienie board i pair
   - Używa spread operator dla częściowej aktualizacji
   - **Uwaga:** NIE aktualizuje kolumny `updated_at` w tabeli `pairs`

3. **Route** – `src/pages/api/boards/[boardId]/pairs/[pairId].ts`:
   - Metoda `PATCH` z pełną walidacją params i body
   - Autoryzacja przez `locals.user`
   - Obsługa błędów przez `getErrorMapping()`
   - **Uwaga:** Zawiera duplikat `PathParamSchema` (linie 17-20), mimo że importuje `PairPathParamSchema`
