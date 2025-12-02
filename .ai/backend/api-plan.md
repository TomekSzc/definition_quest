# Plan REST API

> **Ostatnia aktualizacja**: 1 grudnia 2025  
> **Status**: Odzwierciedla aktualny stan implementacji na ten dzień.

## Status Implementacji

### ✅ Pełna Implementacja
- **Autentykacja**: Wszystkie endpointy (login, rejestracja, logout, reset hasła, odświeżanie tokena)
- **Plansze**: Operacje CRUD, tworzenie poziomów, generowanie AI, lista granych plansz
- **Pary**: Operacje tworzenia, aktualizacji, usuwania
- **Wyniki**: Przesyłanie/aktualizacja wyniku (POST/PATCH)
- **OpenRouter**: Endpoint testowy

### ⏳ Częściowa Implementacja
- **Listowanie plansz**: Używa parametru `?ownerId` zamiast endpointu `/boards/mine`

### ❌ Nie Zaimplementowano
- **Profile użytkowników**: GET/PATCH `/users/me`, GET `/users/:id`
- **Wyniki**: Tabela wyników (GET `/boards/:boardId/scores`), historia użytkownika (GET `/users/me/scores`)
- **AI**: Endpoint limitu zapytań (GET `/ai/usage`)

## 1. Zasoby

| Zasób         | Tabela / Widok BD                | Opis                                                                                    |
| ------------- | -------------------------------- | --------------------------------------------------------------------------------------- |
| `UserProfile` | `user_meta` (+ `auth.users`)     | Publiczne informacje o użytkowniku (nazwa, awatar). Autentykacja obsługiwana przez Supabase. |
| `Board`       | `boards`                         | Kolekcja par termin–definicja. Może być prywatna lub publiczna, aktywna lub zarchiwizowana.  |
| `Pair`        | `pairs`                          | Pojedyncza para termin–definicja należąca do planszy.                                   |
| `Score`       | `scores`                         | Najlepszy czas ukończenia użytkownika dla planszy.                                      |
| `AIRequest`   | `ai_requests` / `daily_ai_usage` | Audyt użycia AI i egzekwowanie dziennego limitu.                                        |

> Uwaga: Zmaterializowany widok `best_scores` jest tylko do odczytu i udostępniany przez zasób `Score`.

## 2. Endpointy

### 2.1 Autentykacja

Autentykacja jest obsługiwana przez niestandardowe endpointy, które opakowują funkcjonalność Supabase Auth. Frontend otrzymuje JWT i zarządza tokenami sesji.

| Metoda | Ścieżka                     | Opis                                                           | Treść żądania                                     | Sukces                                               | Błędy                                  |
| ------ | --------------------------- | -------------------------------------------------------------- | ------------------------------------------------- | ---------------------------------------------------- | -------------------------------------- |
| POST   | `/api/auth/login`           | Uwierzytelnia użytkownika email/hasło.                         | `{ email, password }`                             | 200 OK - `{ data: { user, session }, message }`      | 400, 401, 403, 500                     |
| POST   | `/api/auth/signUp`          | Rejestruje nowego użytkownika z email, hasłem i nazwą.        | `{ email, password, displayName }`                | 201 Created - `{ data: { user }, message }`          | 400, 409, 500                          |
| POST   | `/api/auth/logout`          | Wylogowuje aktualnego użytkownika i czyści sesję.              | –                                                 | 200 OK - `{ message }`                               | 500                                    |
| POST   | `/api/auth/forgot-password` | Wysyła link resetowania hasła na email.                        | `{ email }`                                       | 200 OK - `{ message }` (zawsze sukces dla bezpieczeństwa) | 400, 500                          |
| POST   | `/api/auth/reset-password`  | Resetuje hasło używając tokenów z linku w emailu.              | `{ accessToken, refreshToken, newPassword }`      | 200 OK - `{ message }`                               | 400, 422, 500                          |
| POST   | `/api/auth/refresh-token`   | Odświeża token dostępu używając tokena odświeżania.            | `{ refreshToken }`                                | 200 OK - `{ data: { session }, message }`            | 400, 401, 500                          |

