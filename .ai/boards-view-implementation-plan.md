# Plan implementacji widoków Public Boards i My Boards

## 1. Przegląd

Widok „Public Boards” umożliwia anonimowym i zalogowanym użytkownikom przeglądanie publicznie udostępnionych plansz (boards) oraz wyszukiwanie ich po tytule, tagach i autorze. Zapewnia listę kart z metadanymi, paginację oraz pole wyszukiwarki wykorzystujące komponent `SearchInput`.

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
PublicBoardsPage (route component)
├─ PageHeader
│  └─ SearchInput (reusable)
├─ BoardsGrid
│  ├─ BoardCard (× n)
│  └─ EmptyState (warunkowo)
└─ Pagination
```

## 4. Szczegóły komponentów

### PublicBoardsPage

- **Opis**: Kontener widoku; pobiera dane z API i zarządza stanem wyszukiwarki, paginacji oraz błędami.
- **Elementy**: wrapper `<main>`, nagłówek, siatka kart, paginacja.
- **Interakcje**: zmiana zapytania, zmiana strony.
- **Walidacja**: wstępna walidacja parametrów query przed wysłaniem zapytania (zgodnie z `ListBoardsSchema`).
- **Typy**: `BoardsViewState`, `ListBoardsQuery`.
- **Propsy**: brak (komponent routingu).

### SearchInput (reusable – `src/components/ui/SearchInput.tsx`)

- **Opis**: Komponent pola wyszukiwania z możliwością wprowadzania wielu fraz (np. tagów). Wartość to tablica `string[]`.
- **Elementy**: `<input type="text">`, przycisk clear, lista wpisanych tagów.
- **Interakcje**: `onChange(value: string[])`, usuwanie tagu, klawisz Enter dodaje frazę.
- **Walidacja**: każda fraza ≤ 100 znaków; max 10 tagów.
- **Typy**: `SearchInputProps`.
- **Propsy**:
  - `value: string[]`
  - `onChange: (value: string[]) => void`

### BoardsGrid

- **Opis**: Odpowiada za układ kart; reaguje na brak wyników.
- **Elementy**: div grid → `BoardCard`.
- **Interakcje**: brak (pas-through).
- **Walidacja**: —
- **Typy**: `BoardCardVM[]`.
- **Propsy**: `boards`, `loading`.

### BoardCard

- **Opis**: Przedstawia pojedynczą planszę; klikalna – przejście do `/boards/[id]`.
- **Elementy**: tytuł, autor, tagi, liczba kart, data.
- **Interakcje**: click → nawigacja.
- **Walidacja**: —
- **Typy**: `BoardCardVM`.
- **Propsy**: `board: BoardCardVM`.

### Pagination

- **Opis**: Kontrolka paginacji (← →, nr stron).
- **Elementy**: przyciski, label.
- **Interakcje**: click → `onPageChange`.
- **Walidacja**: page ∈ ⟨1,totalPages⟩.
- **Typy**: `PaginationMeta`.
- **Propsy**: `meta`, `onPageChange`.

### EmptyState

- **Opis**: Pokazuje wiadomość „Brak plansz” oraz poradę.
- **Elementy**: ikona, tekst.
- **Interakcje**: —
- **Walidacja**: —
- **Typy**: —
- **Propsy**: —

## 5. Typy

```ts
// View-model jednej planszy
export interface BoardCardVM {
  id: string;
  title: string;
  ownerDisplayName: string;
  cardCount: number;
  tags: string[];
  createdAt: string;
}

// Stan widoku
export interface BoardsViewState {
  query: string[]; // tablica fraz wyszukiwania
  page: number;
  pageSize: number;
  loading: boolean;
  error?: string;
  data: BoardCardVM[];
  meta?: PaginationMeta;
}

// Props SearchInput
export interface SearchInputProps {
  value: string[];
  onChange: (value: string[]) => void;
}
```

## 6. Zarządzanie stanem

- **Custom hook**: `usePublicBoards` (w `src/lib/hooks/usePublicBoards.ts`)
  - Wejście: `{ query: string[], page: number, pageSize: number }`
  - Wynik: `{ data, meta, loading, error, refetch }`
  - Implementuje debounce (300 ms) wyszukiwania oraz anulowanie poprzednich żądań.
- **Struktura stanu**: patrz `BoardsViewState`.

## 7. Integracja API

- **Endpoint**: `GET /api/boards`
- **Parametry**: mapowane z hooka do `ListBoardsQuery`.
- **Typ odpowiedzi**: `Paged<BoardSummaryDTO>`.
- **Mapowanie**: `BoardSummaryDTO` → `BoardCardVM` (formatowanie daty, nazwa autora – wymaga dodatkowego pola jeśli backend go zwraca lub placeholder „Unknown”).

## 8. Interakcje użytkownika

1. Użytkownik wpisuje frazę → `SearchInput` emituje `onChange` → aktualizacja `query` → wywołanie `refetch`.
2. Użytkownik klika numer strony → `page` update → wywołanie `refetch`.
3. Kliknięcie `BoardCard` → przejście do `/boards/[id]`.

## 9. Warunki i walidacja

- Fraza wyszukiwania ≤ 100 znaków; liczba fraz ≤ 10.
- `page` ≥ 1; `pageSize` ∈ ⟨1,100⟩.
- Przy wejściu na stronę parametry z URL są parsowane i walidowane – niepoprawne wartości resetowane do domyślnych.

## 10. Obsługa błędów

- **Walidacja parametrów**: wyświetla toast z informacją i przywraca domyślne parametry.
- **Błąd API (4xx/5xx/timeout)**: pokazuje `Toast` z komunikatem „Nie udało się pobrać plansz. Spróbuj ponownie.” oraz przycisk „Odśwież”.
- **Brak wyników**: renderuje `EmptyState`.

## 11. Kroki implementacji

1. **Typy**: dodaj `BoardCardVM`, `BoardsViewState`, `SearchInputProps` w `src/types.ts` lub dedykowanym module.
2. **Komponent SearchInput**:
   - Utwórz `src/components/ui/SearchInput.tsx` z interfejsem `SearchInputProps`.
   - Zaimplementuj obsługę wielu fraz oraz emitowanie `onChange`.
3. **Hook usePublicBoards**:
   - Stwórz w `src/lib/hooks/usePublicBoards.ts`.
   - Użyj `fetch`/`supabase` do wywołania `GET /api/boards`.
4. **Layout strony**: utwórz `src/pages/boards.astro`.
5. **Komponenty prezentacyjne**: `BoardCard`, `BoardsGrid`, `Pagination`, `EmptyState` w `src/components/boards/`.
6. **Integracja API**: w hooku mapuj odpowiedź do `BoardCardVM`.
7. **Routing & SEO**: dodaj meta title „Public Boards – Definition Quest”.
8. **Stylowanie**: użyj Tailwind, responsywność desktop-first.
9. **A11y**: aria-label dla inputu, klikalne elementy focusable, kontrast.
10. **Testy jednostkowe**: komponent `SearchInput` i hook `usePublicBoards` (mock fetch).
11. **Dokumentacja**: zaktualizuj README i Storybook (jeśli obecny) o `SearchInput`.

## 12. Header komponent

- Dodany komponent `Header` w `src/components/ui/Header.tsx` (100 vw, 80 px, cień). Aktualizuje strukturę widoku – `BoardsPage` będzie opakowany przez `Header` w layout.
