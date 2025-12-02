# Architektura UI dla Definition Quest

## 1. Przegląd struktury UI

Definition Quest to aplikacja webowa typu desktop-first, której interfejs dzieli się na dwa główne rejony:

1. **Stały lewy sidebar** (nawigacja sekcyjna + akcja stworzenia planszy).
2. **Górny pasek** (avatar użytkownika, przełączniki globalne, toasty).

Całość stron (oprócz logowania/rejestracji) chroniona jest warstwą `AuthGuard`. Widoki ładują się w `<Outlet>` React Routera, co ułatwia zarządzanie stanem i cache.

## 2. Lista widoków

### Dashboard – Public Boards

- **Ścieżka**: `/boards`
- **Cel**: umożliwia przeglądanie publicznych plansz.
- **Kluczowe informacje**: lista BoardCard (tytuł, autor, liczba kart, data), paginacja, wyszukiwarka.
- **Kluczowe komponenty**: `BoardCard`, `SearchInput`, `Pagination`, `Sidebar`, `ToastContainer`.
- **UX/a11y/bezpieczeństwo**: debounce 300 ms; aria-labels przy inputach; paginacja dostępna klawiaturą.

### My Boards

- **Ścieżka**: `/boards/mine`
- **Cel**: przegląd, edycja i archiwizacja własnych plansz.
- **Kluczowe informacje**: BoardCard z akcjami Edit / Delete / Play, filtr archived.
- **Kluczowe komponenty**: `BoardCard` (z menu akcji), `Pagination`, `Sidebar`.
- **UX/a11y/bezpieczeństwo**: akcje wymagają auth; przy Delete potwierdzenie modal.

### Played Boards

- **Ścieżka**: `/boards/played`
- **Cel**: lista plansz z odnotowanym wynikiem użytkownika.
- **Kluczowe informacje**: BoardCard + ostatni czas.
- **Kluczowe komponenty**: `BoardCard`, `Pagination`.

### Create Board

- **Ścieżka**: `/boards/create`
- **Cel**: ręczne dodawanie par lub generowanie przez AI.
- **Kluczowe informacje**: formularz tytułu, tagów, cardCount, lista `PairFormRow`, licznik zapytań AI.
- **Kluczowe komponenty**: `PairFormRow`, `AIQuotaMeter`, `GenerateDialog`, `UnsavedChangesGuard`.
- **UX/a11y/bezpieczeństwo**: walidacje w czasie rzeczywistym; liczba par nielimitowana (backend dzieli na poziomy); dialog postępu generowania z opcją anulowania.

### Edit Board

- **Ścieżka**: `/boards/:id/edit`
- **Cel**: modyfikacja istniejącej planszy już bez ai. Ten forularz ma limit par zgodnie z cardCount. Ale jest też przycisk "+", który tworzy nowy level w boardzie zgodnie z wcześniej utworzonym endpointem
- **Kluczowe informacje**: wstępnie wypełniony formularz Create Board.
- **Kluczowe komponenty**: `PairFormRow`, `AIQuotaMeter`, `GenerateDialog`, `UnsavedChangesGuard`.

### Play Board

- **Ścieżka**: `/play/:boardId`
- **Cel**: rozgrywka memory-match i zapis wyniku.
- **Kluczowe informacje**: siatka kart (term/definition), timer, komunikat wynikowy.
- **Kluczowe komponenty**: `MemoryGrid`, `CardButton`, `Timer`, `ResultDialog`.
- **UX/a11y/bezpieczeństwo**: karty jako `button` z `aria-label`; max 2 zaznaczone; focus przenoszony po dopasowaniu; wynik POST do API.

### Sign In

- **Ścieżka**: `/signin`
- **Cel**: logowanie.
- **Kluczowe informacje**: formularz email/hasło + OAuth.
- **Kluczowe komponenty**: `AuthForm`, `ToastContainer`.

### Sign Up

- **Ścieżka**: `/signup`
- **Cel**: rejestracja.
- **Kluczowe informacje**: formularz z walidacją (email, password, displayName).
- **Kluczowe komponenty**: `SignUpForm`, `ToastContainer`.

### Forgot Password

- **Ścieżka**: `/forgot-password`
- **Cel**: żądanie resetu hasła.
- **Kluczowe informacje**: formularz emaila, komunikat sukcesu po wysłaniu linku.
- **Kluczowe komponenty**: `ForgotPasswordForm`, `ToastContainer`.
- **UX/a11y/bezpieczeństwo**: zawsze zwraca sukces (nie ujawnia czy email istnieje); walidacja formatu email.