> **Uwaga implementacyjna**: Wszystkie endpointy auth sprawdzają flagę funkcji `auth` i zwracają 503 jeśli wyłączona.

### 2.2 Profile Użytkowników

**Status**: Nie zaimplementowano.

Dane profilu użytkownika są przechowywane w tabeli `user_meta` i tworzone podczas rejestracji. Endpointy profili planowane do przyszłej implementacji:

| Metoda | Ścieżka      | Opis                                    | Treść żądania                  | Sukces (200)                                       | Błędy                                                |
| ------ | ------------ | --------------------------------------- | ------------------------------ | -------------------------------------------------- | ---------------------------------------------------- |
| GET    | `/users/me`  | Zwraca profil uwierzytelnionego użytkownika. | –                         | `{ id, email, displayName, avatarUrl, createdAt }` | 401 brak uwierzytelnienia                            |
| PATCH  | `/users/me`  | Aktualizuje własny profil.              | `{ displayName?, avatarUrl? }` | jak GET                                            | 400 nieprawidłowy, 409 displayName za długi, 429 limit |
| GET    | `/users/:id` | Wyszukanie publicznego profilu.         | –                              | `{ id, displayName, avatarUrl }`                   | 404                                                  |

### 2.3 Plansze

Wspólne parametry zapytania dla listowania:

- `page`, `pageSize` (domyślnie 20, max 100)
- `q` – wyszukiwanie pełnotekstowe w tytule (`search_vector`)
- `tags` – filtrowanie po jednym lub więcej tagach (rozdzielone przecinkami)
- `ownerId` – filtrowanie po id właściciela
- `sort` – `created`, `updated`, `cardCount`, domyślnie `created`
- `direction` – `asc` / `desc`

| Metoda | Ścieżka            | Opis                                                                                                                                    |
| ------ | ------------------ | --------------------------------------------------------------------------------------------------------------------------------------- |
| GET    | `/boards`          | Listuje plansze (opcjonalnie filtrowane). Dostęp anonimowy pokazuje tylko publiczne. Z parametrem `ownerId` pokazuje wszystkie plansze właściciela. |
| GET    | `/boards/played`   | Listuje plansze, na których uwierzytelniony użytkownik ma co najmniej jeden wynik. Zawiera `lastTime` użytkownika dla każdej planszy. Wymaga auth. |
| POST   | `/boards`          | Tworzy planszę ręcznie (pary zawarte w treści). Może utworzyć wiele poziomów z jednego żądania.                                       |
| POST   | `/boards/level`    | Tworzy kolejny poziom dla istniejącej planszy (pary zawarte w treści).                                                                 |
| POST   | `/boards/generate` | Generuje pary przez AI (nie tworzy planszy, zwraca pary do edycji). Zobacz sekcję AI.                                                 |
| GET    | `/boards/:id`      | Pobiera metadane planszy + pary + ostatni wynik użytkownika (jeśli istnieje). Publiczne plansze dostępne dla wszystkich, prywatne tylko dla właściciela. |
| PATCH  | `/boards/:id`      | Częściowa aktualizacja metadanych planszy (tytuł, tagi, isPublic). Aktualizuje wszystkie poziomy o tym samym tytule. Tylko właściciel, zarchiwizowane niedozwolone. |
| DELETE | `/boards/:id`      | Miękkie archiwizowanie planszy (`archived=true`). Archiwizuje tylko konkretny poziom.                                                 |

> **Uwaga implementacyjna**: Zamiast osobnego endpointu `/boards/mine`, użyj `GET /boards?ownerId={userId}` aby wylistować własne plansze użytkownika (publiczne + prywatne).
> 
> **PUT nie zaimplementowano**: Całkowite zastąpienie planszy nie jest wspierane. Użyj PATCH do aktualizacji metadanych lub utwórz nowy poziom dla zmian treści.

