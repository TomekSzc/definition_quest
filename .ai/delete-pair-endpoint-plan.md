# API Endpoint Implementation Plan: DELETE /boards/:boardId/pairs/:pairId

## 1. Przegląd punktu końcowego
Usuwa pojedynczą parę (term + definition) z istniejącej tablicy (board). Dostęp mają wyłącznie właściciele tablicy.

## 2. Szczegóły żądania
- Metoda HTTP: **DELETE**
- URL: `/api/boards/:boardId/pairs/:pairId`
- Parametry ścieżki (wymagane)
  - `boardId` – UUID tablicy
  - `pairId` – UUID pary
- Nagłówki: `Authorization: Bearer <JWT>` (Supabase Auth)
- Body: brak

## 3. Wykorzystywane typy
- `PairDTO` (src/types.ts) – użyte wyłącznie w testach / logice, odpowiedź nie zwraca samej pary.
- Komenda: brak – operacja identyfikowana tylko parametrami.
- DTO odpowiedzi:
  ```ts
  export interface DeletePairSuccessDTO {
    id: string;      // usunięty pairId
    boardId: string; // boardId
    message: "deleted";
  }
  ```

## 4. Szczegóły odpowiedzi
| Status | Treść                                               | Warunek                                           |
|--------|-----------------------------------------------------|---------------------------------------------------|
| 200    | `DeletePairSuccessDTO`                              | Para usunięta poprawnie                           |
| 400    | `{ errors: ValidationError[] }`                     | Niepoprawne UUID / błędy walidacji                |
| 401    | `{ error: "Unauthorized" }`                        | Brak lub nieważny JWT                             |
| 404    | `{ error: "Board not found" }` lub `{ error: "Pair not found" }` | Zasób nie istnieje lub nie należy do użytkownika |
| 409    | `{ error: "Board archived" }`                      | Board w stanie archived                           |
| 500    | `{ error: "Internal server error" }`               | Nieoczekiwany wyjątek serwera                     |

## 5. Przepływ danych
1. Middleware `src/middleware/index.ts` uwierzytelnia użytkownika, podstawia `locals.user` oraz `locals.supabase`.
2. Endpoint `src/pages/api/boards/[boardId]/pairs/[pairId].ts`:
   1. Waliduje `boardId`, `pairId` przy użyciu Zod (`uuid()`).
   2. Sprawdza obecność `locals.user`.
   3. Wywołuje nowy serwis `removePair(...)`.
3. Service `removePair` (dodany do `board.service.ts`):
   1. Pobiera tablicę i weryfikuje: istnienie, ownerId === userId, `archived = false`.
   2. Próbuje usunąć parę (`delete from pairs where id = pairId and board_id = boardId`).
   3. Jeśli `delete` zwróci `count = 0`, rzuca błąd `"PAIR_NOT_FOUND"`.
4. RLS w DB (`pairs_delete_owner`) zapewnia dodatkowe bezpieczeństwo.
5. Endpoint zwraca `{ id, boardId, message: "deleted" }`.

## 6. Względy bezpieczeństwa
- Autoryzacja: tylko zalogowany użytkownik będący właścicielem tablicy.
- Supabase RLS wymusza warunek właściciela; używamy `locals.supabase` (rola authenticated) – brak dostępu do roli serwisowej.
- Walidacja UUID zapobiega SQL-Injection.
- Mapowanie kodów błędów zapobiega ujawnieniu szczegółów DB.

## 7. Obsługa błędów
| Kod błędu serwisowego | HTTP | Komunikat             |
|-----------------------|------|-----------------------|
| UNAUTHORIZED          | 401  | Unauthorized          |
| BOARD_NOT_FOUND       | 404  | Board not found       |
| PAIR_NOT_FOUND        | 404  | Pair not found        |
| NOT_OWNER             | 404* | Board not found       |
| BOARD_ARCHIVED        | 409  | Board archived        |
| SERVER_ERROR          | 500  | Internal server error |

\* Ukrywamy fakt istnienia zasobu przed osobami niebędącymi właścicielem.

## 8. Rozważania dotyczące wydajności
- Operacja `DELETE` na pojedynczym wierszu – minimalny koszt.
- Indeksy: PK `pairs.id` i `pairs_board_id_idx` zapewniają szybki lookup.
- Brak transakcyjnych pętli N+1; latency ≈ 1 RTT.

## 9. Etapy wdrożenia
1. **Service**
   - [ ] Dodaj funkcję `removePair` w `src/lib/services/board.service.ts`.
   - [ ] Implementuj walidację właściciela, status archived, usunięcie, mapowanie błędów.
2. **Walidacja**
   - [ ] W `src/lib/validation/pairs.ts` dodaj/publikuj `PathParamSchema` na `boardId`, `pairId`.
3. **Endpoint**
   - [ ] W `src/pages/api/boards/[boardId]/pairs/[pairId].ts` dodaj handler `DELETE` wg schematu PATCH.
   - [ ] Zwracaj `createSuccessResponse` z `DeletePairSuccessDTO`.
4. **Error mapping**
   - [ ] Rozszerz `http-error.ts` / `api-response.ts` o mapowanie `"BOARD_ARCHIVED" → 409`.
5. **Dokumentacja**
   - [ ] Uzupełnij OpenAPI/README.
6. **Review & merge**.
