# Plan implementacji toast messages

## 1. Przegląd
Globalny system powiadomień (toast messages) informuje użytkownika o zdarzeniach aplikacji (sukces, ostrzeżenie, błąd). Komponent korzysta z bibliotek shadcn/ui (Toast) i jest dostępny z każdego miejsca dzięki portalowi osadzonemu obok głównego rendera React. Widoczność oraz treść toastów kontroluje dedykowany slice w Redux Toolkit.

## 2. Routing widoku
Toast nie posiada własnej trasy URL. Portal montujemy jednokrotnie w `src/components/Providers.tsx`, tak aby był dostępny w każdym widoku aplikacji.

## 3. Struktura komponentów
```
<Providers>
  └── <ToastProvider>   ← portal (ReactDOM.createPortal)
        └── <GlobalToast />
              ├── <Toast />        ← shadcn/ui komponent bazowy
              └── <ToastViewport />
```

## 4. Szczegóły komponentów
### ToastProvider
- **Opis**: Odpowiada za utworzenie portalu i wstrzyknięcie kontekstu Shadcn `Toast.Provider`.
- **Elementy**: `Toast.Provider`, `ToastViewport`, `Portal` (ReactDOM)
- **Interakcje**: brak (tylko renderuje)
- **Walidacja**: brak
- **Typy**: brak specjalnych
- **Propsy**: `children: ReactNode`

### GlobalToast
- **Opis**: Konsumuje stan `toastSlice` i wyświetla pojedynczego `Toast`a gdy `visible === true`.
- **Elementy**: `Toast.Root`, `Toast.Title`, `Toast.Description`, przyciski zamykania (opcjonalnie)
- **Interakcje**:
  - Auto-close po 15 s (`duration`)
  - Manualne zamknięcie (krzyżyk lub ESC) → dispatch(`toast/hide`)
- **Walidacja**: gwarancja istnienia `title` lub `description`
- **Typy**: `ToastState`
- **Propsy**: brak (pobiera z Redux)

## 5. Typy
```ts
export type ToastVariant = "success" | "warning" | "error";
export interface ToastState {
  id: string;          // uuid – pomocne przy debugowaniu
  title?: string;
  message: string;     // główna treść
  variant: ToastVariant;
  visible: boolean;
}
```

## 6. Zarządzanie stanem
- **Redux slice `toastSlice`**
  - `initialState: ToastState | null`
  - Akcje:
    - `show(payload: Omit<ToastState, 'visible'>)` → ustawia `visible=true`
    - `hide()` → ustawia `visible=false`
  - Extra reducer wykorzystujący `RTK.createSlice`.
- **Selector**: `selectToast(state) → ToastState | null`

## 7. Integracja API
- **Interceptor** (Axios / fetch wrapper w `src/lib/services`):
  - On `response.error` sprawdza `status !== 401` → `dispatch(show({variant:'error', message: error.message}))`
- **Login thunk**: po błędzie logowania dispatchuje `show({variant:'error', message:'Nieprawidłowy e-mail lub hasło'})`

## 8. Interakcje użytkownika
1. Użytkownik wykonuje akcję → API zwraca błąd → toast `error` pojawia się 15 s lub do zamknięcia.
2. Użytkownik zapisuje dane pomyślnie → toast `success`.
3. Operacja ryzykowna (np. delete) → toast `warning`.

## 9. Warunki i walidacja
- `message` musi być nie-pusty.
- `variant` musi należeć do `ToastVariant`.
- Jeden toast widoczny jednocześnie (viewport limit 1).

## 10. Obsługa błędów
- Jeśli portal nie może się zamontować → console.error, fallback do inline render.
- Nieudane dispatch (np. brak store) – loguje błąd i nie wyświetla toast.

## 11. Kroki implementacji
1. **Instalacja zależności**: `shadcn/ui`, `@radix-ui/react-toast` (jeśli nie ma), `uuid`.
2. **Utwórz `toastSlice`** w `src/store/slices`.
3. **Dodaj `ToastProvider`** w `src/components/Providers.tsx` i stwórz portal (`document.body`).
4. **Zaimplementuj `GlobalToast`** w `src/components/GlobalToast.tsx` – subskrybuje Redux.
5. **Importuj style toastów** (`shadcn` CLI lub ręcznie do `global.css`).
6. **Aktualizuj interceptor HTTP** – dispatch `show(error)` oprócz 401.
7. **Modyfikuj akcje związane z loginem** – przy błędzie dispatch toast.
8. **Dodaj helper hook `useToast()`** aby łatwo wywoływać toast w komponentach.
9. **Testy manualne**: symulacja sukcesu, ostrzeżeń, błędów; auto-hide.
10. **E2E lub jednostkowe**: sprawdzenie slice i wyświetlania komponentu.