Kształty żądań/odpowiedzi (skrócone):

```jsonc
// POST /boards
{
  "title": "Stolice Państw",
  "cardCount": 16,
  "pairs": [
    { "term": "Francja", "definition": "Paryż" },
    // max 24 pary …
  ],
  "isPublic": false,
  "tags": ["geografia", "europa"]
}

// 201 Created
{
  "message": "Board created with 1 level/s"
}
// Uwaga: Odpowiedź zwraca tylko wiadomość. Frontend przekierowuje do listy plansz po utworzeniu.

// POST /boards/level
{
  "boardId": "<uuid>",
  "pairs": [
    { "term": "Francja", "definition": "Paryż" },
    // max 24 pary …
  ],
}

// 201 Created
{
  "message": "Level 2 of Stolice Państw created"
}
```

Reguły walidacji egzekwowane po stronie serwera:

- `cardCount` ∈ {16, 24}
- liczba `pairs` = `cardCount` / 2
- każdy `term` unikalny w ramach planszy
- `level` auto-inkrementowany per właściciel & tytuł
- `tags` ≤ 10, każdy ≤ 20 znaków

### 2.4 Pary (podzasób)

| Metoda | Ścieżka                          | Opis                                                                     |
| ------ | -------------------------------- | ------------------------------------------------------------------------ |
| POST   | `/boards/:boardId/pairs`         | Dodaje nową parę. Tylko właściciel. Egzekwuje limit kart (max cardCount/2 par). |
| PATCH  | `/boards/:boardId/pairs/:pairId` | Edytuje termin lub definicję. Tylko właściciel.                          |
| DELETE | `/boards/:boardId/pairs/:pairId` | Usuwa parę. Tylko właściciel.                                            |

#### POST `/boards/:boardId/pairs`

Dodaje nową parę termin-definicja do planszy.

**Auth**: Tylko właściciel (JWT).

Treść żądania:

```jsonc
{
  "term": "fotosynteza",
  "definition": "Proces, w którym rośliny przekształcają światło w energię"
}
```

Odpowiedzi:

| Kod  | Opis                                       |
| ---- | ------------------------------------------ |
| 201  | Created - zwraca PairDTO                   |
| 400  | Bad Request - walidacja nieudana           |
| 401  | Unauthorized - nie właściciel              |
| 404  | Not Found - plansza nie istnieje           |
| 409  | Conflict - duplikat terminu lub limit kart |
| 500  | Internal Server Error                      |

#### PATCH `/boards/:boardId/pairs/:pairId`

Aktualizuje istniejący termin lub definicję.

**Auth**: Tylko właściciel (JWT).

Treść żądania (co najmniej jedno pole):

```jsonc
{
  "term": "fotosynteza",
  "definition": "Proces, w którym rośliny przekształcają światło w energię"
}
```

Odpowiedzi:

| Kod  | Opis                                       |
| ---- | ------------------------------------------ |
| 200  | OK - zwraca zaktualizowany PairDTO         |
| 400  | Bad Request - walidacja nieudana           |
| 401  | Unauthorized - nie właściciel              |
| 404  | Not Found - plansza lub para nie istnieje  |
| 409  | Conflict - plansza zarchiwizowana          |
| 500  | Internal Server Error                      |

#### DELETE `/boards/:boardId/pairs/:pairId`

Usuwa parę z planszy.

**Auth**: Tylko właściciel (JWT).

Odpowiedzi:

| Kod  | Opis                                       |
| ---- | ------------------------------------------ |
| 200  | OK - `{ id, boardId, message: "deleted" }` |
| 401  | Unauthorized - nie właściciel              |
| 404  | Not Found - plansza lub para nie istnieje  |
| 409  | Conflict - plansza zarchiwizowana          |
| 500  | Internal Server Error                      |

