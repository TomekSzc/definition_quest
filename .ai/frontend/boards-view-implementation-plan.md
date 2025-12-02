# Plan implementacji widoków Public Boards i My Boards

## 1. Przegląd

Widoki „Public Boards" (`/boards`) i „My Boards" (`/my-boards`) umożliwiają przeglądanie plansz oraz wyszukiwanie ich po tytule. Widok Public Boards pokazuje wszystkie publiczne plansze, podczas gdy My Boards filtruje tylko plansze należące do zalogowanego użytkownika.

Oba widoki współdzielą tę samą implementację UI, różniąc się tylko parametrem `ownerId` w zapytaniu API. Używają RTK Query do pobierania danych, synchronizują parametry wyszukiwania z URL, oraz oferują paginację. Właściciele plansz mają dostęp do funkcji edycji i usuwania swoich plansz bezpośrednio z listy.

## 2. Routing widoków

Public Boards:

- Ścieżka: `/boards`
- Plik Astro: `src/pages/boards.astro`

My Boards (widok prywatny – wymaga zalogowania):

- Ścieżka: `/my-boards`
- Plik Astro: `src/pages/my-boards.astro`
- Różnica w zapytaniu: `ownerId` ustawiany na `auth.user.id` (reszta parametrów i UI takie same jak w Public Boards)

## 3. Struktura komponentów

```
BoardsPage / MyBoardsPage (route component)
├─ SearchInput (reusable)
├─ BoardsList
│  ├─ BoardListTile (× n)
│  └─ EmptyState (zintegrowany)
└─ Pagination
```

## 4. Szczegóły komponentów

### BoardsPage / MyBoardsPage

- **Opis**: Kontener widoku; pobiera dane z API poprzez RTK Query i zarządza parametrami URL wyszukiwarki oraz paginacji.
- **Elementy**: wrapper `<div>`, sekcja kontenera, SearchInput, BoardsList, Pagination.
- **Interakcje**: zmiana zapytania przez SearchInput, zmiana strony przez Pagination.
- **Stan**: Używa `useListPublicBoardsQuery` z RTK Query oraz `useQueryParams` do zarządzania parametrami URL.
- **Typy**: `ListBoardsQuery`, `BoardSummaryDTO`, `Paged`.
- **Propsy**: brak (komponent routingu).
- **Różnica My Boards**: Dodaje `ownerId` z Redux store (`useAppSelector`) do parametrów query.

### SearchInput (reusable – `src/components/ui/SearchInput.tsx`)

- **Opis**: Komponent prostego pola wyszukiwania z debounce (300ms). Wartość to pojedynczy `string`.
- **Elementy**: `<input type="text">`, przycisk clear (X) widoczny gdy jest wartość.
- **Interakcje**: `onChange(value: string)` wywoływane z 300ms opóźnieniem, przycisk clear resetuje wartość.
- **Implementacja**: Używa `useRefValue` hook do śledzenia wartości ref oraz `lodash.debounce` do opóźnienia.
- **Typy**: `ISearchInputProps { onChange: (value: string) => void; initialValue?: string; }`.
- **Propsy**:
  - `onChange: (value: string) => void`
  - `initialValue?: string` (ustawiane z parametrów URL)

### BoardsList (`src/components/ui/Boards/BoardsList.tsx`)

- **Opis**: Wyświetla listę plansz w układzie pionowym; obsługuje stan ładowania i pusty stan.
- **Elementy**: wrapper flex-column → `BoardListTile` dla każdej planszy, komunikaty dla stanów loading/empty.
- **Interakcje**: brak (pas-through do BoardListTile).
- **Stany**: Loading ("Ładowanie…"), Empty ("Brak plansz do wyświetlenia.").
- **Typy**: `BoardSummaryDTO[]`.
- **Propsy**: `boards: BoardSummaryDTO[] | undefined`, `loading: boolean`.

### BoardListTile (`src/components/ui/Boards/BoardListTile.tsx`)

- **Opis**: Przedstawia pojedynczą planszę w formacie kafelka; klikalna – przejście do `/boards/[id]`.
- **Elementy**:
  - Avatar z pierwszą literą tytułu
  - Tytuł (skrócony do 22 znaków na mobile)
  - Poziom (level)
  - Tagi (1 na mobile, 2 na desktop, z "…" jeśli więcej)
  - Przyciski Edit/Delete (tylko dla właściciela)
  - Czas ostatniego wyniku (lastTime, tylko dla właściciela)
- **Interakcje**: click → nawigacja, Edit → `/boards/[id]/edit`, Delete → otwiera `DeleteBoardDialog`.
- **Walidacja**: Sprawdza czy użytkownik jest właścicielem (`authUserId === board.ownerId`).
- **Typy**: `BoardSummaryDTO`.
- **Propsy**: `board: BoardSummaryDTO`.

