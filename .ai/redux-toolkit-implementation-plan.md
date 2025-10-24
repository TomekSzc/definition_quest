# Plan implementacji systemu zarządzania stanem (Redux Toolkit + RTK Query)

## 1. Przegląd
System zarządzania stanem będzie centralnym miejscem przechowywania i synchronizacji danych UI oraz sesji użytkownika dla aplikacji Definition Quest. Wykorzystamy Redux Toolkit (RTK-**@reduxjs/toolkit**) z rozszerzeniem **RTK Query** do komunikacji z backendem oraz **redux-persist** do trwałego przechowywania wybranych fragmentów stanu w `localStorage`.  
Celem jest umożliwienie:
• intuicyjnego dostępu do stanu w komponentach React,  
• automatycznego cachowania i ponownego wykorzystania odpowiedzi API,  
• odświeżania tokenów i obsługi sesji bez duplikacji kodu,  
• łatwego debugowania z DevTools.

## 2. Routing widoku
System store nie posiada dedykowanej strony, ale pliki konfiguracyjne będą umieszczone w katalogu:
```
/src/store/
  ├─ api/          # RTK Query apiSlice
  ├─ slices/       # poszczególne domeny (auth, toast, ui)
  ├─ hooks.ts      # typed useDispatch / useSelector
  └─ index.ts      # konfiguracja store + persist
```

## 3. Struktura plików i zależności
Zestaw plików konfiguracyjnych niezbędnych do działania Redux Toolkit oraz RTK Query:
```
/src/store/
  ├─ api/
  │   └─ apiSlice.ts          # konfiguracja RTK Query
  ├─ slices/
  │   ├─ authSlice.ts         # domena autentykacji
  │   ├─ toastSlice.ts        # globalne komunikaty
  │   └─ uiSlice.ts           # preferencje UI (opcjonalnie)
  ├─ hooks.ts                 # typed useDispatch / useSelector
  └─ index.ts                 # konfiguracja store + persist
```

Provider React zostanie dodany w zadaniu implementacji widoku – tutaj definiujemy jedynie eksport `store`.

## 4. Szczegóły komponentów (logika store)
### 4.1. store/index.ts
- **Opis**: Konfiguracja store, integracja z `redux-persist`, dodanie middlewarów RTK Query.  
- **Elementy**: `configureStore`, `persistReducer`, `PersistGate` (react-persist) w `App.tsx`.  
- **Interakcje**: none (pure setup).  
- **Walidacja**: brak.  
- **Typy**: `RootState`, `AppDispatch`.  
- **Propsy**: n/a

### 4.2. slices/authSlice.ts
- **Opis**: Zarządza stanem sesji i danych użytkownika.  
- **Elementy**: akcje `setCredentials`, `logout`, `updateTokens`, selektory `selectCurrentUser`, …  
- **Interakcje**: dispatch akcji z formularzy auth i interceptorów RTKQ.  
- **Walidacja**: przy `setCredentials` wymagane pola `user`, `accessToken`, `refreshToken`.  
- **Typy**: `AuthState`, `AuthUserDTO`, `AuthSessionDTO`.  
- **Propsy**: n/a

### 4.3. slices/toastSlice.ts
- **Opis**: Globalny system komunikatów.  
- **Elementy**: akcje `showToast`, `hideToast`, `clearToast`.  
- **Interakcje**: wywoływane z hooków RTK Query (onQueryStarted) oraz komponentów UI.  
- **Walidacja**: typ i treść toasta nie mogą być `null` przy `showToast`.  
- **Typy**: `ToastState`, `ToastType`.  

### 4.4. slices/uiSlice.ts (opcja)
- **Opis**: Drobne preferencje UI (sidebar, theme …).  
- **Elementy**: `toggleSidebar`.  
- **Typy**: `UIState`.