### 2.5 Wyniki

| Metoda | Ścieżka                   | Opis                                                                                          |
| ------ | ------------------------- | --------------------------------------------------------------------------------------------- |
| POST   | `/boards/:boardId/scores` | Przesyła czas ukończenia (ms). Upsert do `scores`. Zwraca 201 jeśli nowy, 200 jeśli zaktualizowany. |
| PATCH  | `/boards/:boardId/scores` | Przesyła czas ukończenia (ms). Upsert do `scores`. Zawsze zwraca 200 (semantyka idempotentna). |

> **Nie zaimplementowano**: Tabela wyników (`GET /boards/:boardId/scores`) i historia wyników użytkownika (`GET /users/me/scores`).

Treść żądania:

```jsonc
{ "elapsedMs": 93400 }
```

Odpowiedź:

```jsonc
{
  "id": "<uuid>",
  "elapsedMs": 93400
}
```

**Uwagi implementacyjne**:

- `elapsedMs` musi być > 0
- Upsert zachowuje tylko najlepszą (niższą) wartość per użytkownik per plansza
- POST zwraca 201 dla nowego wyniku, 200 dla zaktualizowanego
- PATCH zawsze zwraca 200 (idempotentny)
- Tylko uwierzytelnieni użytkownicy (właściciel może przesyłać wyniki na własnych planszach)

### 2.6 AI

| Metoda | Ścieżka            | Opis                                                                                                                |
| ------ | ------------------ | ------------------------------------------------------------------------------------------------------------------- |
| POST   | `/boards/generate` | Generuje pary z surowego tekstu ≤ 5 000 znaków. Zwraca pary do edycji. Wlicza się do dziennego limitu (50 req/dzień). |

> **Nie zaimplementowano**: Endpoint limitu użycia AI (`GET /ai/usage`).

Przykładowa treść POST:

```jsonc
{
  "inputText": "Alkany to węglowodory…",
  "cardCount": 24
}
```

Sukces (200 OK): Zwraca tablicę wygenerowanych par do edycji przed utworzeniem planszy.

```jsonc
{
  "pairs": [
    { "term": "Alkan", "definition": "Nasycony węglowodór z pojedynczymi wiązaniami" },
    // ... więcej par (cardCount/2)
  ]
}
```

**Uwagi implementacyjne**:

- Dzienny limit 50 zapytań AI na użytkownika egzekwowany w warstwie serwisowej
- Sprawdzanie limitu wykonywane przed wywołaniem AI
- Zwraca 429 Too Many Requests gdy limit przekroczony
- **Nie** tworzy planszy automatycznie - frontend używa par do wypełnienia formularza tworzenia planszy
- Używa OpenRouter API do generowania AI
- Dostępny endpoint testowy: `GET /api/openrouter/test`

### 2.7 Dodatkowe Endpointy

#### Test OpenRouter

| Metoda | Ścieżka                | Opis                                                         |
| ------ | ---------------------- | ------------------------------------------------------------ |
| GET    | `/api/openrouter/test` | Testuje połączenie z OpenRouter API i dostępność modeli.    |

Odpowiedź:

```jsonc
{
  "status": "ok",
  "message": "OpenRouter API is working correctly",
  "data": {
    "modelCount": 150,
    "testResponse": "OpenRouter API is working correctly",
    "tokensUsed": 25
  }
}
```

### 2.8 Analityka (opcjonalna)

Zdarzenia wysyłane po stronie klienta bezpośrednio do GA; nie są wymagane endpointy API.

## 3. Autentykacja i Autoryzacja

### Implementacja

