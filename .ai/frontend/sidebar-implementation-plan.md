# Plan implementacji widoku Sidebar

## 1. Przegląd

Sidebar to lewa, stała nawigacja aplikacji webowej Definition Quest. Umożliwia szybki dostęp do kluczowych sekcji („Publiczne tablice", „Moje tablice", „Rozegrane Tablice", „Utwórz tablicę") oraz zawiera przycisk wylogowania na dole. Sidebar jest responsywny - w trybie collapsed (zwinięty) pokazuje tylko ikony, w trybie rozwiniętym pokazuje ikony + labelki. Na mobile (poniżej breakpointu `md`) sidebar jest domyślnie ukryty poza ekranem (`left-[-50px]`). Preferencja zwinięcia jest przechowywana w Reduxie (`ui.layout.sidebarCollapsed`) i synchronizowana z `localStorage` (klucz: `dq_sidebar_collapsed`), co pozwala zachować stan między sesjami. Dodatkowo, sidebar automatycznie zwija się po kliknięciu poza jego obszarem (funkcjonalność `useClickOutside`).

## 2. Routing widoku

Sidebar jest częścią układu chronionego renderowanego przez `ReactLayout`. Renderuje się globalnie dla wszystkich chronionych tras (zdefiniowanych w `ProtectedRoutes`) i nie posiada własnej ścieżki URL. Poszczególne elementy nawigacyjne prowadzą do routów:

| Label (polski)        | Route (rzeczywista ścieżka) | Routes enum             |
| --------------------- | --------------------------- | ----------------------- |
| Publiczne tablice     | `/boards`                   | `Routes.Boards`         |
| Moje tablice          | `/my-boards`                | `Routes.MyBoards`       |
| Rozegrane Tablice     | `/played`                   | `Routes.MyPlayedBoards` |
| Utwórz tablicę        | `/boards/create`            | hardcoded string        |
| Wyloguj (przycisk)    | logout action               | n/a                     |

## 3. Struktura komponentów

```
<ReactLayout> (HOC warunkowe - tylko dla chronionych tras)
 ├─ <Sidebar> (fixed position, z-40)
 │   └─ <div> (flex column)
 │       ├─ <SidebarToggleButton>
 │       └─ <nav> (flex-1)
 │           ├─ <NavItem> × 4 (mapowane z navItems array)
 │           └─ <button> (logout - PowerIcon)
 └─ <div> (main content wrapper)
     ├─ <Header>
     ├─ <div> {children} (content)
     └─ <Footer>
```

**Lokalizacje plików**:
- `src/components/HOC/ReactLayout.tsx` - główny layout z warunkiem dla chronionych tras
- `src/components/ui/Sidebar/Sidebar.tsx` - główny komponent
- `src/components/ui/Sidebar/SidebarToggleButton.tsx` - przycisk toggle
- `src/components/ui/Sidebar/NavItem.tsx` - pojedynczy link nawigacyjny

## 4. Szczegóły komponentów

### Sidebar (src/components/ui/Sidebar/Sidebar.tsx)

- **Opis**: Lewy panel nawigacji, responsywny, z możliwością zwinięcia. Fixed position z `z-40`.
- **Główne elementy**: 
  - `<aside>` z `ref={asideRef}` dla `useClickOutside`
  - `<SidebarToggleButton />`
  - `<nav>` z mapowaniem `navItems` do `<NavItem />`
  - `<button>` wylogowania z `PowerIcon` na dole
- **Obsługiwane interakcje**:
  - Kliknięcie przycisku toggle → wywołuje `toggle()` z `useSidebar()`
  - Kliknięcie linku → nawigacja natywnym `<a href>` + zamknięcie sidebara przez `toggle()`
  - Kliknięcie poza sidebar → `useClickOutside` → `set(true)` (zwinięcie)
  - Kliknięcie wyloguj → `logout(undefined)` z `useLogoutMutation()`
- **Stan lokalny**: `asideRef` (useRef) dla obsługi kliknięcia poza obszarem
- **State Redux**: `collapsed` i `set` z `useSidebar()`
- **Typy**: `NavItemVM` (array zdefiniowany lokalnie w komponencie)
- **Propsy**: brak
- **Styling**: 
  - Collapsed: `left-[-50px] md:left-0` (ukryty na mobile, widoczny na desktop jako wąski)
  - Expanded: `left-0 w-64` (pełna szerokość)
  - Przejścia: `transition-all duration-200`
  - Kolory: `bg-[var(--color-primary)] text-white`

