# API Endpoint Implementation Plan: GET /boards/played

## 1. Przegląd punktu końcowego

Endpoint zwraca listę **publicznych i prywatnych** tablic (`boards`), w których zalogowany użytkownik uzyskał przynajmniej jeden wynik (`scores`). Każdy element zawiera ostatni zapisany czas użytkownika (`lastTime`). Zapewnia paginację, wyszukiwanie po tytule i tagach (`ilike`), filtrowanie po tagach oraz sortowanie. Dostęp wymaga uwierzytelnienia.

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

- Wejście: `ListPlayedBoardsQuery` – `z.infer<typeof ListPlayedBoardsSchema>` (identyczny jak `ListBoardsQuery` ale bez `ownerId`)
- Wyjście: `Paged<PlayedBoardDTO>` z `src/types.ts`

```ts
// PlayedBoardDTO extends BoardSummaryDTO but without 'archived' and with mandatory 'lastTime'
type PlayedBoardDTO = Omit<BoardSummaryDTO, "archived"> & {
  lastTime: ScoreRow["elapsed_ms"];
};
```

## 4. Szczegóły odpowiedzi

- **200 OK** – `application/json`
  ```jsonc
  {
    "data": [
      /* PlayedBoardDTO[] - każdy element zawiera lastTime */
    ],
    "meta": {
      "page": 1,
      "pageSize": 20,
      "total": 42,
    },
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
      - `boards!inner(scores)` inner join na tabelę `scores` wybierając `user_id, elapsed_ms`.
      - Filtry: `archived = false`, `scores.user_id = :userId`.
      - **Brak filtra** `is_public` – zwracamy zarówno publiczne, jak i prywatne tablice użytkownika.
      - Wyszukiwanie: `title.ilike.%q%` lub `tags.cs.{q}` (case-insensitive substring match).
      - Filtrowanie tagów: `contains(tags, tags[])`.
      - Sortowanie według mapy `columnMap`.
      - `range(from, to)` dla paginacji + `count: 'exact'`.
   2. Deduplikacja przez `Map<boardId, PlayedBoardDTO>` (obsługa wielu wyników per tablica).
   3. Dla każdej tablicy wybiera pierwszy `elapsed_ms` jako `lastTime`.
   4. Zwraca `{ data: Array.from(uniqueMap.values()), meta }`.
4. Handler zwraca `createSuccessResponse(paged)`.

## 6. Względy bezpieczeństwa

- **Autoryzacja**: Wymagany zalogowany użytkownik. Sprawdzane w handlerze i dodatkowo w RLS tabel `scores` oraz `boards`.
- **Dostęp do prywatnych tablic**: Endpoint zwraca zarówno publiczne, jak i prywatne tablice, ale **tylko te**, w których użytkownik ma wyniki. Dzięki inner join na `scores` z filtrem `scores.user_id = :userId`, użytkownik widzi tylko tablice, w których rzeczywiście grał, co jest bezpieczne (nawet jeśli tablica jest prywatna, użytkownik już wcześniej miał do niej dostęp).
- **SQL Injection**: Supabase klient parametryzuje zapytania; dodatkowo Zod ogranicza długości ciągów. Wyszukiwany tekst jest escapowany (`q.replace(/[%_\\]/g, '\\$&')`).
- **Rate Limiting**: (globalne; poza zakresem tego zadania).
- **Bezpieczne logowanie błędów**: nie wypisujemy danych wrażliwych. Logujemy `console.error()` analogicznie jak w istniejących endpointach.

## 7. Obsługa błędów

| Scenariusz              | Kod | Treść odpowiedzi                                 |
| ----------------------- | --- | ------------------------------------------------ |
| Nieautoryzowany dostęp  | 401 | `"Unauthorized"`                                 |
| Nieprawidłowe parametry | 400 | `{ error: "Validation failed", details: { … } }` |
| Brak wyników            | 200 | `data: [], meta.total: 0`                        |
| Błąd DB/RLS             | 500 | `"Internal server error"`                        |

## 8. Rozważania dotyczące wydajności

- Zapytanie wykonuje **inner join** na `scores` (indeks BTREE na `scores.user_id` i `scores.board_id` już istnieje).
- `boards` posiada indeks złożony `(is_public, archived, owner_id)` – filtr `archived` skorzysta z indeksu.
- Paginacja via `range` aby ograniczyć transfer.
- Wyszukiwanie przez `ilike` i `contains` na tagach (GIN index na tags jeśli istnieje).
- W przypadku duplikatów (`scores` wiele wierszy dla tej samej tablicy) deduplikacja odbywa się w aplikacji przez `Map<boardId>` — akceptowalny overhead dla typowych przypadków (użytkownik rzadko ma >100 wyników per tablica na stronie).

## 9. Etapy wdrożenia

1. **Validation**
   - [x] Dodano `ListPlayedBoardsSchema` w `src/lib/validation/boards.ts` (linie 139-145) – używa `.omit({ ownerId: true })` z `ListBoardsBaseSchema`.
2. **Typy**
   - [x] Eksportowano `ListPlayedBoardsQuery` (linia 145 w `validation/boards.ts`).
   - [x] Zdefiniowano `PlayedBoardDTO` w `src/types.ts` (linia 145) – rozszerza `BoardSummaryDTO` bez `archived` i z obowiązkowym `lastTime`.
3. **Service**
   - [x] Zaimplementowano `listBoardsPlayedByUser` w `src/lib/services/board.service.ts` (linie 315-410):
     - Inner join na `scores` z filtrem `user_id`.
     - Deduplikacja przez `Map`.
     - Zwraca `Paged<PlayedBoardDTO>`.
4. **Route**
   - [x] Stworzono `src/pages/api/boards/played.ts` (linie 1-60):
     - auth check (rzuca `HttpError` 401 jeśli brak użytkownika).
     - walidacja query przez `ListPlayedBoardsSchema.safeParse`.
     - wywołanie `listBoardsPlayedByUser`.
     - odpowiedzi (200/400/401/500) z `createSuccessResponse`/`createErrorResponse`.
5. **Utils**
   - [x] `HttpError` i `ValidationError` wykorzystane w handlerze.
6. **Testy jednostkowe / integracyjne**
   - [ ] Brak testów (future task).
7. **Dokumentacja**
   - [x] Plan zaimplementowany i zaktualizowany.
8. **Code Review & Merge**
   - [x] Endpoint wdrożony i działający.