1. **Niestandardowe Endpointy Auth** – Aplikacja dostarcza niestandardowe endpointy `/api/auth/*`, które opakowują funkcjonalność Supabase Auth
2. **Zarządzanie JWT** – Frontend otrzymuje JWT z `/api/auth/login` lub `/api/auth/signUp` i zarządza tokenami sesji
3. **Middleware** – Middleware Astro (`src/middleware/index.ts`) wydobywa użytkownika z sesji i ustawia `locals.user`
4. **Flagi Funkcji** – Endpointy auth sprawdzają flagę funkcji `auth`; zwracają 503 jeśli wyłączona
5. **RLS** – Tabele bazy danych używają polityk Row Level Security do kontroli dostępu do danych
6. **Sprawdzanie Własności** – Warstwa serwisowa weryfikuje, czy użytkownik jest właścicielem planszy przed zezwoleniem na modyfikacje
7. **Dostęp Publiczny** – Anonimowi użytkownicy mogą:
   - Listować publiczne plansze (`GET /boards`)
   - Przeglądać szczegóły publicznych plansz (`GET /boards/:id`)
   - Wszystkie inne endpointy wymagają uwierzytelnienia

### Przepływ Sesji

1. Użytkownik loguje się przez `POST /api/auth/login` → otrzymuje `accessToken` i `refreshToken`
2. Frontend przechowuje tokeny i dołącza `accessToken` w kolejnych żądaniach
3. Middleware waliduje sesję i wypełnia `locals.user`
4. Gdy token wygasa, frontend wywołuje `POST /api/auth/refresh-token` z `refreshToken`

## 4. Walidacja i Logika Biznesowa

### Warstwy Walidacji

1. **Schematy Zod** – Trasy API używają schematów Zod do walidacji żądań (zlokalizowane w `src/lib/validation/`)
2. **Ograniczenia Bazy Danych** – Ograniczenia PostgreSQL egzekwują integralność danych
3. **Warstwa Serwisowa** – Walidacja logiki biznesowej w funkcjach serwisowych

### Reguły Walidacji

| Zasób    | Reguła                                | Egzekwowane Przez                         | Odpowiedź Błędu |
| -------- | ------------------------------------- | ----------------------------------------- | --------------- |
| Board    | `cardCount` ∈ {16, 24}                | Schemat Zod + DB CHECK                    | 400             |
| Board    | Unikalne (ownerId, title, level)      | DB UNIQUE CONSTRAINT                      | 409             |
| Board    | `tags` ≤ 10 & każdy ≤ 20 znaków       | Schemat Zod                               | 400             |
| Board    | Nie można modyfikować zarchiwizowanych| Warstwa serwisowa                         | 409             |
| Pair     | Unikalne (boardId, term)              | DB UNIQUE CONSTRAINT                      | 409             |
| Pair     | Limit kart (max cardCount/2)          | Warstwa serwisowa (`addPairToBoard`)      | 409             |
| Score    | `elapsedMs` > 0                       | Schemat Zod                               | 400             |
| AI       | ≤ 50 zapytań / użytkownik / dzień     | Warstwa serwisowa + widok `daily_ai_usage`| 429             |
| AI       | `inputText` ≤ 5000 znaków             | Schemat Zod                               | 400             |

### Kody Odpowiedzi Błędów

- **400 Bad Request** – Walidacja nieudana (błędy schematu Zod)
- **401 Unauthorized** – Brak lub nieprawidłowe uwierzytelnienie
- **403 Forbidden** – Uwierzytelniony ale niedozwolony (np. email niepotwierdzony)
- **404 Not Found** – Zasób nie istnieje
- **409 Conflict** – Naruszenie reguły biznesowej (zarchiwizowana plansza, duplikat, itp.)
- **422 Unprocessable Entity** – Nieprawidłowe tokeny lub wygasłe linki
- **429 Too Many Requests** – Przekroczony limit częstotliwości lub quota
- **500 Internal Server Error** – Nieoczekiwany błąd serwera

### Przykłady Przepływu Logiki Biznesowej

#### 1. Generowanie Par przez AI (POST /boards/generate)