### SidebarToggleButton (src/components/ui/Sidebar/SidebarToggleButton.tsx)

- **Opis**: Przycisk hamburger / strzałka (chevron left), zmienia stan zwinięcia.
- **Elementy**: `button` z warunkowo renderowaną ikoną:
  - Collapsed: `<MenuIcon />` (hamburger)
  - Expanded: `<ChevronLeftIcon />` (strzałka w lewo)
- **Interakcje**: `onClick` → `toggle()` z `useSidebar()`
- **Accessibility**: 
  - `aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}`
  - `aria-pressed={collapsed}`
- **Typy**: brak (używa hooks)
- **Propsy**: brak (pobiera `collapsed` i `toggle` z hooka)
- **Styling**: 
  - Collapsed: `justify-center position: absolute md:relative left-13 top-3 md:top-[unset] md:left-[unset]`
  - Expanded: `px-3`
  - Hover: `hover:bg-blue-700 hover:bg-opacity-50`

### NavItem (src/components/ui/Sidebar/NavItem.tsx)

- **Opis**: Pojedynczy link nawigacyjny.
- **Elementy**: `<a href>` + `Icon` + `<span>` (conditional)
- **Interakcje**: 
  - `onClick` → `handleClick()` - zawsze wywołuje `toggle()` jeśli sidebar nie jest collapsed (zamyka po kliknięciu)
  - Natywna nawigacja przez `<a href>`
- **Stan lokalny**: 
  - `currentPath` - odczytany z `window.location.pathname` w `useEffect`
  - `isActive` - porównanie `currentPath === item.route`
