# Plan implementacji widoku „Utwórz tablicę”

## 1. Przegląd

Widok „Utwórz tablicę" umożliwia ręczne dodawanie par termin–definicja lub generowanie ich przy pomocy AI. Użytkownik może skonfigurować:
- tytuł tablicy
- widoczność (publiczna/prywatna)
- tagi (max 10)
- liczbę kart (16/24)
- pary termin-definicja (1-100)

Formularz korzysta z `react-hook-form` i walidacji `zod` (`CreateBoardSchema`). Pary mogą być dodawane/usuwane dynamicznie (z wizualnym grupowaniem po poziomach), a panel boczny (fixed/sticky) pozwala wkleić tekst do AI, wygenerować pary i zaakceptować je w modalu.

## 2. Routing widoku

- Ścieżka: `/boards/create`
- Plik strony: `src/pages/boards/create.astro`
- Komponent React: `src/components/pages/CreateBoardPage.tsx`
- Route jest chroniony – dostęp tylko po zalogowaniu:
  - Komponent opakowany w `withProviders` HOC (Redux, PersistGate, ProtectedRoute, Toast, ReactLayout)
  - `ProtectedRoute` sprawdza autentykację i przekierowuje na login jeśli brak sesji
- Link w Sidebar: "Utwórz tablicę" z ikoną `PlusIcon`
- Breadcrumb: "Utwórz tablicę" (w `routeTitles`)

## 3. Struktura komponentów

```
CreateBoardPage (.astro)
└── Layout
    ├── Header
    ├── Sidebar
    │   └── Breadcrumbs ("Utwórz tablicę")
    ├── <React Island> CreateBoardView (ts/tsx)
    │   ├── LoaderOverlay
    │   ├── CreateBoardForm
    │   │   ├── Title Input (inline)
    │   │   ├── TagsInput (chips)
    │   │   ├── CardCountToggle (16 | 24)
    │   │   ├── BoardVisibilityToggle (Publiczna | Prywatna)
    │   │   ├── PairForm
    │   │   │   └── PairFormRow × N
    │   │   └── FormFooter (Submit)
    │   └── GeneratePairsByAI (fixed/sticky panel)
    │       ├── Textarea
    │       ├── GenerateButton
    │       └── AcceptPairsModal
    └── Footer
```

## 4. Szczegóły komponentów

### 4.1 CreateBoardForm

- **Opis**: Główny formularz tworzenia tablicy z użyciem `react-hook-form` i walidacji `zod`.
- **Elementy**: `form`, inline title input, `TagsInput`, `CardCountToggle`, `BoardVisibilityToggle`, `PairForm`, `Submit`.
- **Interakcje**: 
  - submit → wywołuje `submitFn` (RTK Query mutation)
  - dodawanie/usuwanie par przez `useFieldArray` (append, remove)
  - expose `addPairs` method przez `forwardRef` + `useImperativeHandle`
- **Walidacja**:
  - `title`: min 1, max 255.
  - `tags[]`: ≤ 10, każdy 1–20 znaków, unikalne.
  - `cardCount`: 16 | 24.
  - `isPublic`: boolean (default: true).
  - `pairs.length`: 1–100.
  - `term/definition`: 1–255, term unikalny (case-insensitive) w ramach formularza.
- **Typy**: `CreateBoardFormValues` z inferowanego `CreateBoardSchema`.
- **Propsy**: `submitFn: SubmitFn`.
- **Handle**: Eksportuje `CreateBoardFormHandle` z metodą `addPairs(pairs: PairFormValue[])`:
  - dodaje pary do formularza (respektując limit 100)
  - automatycznie usuwa puste pary po dodaniu nowych (cleanup)

### 4.2 TagsInput

- **Opis**: Pole tekstowe + lista chipów usuwalnych używając Shadcn `Badge`.
- **Elementy**: `input`, lista `Badge` z `CloseIcon`.
- **Interakcje**: 
  - Enter dodaje tag do listy
  - Sprawdza unikalność i limit 10 przed dodaniem
  - Klik X (CloseIcon) usuwa tag
- **Walidacja**: długość tagu (1-20), unikalność, max 10 tagów.
- **Integracja**: używany przez RHF `Controller` z name="tags".
- **Propsy**: `value?: string[]`, `onChange: (value: string[]) => void`, `error?: string`.

### 4.3 CardCountToggle

- **Opis**: Przełącznik 16/24 kart używający `ToggleGroup` z Shadcn/ui.
- **Elementy**: `ToggleGroup` z dwoma `ToggleGroupItem` (16, 24).
- **Interakcje**: klik zmienia `cardCount` w RHF przez `Controller`.
- **Walidacja**: literal 16 lub 24.
- **Propsy**: `value: 16 | 24`, `onChange: (value: 16 | 24) => void`.

### 4.3a BoardVisibilityToggle

- **Opis**: Przełącznik widoczności tablicy (Publiczna/Prywatna).
- **Elementy**: `ToggleGroup` z dwoma `ToggleGroupItem` (public, private).
- **Interakcje**: klik zmienia `isPublic` w RHF przez `Controller`.
- **Propsy**: `value: boolean`, `onChange: (value: boolean) => void`.

