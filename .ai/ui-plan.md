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
- **Kluczowe informacje**: formularz z walidacją.

### Profile Dropdown
- **Ścieżka pseudo**: w nagłówku.
- **Cel**: szybki dostęp do ustawień profilu i wylogowania.

### Not Found
- **Ścieżka**: `*`
- **Cel**: obsługa 404.

## 3. Mapa podróży użytkownika

1. **Pierwsza wizyta (anonim)**  → `/signin` lub `/signup`.
2. **Udane logowanie**  → redirect do `/boards` (Public Boards).
3. **Tworzenie planszy**:
   1. Sidebar ➜ „Create Board”.
   2. Uzupełnij formularz lub kliknij „Generate”.
   3. AI generuje pary → podgląd i ewentualna edycja.
   4. Zapis → backend tworzy board → redirect do `/boards/mine` z toastem *Success*.
4. **Rozgrywka**:
   1. Z listy (publicznej lub własnej) wybierz „Play”.
   2. Strona `/play/:boardId` ładuje dane, startuje timer.
   3. Dopasuj wszystkie pary → wynik zapisany, dialog z czasem.
   4. Zamknij dialog → redirect back lub przycisk „Replay”.
5. **Przegląd wyników**: zakładka Played Boards, gdzie ostatni czas widoczny przy każdej planszy.

## 4. Układ i struktura nawigacji

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

## 5. Kluczowe komponenty

| Komponent | Opis | Kluczowe cechy |
|-----------|------|----------------|
| Sidebar | Nawigacja aplikacji | collapsible, active link, WCAG-ready |
| Header | Pasek górny | avatar menu, opcje globalne |
| BoardCard | Kafelek planszy | menu akcji, badge public/private |
| SearchInput | Input z debounce | synchronizacja z URL |
| Pagination | Kontrolki strony | klawiatura & aria-labels |
| PairFormRow | Wiersz formularza pary | dynamiczne dodawanie/usu |n| AIQuotaMeter | Licznik zapytań AI | kolorowy licznik, disabled state |
| GenerateDialog | Pełnoekranowy postęp generowania | abort, spinner |
| MemoryGrid & CardButton | Siatka kart | max 2 aktywne, aria-label |
| Timer | Licznik czasu | start/pause/stop |
| ToastContainer | Globalne powiadomienia | `aria-live`, limit 3 |
| ProtectedRoute | Warstwa RLS FE | sprawdza auth & refresh |
| UnsavedChangesGuard | Hook/komponent | modal przed odświeżeniem |

---
Ta architektura spełnia wymagania PRD i jest w pełni zgodna z planem API oraz ustaleniami z sesji planowania. Wszystkie kluczowe historyjki użytkownika mają przypisane odpowiednie widoki i komponenty, a projekt uwzględnia dostępność, responsywność i bezpieczeństwo.