### Reset Password

- **Ścieżka**: `/reset-password?token=xxx&type=recovery`
- **Cel**: ustawienie nowego hasła po kliknięciu linku z emaila.
- **Kluczowe informacje**: formularz nowego hasła (2x dla potwierdzenia), walidacja tokenu SSR.
- **Kluczowe komponenty**: `ResetPasswordForm`, `ToastContainer`.
- **UX/a11y/bezpieczeństwo**: token weryfikowany przez Astro SSR przed renderowaniem; przekierowanie na `/forgot-password` jeśli token nieprawidłowy.

### Profile Dropdown

- **Ścieżka pseudo**: w nagłówku.
- **Cel**: szybki dostęp do ustawień profilu i wylogowania.

### Not Found

- **Ścieżka**: `*`
- **Cel**: obsługa 404.

## 3. Mapa podróży użytkownika

1. **Pierwsza wizyta (anonim)** → `/signin` lub `/signup`.
2. **Udane logowanie** → redirect do `/boards` (Public Boards).
3. **Zapomnienie hasła**:
   1. Na stronie logowania kliknij "Forgot password?".
   2. Wprowadź email → `/forgot-password`.
   3. Komunikat sukcesu → sprawdź email.
   4. Kliknij link w emailu → `/reset-password?token=xxx`.
   5. Wprowadź nowe hasło → redirect do `/signin` z toastem _Success_.
4. **Tworzenie planszy**:
   1. Sidebar ➜ „Create Board".
   2. Uzupełnij formularz lub kliknij „Generate".
   3. AI generuje pary → podgląd i ewentualna edycja.
   4. Zapis → backend tworzy board → redirect do `/boards/mine` z toastem _Success_.
5. **Rozgrywka**:
   1. Z listy (publicznej lub własnej) wybierz „Play".
   2. Strona `/play/:boardId` ładuje dane, startuje timer.
   3. Dopasuj wszystkie pary → wynik zapisany, dialog z czasem.
   4. Zamknij dialog → redirect back lub przycisk „Replay".
6. **Przegląd wyników**: zakładka Played Boards, gdzie ostatni czas widoczny przy każdej planszy.

## 4. Zarządzanie stanem globalnym (Redux Toolkit)

### 4.1. Architektura Redux Store

Aplikacja wykorzystuje **Redux Toolkit** z **Redux Persist** jako centralny manager stanu globalnego. Store organizowany jest w **slices** odpowiadające za różne domeny aplikacji.

### 4.2. Store Structure

```typescript
// src/store/index.ts
{
  auth: {
    user: {
      id: string | null,
      email: string | null,
      displayName: string | null,
    },
    accessToken: string | null,
    refreshToken: string | null,
    isAuthenticated: boolean,
  },
  toast: {
    type: 'success' | 'error' | 'info' | 'warning' | null,
    title: string | null,
    message: string | null,
    visible: boolean,
  },
  ui: {
    layout: {
      sidebarCollapsed: boolean,
    },
    loading: boolean,
  },
  sound: {
    soundOn: boolean,
  },
  // RTK Query slice managed internally
  api: {
    /* RTK Query cache & status */
  },
}
```

### 4.3. Auth Slice

**Lokalizacja:** `src/store/slices/authSlice.ts`

**Odpowiedzialność:**

- Przechowywanie danych użytkownika (id, email, displayName)
- Przechowywanie tokenów (accessToken, refreshToken)
- Stan autentykacji (isAuthenticated)
- Akcje: `setCredentials`, `logout`, `updateTokens`

**Redux Persist:** Cały slice `auth` jest persistowany w localStorage (z wyjątkiem tokenów w produkcji - przechowywane w httpOnly cookies przez Supabase).

**Przykład:**

```typescript
const authSlice = createSlice({
  name: "auth",
  initialState: {
    user: null,
    accessToken: null,
    refreshToken: null,
    isAuthenticated: false,
  },
  reducers: {
    setCredentials: (state, action) => {
      state.user = action.payload.user;
      state.accessToken = action.payload.accessToken;
      state.refreshToken = action.payload.refreshToken;
      state.isAuthenticated = true;
    },
    logout: (state) => {
      state.user = null;
      state.accessToken = null;
      state.refreshToken = null;
      state.isAuthenticated = false;
    },
    updateTokens: (state, action) => {
      state.accessToken = action.payload.accessToken;
      state.refreshToken = action.payload.refreshToken;
    },
  },
});
```

