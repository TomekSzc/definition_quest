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
- DTO odpowiedzi (nie jest zdefiniowane jako formalny typ w `types.ts`, ale zwracane przez endpoint):
  ```ts
  // Zwracana struktura:
  {
    id: string; // usunięty pairId
    boardId: string; // boardId
    message: "deleted";
  }
  ```

## 4. Szczegóły odpowiedzi

| Status | Treść                                                 | Warunek                                          |
| ------ | ----------------------------------------------------- | ------------------------------------------------ |
| 200    | `{ id: string, boardId: string, message: "deleted" }` | Para usunięta poprawnie                          |
| 400    | `{ error: string, details: ValidationError[] }`       | Niepoprawne UUID / błędy walidacji               |
| 401    | `{ error: string, message: string }`                  | Brak lub nieważny JWT / brak uprawnień właściciela |
| 404    | `{ error: string, message: string }`                  | Zasób nie istnieje lub nie należy do użytkownika |
| 409    | `{ error: string, message: string }`                  | Board w stanie archived                          |
| 500    | `{ error: string, message?: string }`                 | Nieoczekiwany wyjątek serwera                    |

## 5. Przepływ danych

1. Middleware `src/middleware/index.ts` uwierzytelnia użytkownika, podstawia `locals.user` oraz `locals.supabase`.
2. Endpoint `src/pages/api/boards/[boardId]/pairs/[pairId].ts`:
   1. Waliduje `boardId`, `pairId` przy użyciu Zod (`uuid()`).
   2. Sprawdza obecność `locals.user`.
   3. Wywołuje nowy serwis `removePair(...)`.
3. Service `removePair` (dodany do `board.service.ts`):
   1. Pobiera tablicę i weryfikuje: istnienie, ownerId === userId, `archived = false`.
   2. Próbuje usunąć parę (`delete from pairs where id = pairId and board_id = boardId`) z `.select("id, board_id").maybeSingle()`.
   3. Jeśli `deletedRow` jest `null`, rzuca błąd `"PAIR_NOT_FOUND"`.
4. RLS w DB (`pairs_delete_owner`) zapewnia dodatkowe bezpieczeństwo.
5. Endpoint zwraca `{ id, boardId, message: "deleted" }`.

## 6. Względy bezpieczeństwa

- Autoryzacja: tylko zalogowany użytkownik będący właścicielem tablicy.
- Supabase RLS wymusza warunek właściciela; używamy `locals.supabase` (rola authenticated) – brak dostępu do roli serwisowej.
- Walidacja UUID zapobiega SQL-Injection.
- Mapowanie kodów błędów zapobiega ujawnieniu szczegółów DB.

## 7. Obsługa błędów

| Kod błędu serwisowego | HTTP | Komunikat                                                   |
| --------------------- | ---- | ----------------------------------------------------------- |
| UNAUTHORIZED          | 401  | Authentication required                                     |
| BOARD_NOT_FOUND       | 404  | Board does not exist or access denied                       |
| PAIR_NOT_FOUND        | 404  | Pair does not exist on this board or access denied          |
| NOT_OWNER             | 401  | You are not the owner of this board                         |
| BOARD_ARCHIVED        | 409  | Board is archived and cannot be modified                    |
| SERVER_ERROR          | 500  | Internal server error                                       |

**Uwaga:** Komunikaty błędów zostały ujednolicone w `src/lib/utils/api-response.ts` w funkcji `getErrorMapping()`.

## 8. Rozważania dotyczące wydajności

- Operacja `DELETE` na pojedynczym wierszu – minimalny koszt.
- Indeksy: PK `pairs.id` i `pairs_board_id_idx` zapewniają szybki lookup.
- Brak transakcyjnych pętli N+1; latency ≈ 1 RTT.

## 9. Etapy wdrożenia

1. **Service**
   - [x] Dodaj funkcję `removePair` w `src/lib/services/board.service.ts` (linie 615-667).
   - [x] Implementuj walidację właściciela, status archived, usunięcie, mapowanie błędów.
2. **Walidacja**
   - [x] W `src/lib/validation/pairs.ts` dodano `PairPathParamSchema` na `boardId`, `pairId` (linie 40-45).
3. **Endpoint**
   - [x] W `src/pages/api/boards/[boardId]/pairs/[pairId].ts` dodano handler `DELETE` (linie 71-109).
   - [x] Zwraca `createSuccessResponse` z `{ id, boardId, message: "deleted" }`.
4. **Error mapping**
   - [x] Rozszerzono `api-response.ts` o mapowanie `"BOARD_ARCHIVED" → 409` (linie 79-85).
   - [x] Dodano również mapowanie dla `"PAIR_NOT_FOUND" → 404` (linie 86-92).
5. **Dokumentacja**
   - [x] Uzupełniono plan implementacji o rzeczywiste szczegóły.
6. **Review & merge**
   - [x] Implementacja zakończona i gotowa do użycia.
