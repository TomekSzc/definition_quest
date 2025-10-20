# API Endpoint Implementation Plan: GET /boards/played

## 1. Przegląd punktu końcowego
Endpoint zwraca listę **publicznych** tablic (`boards`), w których zalogowany użytkownik uzyskał przynajmniej jeden wynik (`scores`). Zapewnia paginację, pełnotekstowe wyszukiwanie po tytule, filtrowanie po tagach oraz sortowanie. Dostęp wymaga uwierzytelnienia.

## 2. Szczegóły żądania
- Metoda HTTP: **GET**
- URL (zewnętrzny): `/boards/played`
- Ścieżka w repozytorium: `src/pages/api/boards/played.ts` ⇒ finalny URL `/api/boards/played`
- Wymagane nagłówki:
  - `Authorization: Bearer <jwt>` – ustawiany globalnie przez middleware.
- Parametry zapytania (query‐string):
  | Parametr | Typ | Domyślnie | Zakres/Walidacja | Opis |
  |----------|-----|-----------|------------------|------|
  | `page` | number | `1` | `≥ 1` | numer strony (paginacja) |
  | `pageSize` | number | `20` | `1–100` | liczba elementów per strona |
  | `q` | string | — | `≤ 100 zn.` | pełnotekstowe wyszukiwanie po `title` |
  | `tags` | string | — | max 10 tagów, każdy `≤ 20 zn.` | przecinkowo‐rozdzielone tagi |
  | `sort` | enum | `created` | `created | updated | cardCount` | pole sortowania |
  | `direction` | enum | `desc` | `asc | desc` | kierunek sortowania |

## 3. Wykorzystywane typy
- Wejście: `ListPlayedBoardsQuery` (nowy) – `z.infer<typeof ListPlayedBoardsSchema>`
- Wyjście: `Paged<BoardSummaryDTO>` z `src/types.ts`

```ts
// example
interface PlayedBoardsResponse extends Paged<BoardSummaryDTO> {}
```

## 4. Szczegóły odpowiedzi
- **200 OK** – `application/json`
  ```jsonc
  {
    "data": [ /* BoardSummaryDTO[] */ ],
    "meta": {
      "page": 1,
      "pageSize": 20,
      "total": 42
    }
  }
  ```
- **401 Unauthorized** – brak/lub nieważny token
- **400 Bad Request** – niepoprawne parametry (format/zakres)
- **500 Internal Server Error** – nieoczekiwane problemy (DB, serwer)

## 5. Przepływ danych
1. Middleware sprawdza autentykację i w `locals.user` ustawia użytkownika.
2. Handler `GET /api/boards/played`:
   1. Wyciąga `user` – jeśli brak → 401.
   2. Waliduje `url.searchParams` przy pomocy `ListPlayedBoardsSchema`.
   3. Wywołuje `listBoardsPlayedByUser(locals.supabase, user.id, query)` w warstwie service.
3. Service (`board.service.ts`):
   1. Buduje zapytanie:
      - `boards!inner(scores)` join na tabelę `scores` (RLS wymusza `scores.user_id = auth.uid()`, dodatkowo filtr `scores.user_id = :userId`).
      - Filtry: `archived = false`, `is_public = true`, `textSearch(search_vector, q)`, `contains(tags, tags[])`.
      - Sortowanie według mapy `columnMap`.
      - `distinct on (boards.id)` aby uniknąć duplikatów przy wielu wynikach.
      - `range(from, to)` dla paginacji + `count: 'exact'`.
   2. Mapuje rekords na `BoardSummaryDTO`.
   3. Zwraca `{ data, meta }`.
4. Handler zwraca `createSuccessResponse(paged)`.

## 6. Względy bezpieczeństwa
- **Autoryzacja**: Wymagany zalogowany użytkownik. Sprawdzane w handlerze i dodatkowo w RLS tabel `scores` oraz `boards`.
- **Eksfiltracja prywatnych tablic**: Zapytanie wymusza `boards.is_public = true`, zabezpieczając przed wyciekiem niepublicznych treści.
- **SQL Injection**: Supabase klient parametryzuje zapytania; dodatkowo Zod ogranicza długości ciągów.
- **Rate Limiting**: (globalne; poza zakresem tego zadania).
- **Bezpieczne logowanie błędów**: nie wypisujemy danych wrażliwych. Logujemy `console.error()` analogicznie jak w istniejących endpointach.

## 7. Obsługa błędów
| Scenariusz | Kod | Treść odpowiedzi |
|------------|-----|------------------|
| Nieautoryzowany dostęp | 401 | `"Unauthorized"` |
| Nieprawidłowe parametry | 400 | `{ error: "Validation failed", details: { … } }` |
| Brak wyników | 200 | `data: [], meta.total: 0` |
| Błąd DB/RLS | 500 | `"Internal server error"` |

## 8. Rozważania dotyczące wydajności
- Zapytanie wykonuje **inner join** na `scores` (indeks BTREE na `scores.user_id` i `scores.board_id` już istnieje).
- `boards` posiada indeks złożony `(is_public, archived, owner_id)` – filtr `is_public/archived` skorzysta z indeksu.
- Paginate via `range` aby ograniczyć transfer.
- FTS po `search_vector` wykorzystuje GIN.
- W przypadku duplikatów (`scores` wiele wierszy) używamy `distinct on (boards.id)` — koszt minimalny przy indeksie PK.

## 9. Etapy wdrożenia
1. **Validation**
   - [ ] Dodaj `ListPlayedBoardsSchema` w `src/lib/validation/boards.ts` (kopiuj `ListBoardsSchema`, usuń `ownerId`).
2. **Typy**
   - [ ] Eksportuj `ListPlayedBoardsQuery`.
3. **Service**
   - [ ] Implementuj `listBoardsPlayedByUser` w `src/lib/services/board.service.ts` (reusing mapping logic).
4. **Route**
   - [ ] Stwórz `src/pages/api/boards/played.ts`:
     - auth check
     - walidacja query
     - wywołanie service
     - odpowiedzi (200/400/401/500) z utili.
5. **Utils (optional)**
   - [ ] Upewnij się, że `getErrorMapping` posiada klucz `UNAUTHORIZED` jeśli nie istnieje.
6. **Testy jednostkowe / integracyjne** (future task):
   - [ ] Service – zwraca poprawne wyniki/paginację.
   - [ ] Handler – 401 bez auth, 400 invalid params, 200 OK.
7. **Dokumentacja**
   - [ ] Zaktualizuj README / OpenAPI spec.
8. **Code Review & Merge**
   - [ ] Lint/format, CI green, approve, merge.
