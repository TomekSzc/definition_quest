# Plan implementacji widoku Card Game

## 1. Przegląd

Widok odpowiada za interaktywną grę typu "memory-match" opartą o pary (termin – definicja) pobierane z endpointu `GET /api/boards/:id`. Celem widoku jest umożliwienie użytkownikowi rozwiązania planszy, pomiar czasu, prezentację stanu gry oraz zapis najlepszego wyniku do API.

## 2. Routing widoku

`/boards/:id` – publiczny lub prywatny w zależności od właściwości planszy.

**Implementacja:** `src/pages/boards/[id]/index.astro` - renderuje komponent `BoardGamePage` z React.

## 3. Struktura komponentów

```
BoardGamePage (route)
├── SkeletonBoard (loading state)
├── GameMeta (sidebar, fixed right/bottom)
│   ├── Sound toggle button
│   ├── Timer display
│   ├── Last score display
│   ├── Start/Stop button
│   ├── Reset button
│   └── Level navigation (if multiple levels)
└── BoardGrid (flex wrap)
    ├── Card (N-krotnie)
    ├── Overlay (when not running)
    └── Level navigation buttons (after completion)
```

**Implementacja:** Komponenty znajdują się w `src/components/pages/BoardGamePage.tsx` oraz `src/components/ui/Game/`.

## 4. Szczegóły komponentów

### BoardGamePage

- **Opis:** Główny komponent strony. Ładuje dane planszy przez RTK Query, inicjuje hook `useBoardGame`, renderuje `GameMeta` i `BoardGrid`.
- **Główne elementy:**
  - RTK Query `useGetBoardByIdQuery` do pobierania danych + `SkeletonBoard` jako loader.
  - `useSubmitScoreMutation` do zapisywania wyniku.
  - `useLevels` hook do zarządzania poziomami.
  - `useSidebar` do responsywnego marginesu.
  - Toast notifications do komunikacji z użytkownikiem.
  - `<GameMeta …/>`, `<BoardGrid …/>`.
- **Interakcje:**
  - Przekazuje zdarzenia z `GameMeta` (start/stop/reset) do hooka.
  - Przekazuje handler zaznaczenia kart do `BoardGrid`.
  - Obsługuje callbacki z hooka (`onFinish`, `onTimeout`).
- **Walidacja:**
  - Sprawdza obecność `boardId`; wyświetla komunikat błędu.
  - Obsługuje błędy z query (404) - wyświetla "Board not found".
- **Typy:** `BoardViewDTO`, `GameState`, `CardVM`, `IBoardGamePageComponentProps`.
- **Propsy:** `{ boardId?: string }` (z Astro `params.id`).
- **HOC:** Owinięty w `withProviders` dla Redux i innych providerów.

### GameMeta

- **Opis:** Pasek boczny (desktop: fixed right, mobile: fixed bottom) zawierający timer, przyciski sterujące grą oraz nawigację poziomów.
- **Elementy:**
  - `<aside>` fixed (pozycja responsywna)
  - Przycisk toggle dźwięku z ikonami `VolumeOnIcon`/`VolumeOffIcon`
  - `<div>` z timerem w formacie HH:MM:SS
  - Display ostatniego wyniku (tylko desktop)
  - `<button>` Start/Stop (zielony/czerwony)
  - `<button>` Reset
  - Nawigacja poziomów (jeśli więcej niż 1 poziom, tylko desktop).
- **Interakcje:** `onStart`, `onStop`, `onReset`, `navigateToLevel`, `handleSound` (toggle dźwięku).
- **Walidacja:**
  - Start button nieaktywny gdy `canStart === false` (brak kart lub gra już trwa).
  - Reset button nieaktywny gdy `running === false && timeSec === 0`.
  - Przyciski poziomów nieaktywne dla aktualnego poziomu.
- **Typy:** `IGameMetaProps`.
- **Propsy:** `{ timeSec, running, canStart, lastScore?, onStart, onStop, onReset, levels?, currentLevel?, navigateToLevel? }`.
- **Hooks:** Używa `useBoardSound` do zarządzania dźwiękami.

### BoardGrid