1. Middleware uwierzytelnia użytkownika i ustawia `locals.user`
2. Trasa waliduje treść żądania z `GenerateBoardSchema` (Zod)
3. Warstwa serwisowa (`generateBoardPairs`):
   - Sprawdza dzienny limit w widoku `daily_ai_usage`
   - Wstawia wiersz do `ai_requests` ze statusem `pending`
   - Wywołuje OpenRouter API aby wygenerować pary
   - Aktualizuje `ai_requests` statusem, tokenami, kosztem
   - Zwraca wygenerowane pary (**nie** tworzy planszy)
4. Frontend używa par do wypełnienia formularza tworzenia planszy
5. Użytkownik edytuje pary jeśli potrzeba, następnie wywołuje `POST /boards` aby utworzyć planszę

#### 2. Tworzenie Planszy (POST /boards)

1. Trasa waliduje `CreateBoardSchema` (tytuł, pary, cardCount, tagi, isPublic)
2. Warstwa serwisowa (`createBoard`):
   - Dzieli pary na fragmenty bazując na cardCount/2
   - Dla każdego fragmentu:
     - Wstawia wiersz planszy (auto-inkrementuje poziom)
     - Wstawia pary dla tej planszy
   - Zwraca komunikat sukcesu z liczbą poziomów
3. Frontend przekierowuje do listy plansz

#### 3. Tworzenie Kolejnego Poziomu (POST /boards/level)

1. Trasa waliduje `CreateNextLevelSchema` (boardId, pary)
2. Warstwa serwisowa (`createBoardNextLevel`):
   - Pobiera referencyjną planszę aby zweryfikować własność i pobrać właściwości
   - Waliduje czy nie zarchiwizowana
   - Określa numer kolejnego poziomu
   - Tworzy nowy wiersz planszy z zinkrementowanym poziomem
   - Wstawia pary
   - Zwraca komunikat sukcesu

#### 4. Przesyłanie Wyniku (POST /boards/:boardId/scores)

1. Middleware uwierzytelnia użytkownika
2. Trasa waliduje `SubmitScoreSchema` (elapsedMs)
3. Warstwa serwisowa (`upsertScore`):
   - Sprawdza czy wynik istnieje dla tego użytkownika+planszy
   - Jeśli istnieje i nowy czas jest lepszy (niższy), aktualizuje
   - Jeśli istnieje i nowy czas jest gorszy, zachowuje istniejący
   - Jeśli nie istnieje, wstawia nowy wynik
   - Zwraca wynik z flagą `isNew`
4. Trasa zwraca 201 jeśli nowy, 200 jeśli zaktualizowany

#### 5. Aktualizacja Metadanych Planszy (PATCH /boards/:id)

1. Trasa waliduje ID planszy i treść żądania (tytuł, isPublic, tagi)
2. Warstwa serwisowa (`updateBoardMeta`):
   - Weryfikuje własność
   - Sprawdza czy nie zarchiwizowana
   - Aktualizuje **wszystkie poziomy** z tym samym właścicielem+tytułem
   - Zwraca komunikat sukcesu
3. To zapewnia, że wszystkie poziomy pozostają zsynchronizowane

## 5. Paginacja, Filtrowanie i Sortowanie

- **Paginacja** – `page` & `pageSize` (offset/limit); zwracane metadane `{ page, pageSize, total }`.
- **Filtrowanie** – parametry zapytania wymienione per endpoint; nieznane parametry ignorowane.
- **Sortowanie** – `sort` & `direction` z białą listą pól do sortowania.

## 6. Obsługa Błędów

### Narzędzia Błędów

API używa scentralizowanych narzędzi obsługi błędów z `src/lib/utils/`:

- Klasa `HttpError` – Niestandardowy błąd z kodem statusu i opcjonalnymi danymi odpowiedzi
- Klasa `ValidationError` – Błędy walidacji Zod formatowane spójnie
- `createErrorResponse()` – Standaryzowany builder odpowiedzi błędu
- `getErrorMapping()` – Mapuje biznesowe kody błędów na odpowiedzi HTTP

