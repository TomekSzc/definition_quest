# API Endpoint Implementation Plan: DELETE /boards/:id

## 1. Przegląd punktu końcowego

Endpoint umożliwia właścicielowi tablicy jej „miękkie" usunięcie poprzez ustawienie pola `archived = true`. Pozwala to ukryć tablicę przed innymi operacjami, zachowując jednocześnie dane w bazie.

**UWAGA:** Archiwizacja dotyczy **tylko konkretnego poziomu** (pojedynczego rekordu w tabeli `boards`), a nie wszystkich poziomów tej samej tablicy. Jest to celowa decyzja projektowa różniąca się od `updateBoardMeta`, która aktualizuje wszystkie poziomy.

## 2. Szczegóły żądania

- **Metoda HTTP:** DELETE
- **URL pattern:** `/api/boards/:id`
- **Parametry Path:**
  - `id` (UUID) – identyfikator tablicy (wymagany)
- **Body:** brak
- **Nagłówki dodatkowe:**
  - `Authorization: Bearer <jwt>` – wymagana sesja Supabase (weryfikowana przez middleware)

### Walidacja ✅

1. **Path param:** `BoardIdParamSchema.safeParse(params)` → poprawny UUID (linia 129 w endpoincie).
2. **Autentykacja:** `locals.user` musi być ustawiony, w przeciwnym razie `HttpError("Authentication required", 401)` (linie 137-139).
3. **Format błędów:** Zod errors formatowane przez `formatValidationErrors()` i zwracane jako `ValidationError`.

## 3. Wykorzystywane typy

| Typ                                                               | Plik                                | Zastosowanie                      |
| ----------------------------------------------------------------- | ----------------------------------- | --------------------------------- |
| `BoardIdParamSchema`                                              | `src/lib/validation/boards.ts`      | walidacja `id` (linie 150-152)    |
| `HttpError`, `ValidationError`                                    | `src/lib/utils/http-error.ts`       | obsługa błędów                    |
| `createSuccessResponse`, `createErrorResponse`, `getErrorMapping` | `src/lib/utils/api-response.ts`     | standaryzacja odpowiedzi          |
| `formatValidationErrors`                                          | `src/lib/utils/api-response.ts`     | formatowanie błędów Zod           |
| `archiveBoard` ✅                                                  | `src/lib/services/board.service.ts` | logika biznesowa (linie 749-786)  |

## 4. Szczegóły odpowiedzi

| Kod                       | Treść                                                                                    | Warunek                          |
| ------------------------- | ---------------------------------------------------------------------------------------- | -------------------------------- |
| 200 OK ✅                  | `{ "message": "Board archived" }`                                                        | Archiwizacja zakończona sukcesem |
| 400 Bad Request ✅         | `{ "error": "validation_failed", "message": "...", errors: [...] }`                      | Niepoprawny UUID                 |
| 401 Unauthorized ✅        | `{ "error": "Authentication required" }` lub `{ "error": "not_owner", "message": "..." }` | Brak sesji lub nie-owner         |
| 404 Not Found ✅           | `{ "error": "board_not_found", "message": "Board does not exist or access denied." }`    | Brak rekordu                     |
| 409 Conflict ✅            | `{ "error": "board_already_archived", "message": "Board is already archived." }`         | Tablica już archived             |
| 500 Internal Server Error | `{ "error": "Internal server error" }`                                                   | Nieoczekiwany błąd               |

## 5. Przepływ danych

1. **Router** `DELETE /api/boards/:id` (zaimplementowany w `src/pages/api/boards/[id].ts`, linie 126-165)
2. **Walidacja path params** → `BoardIdParamSchema.safeParse(params)` sprawdza UUID.
3. **Auth middleware** sprawdza `locals.user`, wyrzuca `HttpError` jeśli null.
4. **Service** `archiveBoard(supabase, userId, boardId)` (linie 749-786 w `board.service.ts`)
   - SELECT owner_id, archived dla boardId
   - Autoryzacja: porównuje owner_id z userId
   - Weryfikacja stanu: rzuca błąd jeśli już archived
   - UPDATE archived = true, updated_at = now() **TYLKO dla tego konkretnego poziomu** (boardId)
5. **Odpowiedź** 200 + `{ message: "Board archived" }`.
6. **Logi** `console.error` przy wyjątkach Supabase.

## 6. Względy bezpieczeństwa

