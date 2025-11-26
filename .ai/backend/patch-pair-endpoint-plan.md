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
    "term": "updated term", // opcjonalne, ≥1 znak
    "definition": "updated definition" // opcjonalne, ≥1 znak
  }
  ```
  Reguły:
  1. Co najmniej jedno z pól musi być obecne.
  2. Żadne dodatkowe właściwości nie są dozwolone.

## 3. Wykorzystywane typy

| Cel               | Typ                                               | Plik                          |
| ----------------- | ------------------------------------------------- | ----------------------------- |
| Komenda wejściowa | `PairUpdateCmd`                                   | `src/types.ts`                |
| Walidacja         | `patchPairSchema` (nowy)                          | `src/lib/validation/pairs.ts` |
| DTO odpowiedzi    | `PairDTO`                                         | `src/types.ts`                |
| Błędy HTTP        | `ValidationError`, `HttpError`, `getErrorMapping` | `src/lib/utils`               |

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

1. Middleware wstrzykuje `supabase` i `session` do `context`.
2. Endpoint `PATCH`:
   1. Wyciągnięcie `boardId`, `pairId` z `params`.
   2. Autoryzacja: wymagana aktywna sesja (`session.user.id`).
   3. Walidacja UUID (Zod `uuid()`).
   4. Walidacja body → `patchPairSchema`.
   5. Wywołanie **service** `boardService.updatePair()`.
   6. Zwrócenie `200` + zaktualizowana para.

### boardService.updatePair()

```ts
async function updatePair(supabase, boardId, pairId, updates): Promise<PairDTO> {
  // 1. Select board to verify owner & archived
  const { data: board } = await supabase.from("boards").select("owner_id, archived").eq("id", boardId).single();
  if (!board) throw new HttpError("Board not found", 404);
  if (board.archived) throw new HttpError("Board archived", 409);
  if (board.owner_id !== session.user.id) throw new HttpError("Not owner", 401);

  // 2. Update pair
  const { data: pair, error } = await supabase
    .from("pairs")
    .update({ term: updates.term, definition: updates.definition, updated_at: "now()" })
    .eq("id", pairId)
    .eq("board_id", boardId)
    .select("id, term, definition")
    .single();
  if (!pair) throw new HttpError("Pair not found", 404);
  if (error) throw error;
  return pair as PairDTO;
}
```

## 6. Względy bezpieczeństwa

- **Autoryzacja:** tylko właściciel planszy może modyfikować (sprawdza service + RLS w Supabase).
- **Walidacja wejścia:** Zod + `Strict<T>` odrzuca nadmiarowe pola.
- **SQL injection:** Supabase parametrized queries + walidacja UUID eliminuje ryzyko.
- **Rate limiting:** do rozważenia (Supabase Edge Functions / middleware).

## 7. Obsługa błędów

- Błędy Zod → `VALIDATION_FAILED` (400).
- Brak planszy / pary → 404.
- Brak uprawnień → 401.
- Plansza zarchiwizowana → 409.
- Niespodziewane błędy → 500.
- Wszystkie mapowane przez `getErrorMapping` do spójnego JSON.

## 8. Rozważania dotyczące wydajności

- Pojedynczy update, niski koszt.
- Indeks `BTREE(board_id)` + `id` na `pairs` → szybkie wyszukiwanie.
- Transakcja nie wymagana (jedna tabela).

## 9. Etapy implementacji

1. **Validation** – utworzyć `src/lib/validation/pairs.ts` z `patchPairSchema`.
2. **Service** – dodać `updatePair` do `src/lib/services/board.service.ts` (ew. nowy plik `pairs.service.ts`).
3. **Route** – utworzyć `src/pages/api/boards/[boardId]/pairs/[pairId].ts` z metodą `PATCH`:
   - importować walidator, services, utils.
4. **Docs** – aktualizacja `.ai/api-plan.md` (sekcja endpointów) i generator Swagger (opc).
