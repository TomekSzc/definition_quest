# Plan implementacji widoku „Played Boards”

## 1. Przegląd

Widok „Played Boards" prezentuje listę **wszystkich plansz** (publicznych i prywatnych), w których zalogowany użytkownik ma zapisany przynajmniej jeden wynik (score). Celem widoku jest umożliwienie graczowi szybkiego odnalezienia plansz, które już rozwiązywał, ponownego ich uruchomienia oraz porównania swojego ostatniego czasu (lastTime). 

Funkcjonalnie widok stanowi wariant istniejącego widoku `BoardsPage`, korzysta jednak z innego endpointu (`GET /api/boards/played`), który:
- Filtruje plansze przez inner join z tabelą `scores` dla danego użytkownika
- Zwraca zarówno publiczne jak i prywatne plansze (bez filtrowania `is_public`)
- Rozszerza `BoardSummaryDTO` o pole `lastTime` (ostatni zapisany czas użytkownika)

Pole `lastTime` jest wyświetlane w interfejsie tylko dla plansz, których użytkownik jest właścicielem.

## 2. Routing widoku

| Ścieżka URL | Komponent strony   | Dostęp                  |
| ----------- | ------------------ | ----------------------- |
| `/played`   | `BoardsPlayedPage` | wymagane logowanie (API) |

> **Uwaga implementacyjna**: Middleware w projekcie (`src/middleware/index.ts`) sprawdza uwierzytelnienie tylko dla endpointów API (nie dla stron). Endpoint API `/api/boards/played` zwraca 401 dla niezalogowanych użytkowników. Strona frontendowa nie ma przekierowania na poziomie middleware – zamiast tego, brak autoryzacji jest obsługiwany przez RTK Query i wyświetlany jako błąd.

## 3. Struktura komponentów

```
BoardsPlayedPage
 ├─ SearchInput (reuse)
 ├─ BoardsList (reuse)
 └─ Pagination (reuse)
```

## 4. Szczegóły komponentów

### 4.1 BoardsPlayedPage

- **Opis**: Komponent‐strona odpowiadający za pobranie danych z API, zarządzanie parametrami zapytania (query-string) oraz renderowanie pod‐komponentów.
- **Lokalizacja**: `src/components/pages/BoardsPlayedPage.tsx`
- **Główne elementy**:
  - kontener `div.min-h-[85vh].bg-secondary`
  - sekcja `SearchInput`, lista `BoardsList`, `Pagination`.
- **Obsługiwane interakcje**:
  - wpisanie tekstu w `SearchInput` ➜ aktualizacja `q` i reset `page=1`, wywołanie `refetch()` dla pustego ciągu.
  - kliknięcie numeru strony ➜ aktualizacja `page`.
- **Walidacja**:
  - `q`: max 100 znaków (zgodnie ze schematem backendu `ListPlayedBoardsSchema`)
  - `page`: ≥ 1 (wartości z hooka `useQueryParams`, fallback = 1 z `DEFAULT_PAGINATION`).
- **Typy**: 
  - Request: `Partial<ListBoardsQuery>` (rzutowany z parametrów URL)
  - Response: `Paged<PlayedBoardDTO>` z hooka `useListPlayedBoardsQuery`
  - Dla `BoardsList`: rzutowanie na `BoardSummaryDTO[] | undefined`
- **Propsy**: brak (komponent strona).

### 4.2 BoardsList (reuse)

- **Opis**: Istniejący komponent renderujący listę `BoardSummaryDTO`. Nie wymaga zmian – przyjmuje tablicę wyników z endpointu oraz flagę `loading`.
- **Walidacja**: brak dodatkowej logiki.
- **Typy**: `BoardSummaryDTO[]`.
- **Propsy**: (jak w pliku źródłowym)

## 5. Typy

Wszystkie typy już istnieją w `src/types.ts`:

- `PlayedBoardDTO` (linie 145-147) – rozszerza `BoardSummaryDTO` o pole `lastTime`, usuwa pole `archived`:
  ```ts
  export type PlayedBoardDTO = Omit<BoardSummaryDTO, "archived"> & {
    lastTime: ScoreRow["elapsed_ms"];
  };
  ```
- `Paged<T>` – wrapper paginacji.

Front nie wprowadza nowych typów. `BoardsList` akceptuje `BoardSummaryDTO[]`, więc wynik z API jest rzutowany przy przekazaniu:

```ts
const boardsForList = data?.data as BoardSummaryDTO[] | undefined;
```

Pole `lastTime` jest renderowane w komponencie `BoardListTile` (linie 78-83), ale tylko dla plansz, których użytkownik jest właścicielem (`canManage`).

## 6. Zarządzanie stanem

- **Źródło prawdy**: RTK Query cache z endpointu `useListPlayedBoardsQuery`.
- **Lokalny stan komponentu**:
  - `params` (q, page) z hooka `useQueryParams`.
  - brak dodatkowego stanu – loading i error pochodzą z RTK Query.