### Standardowe Kody Błędów

| Kod  | Znaczenie                                         | Przykłady                                     |
| ---- | ------------------------------------------------- | --------------------------------------------- |
| 400  | Bad Request – walidacja nieudana                  | Nieprawidłowy JSON, błędy schematu Zod        |
| 401  | Unauthorized – brak lub nieprawidłowe auth        | Brak JWT, nieprawidłowe dane, wygasły token   |
| 403  | Forbidden – uwierzytelniony ale niedozwolony      | Email niepotwierdzony                         |
| 404  | Not Found – zasób nie istnieje                    | Plansza nie znaleziona, para nie znaleziona   |
| 409  | Conflict – naruszenie reguły biznesowej           | Duplikat planszy, zarchiwizowana, limit kart  |
| 422  | Unprocessable Entity – nieprawidłowe tokeny       | Wygasły token resetu hasła                    |
| 429  | Too Many Requests – quota przekroczona            | Osiągnięty dzienny limit AI                   |
| 500  | Internal Server Error – nieoczekiwany błąd        | Błędy bazy danych, nieobsłużone wyjątki       |
| 503  | Service Unavailable – funkcja wyłączona           | Flaga auth wyłączona                          |

### Format Odpowiedzi Błędu

Wszystkie błędy mają spójną strukturę:

```jsonc
// Prosty błąd
{
  "error": "Plansza nie znaleziona"
}

// Błąd ze szczegółami
{
  "error": {
    "message": "Walidacja nieudana",
    "details": [
      {
        "path": ["title"],
        "message": "Tytuł jest wymagany"
      }
    ]
  }
}
```

### Mapowania Błędów Biznesowych

Warstwa serwisowa rzuca kody błędów (stringi), które są mapowane na odpowiedzi HTTP:

| Kod Błędu                 | Status HTTP | Komunikat Odpowiedzi                        |
| ------------------------- | ----------- | ------------------------------------------- |
| `BOARD_NOT_FOUND`         | 404         | Plansza nie znaleziona                      |
| `BOARD_PRIVATE`           | 401         | Ta plansza jest prywatna                    |
| `BOARD_ARCHIVED`          | 409         | Nie można modyfikować zarchiwizowanej planszy |
| `NOT_OWNER`               | 401         | Nie jesteś właścicielem tej planszy         |
| `DUPLICATE_BOARD`         | 409         | Plansza o tym tytule już istnieje           |
| `DUPLICATE_PAIR`          | 409         | Termin już istnieje na tej planszy          |
| `CARD_LIMIT_REACHED`      | 409         | Osiągnięty limit kart                       |
| `PAIR_NOT_FOUND`          | 404         | Para nie znaleziona                         |
| `EMAIL_ALREADY_EXISTS`    | 409         | Email już zarejestrowany                    |
| `INVALID_CREDENTIALS`     | 401         | Nieprawidłowy email lub hasło               |
| `EMAIL_NOT_CONFIRMED`     | 403         | Proszę potwierdzić swój email               |
| `INVALID_REFRESH_TOKEN`   | 401         | Nieprawidłowy lub wygasły token odświeżania |
| `UNAUTHORIZED`            | 401         | Wymagane uwierzytelnienie                   |
| `FEATURE_DISABLED`        | 503         | Ta funkcja jest obecnie wyłączona           |

Mapowanie zaimplementowane w `src/lib/utils/api-response.ts` przez `getErrorMapping()`.

## 7. Bezpieczeństwo i Wydajność

### Zaimplementowane