### 4.4. Toast Slice

**Lokalizacja:** `src/store/slices/toastSlice.ts`

**Odpowiedzialność:**

- Przechowywanie aktualnego toasta (type, title, message)
- Stan widoczności toasta (visible)
- Akcje: `showToast`, `hideToast`, `clearToast`

**Przykład:**

```typescript
const toastSlice = createSlice({
  name: "toast",
  initialState: {
    type: null,
    title: null,
    message: null,
    visible: false,
  },
  reducers: {
    showToast: (state, action) => {
      state.type = action.payload.type;
      state.title = action.payload.title;
      state.message = action.payload.message;
      state.visible = true;
    },
    hideToast: (state) => {
      state.visible = false;
    },
    clearToast: (state) => {
      state.type = null;
      state.title = null;
      state.message = null;
      state.visible = false;
    },
  },
});
```

### 4.5. UI Slice

**Lokalizacja:** `src/store/slices/uiSlice.ts`

**Odpowiedzialność:**

- Zarządzanie wyglądem i stanem interfejsu użytkownika
- Informacja czy sidebar jest zwinięty (`sidebarCollapsed`)
- Globalny spinner ładowania (`loading`)
- Akcje: `toggleSidebar`, `setSidebarCollapsed`, `setLoading`

### 4.6. Sound Slice

**Lokalizacja:** `src/store/slices/soundSlice.ts`

**Odpowiedzialność:**

- Przechowywanie preferencji dźwięku (on/off)
- Akcje: `toggleSound`, `setSound`

```typescript
const soundSlice = createSlice({
  name: "sound",
  initialState: { soundOn: true },
  reducers: {
    toggleSound: (state) => {
      state.soundOn = !state.soundOn;
    },
    setSound: (state, { payload }: { payload: boolean }) => {
      state.soundOn = payload;
    },
  },
});
```

### 4.7. RTK Query API

**Lokalizacja:** `src/store/api/apiSlice.ts`

**Odpowiedzialność:**

- Komunikacja z API endpointami
- Automatyczne cache'owanie odpowiedzi
- Interceptory dla access token
- Automatyczna wymiana tokenu przy 401

**Base Query z interceptorem:**

```typescript
const baseQueryWithReauth = async (args, api, extraOptions) => {
  let result = await baseQuery(args, api, extraOptions);

  // Jeśli 401, spróbuj odświeżyć token
  if (result.error && result.error.status === 401) {
    const refreshToken = api.getState().auth.refreshToken;

    // Wywołaj endpoint refresh-token
    const refreshResult = await baseQuery(
      {
        url: "/api/auth/refresh-token",
        method: "POST",
        body: { refreshToken },
      },
      api,
      extraOptions
    );

    if (refreshResult.data) {
      // Zapisz nowe tokeny w store
      api.dispatch(updateTokens(refreshResult.data.session));

      // Ponów pierwotne zapytanie
      result = await baseQuery(args, api, extraOptions);
    } else {
      // Refresh nie powiódł się - wyloguj
      api.dispatch(logout());
    }
  }

  return result;
};

export const apiSlice = createApi({
  baseQuery: baseQueryWithReauth,
  endpoints: (builder) => ({
    login: builder.mutation({
      query: (credentials) => ({
        url: "/api/auth/login",
        method: "POST",
        body: credentials,
      }),
      onQueryStarted: async (arg, { dispatch, queryFulfilled }) => {
        try {
          const { data } = await queryFulfilled;
          dispatch(setCredentials(data));
          dispatch(
            showToast({
              type: "success",
              title: "Success",
              message: "Logged in successfully",
            })
          );
        } catch (err) {
          dispatch(
            showToast({
              type: "error",
              title: "Error",
              message: err.error?.data?.error || "Login failed",
            })
          );
        }
      },
    }),
    // ... inne endpointy
  }),
});
```

### 4.8. Interceptor - Dodawanie Access Token

**Mechanizm:**

- Każde zapytanie przez RTK Query automatycznie dodaje access token do nagłówka `Authorization: Bearer <token>`
- Token pobierany jest ze store'a Redux (`state.auth.accessToken`)

