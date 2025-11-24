# Plan implementacji widoku Card Game

## 1. Przegląd

Widok odpowiada za interaktywną grę typu "memory-match" opartą o pary (termin – definicja) pobierane z endpointu `GET /api/boards/:id`. Celem widoku jest umożliwienie użytkownikowi rozwiązania planszy, pomiar czasu, prezentację stanu gry oraz zapis najlepszego wyniku do API.

## 2. Routing widoku

`/boards/:id/play` – publiczny lub prywatny w zależności od właściwości planszy.

## 3. Struktura komponentów

```
CardBoardPage (route)
├── GameMeta (sidebar, fixed right)
└── BoardGrid (CSS grid)
    └── Card (N-krotnie)
```

## 4. Szczegóły komponentów

### CardBoardPage

- **Opis:** Główny komponent strony. Ładuje dane planszy, inicjuje hook `useBoardGame`, renderuje `GameMeta` i `BoardGrid`.
- **Główne elementy:**
  - Lazy fetch danych (`useEffect`) + fallback loader.
  - `<GameMeta …/>`, `<BoardGrid …/>`.
- **Interakcje:**
  - Przekazuje zdarzenia z `GameMeta` (start/stop/reset) do hooka.
  - Przekazuje handler zaznaczenia kart do `Card`.
- **Walidacja:**
  - Sprawdza obecność `pairs`; w przypadku braku/404 wyświetla stronę błędu.
- **Typy:** `BoardViewDTO`, `GameState`, `CardVM`.
- **Propsy:** route params `id` (Astro `props.params.id`).

### GameMeta

- **Opis:** Pasek boczny zawierający timer i przyciski sterujące grą.
- **Elementy:** `<aside>` fixed right, `<span>{time}</span>`, `<button>` Start/Stop, `<button>` Reset.
- **Interakcje:** `onStart`, `onStop`, `onReset` przekazane przez props.
- **Walidacja:**
  - Przyciski nieaktywne gdy board niezaładowany.
  - `Reset` ukryty przy nieuruchomionej grze.
- **Typy:** `GameMetaProps`.
- **Propsy:** `{ timeSec, running, onStart, onStop, onReset }`.

### BoardGrid

- **Opis:** Renderuje karty w siatce Tailwind (`grid-cols-[√N]`).
- **Elementy:** `<ul>` z `<li><Card …/></li>`.
- **Interakcje:** deleguje `onCardClick(index)`.
- **Typy:** `BoardGridProps`.
- **Propsy:** `{ cards: CardVM[], onCardClick }`.

### Card

- **Opis:** Pojedyncza karta wyświetlająca tekst (termin lub definicja) oraz stan.
- **Elementy:** `<button>` z tailwindowymi obramowaniami zależnymi od statusu.
- **Interakcje:** `onClick` wywołuje `markCard(index)`.
- **Walidacja:**
  - Klik ignorowany, gdy karta znajduje się w `success` lub `failure` albo gra zatrzymana.
- **Typy:** `CardProps`.
- **Propsy:** `{ text, status }`, gdzie `status: "idle" | "selected" | "success" | "failure"`.

## 5. Typy

```ts
// Widok gry
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
}

// Props
export interface GameMetaProps {
  timeSec: number;
  running: boolean;
  onStart(): void;
  onStop(): void;
  onReset(): void;
}

export interface BoardGridProps {
  cards: (CardVM & { status: CardStatus })[];
  onCardClick(index: number): void;
}

export interface CardProps {
  text: string;
  status: CardStatus;
  onClick(): void;
}
```

## 6. Zarządzanie stanem

Customowy hook `useBoardGame(board: BoardViewDTO)`:

- Inicjalizuje `cards` – rozdziela `pairs` na term/definition, miesza `_.shuffle`.
- Udostępnia funkcje:
  - `markCard(index)` – logika zaznaczania + auto-sprawdzenie.
  - `startGame()`, `stopGame()`, `resetGame()` – zarządzanie timerem (`setInterval`).
- Efekt `useEffect` czyści interwał on unmount lub po 10 min.
- Po opróżnieniu `cards` wywołuje `submitScore()` i zatrzymuje timer.

## 7. Integracja API

1. **GET /api/boards/:id** – fetch w `CardBoardPage`, typ `BoardViewDTO`.
2. **POST /api/boards/:id/scores** – w `submitScore` przekazujemy `{ elapsedMs }` (`ScoreSubmitCmd`). On 201/200 aktualizujemy UI; na 401 przekierowujemy do logowania.

## 8. Interakcje użytkownika

- Klik „Start” ➞ timer rusza, karty można zaznaczać.
- Klik karty ➞ zmienia się status na `selected`; po drugiej karcie hook decyduje o `success`/`failure`.
- Zielona obwódka na 3 s, następnie usuwa karty.
- Czerwona obwódka na 3 s, następnie status wraca do `idle`.
- Wszystkie karty zniknęły ➞ timer stop, wynik wysłany.
- Klik „Stop” ➞ timer pauza, karty nieklikalne.
- Klik „Reset” ➞ stan gry i timer wyzerowane czyli generujemy na nowo boarda i zerujemy licznik

## 9. Warunki i walidacja

- `elapsedMs` > 0 przed wysłaniem.
- Maks. 2 wybrane karty.
- Kliknięcie na już zaznaczoną kartę ma oznaczać jej odznaczenie
- Nie wolno kliknąć w `success`/`failure`.
- Gra rozpoczyna się dopiero po `startGame`.

## 10. Obsługa błędów

- 404 board ➞ komponent `NotFound`.
- 401 przy zapisie wyniku ➞ toast + redirect do logowania.
- Network error ➞ toast + możliwość ponownego wysłania.
- Upływ 10 min ➞ auto stop, toast „Czas minął”.

## 11. Kroki implementacji

1. Utwórz plik routingu `src/pages/boards/[id]/play.astro` i stwórz skeleton.
2. Zaimplementuj `useBoardGame` w `src/lib/hooks/useBoardGame.ts` wraz z typami.
3. Stwórz komponenty `GameMeta`, `Card`, `BoardGrid` w `src/components/ui`.
4. Podłącz hook i interakcje w `CardBoardPage`.
5. Styluj komponenty Tailwindem, dodaj klasy stanu.
6. Dodaj obsługę czasu (interwał + cleanup).
7. Implementuj zapisywanie wyniku (fetch + obsługa błędów).
8. Zaimplementuj lazy-loading danych i placeholder skeleton.
9. Zadbaj o dostępność: aria-label przyciski, focus-ring na kartach.
