# Plan implementacji widoku „Utwórz tablicę”

## 1. Przegląd
Widok „Utwórz tablicę” umożliwia ręczne dodawanie par termin–definicja lub generowanie ich przy pomocy AI. Użytkownik może skonfigurować tytuł, tagi, liczbę kart (16/24) oraz maksymalnie 100 par. Formularz korzysta z `react-hook-form` i walidacji `zod`. Pary mogą być dodawane / usuwane dynamicznie, a panel boczny pozwala wkleić tekst do AI i zaakceptować wygenerowane pary.

## 2. Routing widoku
- Ścieżka: `/boards/create`  
- Plik strony: `src/pages/boards/create.astro`  
- Route jest chroniony – dostęp tylko po zalogowaniu (middleware auth).

## 3. Struktura komponentów
```
CreateBoardPage (.astro)
└── Layout
    ├── Header
    ├── Sidebar
    │   └── Breadcrumbs ("Utwórz tablicę")
    ├── <React Island> CreateBoardView (ts/tsx)
    │   ├── CreateBoardForm
    │   │   ├── TitleInput
    │   │   ├── TagsInput (chips)
    │   │   ├── CardCountToggle (16 | 24)
    │   │   └── PairsFieldArray
    │   │       └── PairFormRow × N
    │   ├── GeneratePairsByAI (sticky panel)
    │   │   ├── InputTextArea
    │   │   ├── GenerateButton
    │   │   └── AcceptPairsModal
    │   └── FormFooter (Submit / Reset)
    └── Footer
```

## 4. Szczegóły komponentów
### 4.1 CreateBoardForm
- **Opis**: Główny formularz tworzenia tablicy.
- **Elementy**: `form`, `TitleInput`, `TagsInput`, `CardCountToggle`, `PairsFieldArray`, `Submit`, `Reset`.
- **Interakcje**: submit, reset, dodawanie/usuwanie par.
- **Walidacja**:
  - `title`: min 1, max 255.
  - `tags[]`: ≤ 10, każdy 1–20 znaków, unikalne.
  - `cardCount`: 16 | 24.
  - `pairs.length`: 1–100.
  - `term/definition`: 1–255, term unikalny w ramach formularza.
- **Typy**: `CreateBoardFormValues` (ViewModel), `PairFormValue`.
- **Propsy**: brak (komponent nadrzędny zarządza stanem globalnym formularza przez RHF context).

### 4.2 TagsInput
- **Opis**: Pole tekstowe + lista chipów usuwalnych.
- **Elementy**: `input`, lista `Chip` z przyciskiem X.
- **Interakcje**: `onEnter` dodaje tag, klik X usuwa.
- **Walidacja**: długość tagu, unikalność, maks 10.
- **Typy**: `string[]` z RHF `Controller`.
- **Propsy**: `name` (string).

### 4.3 CardCountToggle
- **Opis**: Przełącznik 16/24 kart (radio lub SegmentedToggle z Shadcn/ui).
- **Interakcje**: klik zmienia `cardCount` w RHF.
- **Walidacja**: literal 16 lub 24.
- **Propsy**: `name`.

### 4.4 PairsFieldArray
- **Opis**: Zarządza dynamiczną listą par z użyciem `useFieldArray`.
- **Interakcje**: Dodaj (+), Usuń (trash), edycja pól.
- **Walidacja**: delegowane do `PairFormRow` + limit 100.

### 4.5 PairFormRow
- **Opis**: Dwa pola tekstowe w wierszu.
- **Walidacja**: term i definition jak wyżej.
- **Interakcje**: na blur walidacja, przycisk usuń.

### 4.6 GeneratePairsByAI
- **Opis**: Sticky panel z textarea i przyciskiem „Generuj AI”.
- **Interakcje**: submit ↠ POST `/api/boards/generate`.
- **Walidacja**: `inputText` ≤ 5000.
- **Stan**: `loading`, `error`, `pairsResult`.

### 4.7 AcceptPairsModal
- **Opis**: Modal z listą wygenerowanych par (checkbox per pair, zaznaczone domyślnie).
- **Interakcje**: odznacz, „Akceptuj” ↠ filtr → dodać do `PairsFieldArray`.
- **Walidacja**: co najmniej 1 para zaznaczona.

## 5. Typy
```ts
interface PairFormValue {
  term: string;
  definition: string;
}

interface CreateBoardFormValues {
  title: string;
  tags: string[];
  cardCount: 16 | 24;
  pairs: PairFormValue[]; // 1–100
}

interface AiGenerateRequest extends GenerateBoardCmd {}
interface AiGenerateResponse extends BoardGenerationResultDTO {}
```

## 6. Zarządzanie stanem
- Formularz: `react-hook-form` + `zodResolver`.
- Dynamiczna lista par: `useFieldArray`.
- AI panel: lokalny `useState` na `inputText`, `loading`, `pairsResult`.
- Modal: kontrolowany `isOpen` oraz formularz RHF do checkboxów.

## 7. Integracja API
| Akcja | Endpoint | Metoda | Wejście | Wyjście |
|-------|----------|--------|---------|---------|
| Utwórz tablicę | `/api/boards` | POST | `CreateBoardCmd` | `BoardDetailDTO[]` |
| Generuj pary | `/api/boards/generate` | POST | `GenerateBoardCmd` | `BoardGenerationResultDTO` |

Implementacja w RTK Query (`apiSlice`) – dodać dwa endpoints `createBoard` i `generatePairs`.

## 8. Interakcje użytkownika
1. Wprowadza tytuł, tagi, cardCount.
2. Dodaje pary ręcznie lub generuje AI:
   - Wkleja tekst → klik „Generuj AI”.
   - Po sukcesie otwiera się modal, wybiera pary → „Akceptuj” → pary dodane.
3. Klik „Zapisz tablicę” → walidacja → POST `/boards` →
   - sukces: redirect do /my-boards lub /boards/:id
   - błąd: toast z komunikatem.

## 9. Warunki i walidacja
- Walidacja klienta = walidacji z schematów backend (zod sync).
- Dodatkowe:
  - unikalność termów lokalnie.
  - limit 100 par.
  - limit 5000 znaków dla AI input.

## 10. Obsługa błędów
- Walidacja kliencka: komunikaty inline.
- 400/409 z API: toast error + podświetlenie pól.
- 401: redirect do login.
- 429 (quota): toast warning.
- Sieć / 500: toast error, możliwość ponowienia.

## 11. Kroki implementacji
1. **Routing**: utwórz `src/pages/boards/create.astro` na bazie `my-boards.astro`.
2. **Breadcrumbs**: rozszerz `routeTitles` o `/boards/create`.
3. **Instalacja lib**: `npm i react-hook-form @hookform/resolvers zod`.
4. **CreateBoardView**: kontener React + import `client:load` w Astro.
5. **CreateBoardForm**: implementacja RHF + zod schema.
6. **TagsInput**: komponent chips (użyj Shadcn `Badge` + `X`).
7. **CardCountToggle**: segment/toggle.
8. **PairsFieldArray** + `PairFormRow` z `useFieldArray`.
9. **API Slice**: dodaj `createBoard`, `generatePairs` endpoints.
10. **GeneratePairsByAI** panel + modal AcceptPairsModal.
11. **Toasty**: wykorzystaj istniejący `useToast`.
12. **Stylowanie**: Tailwind + dark mode.
13. **Testy jednostkowe**: walidacja schema, dodawanie tagów, par.
14. **E2E happy path**: Cypress/Playwright – create board.
15. **Dokumentacja**: README + Storybook entry dla nowych komponentów.