**Implementacja w baseQuery:**

```typescript
const baseQuery = fetchBaseQuery({
  baseUrl: "/",
  prepareHeaders: (headers, { getState }) => {
    const token = getState().auth.accessToken;
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
    return headers;
  },
});
```

### 4.9. Interceptor - Automatyczna wymiana tokenu (401)

**Mechanizm:**

1. Zapytanie zwraca 401 Unauthorized
2. Interceptor `baseQueryWithReauth` przechwytuje błąd
3. Pobiera `refreshToken` ze store'a
4. Wywołuje `POST /api/auth/refresh-token` z refreshToken
5. Jeśli sukces:
   - Aktualizuje tokeny w store (`updateTokens`)
   - Ponawia pierwotne zapytanie z nowym tokenem
6. Jeśli błąd:
   - Wylogowuje użytkownika (`logout`)
   - Przekierowuje na `/signin`

**Flow:**

```
Request → 401 → Refresh Token → Success → Update Store → Retry Request
                              → Failure → Logout → Redirect /signin
```

### 4.10. Redux Persist Configuration

**Lokalizacja:** `src/store/index.ts`

**Konfiguracja:**

```typescript
const persistConfig = {
  key: "root",
  storage,
  whitelist: ["auth", "ui", "sound"], // persistujemy auth, ui i sound
  blacklist: ["toast"], // Toast nie jest persistowany
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }).concat(apiSlice.middleware),
});
```

### 4.11. Integracja z React (Astro Islands)

**Provider w Layout:**

```astro
---
// src/layouts/Layout.astro
import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import { store, persistor } from "../store";
---

<html>
  <body>
    <Provider store={store} client:only="react">
      <PersistGate loading={null} persistor={persistor}>
        <!-- Treść aplikacji -->
        <slot />
      </PersistGate>
    </Provider>
  </body>
</html>
```

### 4.12. Użycie w komponentach

**Przykład - LoginForm:**

```typescript
import { useDispatch } from 'react-redux';
import { useLoginMutation } from '../../store/api/apiSlice';

const LoginForm = () => {
  const [login, { isLoading }] = useLoginMutation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    await login({ email, password });
    // Store i toast są automatycznie aktualizowane przez onQueryStarted
  };

  return (/* formularz */);
};
```

**Przykład - ToastContainer:**

```typescript
import { useSelector, useDispatch } from 'react-redux';
import { hideToast } from '../../store/slices/toastSlice';

const ToastContainer = () => {
  const toast = useSelector((state) => state.toast);
  const dispatch = useDispatch();

  if (!toast.visible) return null;

  return (
    <div className={`toast toast-${toast.type}`}>
      <h3>{toast.title}</h3>
      <p>{toast.message}</p>
      <button onClick={() => dispatch(hideToast())}>×</button>
    </div>
  );
};
```

## 5. Układ i struktura nawigacji

```
┌──────────────────┬───────────────────────────────────────┐
│ Sidebar          │ Header (avatar, toasty)              │
│ ├ Boards         │ ───────────────────────────────────── │
│ ├ My Boards      │ Outlet (widoki)                      │
│ ├ Played         │                                       │
│ └ Create Board   │                                       │
└──────────────────┴───────────────────────────────────────┘
```

- Sidebar zwija się do ikon < `md` breakpoint; preferencja zapisana w Redux `ui.layout`.
- Header stale widoczny; komponent `ToastContainer` absolutnie pod nim.
- Routing chroniony: `<ProtectedRoute>` opakowuje wszystkie dzieci poza auth.

## 6. Kluczowe komponenty