### 4.4 PairForm

- **Opis**: Renderuje listę `PairFormRow` z podziałem na poziomy (level) w zależności od `cardCount`.
- **Elementy**: Iteruje przez `fields` z `useFieldArray` i grupuje pary po `cardCount / 2`.
- **Interakcje**: Przekazuje funkcję `remove` do każdego wiersza.
- **Propsy**: `fields`, `errors`, `register`, `remove`, `cardCount`.

### 4.5 PairFormRow

- **Opis**: Pojedynczy wiersz z dwoma polami tekstowymi (term, definition) i przyciskiem usuń.
- **Elementy**: 2x `input` + `Button` (×).
- **Walidacja**: term i definition jak wyżej, błędy wyświetlane inline.
- **Interakcje**: edycja pól, klik na × usuwa parę.
- **Propsy**: `index`, `register`, `errors`, `onRemove`.

### 4.6 GeneratePairsByAI

- **Opis**: Panel z textarea i przyciskiem „Generuj AI". Pozycjonowany jako `fixed` na mobile (bottom) i sticky na desktop (right).
- **Elementy**: `Textarea`, `Button`, opcjonalnie `AcceptPairsModal`.
- **Interakcje**: 
  - Wpisanie tekstu + klik „Generuj" → POST `/api/boards/generate`
  - Enter (bez shift/ctrl/alt) również wywołuje generowanie
  - Po sukcesie otwiera `AcceptPairsModal`
- **Stan**: `inputText`, `isLoading`, `pairs` (wygenerowane pary).
- **Propsy**: `formRef?: RefObject<CreateBoardFormHandle>`, `remainingSlots?`, `onAdd?`.
- **Integracja**: Używa `formRef.current.addPairs()` do dodania zaakceptowanych par.

### 4.7 AcceptPairsModal

- **Opis**: Modal z listą wygenerowanych par (checkbox per pair, zaznaczone domyślnie).
- **Elementy**: `Dialog`, lista par z `checkbox`, przyciski Anuluj/Akceptuj.
- **Interakcje**: 
  - Toggle checkbox per para
  - „Akceptuj" → filtruje zaznaczone pary → wywołuje `onAccept` → dodaje do formularza
  - „Anuluj" → zamyka modal bez zmian
- **Walidacja**: przycisk Akceptuj disabled gdy żadna para nie jest zaznaczona.
- **Propsy**: `pairs: GeneratedPair[]`, `onAccept`, `onCancel`.

## 5. Typy

```ts
// Inferowane z CreateBoardSchema (zod)
type CreateBoardFormValues = z.infer<typeof CreateBoardSchema>;
// = {
//   title: string;
//   cardCount: 16 | 24;
//   pairs: { term: string; definition: string }[]; // 1–100
//   isPublic: boolean;
//   tags?: string[];
// }

// Z types.ts
interface CreateBoardCmd {
  title: string;
  cardCount: 16 | 24;
  pairs: PairCreateCmd[];
  isPublic: boolean;
  tags?: string[];
}

interface GenerateBoardCmd extends Omit<CreateBoardCmd, "pairs"> {
  inputText: string;
}

interface BoardGenerationResultDTO {
  pairs: GeneratedPair[];
}

type GeneratedPair = { term: string; definition: string };

// Handle do komunikacji między GeneratePairsByAI a CreateBoardForm
interface CreateBoardFormHandle {
  addPairs: (pairs: { term: string; definition: string }[]) => void;
}
```

## 6. Zarządzanie stanem

- **Formularz**: `react-hook-form` + `zodResolver(CreateBoardSchema)`.
- **Dynamiczna lista par**: `useFieldArray` w `CreateBoardForm` z metodami `append` i `remove`.
- **AI panel**: lokalny `useState` na `inputText`, `pairs`, korzysta z `useGeneratePairsMutation` hook RTK Query.
- **Modal**: kontrolowany przez `pairs !== null` w `GeneratePairsByAI`, lokalny `useState` dla checkboxów w `AcceptPairsModal`.
- **Global UI state**: `setLoading` z Redux slice do wyświetlania `LoaderOverlay`.
- **Toasty**: `useToast` hook z Redux do wyświetlania komunikatów sukcesu/błędu.

## 7. Integracja API

| Akcja          | Endpoint               | Metoda | Wejście            | Wyjście                    |
| -------------- | ---------------------- | ------ | ------------------ | -------------------------- |
| Utwórz tablicę | `/api/boards`          | POST   | `CreateBoardCmd`   | `BoardDetailDTO[]`         |
| Generuj pary   | `/api/boards/generate` | POST   | `GenerateBoardCmd` | `BoardGenerationResultDTO` |

Implementacja w RTK Query (`src/store/api/apiSlice.ts`):

### createBoard
- invalidatesTags: `["Boards"]`
- onQueryStarted:
  - sukces: toast success + automatyczne przekierowanie do `/boards/${data[0].id}` (pierwsza utworzona tablica)
  - błąd: toast error z komunikatem z serwera

