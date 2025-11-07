# Plan implementacji widoku ProtectedRoute

## 1. Przegląd

`ProtectedRoute` to Higher-Order Component (HOC) służący do ochrony widoków wymagających autentykacji. Komponent renderuje przekazane `children` tylko wtedy, gdy użytkownik jest zalogowany (spełnione warunki: flaga `loggedIn === true` oraz obecny `accessToken` w storze). W przeciwnym wypadku następuje przekierowanie na stronę logowania (`/login`). W pierwszym etapie HOC zostanie wykorzystany w widoku `BoardsPage`, który jest dostępny wyłącznie dla zalogowanych użytkowników.

## 2. Routing widoku

| Ścieżka   | Widok        | Ochrona          |
| --------- | ------------ | ---------------- |
| `/boards` | `BoardsPage` | `ProtectedRoute` |

Przekierowanie w przypadku braku autentykacji: `/login?return=/boards` (po udanym logowaniu nastąpi powrót do żądanej ścieżki).

## 3. Struktura komponentów

```
Pages (Astro)
└── src/pages/boards.astro  (client:react)
    └── <Providers>
        └── <ProtectedRoute>
            └── <BoardsPage />
```

## 4. Szczegóły komponentów

### ProtectedRoute (HOC)

- **Opis:** Opakowuje komponent docelowy, weryfikuje stan autentykacji i warunkowo renderuje zawartość. Umieszczony jest **wewnątrz** komponentu `Providers`, aby mieć bezpośredni dostęp do store.
- **Główne elementy:**
  - `enum protectedRoutes` – lista ścieżek wymagających autentykacji (`"/boards"` na ten moment).
  - Hook `useAppSelector` (Redux) – pobranie `accessToken`, `loggedIn`.
  - Hook `useLocation` (React Router) – odczyt bieżącej ścieżki.
  - Hook `useNavigate` – przekierowanie na `/login`.
- **Obsługiwane interakcje:** Brak bezpośrednich interakcji UI; wyłącznie efekt przekierowania.
- **Obsługiwana walidacja:**
  - `loggedIn === true` **AND** `accessToken != null` ⇒ renderuj `children`.
  - W przeciwnym razie `navigate('/login?return='+pathname)`.
- **Typy:**
  - `ProtectedRouteProps { children: React.ReactNode }`.
  - `enum protectedRoutes` (string enum z dozwolonymi ścieżkami).
- **Propsy:**
  - `children` – dowolny komponent React.

### BoardsPage (istniejący)

- **Zmiana:** Otoczenie istniejącego eksportu przez `ProtectedRoute` przy eksporcie domyślnym lub w miejscu użycia w `.astro`.

## 5. Typy

```ts
// src/types/protectedRoute.ts
export interface ProtectedRouteProps {
  children: React.ReactNode;
}
```

Nie są wymagane nowe DTO – komponent korzysta wyłącznie z lokalnego stanu auth w Redux.

## 6. Zarządzanie stanem

- **Źródło stanu:** Slice `auth` w Redux Toolkit (`accessToken`, `loggedIn`).
- **Hooki:**
  - `useAppSelector(state => state.auth)` – pobranie stanu.
  - `useEffect` do obserwacji zmian i ewentualnego przekierowania.

## 7. Integracja API

Brak bezpośrednich wywołań API. Autentykacja opiera się na danych z Redux, które są wypełniane podczas logowania (US-001).

## 8. Interakcje użytkownika

| Akcja                                         | Wynik                                                   |
| --------------------------------------------- | ------------------------------------------------------- |
| Odwiedzenie `/boards` w stanie zalogowanym    | Strona z listą plansz renderuje się normalnie.          |
| Odwiedzenie `/boards` w stanie niezalogowanym | Automatyczne przekierowanie do `/login?return=/boards`. |

## 9. Warunki i walidacja

1. `accessToken` istnieje (nie `null` / `undefined` / pusty string).
2. Flaga `loggedIn` ustawiona na `true`.

Walidacja wykonywana w hooku `useEffect` przy każdym renderze oraz aktualizacji stanu auth.

## 10. Obsługa błędów

| Scenariusz                             | Obsługa                                            |
| -------------------------------------- | -------------------------------------------------- |
| `auth` slice niezaładowany (undefined) | Traktować jako brak autentykacji → przekierowanie. |
| Błąd nawigacji                         | Fallback – render informacyjny "Redirecting…".     |

## 11. Kroki implementacji

1. **Utwórz plik komponentu**: `src/components/Providers/ProtectedRoute.tsx`.
2. **Zaimplementuj HOC**:
   - Zdefiniuj `export enum protectedRoutes { BOARDS = "/boards" }`.
   - Pobierz `auth` ze store.
   - Pobierz `location.pathname` i sprawdź `protectedRoutes`.
   - Jeśli brak autentykacji **i** ścieżka znajduje się w enumie → `navigate('/login?return='+pathname)`.
   - W przeciwnym razie renderuj `children`.
3. **Eksportuj** `ProtectedRoute` z `index.ts` w folderze `Providers` i użyj wewnątrz JSX `Providers`.
4. **Zintegruj w BoardsPage**:
   - W `src/pages/boards.astro` zaimportuj `Providers` **i** opakuj `<BoardsPage />` w `<ProtectedRoute>` wewnątrz `<Providers>`.
5. **Aktualizuj testy jednostkowe** (jeśli istnieją) – dodaj test przekierowania.
6. **Manualne QA**:
   - Niezalogowany → `/boards` ⇒ przekierowanie.
   - Po zalogowaniu powrót na `/boards`.
7. **Dokumentacja** – dodać opis w `.ai/middleware-usage.md` (opcjonalnie).