- ✅ **Autentykacja** – Niestandardowa auth bazująca na JWT opakowująca Supabase Auth
- ✅ **Autoryzacja** – Wydobywanie użytkownika przez middleware, sprawdzanie własności w warstwie serwisowej
- ✅ **Row Level Security** – Polityki RLS bazy danych na wszystkich tabelach
- ✅ **Walidacja Wejścia** – Schematy Zod walidują wszystkie treści żądań i parametry zapytań
- ✅ **Flagi Funkcji** – Endpointy auth sprawdzają flagi funkcji (`src/features/featureFlags.ts`)
- ✅ **Quota AI** – Dzienny limit 50 zapytań na użytkownika egzekwowany w warstwie serwisowej
- ✅ **Obsługa Błędów** – Spójne odpowiedzi błędów z właściwymi kodami statusu HTTP
- ✅ **Ograniczenia Unikalności** – Baza danych egzekwuje unikalność (tytuł+poziom planszy, terminy par)
- ✅ **Ochrona Zarchiwizowanych Plansz** – Warstwa serwisowa zapobiega modyfikacji zarchiwizowanych plansz

### Planowane / Do Zaimplementowania

- ⏳ **Rate Limiting** – Ogólne limitowanie częstotliwości (60 req/min/użytkownik) jeszcze nie zaimplementowane
- ⏳ **Sanityzacja Wejścia** – Usuwanie HTML i egzekwowanie UTF-8
- ⏳ **Kompresja** – gzip/brotli nie skonfigurowane
- ⏳ **Cachowanie** – Cachowanie bazujące na ETag dla odpowiedzi publicznych plansz
- ⏳ **CORS** – Właściwa konfiguracja CORS dla produkcji
- ⏳ **HTTPS/HSTS** – Obsługiwane przez platformę hostingową (Cloudflare Pages)

### Indeksy Bazy Danych

Obecne indeksy wspierają:

- Listowanie plansz: `(is_public, archived, owner_id)`
- Wyszukiwanie pełnotekstowe: indeks GIN `search_vector` (jeśli zaimplementowany)
- Filtrowanie tagów: indeks GIN na tablicy `tags`
- Wyszukiwanie wyników: `(board_id, user_id)`
- Unikalność par: `(board_id, term)`

### Wzorce Wydajnościowe

1. **Paginacja** – Wszystkie endpointy list wspierają parametry `page` i `pageSize`
2. **Selektywne Ładowanie** – Pary ładowane tylko przy pobieraniu pojedynczej planszy
3. **Logika Upsert** – Wyniki używają pojedynczego upsert zamiast select-then-insert
4. **Operacje Wsadowe** – Tworzenie planszy może utworzyć wiele poziomów w jednym żądaniu

---

## 8. Podsumowanie

Ten dokument odzwierciedla **rzeczywistą implementację** na dzień 1 grudnia 2025. API jest zbudowane z:

- **Stos Technologiczny**: Astro 5, TypeScript 5, Supabase (PostgreSQL + Auth), OpenRouter AI
- **Architektura**: REST API z trasami API Astro, wzorzec warstwy serwisowej, walidacja Zod
- **Autentykacja**: Niestandardowe endpointy opakowujące Supabase Auth z zarządzaniem sesją
- **Kluczowe Funkcje**: CRUD plansz, plansze wielopoziomowe, generowanie par AI, śledzenie wyników
- **Deployment**: Cloudflare Pages (na podstawie struktury projektu)

### Różnice od Oryginalnego Planu

1. **Autentykacja** – Zaimplementowana jako niestandardowe endpointy zamiast delegowania bezpośrednio do Supabase
2. **Listowanie plansz** – Używa parametru zapytania `?ownerId` zamiast osobnego endpointu `/boards/mine`
3. **Generowanie AI** – Zwraca tylko pary (nie tworzy planszy automatycznie)
4. **Wyniki** – Tabela wyników i historia użytkownika jeszcze nie zaimplementowane
5. **Profile Użytkowników** – Endpointy zarządzania profilem jeszcze nie zaimplementowane
6. **Aktualizacje Plansz** – PATCH aktualizuje wszystkie poziomy o tym samym tytule (utrzymuje poziomy zsynchronizowane)