### Pagination (`src/components/ui/Pagination.tsx`)

- **Opis**: Kontrolka paginacji z przyciskami "Poprzednia"/"Następna" oraz licznikiem stron.
- **Elementy**: przyciski nawigacyjne, label `{page} / {totalPages}`.
- **Interakcje**: click → `onPageChange(page - 1)` lub `onPageChange(page + 1)`.
- **Walidacja**: Przyciski disabled gdy page === 1 lub page === totalPages. Komponent nie renderuje się gdy `total <= pageSize`.
- **Typy**: `PaginationMeta`.
- **Propsy**: `meta?: PaginationMeta`, `onPageChange: (page: number) => void`.

## 5. Typy

Typy zdefiniowane w `src/types.ts`:

```ts
// BoardSummaryDTO - używany bezpośrednio zamiast BoardCardVM
export interface BoardSummaryDTO {
  id: string;
  ownerId: string;
  title: string;
  cardCount: number;
  level: number;
  isPublic: boolean;
  archived: boolean;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  lastTime?: number; // elapsed_ms, tylko dla Played boards
}

// Paginacja
export interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
}

// Odpowiedź API
export interface Paged<T> {
  data: T[];
  meta: PaginationMeta;
}

// Query parameters dla GET /api/boards
export interface ListBoardsQuery {
  page: number;
  pageSize: number;
  q?: string;
  tags?: string[];
  ownerId?: string;
  sort?: "created" | "updated" | "cardCount";
  direction?: "asc" | "desc";
}

// Props SearchInput (rzeczywista implementacja)
interface ISearchInputProps {
  onChange: (value: string) => void;
  initialValue?: string;
}
```

**Uwaga**: Typy `BoardCardVM`, `BoardsViewState` i `SearchInputProps` (ze string[]) są zdefiniowane w `types.ts`, ale nie są używane w implementacji. Faktycznie wykorzystywane są `BoardSummaryDTO`, RTK Query state i `ISearchInputProps`.

## 6. Zarządzanie stanem

### Redux Toolkit Query

- **Hook**: `useListPublicBoardsQuery` z RTK Query (w `src/store/api/apiSlice.ts`)
  - Wejście: `Partial<ListBoardsQuery>`
  - Wynik: `{ data: Paged<BoardSummaryDTO>, isFetching, refetch }`
  - Automatyczna cache'owanie i ponowne pobieranie danych przy zmianie parametrów.

### Zarządzanie parametrami URL

- **Hook**: `useQueryParams<{ q?: string; page?: string }>()` (w `src/hooks/useQueryParams.ts`)
  - Zwraca: `{ params, setQueryParams }`
  - Synchronizuje parametry wyszukiwania z URL (history.pushState/replaceState).
  - Parametry z URL są przekazywane do RTK Query hook.

### Debounce

- Implementowany w komponencie `SearchInput` (300ms delay) przy użyciu `lodash.debounce`.

### Store Redux (tylko My Boards)

- `useAppSelector((state) => state.auth.user?.id)` do pobrania userId dla filtrowania po `ownerId`.

## 7. Integracja API

- **Endpoint**: `GET /api/boards`
- **Parametry**: Konstruowane z `ListBoardsQuery` i serializowane do URL query string w RTK Query.
  - `page`, `pageSize`, `q` (search query), `tags`, `ownerId`, `sort`, `direction`
- **Typ odpowiedzi**: `Paged<BoardSummaryDTO>`.
- **Mapowanie**: Brak - `BoardSummaryDTO` używane bezpośrednio w UI. Backend zwraca `ownerId` ale nie zwraca `ownerDisplayName`.

## 8. Interakcje użytkownika

1. **Wyszukiwanie**: Użytkownik wpisuje tekst → `SearchInput` po 300ms debounce emituje `onChange` → `handleQueryChange` aktualizuje parametry URL (q, page=1) przez `setQueryParams` → automatyczny refetch RTK Query.
2. **Paginacja**: Użytkownik klika "Następna"/"Poprzednia" → `Pagination` wywołuje `onPageChange(page)` → `handlePageChange` aktualizuje parametr URL (page) → automatyczny refetch RTK Query.
3. **Nawigacja do planszy**: Kliknięcie `BoardListTile` → przejście do `/boards/[id]`.
4. **Edycja planszy** (właściciel): Kliknięcie ikony Edit → przejście do `/boards/[id]/edit`.
5. **Usuwanie planszy** (właściciel): Kliknięcie ikony Delete → otwiera dialog `DeleteBoardDialog` → potwierdzenie → API call → reload strony.

## 9. Warunki i walidacja