- **Autentykacja JWT** (Supabase): Middleware weryfikuje sesję i udostępnia `locals.user`.
- **Autoryzacja właściciela**: Funkcja `archiveBoard` weryfikuje `owner_id` przed aktualizacją.
- **RLS w tabeli `boards`**: Policy `owner_full_access` uniemożliwia UPDATE innym użytkownikom nawet przy próbie ominięcia logiki API.
- **Ograniczenie enumeracji UUID**: Zwracamy 404 gdy rekord nie istnieje (nie ujawniamy czy to brak rekordu czy brak dostępu).
- **Brak ciała żądania** → minimalizacja wektora ataku (XSS/CSRF).
- **CSRF protection**: Wymóg tokena sesji w nagłówku Authorization.

## 7. Obsługa błędów

| Kod | Źródło                                                         | Mapa w `getErrorMapping`       | Status |
| --- | -------------------------------------------------------------- | ------------------------------ | ------ |
| 400 | `ValidationError`                                              | `"VALIDATION_FAILED"`          | ✅      |
| 401 | `HttpError("Authentication required")`<br>`Error("NOT_OWNER")` | `"NOT_OWNER"`                  | ✅      |
| 404 | `Error("BOARD_NOT_FOUND")`                                     | `"BOARD_NOT_FOUND"`            | ✅      |
| 409 | `Error("BOARD_ALREADY_ARCHIVED")`                              | `"BOARD_ALREADY_ARCHIVED"` ✅   | ✅      |
| 500 | inne błędy Supabase / nieoczekiwane                            | fallback "Internal server error" | ✅      |

**Przepływ obsługi w endpoincie:**
1. `ValidationError` → zwraca `error.response` i `error.status` (400)
2. `HttpError` → zwraca `{ error: error.message }` i `error.status` (401)
3. `Error` z nazwą zmapowaną w `getErrorMapping` → zwraca zmapowaną odpowiedź
4. Inne błędy → zwraca `"Internal server error"` (500)

## 8. Rozważania dotyczące wydajności

- Operacja UPDATE pojedynczego wiersza → pomijalne koszty.
- SELECT + UPDATE odbywają się w jednej sesji Supabase client (potwierdzone w implementacji).
- Indeks BTREE `(owner_id)` i PK `id` w `boards` zapewniają szybki lookup.
- Brak transakcji ani batch operations - wystarczająca prostota dla MVP.

## 9. Etapy wdrożenia

1. **Service** ✅
   - [x] Dodano funkcję `archiveBoard(supabase, userId, boardId)` w `board.service.ts` (linie 749-786).
   - [x] Dodano mapowanie błędu `BOARD_ALREADY_ARCHIVED` w `getErrorMapping` (linie 135-140 w `api-response.ts`).
2. **API Route** ✅
   - [x] Otworzono `src/pages/api/boards/[id].ts`.
   - [x] Dodano handler `DELETE` (linie 126-165).
   - [x] Użyto walidacji path param + auth check + `archiveBoard`.
3. **Validation** ✅
   - [x] `BoardIdParamSchema` już istniał w `boards.ts` i jest używany w endpoincie.
4. **Dokumentacja API** 📝
   - [ ] Aktualizacja swagger / readme (do zrobienia jeśli wymagane).
5. **Code review** ✅
   - [x] Implementacja zgodna z TypeScript types.
   - [x] Obsługa błędów spójna z innymi endpointami.

## 10. Różnice w stosunku do innych operacji na tablicy

### Archiwizacja vs. Aktualizacja metadanych

Istnieje celowa różnica w zakresie operacji:

**`archiveBoard` (DELETE /boards/:id):**
- Dotyczy **tylko jednego poziomu** (konkretny `boardId`)
- UPDATE z warunkiem: `.eq("id", boardId)`
- Komentarz w kodzie: "affect only this board level"

**`updateBoardMeta` (PATCH /boards/:id):**
- Dotyczy **wszystkich poziomów** tej samej tablicy
- UPDATE z warunkami: `.eq("owner_id", userId).eq("title", boardRow.title)`
- Aktualizuje title, isPublic, tags dla wszystkich level

### Uzasadnienie projektowe

Archiwizacja pojedynczego poziomu pozwala na większą elastyczność:
- Właściciel może usunąć tylko wybrane poziomy trudności
- Inne poziomy pozostają dostępne
- Zachowana spójność z filozofią "każdy poziom to osobny rekord"

Jeśli w przyszłości będzie potrzeba archiwizacji wszystkich poziomów naraz, można dodać osobny endpoint `/api/boards/:id/archive-all` lub parametr query `?allLevels=true`.