- **Opis:** Renderuje karty w układzie flex wrap z overlayem gdy gra nie jest uruchomiona oraz nawigacją poziomów po ukończeniu.
- **Elementy:**
  - `<div>` główny kontener (flex wrap, responsywna szerokość)
  - Wewnętrzny `<div>` z flex wrap dla kart
  - Komponenty `<Card …/>` dla każdej karty
  - Overlay z komunikatem gdy `!running` (przezroczyste białe tło)
  - Przyciski "Poprzedni level"/"Następny level" po ukończeniu (gdy `cards.length === 0`).
- **Interakcje:**
  - deleguje `onCardClick(index)`
  - wywołuje `navigateToLevel` dla nawigacji między poziomami.
- **Logika:**
  - Wyłącza karty podczas animacji (`someAnimating` = karty w stanie success/failure).
- **Typy:** `IBoardGridProps`.
- **Propsy:** `{ cards: (CardVM & { status })[], running, onCardClick, levels?, currentLevel?, navigateToLevel? }`.

### Card

- **Opis:** Pojedyncza karta wyświetlająca tekst (termin lub definicja) oraz stan z obsługą dark mode.
- **Elementy:** `<button>` z klasami Tailwind zależnymi od statusu (border, background, hover states).
- **Interakcje:** `onClick` wywołuje przekazaną funkcję (jeśli `!disabled`).
- **Walidacja:**
  - Klik ignorowany, gdy `disabled === true` (podczas animacji lub gra zatrzymana).
- **Accessibility:**
  - `aria-pressed={status === "selected"}` dla stanu zaznaczenia
  - `focus-visible` ring dla nawigacji klawiaturą
  - `select-none` aby uniemożliwić zaznaczanie tekstu.
- **Typy:** `ICardProps`.
- **Propsy:** `{ text, status, disabled?, onClick }`, gdzie `status: "idle" | "selected" | "success" | "failure"`.
- **Styling:**
  - Fixed size: `w-[250px] h-[200px]`
  - Status-dependent borders and backgrounds
  - Dark mode variants dla wszystkich stanów.

## 5. Typy

```ts
// Widok gry (zdefiniowane w src/hooks/useBoardGame.ts)
export interface CardVM {
  value: string; // tekst wyświetlany na karcie
  pairId: string; // identyfikator pary do porównywania
}

export type CardStatus = "idle" | "selected" | "success" | "failure";

export interface GameState {
  cards: CardVM[]; // dynamicznie malejąca tablica
  selectedIndices: number[]; // max 2
  statusMap: Record<number, CardStatus>; // indeks ➞ status
  timeSec: number;
  running: boolean;
  lastScore?: number; // ostatni zapisany wynik
}

export interface UseBoardGame {
  state: GameState;
  startGame(): void;
  stopGame(): void;
  resetGame(): void;
  markCard(index: number): void;
}

// Props komponentów
export interface IGameMetaProps {
  timeSec: number;
  running: boolean;
  canStart: boolean;
  lastScore?: number;
  onStart(): void;
  onStop(): void;
  onReset(): void;
  levels?: number[];
  currentLevel?: number;
  navigateToLevel?: (level: number) => void;
}

export interface IBoardGridProps {
  cards: (CardVM & { status: CardStatus })[];
  running: boolean;
  onCardClick(index: number): void;
  levels?: number[];
  currentLevel?: number;
  navigateToLevel?: (level: number) => void;
}

export interface ICardProps {
  text: string;
  status: CardStatus;
  disabled?: boolean;
  onClick(): void;
}

// Page Props
export interface IBoardGamePageComponentProps {
  boardId?: string;
}

// Typy z src/types.ts
export interface BoardViewDTO extends BoardDetailDTO {
  myScore?: BoardMyScoreDTO;
}

export interface ScoreSubmitCmd {
  elapsedMs: number;
}
```

## 6. Zarządzanie stanem

### Hook `useBoardGame`

**Implementacja:** `src/hooks/useBoardGame.ts`

**Sygnatura:**

```ts
useBoardGame(
  board: BoardViewDTO | null | undefined,
  callbacks?: {
    onFinish?: (elapsedMs: number) => void;
    onTimeout?: () => void;
  }
): UseBoardGame
```

