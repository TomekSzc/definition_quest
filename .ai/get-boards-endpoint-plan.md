# API Endpoint Implementation Plan: GET /boards

## 1. Przegląd punktu końcowego
Enpoint służy do pobierania PAGO-nizowanej listy publicznych plansz (boards), z możliwością pełnotekstowego wyszukiwania, filtrowania po tagach, autorze oraz sortowania wyników. Dostęp anonimowy jest dozwolony – brak wymogu uwierzytelniania.

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
- `ListBoardsQuery` – *NOWY* typ pomocniczy (zod-infer) reprezentujący zwalidowane parametry zapytania.

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
      "tags": ["sql","js"],
      "createdAt": "2025-10-10T12:34:56Z",
      "updatedAt": "2025-10-12T08:00:00Z"
    }
  ],
  "meta": {
    "page": 1,
    "pageSize": 20,
    "total": 87
  }
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
   2. Buduje obiekt `filters` przekazywany do warstwy serwisowej.
3. **Service** `listPublicBoards` (`src/lib/services/board.service.ts` *nowa funkcja*):
   1. Startuje od `supabase.from("boards")` z selekcją kolumn potrzebnych do `BoardSummaryDTO`.
   2. Nakłada warunek `.eq("archived", false).eq("is_public", true)` (podwójne zabezpieczenie RLS).
   3. Opcjonalnie:
      - `fts` → `.textSearch("search_vector", q)`
      - `tags` → `.contains("tags", tags)` (Postgres GIN na tablicy)
      - `ownerId` → `.eq("owner_id", ownerId)`
   4. Sortuje: `.order(columnMap[sort], { ascending: direction==='asc' })`.
   5. Paginacja: `.range((page-1)*pageSize, page*pageSize-1)`.
   6. Równoległe zapytanie `COUNT(*)` via `.select("*, count:boards(*)", { head: true, count: "exact" })` aby uzyskać `total`.
4. **Handler** formatuje wynik do `Paged<BoardSummaryDTO>` i zwraca przez `createSuccessResponse`.

## 6. Względy bezpieczeństwa
- **Anonimowy dostęp**: brak JWT → brak `locals.user`; RLS polityka `public_read` ogranicza SELECT do `is_public=true AND archived=false`.
- **SQL injection**: Supabase klient parametryzuje zapytania; jednak trzeba walidować i whitelisto-wać wartości `sort`.
- **Denial-of-Service**: `pageSize` ograniczone do 100; aplikacja frontu ma debouncer; backend ma limit czasu 10 s.
- **Over-fetching**: zwracamy tylko niezbędne kolumny.

## 7. Obsługa błędów
| Scenariusz | Kod | Działanie |
|------------|-----|-----------|
| Nieprawidłowy typ / zakres parametru | 400 | Zwracamy listę błędów z `formatValidationErrors`. |
| Błąd Supabase (np. timeout) | 500 | Logujemy `error` i zwracamy 500. |

## 8. Rozważania dotyczące wydajności
- Indeksy już istnieją: `BTREE (is_public, archived, owner_id)` i `GIN search_vector`, `GIN tags` – pokrywają główne filtry.
- **Paginacja** via `range` + `order` ogranicza liczbę wierszy.
- **COUNT(*)** przy dużych tabelach bywa kosztowne; alternatywa: `count: "planned"` lub szacowania, ale MVP używa `exact`.
- Możliwe future-work: materialized view dla wyszukiwań popularnych.

## 9. Etapy wdrożenia
1. **Validation**
   - [ ] Rozszerz `boards.ts` o `ListBoardsSchema` & export typu `ListBoardsQuery`.
2. **Service layer**
   - [ ] Dodaj `listPublicBoards(supabase, query): Promise<Paged<BoardSummaryDTO>>` w `board.service.ts`.
3. **API route**
   - [ ] Uzupełnij `GET` handler w `src/pages/api/boards/index.ts` (obok istniejącego `POST`).
4. **Unit tests** (opcjonalnie w MVP)
   - [ ] Mock Supabase → sprawdź prawidłowe zapytania + walidację.
5. **Docs / README**
   - [ ] Opisz parametry w Swagger / .ai docs.
6. **Code review & deploy**
   - [ ] Sprawdź logi, metryki.

---
Ten plan zapewnia pełne pokrycie wymagań, bezpieczeństwa oraz wydajności endpointu. Dzięki modularnej budowie (walidacja → serwis → handler) kod pozostaje łatwy w utrzymaniu i testowaniu.