- **Accessibility**: 
  - `role="menuitem"`
  - `aria-current={isActive ? "page" : undefined}`
  - `aria-disabled={isActive || undefined}`
  - `data-testid={`nav-${item.route.replace(/\//g, "-")}`}`
- **Typy**: `NavItemProps { item: NavItemVM }`
- **Propsy**: `item: NavItemVM` - dane linku (pobiera `collapsed` z hooka, nie z propsów)
- **Styling**:
  - Collapsed: `justify-center text-sm font-normal`
  - Expanded: `text-sm font-bold`
  - Active: `bg-blue-700 bg-opacity-60 cursor-default pointer-events-none`
  - Inactive: `hover:bg-blue-700 hover:bg-opacity-50 cursor-pointer`
  - Labelka ukryta gdy `collapsed`: `{!collapsed && <span>{item.label}</span>}`

### Przycisk Wyloguj (inline w Sidebar)

- **Opis**: Przycisk wylogowania renderowany na dole sidebara (w `<nav>` z `mt-5`).
- **Elementy**: `<button>` + `<PowerIcon>` + `<span>` (conditional)
- **Interakcje**: `onClick={() => logout(undefined)}` - RTK Query mutation
- **Styling**:
  - Czerwony kolor: `text-red-500 hover:bg-red-500 hover:text-white`
  - Collapsed: `justify-center`
  - Labelka: `{!collapsed && <span className="cursor-pointer">Wyloguj</span>}`

## 5. Typy

```ts
// src/types/sidebar.ts (rzeczywista implementacja)
export interface NavItemVM {
  label: string;
  route: string; // UWAGA: to string, nie Routes enum!
  icon: React.ComponentType<{ className?: string }>;
}
```

**Definicja navItems** (w `Sidebar.tsx`):
```ts
const navItems: NavItemVM[] = [
  { label: "Publiczne tablice", route: Routes.Boards, icon: BoardsIcon },
  { label: "Moje tablice", route: Routes.MyBoards, icon: MyBoardsIcon },
  { label: "Rozegrane Tablice", route: Routes.MyPlayedBoards, icon: PlayedIcon },
  { label: "Utwórz tablicę", route: "/boards/create", icon: PlusIcon },
];
```

**UIState** (w `src/store/slices/uiSlice.ts`):
```ts
export interface UIState {
  layout: {
    sidebarCollapsed: boolean;
  };
  loading: boolean;
}
```

## 6. Zarządzanie stanem

### Redux (src/store/slices/uiSlice.ts)

- **State**: `ui.layout.sidebarCollapsed: boolean` (initial: `true`)
- **Akcje**:
  - `toggleSidebar()` - przełącza stan `sidebarCollapsed`
  - `setSidebarCollapsed(payload: boolean)` - ustawia konkretną wartość
  - `setLoading(payload: boolean)` - kontrola stanu ładowania (nie związane z sidebar)
- **Selectors**:
  - `selectSidebarCollapsed(state: RootState)` - zwraca `state.ui.layout.sidebarCollapsed`

### Hook useSidebar (src/hooks/useSidebar.ts)

- **Opis**: Enkapsuluje logikę zarządzania stanem sidebara z synchronizacją do localStorage.
- **API**:
  ```ts
  const { collapsed, toggle, set } = useSidebar();
  ```
- **Implementacja**:
  - `collapsed: boolean` - odczyt z Redux store (`useSelector`)
  - `toggle()` - dispatchuje `toggleSidebar()` + zapisuje do LS
  - `set(val: boolean)` - dispatchuje `setSidebarCollapsed(val)` + zapisuje do LS
- **localStorage**:
  - Klucz: `"dq_sidebar_collapsed"`
  - Funkcja `syncToStorage(val: boolean)` - try/catch wrapper dla `localStorage.setItem`
  - Brak odczytu z LS przy inicjalizacji (tylko zapis)

### Hook useClickOutside (src/hooks/useClickOutside.ts)

- **Opis**: Wykrywa kliknięcia poza elementem wskazanym przez ref.
- **API**:
  ```ts
  const clickedOutside = useClickOutside<HTMLDivElement>(ref);
  ```
- **Implementacja**:
  - Listener na `mousedown` na `document`
  - Sprawdza `!ref.current.contains(e.target)`
  - Zwraca `boolean` - `true` gdy ostatnie kliknięcie było poza elementem
- **Użycie w Sidebar**:
  ```ts
  const clickedOutside = useClickOutside<HTMLDivElement>(asideRef);
  useEffect(() => {
    if (!collapsed && clickedOutside) {
      set(true); // zwiń sidebar
    }
  }, [clickedOutside, collapsed, set]);
  ```

## 7. Integracja API

Sidebar nie wykonuje bezpośrednich wywołań API do własnych celów. Wykorzystuje jednak:
- **useLogoutMutation()** z `src/store/api/apiSlice.ts` - dla przycisku wylogowania
- Endpoint: `POST /api/auth/logout`

## 8. Interakcje użytkownika

| Akcja                                    | Rezultat                                                                                           |
| ---------------------------------------- | -------------------------------------------------------------------------------------------------- |
| Kliknięcie przycisku toggle              | Sidebar zwija/rozwija się, preferencja zapisana w Redux + localStorage                             |
| Kliknięcie poza sidebar (gdy rozwinięty) | Sidebar automatycznie zwija się (useClickOutside)                                                  |
| Kliknięcie linku nawigacyjnego           | Natywna nawigacja + sidebar zwija się (jeśli był rozwinięty)                                      |
| Kliknięcie aktywnego linku               | Brak akcji (`pointer-events-none`)                                                                 |
| Kliknięcie "Wyloguj"                     | Wywołanie `logout()` mutation → przekierowanie + czyszczenie sesji                                 |
| Resize okna < `md` (768px)               | Sidebar ukryty poza ekranem (`left-[-50px]`), przycisk toggle widoczny absolutnie na ekranie      |
| Resize okna >= `md` (768px)              | Sidebar widoczny, collapsed pokazuje wąski panel z ikonami, expanded pokazuje pełny panel z tekstem |

## 9. Warunki i walidacja

### Responsive behavior

- **Mobile (< `md`, 768px)**:
  - Collapsed: `left-[-50px]` - ukryty poza ekranem, ale przycisk toggle widoczny absolutnie
  - Expanded: `left-0 w-64` - pełny sidebar najeżdża na content (overlay)
- **Desktop (>= `md`, 768px)**:
  - Collapsed: `md:left-0` - wąski panel (tylko ikony, szerokość określona przez padding i content)
  - Expanded: `left-0 w-64` - pełny panel (ikony + tekst)

### CSS classes control

- Position: `fixed left-[...] top-0 z-40 h-full`
- Width: conditional na podstawie `collapsed`:
  - Collapsed: brak fixed width (dopasowanie do zawartości)
  - Expanded: `w-64`
- Transitions: `transition-all duration-200`

### ARIA attributes

- **SidebarToggleButton**: `aria-label`, `aria-pressed`
- **NavItem**: `role="menuitem"`, `aria-current`, `aria-disabled`
- Brak `aria-expanded` na `<aside>` (w przeciwieństwie do planu)

## 10. Obsługa błędów

### localStorage errors

- **Implementacja**: try/catch w `syncToStorage()` w `useSidebar`
- **Fallback**: W przypadku błędu (np. quota exceeded) - cichy fail, preferencja pozostaje tylko w Redux

### Routing errors

- Brak specjalnej obsługi - natywna nawigacja przez `<a href>`
- W przypadku błędu routing - standardowy error handling Astro/przeglądarki

### useClickOutside edge cases

- Sprawdzenie `if (!ref.current) return` przed operacjami
- Cleanup listener w `useEffect` return

## 11. Kroki implementacji (zakończone)

### Zrealizowane

1. **Redux state management** ✅
   - Utworzono `uiSlice.ts` z `sidebarCollapsed`, `toggleSidebar`, `setSidebarCollapsed`
   - Initial state: `sidebarCollapsed: true`

2. **Custom hooks** ✅
   - `useSidebar()` - zarządzanie stanem + localStorage sync (klucz: `dq_sidebar_collapsed`)
   - `useClickOutside()` - detekcja kliknięć poza elementem

3. **Typy** ✅
   - `src/types/sidebar.ts` z `NavItemVM` (route jako string, icon z className prop)
   - `UIState` interface w `uiSlice.ts`

4. **Ikony** ✅
   - `BoardsIcon`, `MyBoardsIcon`, `PlayedIcon`, `PlusIcon`, `PowerIcon` w `src/assets/icons`
   - `MenuIcon`, `ChevronLeftIcon` dla toggle button

5. **Komponent SidebarToggleButton** ✅
   - Warunkowo renderuje `MenuIcon` (collapsed) / `ChevronLeftIcon` (expanded)
   - ARIA attributes: `aria-label`, `aria-pressed`
   - Responsive positioning: absolutne na mobile, relative na desktop

6. **Komponent NavItem** ✅
   - Natywny `<a href>` zamiast React Router Link
   - Client-side tracking aktywnej ścieżki przez `window.location.pathname`
   - Auto-collapse po kliknięciu (jeśli sidebar nie był już collapsed)
   - ARIA attributes: `role="menuitem"`, `aria-current`, `aria-disabled`
   - Conditional rendering labelki: `{!collapsed && <span>...`

7. **Komponent Sidebar** ✅
   - Statyczna definicja `navItems: NavItemVM[]` w komponencie
   - Mapowanie do `<NavItem>` components
   - Inline przycisk wylogowania z `useLogoutMutation()`
   - `useClickOutside` integration - auto-collapse gdy kliknięcie poza sidebar
   - Fixed positioning z responsywnymi klasami
   - 4 linki nawigacyjne + 1 przycisk logout

8. **Integracja w ReactLayout** ✅
   - `src/components/HOC/ReactLayout.tsx` - warunkowe renderowanie dla chronionych tras
   - Sprawdzenie `isProtected` na podstawie `ProtectedRoutes` i `pathname`
   - Layout: `<Sidebar />` + `<div>` wrapper z `<Header>`, content, `<Footer>`
   - Padding top: `pt-[60px] md:pt-[80px]` dla content (space dla fixed header)

9. **Styling** ✅
   - Tailwind utility classes
   - CSS variables: `var(--color-primary)`, `var(--color-white)`
   - Responsive width: brak fixed width w collapsed (auto), `w-64` w expanded
   - Transitions: `transition-all duration-200` dla smooth animations
   - Hover states: `hover:bg-blue-700 hover:bg-opacity-50`
   - Active state: `bg-blue-700 bg-opacity-60`

10. **Testy** ✅
    - `tests/unit/components/Sidebar.test.tsx`
    - `tests/unit/components/SidebarToggleButton.test.tsx`

### Uwagi implementacyjne

- **Zmiana względem planu**: NavItem używa natywnego `<a href>` zamiast React Router `<Link>` (Astro routing)
- **Zmiana względem planu**: `NavItemVM.route` to `string`, nie `Routes` enum (choć w praktyce używa wartości z enuma)
- **Zmiana względem planu**: Brak `aria-expanded` na `<aside>` element
- **Zmiana względem planu**: NavItem nie otrzymuje `collapsed` przez props - pobiera z hooka
- **Rozszerzenie**: Dodano `useClickOutside` hook i integrację - auto-collapse przy kliknięciu poza sidebar
- **Rozszerzenie**: Dodano inline przycisk wylogowania w komponencie Sidebar (nie jako osobny NavItem)
- **Rozszerzenie**: Responsive positioning na mobile - `left-[-50px]` zamiast całkowitego ukrycia
- **Rozszerzenie**: Absolutne pozycjonowanie przycisku toggle na mobile dla accessibility
