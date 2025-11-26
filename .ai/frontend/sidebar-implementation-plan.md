# Plan implementacji widoku Sidebar

## 1. Przegląd

Sidebar to lewa, stała nawigacja aplikacji webowej Definition Quest. Umożliwia szybki dostęp do kluczowych sekcji („Public Boards”, „My Boards”, „Played”, „Create Board”) i zwija się do samych ikon poniżej breakpointu `md`. Preferencja zwinięcia jest przechowywana w Reduxie (`ui.layout.sidebarCollapsed`), co pozwala zachować stan między sesjami.

## 2. Routing widoku

Sidebar jest częścią układu chronionego (`<ProtectedRoute>`). Renderuje się globalnie w layoucie aplikacji (np. `src/layouts/AppLayout.astro`) i nie posiada własnej ścieżki URL. Poszczególne elementy nawigacyjne prowadzą do routów:

| Label         | Route (Routes enum) |
| ------------- | ------------------- |
| Public Boards | `/boards`           |
| My Boards     | `/my-boards`        |
| Played        | `/played-boards`    |
| Create Board  | `/create-board`     |

## 3. Struktura komponentów

```
<AppLayout>
 ├─ <Sidebar>
 │   ├─ <SidebarToggleButton>
 │   └─ <NavList>
 │       ├─ <NavItem>
 │       ├─ <NavItem>
 │       ├─ <NavItem>
 │       └─ <NavItem>
 └─ <Header>
     └─ <Outlet />
```

## 4. Szczegóły komponentów

### Sidebar

- **Opis**: Lewy panel nawigacji, responsywny, z możliwością zwinięcia.
- **Główne elementy**: `aside`, przycisk toggle, lista linków.
- **Obsługiwane interakcje**:
  - Kliknięcie przycisku toggle → `dispatch(toggleSidebar())`.
  - Kliknięcie linku → nawigacja przez `Link` (react-router) + zamknięcie w trybie mobilnym.
- **Walidacja**: brak formularzy; kontrola dostępności (kontrast, aria-labels, aria-expanded).
- **Typy**: `NavItemVM`, `UIState` (istniejący).
- **Propsy**: brak (komponent korzysta z globalnego stanu i statycznej konfiguracji linków).

### SidebarToggleButton

- **Opis**: Przycisk hamburger / strzałka, zmienia stan zwinięcia.
- **Elementy**: `button` z ikoną (`MenuIcon` / `ChevronLeftIcon`).
- **Interakcje**: `onClick` → `toggleSidebar`.
- **Walidacja**: `aria-pressed`, `aria-label`.
- **Typy**: none.
- **Propsy**: opcjonalnie `collapsed: boolean` do zmiany ikony.

### NavItem

- **Opis**: Pojedynczy link boczny.
- **Elementy**: `li > NavLink` + `Icon` + `span` (w trybie collappsed widzimy tylko ikony").
- **Interakcje**: aktywacja `activeClassName`, `onClick` callback (zamykanie mobilne).
- **Walidacja**: a11y – `role="menuitem"`, fokus ring.
- **Typy**: `NavItemVM`.
- **Propsy**:
  - `item: NavItemVM` – dane linku.
  - `collapsed: boolean` – kontrola widoczności labelki.

## 5. Typy

```ts
// src/types/sidebar.ts
export interface NavItemVM {
  label: string; // Wyświetlany tekst
  route: Routes; // Ścieżka nawigacji
  icon: React.ComponentType; // Komponent ikony
}
```

Używamy istniejącego `UIState.layout.sidebarCollapsed` (patrz `src/store/slices/uiSlice.ts`).

## 6. Zarządzanie stanem

1. **Redux**: `ui.layout.sidebarCollapsed` – bool. Akcje: `toggleSidebar`, `setSidebarCollapsed`.
2. **Hook**: `useSidebar()` (custom)
   - Cel: hermetyzuje logikę odczytu i zapisu preferencji (Redux + `localStorage`).
   - API:
     ```ts
     const { collapsed, toggle, set } = useSidebar();
     ```

## 7. Integracja API

Brak bezpośrednich wywołań API; komponent korzysta jedynie z routingu. Pośrednio wspiera already implemented pages.

## 8. Interakcje użytkownika

| Akcja                           | Rezultat                                                     |
| ------------------------------- | ------------------------------------------------------------ |
| Kliknięcie toggle               | Sidebar zwija/rozwija się, preferencja zapisana w Redux + LS |
| Zmiana rozmiaru okna < `md`     | Sidebar automatycznie przechodzi w tryb "collapsed"          |
| Kliknięcie linku w trybie mobil | Nawigacja + sidebar zamknięty (UX mobile)                    |

## 9. Warunki i walidacja

- Minimalna szerokość `md` (`768px`) – powyżej pokazujemy pełne labelki.
- `sidebarCollapsed` steruje klasami CSS (`w-16` vs `w-64`).
- Atrybuty ARIA: `aria-expanded` na `<aside>`, `aria-label` na toggle.

## 10. Obsługa błędów

- Brak Internetu / routing failure → fallback `navigate('/')`.
- Problemy z `localStorage` (quota) → operacje w try/catch; w razie błędu preferencja tylko w Redux.

## 11. Kroki implementacji

1. **Przygotowanie ikon**
   - Dodać pliki SVG do `src/assets/icons` + eksport w `index.ts` (np. `BoardsIcon`, `PlayedIcon`, `PlusIcon`).

2. **Definicja typów**
   - Utworzyć `src/types/sidebar.ts` z `NavItemVM`.

3. **Hook `useSidebar`**
   - Odczytuje/ustawia `sidebarCollapsed` + synchronizacja z `localStorage`.

4. **Komponent `SidebarToggleButton`**
   - Implementacja przycisku z ARIA, animacją.

5. **Komponent `NavItem`**
   - Renderuje link z ikoną; wspiera aktywną klasę.

6. **Komponent `Sidebar`**
   - Mapuje statyczną listę `NavItemVM[]` → `NavItem`.
   - Dodaje logikę responsywną (`useMediaQuery('md')`).

7. **Integracja w layoucie**
   - Utworzyć/zmodyfikować `src/layouts/AppLayout.astro` (lub analogiczny) – wstawić `<Sidebar />`.

8. **Style**
   - Tailwind: klasy szerokości (`w-64`, `w-16`), przejścia `transition-all`, kolory z theme.

9. **Testy e2e (Playwright)**
   - Sprawdzić zwinięcie/rozwinięcie, aktywny link, persistencję stanu.

10. **Dokumentacja UI**

- Storybook: scenariusze `Full` i `Collapsed`.
