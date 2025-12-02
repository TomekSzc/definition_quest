# API Endpoint Implementation Plan: GET /boards

## 1. Przegląd punktu końcowego

Enpoint służy do pobierania PAGO-nizowanej listy plansz (boards), z możliwością wyszukiwania, filtrowania po tagach, autorze oraz sortowania wyników. Dostęp anonimowy jest dozwolony – brak wymogu uwierzytelniania.

**Logika dostępu**:

- **Gdy `ownerId` jest podany**: zwraca wszystkie plansze (publiczne + prywatne) tego właściciela
- **Bez `ownerId`**: zwraca tylko publiczne, niearchiwowane plansze

**Ścieżka produkcyjna**: `/api/boards`  
Astro Server Endpoints mapują folder `src/pages/api/boards/index.ts` na powyższą ścieżkę.

## 2. Szczegóły żądania

- **Metoda HTTP**: `GET`
- **URL**: `/api/boards`
- **Parametry zapytania** (`?key=value`):
  | Parametr | Typ | Wymagane | Domyślna wartość | Walidacja | Opis |
  |----------|-----|----------|------------------|-----------|------|
  | `page` | number \>= 1 | nie | `1` | Integer, min 1 | Numer strony (1-based). |
  | `pageSize` | number 1‒100 | nie | `20` | Integer, 1≤n≤100 | Liczba elementów na stronę. |
  | `q` | string | nie | – | max 100 znaków | Fraza do FTS po `title`. |
  | `tags` | string | nie | – | lista ≤10 tagów, każdy ≤20 zn. | Filtr po tagach (CSV). |
  | `ownerId` | UUID | nie | – | UUID v4 | Filtr po autorze. |
  | `sort` | enum | nie | `created` | `created \| updated \| cardCount` | Kolumna sortowania. |
  | `direction` | enum | nie | `desc` | `asc \| desc` | Kierunek sortowania. |

**Request Body**: brak

## 3. Wykorzystywane typy

- `BoardSummaryDTO` (z `src/types.ts`) – reprezentacja planszy w liście.
- `PaginationMeta` oraz wrapper `Paged<T>` – metadane paginacji.
- `ListBoardsQuery` – _NOWY_ typ pomocniczy (zod-infer) reprezentujący zwalidowane parametry zapytania.

```ts
export interface ListBoardsQuery {
  page: number;
  pageSize: number;
  q?: string;
  tags?: string[]; // już parsowane na tablicę
  ownerId?: string;
  sort: "created" | "updated" | "cardCount";
  direction: "asc" | "desc";
}
```

## 4. Szczegóły odpowiedzi

- **Sukces 200**

```jsonc
{
  "data": [
    {
      "id": "…",
      "ownerId": "…",
      "title": "…",
      "cardCount": 24,
      "level": 1,
      "isPublic": true,
      "archived": false,
      "tags": ["sql", "js"],
      "createdAt": "2025-10-10T12:34:56Z",
      "updatedAt": "2025-10-12T08:00:00Z",
    },
  ],
  "meta": {
    "page": 1,
    "pageSize": 20,
    "total": 87,
  },
}
```

- **Błędy**
  | Kod | Sytuacja | Treść JSON |
  |-----|----------|------------|
  | 400 | Nieprawidłowe parametry (np. pageSize>100) | `{ "error": "Validation failed", "details": { … } }` |
  | 500 | Nieoczekiwany błąd serwera / DB | `{ "error": "Internal server error" }` |

> 401 i 404 nie występują w tym endpoint-cie (dostęp anonimowy, zasób zawsze istnieje). Zwracamy 404 tylko dla innych ścieżek.

## 5. Przepływ danych

1. **Walidacja zapytania** – Zod schema `ListBoardsSchema` w `src/lib/validation/boards.ts` parsuje oraz domyślnia parametry.
2. **Handler GET** (`src/pages/api/boards/index.ts`):
   1. Parsuje `url.searchParams` → `ListBoardsSchema.safeParse`.
   2. W przypadku błędu walidacji rzuca `ValidationError` z listą błędów.
   3. Wywołuje `listPublicBoards(locals.supabase, parseResult.data)`.