**Działanie:**

- Inicjalizuje `cards` – rozdziela `pairs` na term/definition, miesza własną funkcją `shuffle`.
- Używa `useMemo` do memoizacji początkowych kart.
- Przechowuje refs do timera (`timerRef`) i czasu startu (`gameStartRef`).
- Integruje się z `useBoardSound` dla efektów dźwiękowych.

**Udostępnia funkcje:**

- `markCard(index)` – logika zaznaczania + auto-sprawdzenie:
  - Toggle selection (kliknięcie zaznaczonej karty odznacza ją)
  - Maksymalnie 2 zaznaczone karty
  - Po zaznaczeniu 2 kart wywołuje `checkPairs`
  - Ignoruje kliknięcia gdy gra nie działa lub karta jest w stanie success/failure
- `startGame()` – uruchamia timer i grę
- `stopGame()` – zatrzymuje timer
- `resetGame()` – resetuje stan gry i ustawia karty do stanu początkowego
- `checkPairs(i1, i2)` – sprawdza czy zaznaczone karty pasują:
  - Success: ustawia status "success", odtwarza dźwięk sukcesu, po 500ms usuwa karty
  - Failure: ustawia status "failure", odtwarza dźwięk porażki, po 500ms resetuje status
  - Po usunięciu wszystkich kart: odtwarza fanfarę, zapisuje wynik, zatrzymuje timer, wywołuje `callbacks.onFinish`

**Efekty uboczne:**

- `useEffect` odświeża karty gdy zmieni się board
- `useEffect` sprawdza limit 10 minut i wywołuje `callbacks.onTimeout`
- `useEffect` czyści interwał przy unmount

**Zwraca:**

```ts
{
  state: { cards, selectedIndices, statusMap, timeSec, running, lastScore },
  startGame,
  stopGame,
  resetGame,
  markCard
}
```

### Redux Store (RTK Query)

**API Slice:** `src/store/api/apiSlice.ts`

- `useGetBoardByIdQuery(boardId)` - pobiera dane planszy
- `useSubmitScoreMutation()` - zapisuje wynik

**Sound Slice:** `src/store/slices/soundSlice.ts`

- Zarządza stanem włączenia/wyłączenia dźwięków
- Action: `toggleSound()`

## 7. Integracja API

1. **GET /api/boards/:id** – RTK Query `useGetBoardByIdQuery` w `BoardGamePage`, typ `BoardViewDTO`.
   - Używa `skipToken` gdy `boardId` jest undefined
   - Zwraca `{ data, isFetching, error }`
2. **POST /api/boards/:id/scores** – RTK Query `useSubmitScoreMutation`, payload: `{ boardId, elapsedMs }` (`ScoreSubmitCmd`).
   - Wywołane w callback `onGameFinish`
   - Success: wyświetla toast sukcesu
   - Error: wyświetla toast błędu

## 8. Interakcje użytkownika

- Klik „Start" ➞ timer rusza (`setInterval` 1s), karty można zaznaczać, overlay znika.
- Klik karty ➞ zmienia się status na `selected`; po drugiej karcie hook decyduje o `success`/`failure`.
- **Success match:**
  - Zielona obwódka, dźwięk sukcesu
  - Po 500ms karty znikają z tablicy
  - StatusMap oczyszczany z tych indeksów
- **Failure match:**
  - Czerwona obwódka, dźwięk porażki
  - Po 500ms status wraca do `idle`
  - Karty pozostają na tablicy
- Wszystkie karty zniknęły ➞
  - Fanfara
  - Timer stop
  - Zapisanie wyniku (`lastScore`)
  - Wywołanie `onFinish` callback (submit do API)
  - Overlay pokazuje "Wciśnij Reset aby powtórzyć"
  - Przyciski nawigacji do następnego/poprzedniego poziomu (jeśli istnieją)
- Klik „Stop" ➞ timer pauza, overlay pokazuje się, karty nieklikalne.
- Klik „Reset" ➞
  - Stan gry wyzerowany
  - Timer wyzerowany
  - Karty przetasowane na nowo (z `initialCards`)
  - StatusMap oczyszczony
  - `selectedIndices` puste