### 4.5. api/apiSlice.ts
- **Opis**: Konfiguracja RTK Query z `fetchBaseQuery`, interceptor odświeżający token przy 401, endpointy auth + boards + scores.  
- **Elementy**: `baseQueryWithReauth`, endpointy `login`, `signUp`, `logout`, `refreshToken`, `getBoards`, …  
- **Interakcje**: Hooki generowane automatycznie (`useLoginMutation`, `useGetBoardsQuery`, …).  
- **Walidacja**: Wejście/wyjście zgodne z typami DTO.  

### 4.6. hooks.ts
- **Opis**: Eksportuje typed hooki `useAppDispatch`, `useAppSelector`.  
- **Typy**: bazuje na `RootState` i `AppDispatch`.

## 5. Typy
| Nazwa | Pola | Źródło |
|-------|------|--------|
| `AuthState` | `user: AuthUserDTO \| null`, `accessToken`, `refreshToken`, `isAuthenticated` | slice | 
| `ToastState` | `type`, `title`, `message`, `visible` | slice |
| `UIState` | `layout.sidebarCollapsed` | slice |
| `RootState` | agregat slice’ów | store |
| `LoginRequest`, `AuthResponse`, … | patrz `src/types.ts` | backend kontrakt |

## 6. Zarządzanie stanem
1. **Persist**: `auth` & `ui` → `localStorage`, `toast` → sesyjny.  
2. **Rehydratacja**: `PersistGate` w `App.tsx` blokuje render do czasu wczytania.  
3. **Middlewares**: domyślne RTK, plus `apiSlice.middleware`.  
4. **DevTools**: włączone globalnie z wyłączeniem w PROD.

## 7. Integracja API
| Akcja | Endpoint | Metoda | Hook RTKQ | Payload | Response |
|-------|----------|--------|-----------|---------|----------|
| Logowanie | `/api/auth/login` | POST | `useLoginMutation` | `LoginRequest` | `AuthResponse` |
| Odświeżenie tokenu | `/api/auth/refresh-token` | POST | internal | `RefreshTokenRequest` | `AuthResponse` |
| Wylogowanie | `/api/auth/logout` | POST | `useLogoutMutation` | _void_ | msg |
| …boards | `/api/boards` | GET/POST | `useGetBoardsQuery` | — | list DTO |

**Interceptor flow**: 401 → `_refreshToken()` → `updateTokens()` → replay.

## 8. Interakcje użytkownika
_Ten rozdział usunięto – szczegóły interakcji będą opisane w planie implementacji widoków._

## 9. Warunki i walidacja
- Email & password walidowane klientem (regex, min-length) oraz serwerem (Zod).  
- Przy próbie ponownego logowania jeśli `isAuthenticated` == true → redirect do `/dashboard`.  
- Przy `showToast` wymagane `type` & `message`.

## 10. Obsługa błędów
| Scenario | Źródło | Reakcja UI |
|----------|--------|------------|
| 400 Bad Request | endpoint | Toast *error* z `details` |
| 401 z expired access | interceptor | Transparentne odświeżenie; jeśli refresh fail → `logout()` + redirect `/login` |
| Brak internetu | RTKQ status `isError` + `error.status === "FETCH_ERROR"` | Toast *warning*: "Network error" |

## 11. Kroki implementacji
1. **Setup dependencies**: `npm i @reduxjs/toolkit react-redux redux-persist`.
2. **Utwórz katalog `/src/store`** z podstrukturą `slices`, `api`.
3. **Zaimplementuj slices** `authSlice.ts`, `toastSlice.ts`, `uiSlice.ts` według opisów.
4. **Skonfiguruj store/index.ts** – persist + middleware + typy.
5. **Dodaj hooks.ts** z typed hookami.
6. **Utwórz api/apiSlice.ts**: `fetchBaseQuery`, interceptor, endpointy auth (mapuj DTO z `types.ts`).
7. **Import Provider** w `src/components/Layout.astro` (entry React root) lub odpowiednim bootstrap:  
```tsx
import { Provider } from 'react-redux';
<Provider store={store}>...</Provider>
```
8. **Dodaj PersistGate** do root React (np. `App.tsx`).