3. **Service** `listPublicBoards` (`src/lib/services/board.service.ts`):
   1. Startuje od `supabase.from("boards")` z selekcją kolumn potrzebnych do `BoardSummaryDTO` oraz `{ count: "exact" }`.
   2. Nakłada warunek `.eq("archived", false)`.
   3. **Logika dostępu**:
      - Jeśli `ownerId` podany → `.eq("owner_id", ownerId)` (zwraca wszystkie plansze właściciela)
      - Jeśli brak `ownerId` → `.eq("is_public", true)` (tylko publiczne)
   4. **Wyszukiwanie** (parametr `q`):
      - Escapuje znaki specjalne pattern matching (`%`, `_`, `\`)
      - Używa `.or(\`title.ilike.%${escapedQ}%,tags.cs.{${escapedQ}}\`)`
      - Wyszukuje case-insensitive substring w tytule LUB dokładne dopasowanie w tagach
      - ⚠️ **Zmiana względem planu**: nie używa FTS `search_vector`, tylko `ILIKE` + `contains`
   5. **Filtrowanie po tagach** (parametr `tags`):
      - `.contains("tags", tags)` (Postgres GIN na tablicy)
   6. Sortuje: `.order(columnMap[sort], { ascending: direction==='asc' })`.
   7. Paginacja: `.range(from, to)` gdzie `from = (page-1)*pageSize`, `to = page*pageSize-1`.
   8. `COUNT` jest pobierany jednocześnie dzięki opcji `count: "exact"` w głównym zapytaniu.
4. **Handler** formatuje wynik do `Paged<BoardSummaryDTO>` i zwraca przez `createSuccessResponse`.

## 6. Względy bezpieczeństwa

- **Anonimowy dostęp**: dozwolony; brak wymogu JWT.
- **Dostęp do prywatnych plansz**: gdy `ownerId` jest podany, endpoint zwraca zarówno publiczne jak i prywatne plansze tego użytkownika. To zachowanie jest zamierzone i pozwala właścicielowi przeglądać swoje plansze, ale **nie** wymusza autoryzacji – każdy może zobaczyć czyjeś prywatne plansze jeśli zna `ownerId`. RLS polityki na poziomie bazy danych powinny być skonfigurowane odpowiednio.
- **SQL injection**: Supabase klient parametryzuje zapytania; wartości `sort` są walidowane przez Zod enum; parametr `q` jest escapowany przed użyciem w `ILIKE`.
- **Denial-of-Service**: `pageSize` ograniczone do 100 przez walidację Zod; aplikacja frontu powinna mieć debouncer; backend ma limit czasu.
- **Over-fetching**: zwracamy tylko niezbędne kolumny zdefiniowane w `select()`.

## 7. Obsługa błędów

| Scenariusz                           | Kod | Działanie                                         |
| ------------------------------------ | --- | ------------------------------------------------- |
| Nieprawidłowy typ / zakres parametru | 400 | Zwracamy listę błędów z `formatValidationErrors`. |
| Błąd Supabase (np. timeout)          | 500 | Logujemy `error` i zwracamy 500.                  |

## 8. Rozważania dotyczące wydajności

- **Indeksy**: Zakładamy istnienie indeksów: `BTREE (is_public, archived, owner_id)` i `GIN tags`.
- **Wyszukiwanie**: Implementacja używa `ILIKE` dla case-insensitive substring search zamiast FTS `search_vector`. `ILIKE` z wildcard na początku (`%term%`) nie może wykorzystać standardowych indeksów B-tree, więc dla dużych tabel może być wolne. Rozważenia na przyszłość:
  - Dodanie trigram indeksu (`pg_trgm`) dla wydajnego `ILIKE`
  - Implementacja pełnotekstowego wyszukiwania z `tsvector` i `GIN` indeksem
- **Paginacja** via `range(from, to)` + `order` ogranicza liczbę zwracanych wierszy.
- **COUNT(\*)** pobierany jednocześnie z danymi przez opcję `{count: "exact"}` w Supabase. Przy bardzo dużych tabelach może być kosztowne; alternatywa: `count: "planned"` (szacunkowy) lub `count: "estimated"`.
- **Future-work**: materialized view dla popularnych kombinacji filtrów/wyszukiwań.

## 9. Etapy wdrożenia

1. **Validation**
   - [x] Rozszerz `boards.ts` o `ListBoardsSchema` & export typu `ListBoardsQuery`. ✅ Zaimplementowane
2. **Service layer**
   - [x] Dodaj `listPublicBoards(supabase, query): Promise<Paged<BoardSummaryDTO>>` w `board.service.ts`. ✅ Zaimplementowane (linie 234-309)
3. **API route**
   - [x] Uzupełnij `GET` handler w `src/pages/api/boards/index.ts` (obok istniejącego `POST`). ✅ Zaimplementowane (linie 27-55)
4. **Unit tests** (opcjonalnie w MVP)
   - [ ] Mock Supabase → sprawdź prawidłowe zapytania + walidację.
5. **Docs / README**
   - [x] Opisz parametry w .ai docs. ✅ Ten dokument
6. **Code review & deploy**
   - [ ] Sprawdź logi, metryki w środowisku produkcyjnym.

---

## 10. Różnice między planem a implementacją

Podczas implementacji wprowadzono następujące zmiany względem pierwotnego planu:

### 10.1. Logika dostępu z parametrem `ownerId`

**Plan**: Endpoint zwraca tylko publiczne, niearchiwowane plansze.  
**Implementacja**:

- Gdy `ownerId` jest podany → zwraca **wszystkie** plansze (publiczne + prywatne) tego właściciela
- Bez `ownerId` → zwraca tylko publiczne plansze

**Implikacje bezpieczeństwa**: Każdy użytkownik (nawet anonimowy) może zobaczyć czyjeś prywatne plansze znając `ownerId`. To zachowanie wymaga weryfikacji z wymaganiami biznesowymi.

### 10.2. Mechanizm wyszukiwania

**Plan**: Pełnotekstowe wyszukiwanie (FTS) z `search_vector` i operatorem `.textSearch()`.  
**Implementacja**:

- Substring search przez `ILIKE` na kolumnie `title`
- Exact/substring match w tablicy `tags` przez `contains` (`cs` operator)
- Escape znaków specjalnych pattern matching (`%`, `_`, `\`)
- Query: `.or(\`title.ilike.%${escapedQ}%,tags.cs.{${escapedQ}}\`)`

**Implikacje wydajności**: `ILIKE` z wildcardami na obu końcach nie wykorzystuje standardowych indeksów. Dla lepszej wydajności rozważ trigram index (`pg_trgm`) lub przejście na FTS.

### 10.3. Sposób pobierania COUNT

**Plan**: Równoległe zapytanie dla `COUNT(*)`.  
**Implementacja**: Opcja `{count: "exact"}` w głównym zapytaniu Supabase – prostsze i atomowe podejście.

### 10.4. Duplikacja typu `ListBoardsQuery`

Typ `ListBoardsQuery` jest zdefiniowany dwukrotnie:

- W `src/lib/validation/boards.ts` (linia 133) – jako `z.infer<typeof ListBoardsSchema>`
- W `src/types.ts` (linie 293-301) – jako `interface` z opcjonalnymi polami

**Rekomendacja**: Rozważ usunięcie duplikacji i import typu z walidacji do `types.ts`.

---

Ten plan oraz notatki o różnicach zapewniają pełne pokrycie wymagań, bezpieczeństwa oraz wydajności endpointu. Dzięki modularnej budowie (walidacja → serwis → handler) kod pozostaje łatwy w utrzymaniu i testowaniu.
