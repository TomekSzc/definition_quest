# Plan implementacji widoku „Played Boards”

## 1. Przegląd

Widok „Played Boards” prezentuje listę publicznych plansz (boards), w których zalogowany użytkownik ma zapisany przynajmniej jeden wynik (score). Celem widoku jest umożliwienie graczowi szyb­kiego odnalezienia plansz, które już rozwiązywał, ponownego ich uruchomienia oraz porównania swojego ostatniego czasu (lastTime). Funkcjonalnie widok stanowi wariant istniejącego widoku `BoardsPage`, korzysta jednak z innego endpointu (`GET /api/boards/played`) i rozszerza kartę planszy o pole „Ostatni czas”.

## 2. Routing widoku

| Ścieżka URL      | Komponent strony   | Dostęp                          |
| ---------------- | ------------------ | ------------------------------- |
| `/boards/played` | `BoardsPlayedPage` | wymagane logowanie (middleware) |

> Middleware `authRedirect` (już używany w projekcie) powinien przekierować niezalogowanych użytkowników na `/login`.

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
- **Główne elementy**:
  - kontener `div.bg-secondary`
  - sekcja `SearchInput`, lista `BoardsList`, `Pagination`.
- **Obsługiwane interakcje**:
  - wpisanie frazy w `SearchInput` (debounce 300 ms) ➜ aktualizacja `q` i reset `page=1`.
  - kliknięcie numeru strony ➜ aktualizacja `page`.
- **Walidacja**:
  - `q`: max 100 znaków (zgodnie ze schematem backendu)
  - `page`: ≥ 1 (hook `useQueryParams` zapewnia liczbę całkowitą; fallback = 1).
- **Typy**: `PlayedBoardsQuery` (alias `ListPlayedBoardsQuery` bez `ownerId`), `Paged<PlayedBoardDTO>`.
- **Propsy**: brak (komponent strona).

### 4.2 BoardsList (reuse)

- **Opis**: Istniejący komponent renderujący listę `BoardSummaryDTO`. Nie wymaga zmian – przyjmuje tablicę wyników z endpointu oraz flagę `loading`.
- **Walidacja**: brak dodatkowej logiki.
- **Typy**: `BoardSummaryDTO[]`.
- **Propsy**: (jak w pliku źródłowym)

## 5. Typy

Wszystkie typy już istnieją w `src/types.ts`:

- `PlayedBoardDTO` – odpowiedź backendu (zawiera `lastTime`).
- `Paged<T>` – wrapper paginacji.

Front nie wprowadza nowych typów – `BoardsList` akceptuje superset `PlayedBoardDTO` w miejscu `BoardSummaryDTO`, więc należy rozszerzyć typ przy mapowaniu (lub zrzutować podczas przekazania).

```ts
const boardsForList = data?.data as BoardSummaryDTO[]; // lastTime ignorowany przez BoardsList
```

## 6. Zarządzanie stanem

- **Źródło prawdy**: RTK Query cache z endpointu `useListPlayedBoardsQuery`.
- **Lokalny stan komponentu**:
  - `params` (q, page) z hooka `useQueryParams`.
  - brak dodatkowego stanu – loading i error pochodzą z RTK Query.

Jeśli w przyszłości wymagane będzie sortowanie / filtrowanie po tagach, zostanie dodany lokalny stan `selectedTags`.

## 7. Integracja API

| Hook                       | HTTP | URL                  | Request Query       | Response                |
| -------------------------- | ---- | -------------------- | ------------------- | ----------------------- |
| `useListPlayedBoardsQuery` | GET  | `/api/boards/played` | `PlayedBoardsQuery` | `Paged<PlayedBoardDTO>` |

Implementacja w pliku `src/store/api/apiSlice.ts`:

```ts
builder.query<Paged<PlayedBoardDTO>, Partial<PlayedBoardsQuery>>({
  query: (params) => ({
    url: "boards/played",
    params,
  }),
  providesTags: ["BoardsPlayed"],
});
```

## 8. Interakcje użytkownika

| Akcja                          | Opis                                        | Efekt                                     |
| ------------------------------ | ------------------------------------------- | ----------------------------------------- |
| Wpisanie tekstu w wyszukiwarkę | debounce 300 ms ➜ aktualizacja query-string | lista przeładowuje się, `page` reset do 1 |
| Zmiana strony                  | kliknięcie w `Pagination`                   | nowa strona, scroll do topu listy         |
| Kliknięcie karty               | przejście do `/boards/[id]`                 | widok gry w trybie read-only              |

## 9. Warunki i walidacja

1. **Parametry zapytania** – walidowane po stronie backendu (Zod). Frontend:
   - ogranicza długość `q` do 100 znaków.
   - wymusza liczbę całkowitą `page ≥ 1`.
2. **Ostatni czas** – jeśli `lastTime === null` (teoretycznie niemożliwe), karta nie pokazuje sekcji czasu.

## 10. Obsługa błędów

| Scenariusz              | UI                                                                              |
| ----------------------- | ------------------------------------------------------------------------------- |
| 401 Unauthorized        | globalny interceptor przekierowuje na `/login` + toast „Zaloguj się ponownie”.  |
| 400 Validation          | pokazuje stan pustej listy + toast „Nieprawidłowe parametry wyszukiwania”.      |
| 500 Server Error / Sieć | komponent `BoardsPlayedList` renderuje `ErrorState` z opcją „Spróbuj ponownie”. |

Retry w RTK Query (exponential backoff) można zostawić na wartościach domyślnych.

## 11. Kroki implementacji

1. **Route**: dodaj plik `src/pages/boards/played.astro` importujący `BoardsPlayedPage`.
2. **Hook RTK Query**: w `apiSlice` zarejestrować `listPlayedBoards`.
3. **ViewModel mapper**: w `src/lib/mappers/board.ts` utworzyć funkcję `toBoardCardPlayedVM(dto)`.
4. **Komponenty**:
   1. Skopiuj `BoardsPage.tsx` ➜ `BoardsPlayedPage.tsx`; zmień hook na `useListPlayedBoardsQuery`, rzutuj rezultat na `BoardSummaryDTO[]` dla `BoardsList`.
   2. Usunięto kroki tworzenia nowych list/kart – pozostają istniejące reużywalne komponenty.
5. **UI tweaks**: Tailwind klasa dla sekcji czasu (`text-primary/80 text-sm`).
6. **Middleware**: upewnij się, że `authRedirect` obejmuje `/boards/played`.
7. **Testy manualne**:
   - brak wyników
   - paginacja
   - różne wartości `lastTime`
8. **Dokumentacja**: aktualizacja README (lista stron) oraz Storybook dla `BoardCardPlayed`.
9. **Code Review / QA**: lint, unit tests (jeśli istnieją), deploy na staging.