- Klik na ikonę dźwięku ➞ toggle `soundOn` w Redux store
- Klik na kartę zaznaczoną ➞ odznacza ją (toggle)
- Klik na numer poziomu ➞ nawigacja do tego poziomu (zmiana `level` w URL)

## 9. Warunki i walidacja

- `elapsedMs` > 0 przed wysłaniem (walidacja na serwerze).
- Maks. 2 wybrane karty w `selectedIndices`.
- Kliknięcie na już zaznaczoną kartę ją odznacza (toggle logic).
- Nie wolno kliknąć w karty ze statusem `success`/`failure` (sprawdzane w `markCard`).
- Karty są `disabled` podczas animacji (`someAnimating` w BoardGrid).
- Gra rozpoczyna się dopiero po `startGame` (sprawdzane `if (!running) return`).
- Start button nieaktywny gdy `!canStart` (brak kart lub gra już działa).
- Reset button nieaktywny gdy gra nie została uruchomiona i timer wynosi 0.
- Timer automatycznie zatrzymuje się po 10 minutach z wywołaniem `onTimeout`.

## 10. Obsługa błędów

- 404 board (query error) ➞ wyświetla "Board not found" w komponencie.
- Brak `boardId` ➞ wyświetla "Brak identyfikatora planszy".
- Błąd przy zapisie wyniku ➞ toast error "Nie udało się zapisać wyniku" (catch w `onGameFinish`).
- Sukces zapisu wyniku ➞ toast success "Wynik zapisany".
- Upływ 10 min ➞ auto stop, wywołanie `onTimeout` callback ➞ toast warning "Czas minął".
- Błąd odtwarzania dźwięku ➞ ignorowany (catch w `play()` funkcji).

## 11. Kroki implementacji (ukończone)

1. ✅ Utworzono plik routingu `src/pages/boards/[id]/index.astro` z integracją BoardGamePage.
2. ✅ Zaimplementowano `useBoardGame` w `src/hooks/useBoardGame.ts` wraz z typami.
3. ✅ Stworzono komponenty `GameMeta`, `Card`, `BoardGrid` w `src/components/ui/Game/`.
4. ✅ Podłączono hook i interakcje w `BoardGamePage` (`src/components/pages/BoardGamePage.tsx`).
5. ✅ Ostylowano komponenty Tailwindem z dark mode i responsive design.
6. ✅ Dodano obsługę czasu (interwał + cleanup + 10min limit).
7. ✅ Zaimplementowano zapisywanie wyniku (RTK Query mutation + toasts).
8. ✅ Zaimplementowano lazy-loading danych (RTK Query) i `SkeletonBoard`.
9. ✅ Zadbano o dostępność: aria-label, aria-pressed, focus-visible rings.
10. ✅ Dodano system dźwięków (`useBoardSound` + Redux store dla toggle).
11. ✅ Zaimplementowano system poziomów (`useLevels` + nawigacja).
12. ✅ Dodano HOC `withProviders` dla Redux integration.
13. ✅ Zaimplementowano responsywny sidebar z `useSidebar`.

## 12. Dodatkowe funkcjonalności (poza planem)

### System dźwięków

- **Implementacja:** `src/hooks/useBoardSound.ts`
- Dźwięki: success.mp3, failure.mp3, fanfare.mp3
- Toggle dźwięku w GameMeta
- Stan w Redux (`soundSlice`)

### System poziomów

- **Hook:** `src/hooks/useLevels.ts`
- Nawigacja między poziomami planszy
- Wyświetlanie w GameMeta i BoardGrid
- Przyciski "Poprzedni/Następny level" po ukończeniu

### Loading states

- **Komponent:** `SkeletonBoard`
- Wyświetlany podczas `isFetching`
- Pokazuje placeholder dla określonej liczby kart

### Responsive design

- GameMeta:
  - Desktop: fixed right sidebar
  - Mobile: fixed bottom bar
- BoardGrid: responsywna szerokość z flex wrap
- Level navigation: ukryta na mobile

### Dark mode

- Wszystkie komponenty mają warianty `dark:`
- Card component z pełnym wsparciem dark mode
