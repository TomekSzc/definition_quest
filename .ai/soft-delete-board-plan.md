# API Endpoint Implementation Plan: DELETE /boards/:id

## 1. Przegląd punktu końcowego
Endpoint umożliwia właścicielowi tablicy jej „miękkie” usunięcie poprzez ustawienie pola `archived = true`. Pozwala to ukryć tablicę przed innymi operacjami, zachowując jednocześnie dane w bazie.

## 2. Szczegóły żądania
- **Metoda HTTP:** DELETE  
- **URL pattern:** `/api/boards/:id`
- **Parametry Path:**  
  - `id` (UUID) – identyfikator tablicy (wymagany)
- **Body:** brak  
- **Nagłówki dodatkowe:**  
  - `Authorization: Bearer <jwt>` – wymagana sesja Supabase  

### Walidacja
1. `BoardIdParamSchema` (Zod) → poprawny UUID.  
2. `locals.user` musi być ustawiony (middleware auth).  

## 3. Wykorzystywane typy
| Typ | Plik | Zastosowanie |
| --- | ---- | ------------ |
| `BoardIdParamSchema` | `src/lib/validation/boards.ts` | walidacja `id` |
| `HttpError`, `ValidationError` | `src/lib/utils/http-error.ts` | obsługa błędów |
| `createSuccessResponse`, `createErrorResponse`, `getErrorMapping` | `src/lib/utils/api-response.ts` | standaryzacja odpowiedzi |
| (nowy) `archiveBoard` | `src/lib/services/board.service.ts` | logika biznesowa |

## 4. Szczegóły odpowiedzi
| Kod | Treść | Warunek |
| --- | ----- | ------- |
| 200 OK | `{ "message": "Board archived" }` | Archiwizacja zakończona sukcesem |
| 204 No Content *(opc.)* | brak | - jeśli zdecydujemy się na pusty body |
| 400 Bad Request | szczegóły walidacji | Niepoprawny UUID |
| 401 Unauthorized | `{ error: "Authentication required" }` | Brak sesji lub nie-owner |
| 404 Not Found | `{ error: "Board not found" }` | Brak rekordu lub brak dostępu |
| 409 Conflict *(opc.)* | `{ error: "Board already archived" }` | Tablica już archived |
| 500 Internal Server Error | `{ error: "Internal server error" }` | Nieoczekiwany błąd |

## 5. Przepływ danych
1. **Router** `DELETE /api/boards/:id`  
2. **Walidacja path params** → UUID.  
3. **Auth middleware** udostępnia `locals.user` i `locals.supabase`.  
4. **Service** `archiveBoard(supabase, userId, boardId)`  
   - SELECT owner_id, archived  
   - Autoryzacja & weryfikacja stanu  
   - UPDATE archived = true, updated_at = now()  
5. **Odpowiedź** 200 + JSON.  
6. **Logi** `console.error` przy wyjątkach.

## 6. Względy bezpieczeństwa
- Autentykacja JWT (Supabase).  
- Autoryzacja: tylko właściciel może archiwizować (sprawdzenie w service + RLS policy `owner_full_access`).  
- RLS w tabeli `boards` uniemożliwia UPDATE innym użytkownikom nawet przy próbie ominięcia API.  
- Ograniczenie enumeracji UUID: zwracamy 404 gdy rekord nie istnieje, 401 gdy nie-owner.  
- Brak ciała → mniejszy wektor XSS/CSRF. CSRF mitigujemy wymogiem tokena sesji.

## 7. Obsługa błędów
| Kod | Źródło | Mapa w `getErrorMapping` |
| --- | ------ | ------------------------ |
| 400 | `ValidationError` | `"VALIDATION_FAILED"` |
| 401 | `HttpError("Authentication required")`<br>`Error("NOT_OWNER")` | `"NOT_OWNER"` |
| 404 | `Error("BOARD_NOT_FOUND")` | `"BOARD_NOT_FOUND"` |
| 409 | `Error("BOARD_ALREADY_ARCHIVED")` | nowy wpis |
| 500 | inne | domyślnie |

## 8. Rozważania dotyczące wydajności
- Operacja UPDATE pojedynczego wiersza → pomijalne koszty.  
- Upewnić się, że SELECT + UPDATE odbywają się w jednej sesji supabase (już tak jest).  
- Indeks BTREE `(owner_id)` i PK `id` w `boards` zapewniają szybki lookup.

## 9. Etapy wdrożenia
1. **Service**  
   - [ ] Dodać funkcję `archiveBoard(supabase, userId, boardId)` w `board.service.ts`.  
   - [ ] Dodać mapowanie błędu `BOARD_ALREADY_ARCHIVED` w `getErrorMapping`.  
2. **API Route**  
   - [ ] Otworzyć `src/pages/api/boards/[id].ts`.  
   - [ ] Dodać handler `DELETE`.  
   - [ ] Użyć walidacji path param + auth + `archiveBoard`.  
3. **Validation**  
   - [ ] W razie potrzeby rozbudować `boards.ts` o Zod schemat wiadomości (nie dotyczy).   
4. **Dokumentacja API**  
   - [ ] Aktualizacja swagger / readme.  
5. **Code review**  
   - [ ] Lint & type-check.  
