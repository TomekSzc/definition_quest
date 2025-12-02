# Plan implementacji toast messages

## 1. Przegląd

Globalny system powiadomień (toast messages) informuje użytkownika o zdarzeniach aplikacji (sukces, ostrzeżenie, błąd). Komponent korzysta z bibliotek shadcn/ui (Toast) i jest dostępny z każdego miejsca dzięki portalowi osadzonemu obok głównego rendera React. Widoczność oraz treść toastów kontroluje dedykowany slice w Redux Toolkit.

## 2. Routing widoku

Toast nie posiada własnej trasy URL. Portal montujemy jednokrotnie w `src/components/Providers.tsx`, tak aby był dostępny w każdym widoku aplikacji.

## 3. Struktura komponentów

```
<Providers>
  └── <Toast />   ← Radix Provider + Toast.Root + Viewport
```

## 4. Szczegóły komponentów

### Toast (globalny)

- **Opis**: Łączy w sobie `ToastPrimitive.Provider`, `Toast.Root` i `ToastViewport`. Konsumuje stan Redux (`toastSlice`) i renderuje komunikat gdy `visible === true`.
- **Elementy**: `ToastPrimitive.Provider`, `ToastPrimitive.Root`, `ToastPrimitive.Title`, `ToastPrimitive.Description`, `ToastPrimitive.Viewport`, przycisk zamknięcia (×).
- **Interakcje**:
  - Auto-close po 15 s (`setTimeout`) → `dispatch(hideToast())`
  - Manualne zamknięcie (× lub swipe/ESC) → `dispatch(clearToast())`
- **Walidacja**: wymaga `message`; `title` opcjonalny (fallback zależny od `type`).
- **Typy**: `ToastState`, `ToastType`
- **Propsy**: brak (stan z Redux)

## 5. Typy

```ts
export type ToastType = "success" | "warning" | "error" | "info";
export interface ToastState {
  type: ToastType | null;
  title: string | null;
  message: string | null;
  visible: boolean;
}
```

## 6. Zarządzanie stanem

- **Redux slice `toastSlice`**
  - `initialState: ToastState` (pola `type`, `title`, `message` mogą być `null`)
  - Akcje:
    - `showToast(payload: { type; message; title? })` → ustawia treść i `visible=true`
    - `hideToast()` → ustawia `visible=false` (używane przy auto-close)
    - `clearToast()` → czyści cały stan (używane przy ręcznym zamknięciu)
  - Zaimplementowane przy użyciu `createSlice` z RTK.
- **Selector**: `selectToast(state) → ToastState`

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

1. **Instalacja zależności**: `@radix-ui/react-toast` (Tailwind/CSS zmienne dla kolorów).
2. **Utwórz `toastSlice`** w `src/store/slices` z akcjami `showToast`, `hideToast`, `clearToast`.
3. **Dodaj komponent `Toast`** w `src/components/ui/Toast.tsx` (łączy provider i logikę).
4. **Umieść `<Toast />`** w `src/components/HOC/Providers.tsx`, aby był obecny globalnie.
5. **Hook `useToast()`** w `src/store/hooks.ts` ułatwia wywołanie `showToast`/`hideToast` w komponentach i endpointach RTK Query.
6. **Aktualizuj interceptory/endpointy HTTP** – dispatch `showToast` dla błędów/sukcesów (z wyjątkiem 401).
7. **Testy manualne/E2E**: sukces, ostrzeżenie, błąd; auto-hide; ręczne zamknięcie.