Jeśli w przyszłości wymagane będzie sortowanie / filtrowanie po tagach, zostanie dodany lokalny stan `selectedTags`.

## 7. Integracja API

| Hook                       | HTTP | URL                  | Request Query                    | Response                |
| -------------------------- | ---- | -------------------- | -------------------------------- | ----------------------- |
| `useListPlayedBoardsQuery` | GET  | `/api/boards/played` | `Partial<ListBoardsQuery>` (bez `ownerId`) | `Paged<PlayedBoardDTO>` |

Implementacja w pliku `src/store/api/apiSlice.ts` (linie 237-247):

```ts
listPlayedBoards: builder.query<Paged<PlayedBoardDTO>, Partial<ListBoardsQuery>>({
  query: (params) => {
    const qs = new URLSearchParams();
    if (params?.page) qs.set("page", params.page.toString());
    if (params?.pageSize) qs.set("pageSize", params.pageSize.toString());
    if (params?.q) qs.set("q", params.q);
    const query = qs.toString();
    return `/api/boards/played${query ? `?${query}` : ""}`;
  },
  providesTags: ["BoardsPlayed"],
}),
```

**Uwaga**: Endpoint używa typu `Partial<ListBoardsQuery>`, ale faktycznie walidowany jest przez `ListPlayedBoardsSchema` (bez pola `ownerId`) w `src/lib/validation/boards.ts` (linie 139-145).

## 8. Interakcje użytkownika

| Akcja                          | Opis                                        | Efekt                                     |
| ------------------------------ | ------------------------------------------- | ----------------------------------------- |
| Wpisanie tekstu w wyszukiwarkę | aktualizacja query-string, jeśli pusty ciąg ➜ `refetch()` | lista przeładowuje się, `page` reset do 1 |
| Zmiana strony                  | kliknięcie w `Pagination`                   | nowa strona (brak scroll do topu)         |
| Kliknięcie karty               | przejście do `/boards/[id]`                 | widok gry lub szczegółów planszy          |
| Edycja planszy (ikona)         | tylko dla właściciela (`canManage`)         | przejście do `/boards/[id]/edit`          |
| Usuwanie planszy (ikona)       | tylko dla właściciela (`canManage`)         | otwarcie dialogu `DeleteBoardDialog`      |

**Uwaga**: W komponencie `SearchInput` nie ma implementacji debounce – zmiany są przekazywane bezpośrednio do `handleQueryChange`.

## 9. Warunki i walidacja

1. **Parametry zapytania** – walidowane po stronie backendu przez `ListPlayedBoardsSchema` (Zod) w `src/lib/validation/boards.ts`:
   - `page`: preprocessed do `number`, min 1, default 1
   - `pageSize`: preprocessed do `number`, min 1, max 100, default 20
   - `q`: string max 100 znaków (opcjonalny)
   - `tags`: array max 10 stringów, każdy max 20 znaków (opcjonalny)
   - `sort`: enum ["created", "updated", "cardCount"], default "created"
   - `direction`: enum ["asc", "desc"], default "desc"
   
   Frontend:
   - używa hooka `useQueryParams` do zarządzania parametrami URL
   - przekazuje wartości do API przez RTK Query bez walidacji po stronie frontu
   
2. **Ostatni czas** – pole `lastTime` jest wyświetlane w `BoardListTile` tylko gdy:
   - `board.lastTime` istnieje (nie jest `undefined`)
   - `canManage === true` (użytkownik jest właścicielem planszy, linia 18)
   
   Format wyświetlania: `msToMin(board.lastTime) min` (linie 78-83).

## 10. Obsługa błędów

| Scenariusz              | UI                                                                              |
| ----------------------- | ------------------------------------------------------------------------------- |
| 401 Unauthorized        | RTK Query `baseQueryWithReauth` próbuje odświeżyć token; w przypadku niepowodzenia wykonuje `handleClientLogout` (czyści store Redux, usuwa tokeny, przekierowuje na `/`). |
| 400 Validation          | pokazuje stan pustej listy.      |
| 500 Server Error / Sieć | toast z komunikatem błędu wyświetlany przez middleware `baseQueryWithReauth` (linie 84-92 w `apiSlice.ts`). Lista wyświetla komunikat „Brak plansz do wyświetlenia." |

**Uwaga implementacyjna**: 
- Globalny interceptor `baseQueryWithReauth` w `apiSlice.ts` automatycznie próbuje odświeżyć token przy 401 i pokazuje toasty dla błędów (poza 401).
- Komponent `BoardsPlayedPage` nie ma dedykowanego `ErrorState` – w przypadku błędu wyświetla się standardowa wiadomość „Brak plansz do wyświetlenia." z komponentu `BoardsList`.
- Retry w RTK Query można zostawić na wartościach domyślnych.

## 11. Kroki implementacji (zrealizowane)

### Zrealizowane elementy:

1. ✅ **Route**: Utworzono plik `src/pages/played.astro` importujący `BoardsPlayedPage`.
   - Użyto `export const prerender = false` dla dynamicznego renderowania.
   
2. ✅ **Endpoint API**: Utworzono `src/pages/api/boards/played.ts`:
   - Walidacja przez `ListPlayedBoardsSchema` (bez pola `ownerId`).
   - Sprawdzanie uwierzytelnienia (`locals.user`).
   - Wywołanie serwisu `listBoardsPlayedByUser`.

3. ✅ **Serwis backendowy**: W `src/lib/services/board.service.ts` dodano funkcję `listBoardsPlayedByUser` (linie 315-410):
   - Inner join z tabelą `scores` filtrowany po `user_id`.
   - Obsługa deduplikacji wyników i wybór `lastTime`.
   - Paginacja, wyszukiwanie i filtrowanie tagów.

4. ✅ **Hook RTK Query**: W `src/store/api/apiSlice.ts` zarejestrowano `listPlayedBoards` (linie 237-247):
   - Endpoint buduje query string z parametrów `page`, `pageSize`, `q`.
   - Typ odpowiedzi: `Paged<PlayedBoardDTO>`.
   - Tag: `BoardsPlayed`.

5. ✅ **Komponenty**:
   - Utworzono `src/components/pages/BoardsPlayedPage.tsx` bazując na `BoardsPage.tsx`.
   - Używa hooka `useListPlayedBoardsQuery`.
   - Rzutuje rezultat na `BoardSummaryDTO[]` dla komponentu `BoardsList`.
   - Reużywa istniejące komponenty: `SearchInput`, `BoardsList`, `Pagination`.

6. ✅ **UI dla lastTime**: W `src/components/ui/Boards/BoardListTile.tsx` (linie 78-83):
   - Wyświetla pole `lastTime` tylko dla plansz należących do użytkownika (`canManage`).
   - Format: `msToMin(board.lastTime) min`.

7. ✅ **Nawigacja**: W `src/components/ui/Sidebar/Sidebar.tsx` (linia 17):
   - Dodano link „Rozegrane Tablice" z ikoną `PlayedIcon`.
   - Prowadzi do `Routes.MyPlayedBoards` (`/played`).

8. ✅ **Routing constants**: W `src/lib/routes.ts` (linia 9):
   - Dodano `MyPlayedBoards = "/played"` w enum `Routes`.
   - Dodano do obiektu `ProtectedRoutes`.

### Różnice względem oryginalnego planu:

- **Brak dedykowanego mappera**: Zamiast tworzyć `src/lib/mappers/board.ts`, rzutowanie typu odbywa się bezpośrednio w komponencie.
- **Route `/played` zamiast `/boards/played`**: Uproszczenie struktury URL.
- **Middleware tylko dla API**: Strony nie mają middleware przekierowania – autoryzacja sprawdzana jest na poziomie endpointu API.
- **Brak dedykowanego ErrorState**: Komponent używa standardowej wiadomości z `BoardsList`.
- **Zwracane plansze**: Endpoint zwraca zarówno publiczne jak i prywatne plansze użytkownika (nie tylko publiczne).
- **Wyświetlanie lastTime**: Pole `lastTime` wyświetlane tylko dla plansz należących do użytkownika.

## 12. Ważne uwagi implementacyjne

### Zakres widoczności `lastTime`

Pole `lastTime` jest zawsze zwracane przez API dla wszystkich plansz, ale w UI jest wyświetlane tylko gdy:
- Użytkownik jest właścicielem planszy (`board.ownerId === authUserId`)
- Wartość `lastTime` istnieje (nie jest `undefined`)

Implementacja w `BoardListTile.tsx`:
```tsx
const canManage = authUserId && authUserId === board.ownerId;

{canManage && (
  <div className="flex items-center gap-2">
    {board?.lastTime && (
      <div className="text-sm text-gray-500 flex flex-col">
        <span>Czas</span>
        <span>{msToMin(board.lastTime)} min</span>
      </div>
    )}
    {/* Edit and Delete icons */}
  </div>
)}
```

### Deduplikacja wyników

Serwis `listBoardsPlayedByUser` wykonuje deduplikację wyników na poziomie backendu:
- Użytkownik może mieć wiele wyników dla jednej planszy
- Backend zwraca planszę tylko raz z jednym `lastTime`
- Implementacja używa `Map<string, PlayedBoardDTO>` do deduplikacji po `board.id`

### Brak filtrowania po `is_public`

W przeciwieństwie do standardowego widoku plansz, endpoint `/api/boards/played`:
- Nie filtruje po `is_public`
- Zwraca zarówno publiczne jak i prywatne plansze użytkownika
- Jedyne filtrowanie: `archived = false` i istnienie wyniku dla użytkownika

To pozwala użytkownikowi zobaczyć wszystkie plansze, które grał, niezależnie od ich statusu publiczny/prywatny.