- **Parametry URL**: Parsowane przez `useQueryParams`, używane bezpośrednio bez dodatkowej walidacji frontendu (walidacja na backendzie).
- **Wartości domyślne**: Zdefiniowane w `DEFAULT_PAGINATION` (page: 1, pageSize: 8).
- **SearchInput**: Brak limitów długości frazy na frontendzie, debounce 300ms.
- **Pagination**: Przyciski disabled gdy na pierwszej/ostatniej stronie, komponent ukryty gdy `total <= pageSize`.

## 10. Obsługa błędów

- **Błąd API**: Obsługiwane automatycznie przez RTK Query middleware (`baseQueryWithReauth`).
  - Błędy 401: Automatyczna próba odświeżenia tokena lub logout.
  - Inne błędy: Automatyczny toast z Redux (`showToast`) z komunikatem błędu z backendu lub domyślnym "Wystąpił błąd zapytania".
- **Brak wyników**: `BoardsList` renderuje komunikat "Brak plansz do wyświetlenia.".
- **Stan ładowania**: `BoardsList` renderuje komunikat "Ładowanie…" gdy `isFetching === true`.

## 11. Zrealizowana implementacja

### Zaimplementowane komponenty i pliki:

1. **Strony Astro**:
   - `src/pages/boards.astro` - importuje `BoardsPage` z `client:load`
   - `src/pages/my-boards.astro` - importuje `MyBoardsPage` z `client:load`

2. **Komponenty React**:
   - `src/components/pages/BoardsPage.tsx` - główny komponent widoku Public Boards
   - `src/components/pages/MyBoardsPage.tsx` - główny komponent widoku My Boards (+ filter ownerId)
   - `src/components/ui/SearchInput.tsx` - prosty input z debounce (string, nie string[])
   - `src/components/ui/Boards/BoardsList.tsx` - lista plansz z obsługą stanów
   - `src/components/ui/Boards/BoardListTile.tsx` - kafelek pojedynczej planszy
   - `src/components/ui/Pagination.tsx` - paginacja z przyciskami Poprzednia/Następna

3. **Redux/RTK Query**:
   - `src/store/api/apiSlice.ts` - zawiera `listPublicBoards` query
   - Hook: `useListPublicBoardsQuery` - automatyczne cache'owanie i refetch

4. **Hooki**:
   - `src/hooks/useQueryParams.ts` - synchronizacja parametrów z URL
   - `src/hooks/useRefValue.ts` - używany w SearchInput
   - `src/hooks/useTime.ts` - konwersja ms na minuty (używany w BoardListTile)

5. **Typy**:
   - `src/types.ts` - zawiera wszystkie typy DTO, w tym `BoardSummaryDTO`, `ListBoardsQuery`, `PaginationMeta`, `Paged<T>`
   - Uwaga: Typy `BoardCardVM`, `BoardsViewState`, `SearchInputProps` (ze string[]) są zdefiniowane, ale nie są używane w rzeczywistej implementacji

6. **Stałe**:
   - `src/constants/pagination.ts` - `DEFAULT_PAGINATION` (page: 1, pageSize: 8)

7. **Stylowanie**: Tailwind CSS z custom properties CSS (`--color-primary`, `--color-secondary`), responsywność (mobile-first z breakpointem md:)

8. **A11y**: aria-label dla inputu wyszukiwania i paginacji, focusable przyciski z focus-visible:ring

### Różnice od pierwotnego planu:

- ❌ Nie zaimplementowano multi-tag input (string[]) - zamiast tego prosty string input
- ❌ Nie zaimplementowano custom hooka `usePublicBoards` - użyto RTK Query
- ❌ Nie zaimplementowano `BoardCardVM` - używany jest bezpośrednio `BoardSummaryDTO`
- ❌ Nie zaimplementowano osobnego komponentu `PageHeader`
- ❌ Nie zaimplementowano osobnego komponentu `EmptyState` - zintegrowany w `BoardsList`
- ✅ Zaimplementowano zarządzanie stanem przez Redux/RTK Query
- ✅ Zaimplementowano synchronizację parametrów z URL
- ✅ Zaimplementowano debounce w SearchInput
- ✅ Zaimplementowano funkcjonalność Edit/Delete dla właściciela planszy

## 12. Layout

- Strony `boards.astro` i `my-boards.astro` używają wspólnego layoutu `Layout.astro` z `src/layouts/Layout.astro`.
- Layout jest globalny dla całej aplikacji i prawdopodobnie zawiera wspólne elementy (header, navigation).
- Komponenty React (`BoardsPage`, `MyBoardsPage`) są renderowane z dyrektywą `client:load` dla pełnej interaktywności.
- Padding `md:pl-[80px]` w sekcji kontenera sugeruje obecność bocznego sidebaru na desktop.