### generatePairs
- bez cache invalidation (nie modyfikuje stanu serwera, tylko generuje pary)
- bez onQueryStarted (obsługa błędów w komponencie)

## 8. Interakcje użytkownika

1. Wprowadza tytuł, tagi, cardCount, isPublic.
2. Dodaje pary ręcznie:
   - Formularz startuje z jedną pustą parą
   - Klik „+ Dodaj parę" → nowa para na końcu listy
   - Pary są grupowane wizualnie po `cardCount / 2` z nagłówkiem „Level: X"
   - Klik × usuwa parę (limit minimum 1 para)
3. Alternatywnie generuje pary AI:
   - Wkleja tekst w panel AI → klik „Generuj" (lub Enter)
   - Ładowanie + LoaderOverlay
   - Po sukcesie otwiera się modal z wygenerowanymi parami (wszystkie zaznaczone)
   - Może odznaczyć niepotrzebne → „Akceptuj" → zaznaczone pary dodane do formularza
4. Klik „Utwórz tablicę" → walidacja → POST `/api/boards` (przez RTK Query) →
   - sukces: toast success (z `apiSlice.onQueryStarted`) + przekierowanie do `/boards/:id` pierwszej utworzonej tablicy
   - błąd: toast error z komunikatem z serwera (z `apiSlice.onQueryStarted`)

## 9. Warunki i walidacja

- Walidacja klienta = walidacji z schematów backend (zod sync) przez `CreateBoardSchema`.
- Dodatkowe reguły enforced przez schema:
  - unikalność termów lokalnie (case-insensitive) przez `.refine()`.
  - limit 100 par (max).
  - minimum 1 para (min).
  - limit 5000 znaków dla AI input (w `GenerateBoardSchema`).
  - tagi: max 10, każdy 1-20 znaków.
- Walidacja na poziomie UI:
  - przycisk „+ Dodaj parę" disabled gdy `fields.length >= 100`.
  - przycisk „Generuj" disabled gdy `inputText` pusty lub isLoading.

## 10. Obsługa błędów

- **Walidacja kliencka**: komunikaty inline pod polami (czerwony tekst, czerwona ramka pola).
- **Generowanie AI**:
  - Błąd: toast error z komunikatem z API (message z response.data)
  - LoaderOverlay wyświetlany podczas ładowania
- **Tworzenie tablicy**:
  - 400/409 z API: toast error z komunikatem z serwera (przez `apiSlice.onQueryStarted`)
  - Sukces: toast success + redirect (przez `apiSlice.onQueryStarted`)
- **401**: obsługa przez middleware + baseQueryWithReauth → automatyczny refresh token lub redirect do login.
- **429 (quota)**: toast error (komunikat z API).
- **Sieć / 500**: toast error z komunikatem generycznym lub z serwera.

## 11. Kroki implementacji (zrealizowane)

1. ✅ **Routing**: utworzono `src/pages/boards/create.astro` z importem `CreateBoardPage`.
2. ✅ **Breadcrumbs**: dodano `/boards/create: "Utwórz tablicę"` do `routeTitles` w `Breadcrumbs.tsx`.
3. ✅ **Sidebar**: dodano link „Utwórz tablicę" z ikoną `PlusIcon` w `Sidebar.tsx`.
4. ✅ **Instalacja lib**: zainstalowano `react-hook-form`, `@hookform/resolvers`, `zod`.
5. ✅ **CreateBoardPage**: utworzono kontener React z layoutem flex, używa `withProviders` HOC.
6. ✅ **CreateBoardForm**: implementacja z RHF + `zodResolver(CreateBoardSchema)`, forwardRef z `addPairs` handle.
7. ✅ **TagsInput**: komponent chips używający Shadcn `Badge` + `CloseIcon`.
8. ✅ **CardCountToggle**: komponent używający `ToggleGroup` z Shadcn/ui.
9. ✅ **BoardVisibilityToggle**: komponent używający `ToggleGroup` dla pola `isPublic`.
10. ✅ **PairForm** + `PairFormRow`: implementacja z `useFieldArray`, grupowanie po poziomach.
11. ✅ **API Slice**: dodano `createBoard` i `generatePairs` endpoints w `apiSlice.ts`.
12. ✅ **GeneratePairsByAI** panel: sticky/fixed panel z textarea, integracja z formRef.
13. ✅ **AcceptPairsModal**: modal z checkboxami, Dialog z Shadcn/ui.
14. ✅ **LoaderOverlay**: globalny overlay podczas operacji async.
15. ✅ **Toasty**: wykorzystano `useToast` hook + Redux dla komunikatów.
16. ✅ **Walidacja**: `CreateBoardSchema` w `src/lib/validation/boards.ts`.
17. ✅ **Stylowanie**: Tailwind + CSS variables (`--color-primary`), responsywny layout.
18. ⏳ **Testy jednostkowe**: komponenty mają data-testid, brak widocznych testów w pliku.
19. ⏳ **E2E testy**: brak widocznych testów E2E dla create board flow.
20. ⏳ **Dokumentacja**: brak Storybook entries.