| Komponent               | Opis                             | Kluczowe cechy                              |
| ----------------------- | -------------------------------- | ------------------------------------------- |
| Sidebar                 | Nawigacja aplikacji              | collapsible, active link, WCAG-ready        |
| Header                  | Pasek górny                      | avatar menu, opcje globalne                 |
| BoardCard               | Kafelek planszy                  | menu akcji, badge public/private            |
| SearchInput             | Input z debounce                 | synchronizacja z URL                        |
| Pagination              | Kontrolki strony                 | klawiatura & aria-labels                    |
| PairFormRow             | Wiersz formularza pary           | dynamiczne dodawanie/usuwanie               |
| AIQuotaMeter            | Licznik zapytań AI               | kolorowy licznik, disabled state            |
| GenerateDialog          | Pełnoekranowy postęp generowania | abort, spinner                              |
| MemoryGrid & CardButton | Siatka kart                      | max 2 aktywne, aria-label                   |
| Timer                   | Licznik czasu                    | start/pause/stop                            |
| ToastContainer          | Globalne powiadomienia Redux     | `aria-live`, state z Redux, auto-dismiss 5s |
| ProtectedRoute          | Warstwa RLS FE                   | sprawdza auth & refresh                     |
| UnsavedChangesGuard     | Hook/komponent                   | modal przed odświeżeniem                    |
| LoginForm               | Formularz logowania              | RTK Query, walidacja Zod, loading state     |
| SignUpForm              | Formularz rejestracji            | RTK Query, walidacja Zod, displayName       |
| ForgotPasswordForm      | Formularz resetu hasła           | zawsze sukces, walidacja email              |
| ResetPasswordForm       | Formularz nowego hasła           | 2x input (potwierdzenie), SSR token check   |
| UserNav                 | Dropdown użytkownika             | Redux selector, logout action, avatar       |

---

## 7. Struktura katalogów dla Redux

```
src/
├── store/
│   ├── index.ts                 # Konfiguracja store, persistor, rootReducer
│   ├── slices/
│   │   ├── authSlice.ts         # Auth state (user, tokens, isAuthenticated)
│   │   ├── toastSlice.ts        # Toast state (type, title, message, visible)
│   │   ├── uiSlice.ts           # UI state (sidebar collapsed, theme, loading)
│   │   ├── soundSlice.ts        # Sound preferences (on/off)
│   │   └── apiSlice.ts          # RTK Query API endpoints + interceptory (reducerPath: "api")
├── components/
│   ├── auth/
│   │   ├── LoginForm.tsx        # Używa useLoginMutation z RTK Query
│   │   ├── SignUpForm.tsx       # Używa useSignUpMutation z RTK Query
│   │   ├── ForgotPasswordForm.tsx
│   │   ├── ResetPasswordForm.tsx
│   │   └── UserNav.tsx          # Używa useSelector(state => state.auth)
│   ├── toast/
│   │   └── ToastContainer.tsx   # Używa useSelector(state => state.toast)
│   └── ui/
│       └── ...                  # Shadcn/ui components
└── layouts/
    ├── Layout.astro             # Provider + PersistGate wrapper
    └── AuthenticatedLayout.astro # Protected layout z auth check
```

## 8. Przepływ autentykacji z Redux

### 8.1. Login Flow

```
[LoginForm]
  → useLoginMutation()
    → POST /api/auth/login
      → Success:
        ├─ dispatch(setCredentials({ user, tokens }))
        ├─ dispatch(showToast({ type: 'success', ... }))
        └─ Navigate to /boards
      → Error:
        └─ dispatch(showToast({ type: 'error', ... }))
```

### 8.2. Protected Request Flow (z token refresh)

```
[Component]
  → useGetBoardsQuery()
    → GET /api/boards
      → prepareHeaders: add Authorization: Bearer <accessToken>
      → Response 401:
        ├─ POST /api/auth/refresh-token (refreshToken)
        ├─ dispatch(updateTokens({ accessToken, refreshToken }))
        └─ Retry GET /api/boards (z nowym tokenem)
          → Success: return data
          → Error 401: dispatch(logout()) + Navigate to /signin
```

### 8.3. Logout Flow

```
[UserNav]
  → onClick "Log out"
    → useLogoutMutation()
      → POST /api/auth/logout
        → dispatch(logout()) // clear Redux state
        → persistor.purge()  // clear persisted state
        → Navigate to /signin
```

---

Ta architektura spełnia wymagania PRD i jest w pełni zgodna z planem API oraz ustaleniami z sesji planowania. Wszystkie kluczowe historyjki użytkownika mają przypisane odpowiednie widoki i komponenty, a projekt uwzględnia dostępność, responsywność i bezpieczeństwo.

**Aktualizacje w wersji 1.1:**

- Dodano widoki Forgot Password i Reset Password
- Wprowadzono Redux Toolkit jako globalny manager stanu
- Dodano RTK Query dla komunikacji z API
- Zaimplementowano interceptory dla access token i automatic token refresh
- Zaktualizowano ToastContainer do współpracy z Redux state
- Dodano przepływy autentykacji z diagramami
