# Definition Quest – Schemat Bazy Danych

## 1. Tabele

### 1.1 `auth.users` (zarządzana przez Supabase Auth)

Ta tabela jest **w pełni zarządzana przez Supabase Auth**—aplikacja nigdy nie zapisuje do niej bezpośrednio. Poniżej znajdują się tylko kolumny, które nasz kod odczytuje lub na których wykonuje złączenia:
| kolumna | typ | ograniczenia |
| ------ | ---- | ----------- |
| id | uuid | **PK** generowany przez Supabase Auth |
| email | text | **UNIQUE**, **NOT NULL** – identyfikator logowania użytkownika |
| created_at | timestamptz | DEFAULT now() – czas utworzenia wiersza |
| confirmed_at | timestamptz | | NULL dopóki email nie zostanie potwierdzony |
| encrypted_password | text | **NOT NULL** – solone i zahaszowane hasło |

> Supabase zarządza wieloma dodatkowymi kolumnami związanymi z autoryzacją (tokeny, faktory, itp.), które są poza zakresem aplikacji.

---

### 1.2 `user_meta`

| kolumna       | typ        | ograniczenia                                     | opis              |
| ------------ | ----------- | ----------------------------------------------- | ------------------------ |
| id           | uuid        | **PK**, **FK** → `auth.users(id)` **NOT NULL**  | odzwierciedla id użytkownika (1-do-1) |
| display_name | text        | **NOT NULL**, CHECK (length(display_name) ≤ 40) | publiczny pseudonim          |
| avatar_url   | text        |                                                 | opcjonalny awatar          |
| created_at   | timestamptz | DEFAULT now()                                   | czas utworzenia wiersza        |

Indeksy:

- PK na `id` (niejawny).

---

### 1.3 `boards`

| kolumna        | typ        | ograniczenia                                                                                                       | opis                           |
| ------------- | ----------- | ----------------------------------------------------------------------------------------------------------------- | ------------------------------------- |
| id            | uuid        | **PK** DEFAULT gen_random_uuid()                                                                                  |
| owner_id      | uuid        | **FK** → `auth.users(id)` **NOT NULL**                                                                            |
| title         | text        | **NOT NULL**                                                                                                      |
| card_count    | smallint    | **NOT NULL**, CHECK (card_count IN (16,24))                                                                       |
| level         | smallint    | **NOT NULL**, CHECK (level ≥ 1)                                                                                   | numer sekwencyjny dla wielostronicowych plansz |
| is_public     | boolean     | DEFAULT false **NOT NULL**                                                                                        |
| archived      | boolean     | DEFAULT false **NOT NULL**                                                                                        |
| tags          | text[]      | DEFAULT '{}'::text[], CHECK (array_length(tags,1) ≤ 10 AND (SELECT bool_and(length(t) ≤ 20) FROM unnest(tags) t)) | maks. 10 tagów, każdy ≤ 20 znaków          |
| search_vector | tsvector    | GENERATED ALWAYS AS (to_tsvector('simple', coalesce(title,'') )) STORED                                           |
| created_at    | timestamptz | DEFAULT now()                                                                                                     |
| updated_at    | timestamptz | DEFAULT now()                                                                                                     |

Ograniczenia:

- UNIQUE (owner_id, title, level) – zapobiega duplikatom tytułów na poziom dla jednego użytkownika.

Indeksy:

- PK na `id` (niejawny)
- BTREE na `(owner_id)`
- BTREE na `(is_public, archived, owner_id)` – przyspiesza zapytania listujące
- GIN na `search_vector` – wyszukiwanie pełnotekstowe
- GIN na `tags`

---

### 1.4 `pairs`

| kolumna     | typ        | ograniczenia                                          | opis |
| ---------- | ----------- | ---------------------------------------------------- | ----------- |
| id         | uuid        | **PK** DEFAULT gen_random_uuid()                     |
| board_id   | uuid        | **FK** → `boards(id)` ON DELETE CASCADE **NOT NULL** |
| term       | text        | **NOT NULL**                                         |
| definition | text        | **NOT NULL**                                         |
| created_at | timestamptz | DEFAULT now()                                        |

Ograniczenia:

- UNIQUE (board_id, term) – eliminuje duplikaty terminów na planszę.

Indeksy:

- PK na `id`
- BTREE na `(board_id)`

---

### 1.5 `scores`

| kolumna     | typ        | ograniczenia                            | opis               |
| ---------- | ----------- | -------------------------------------- | ------------------------- |
| id         | uuid        | **PK** DEFAULT gen_random_uuid()       |
| user_id    | uuid        | **FK** → `auth.users(id)` **NOT NULL** |
| board_id   | uuid        | **FK** → `boards(id)` **NOT NULL**     |
| elapsed_ms | integer     | **NOT NULL**, CHECK (elapsed_ms > 0)   | najlepszy czas w milisekundach |
| played_at  | timestamptz | DEFAULT now()                          |

Ograniczenia:

- UNIQUE (user_id, board_id) – przechowuje tylko najlepszy czas na użytkownika i planszę.

Indeksy:

- PK na `id`
- BTREE na `(board_id)`
- BTREE na `(user_id)`

---

### 1.6 `ai_requests`

| kolumna        | typ          | ograniczenia                            | opis        |
| ------------- | ------------- | -------------------------------------- | ------------------ |
| id            | uuid          | **PK** DEFAULT gen_random_uuid()       |
| user_id       | uuid          | **FK** → `auth.users(id)` **NOT NULL** |
| requested_at  | timestamptz   | DEFAULT now()                          |
| model         | text          | **NOT NULL**                           |
| prompt_tokens | integer       | **NOT NULL**                           |
| cost_usd      | numeric(10,4) | **NOT NULL**                           |
| status        | text          | **NOT NULL**                           | np. `ok`, `error` |

Indeksy:

- PK na `id`
- BTREE na `(user_id, requested_at)`

---

### 1.7 Zmaterializowane Widoki

| widok             | definicja                                                                                                      | strategia odświeżania                                               |
| ---------------- | --------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| `daily_ai_usage` | SELECT user_id, date_trunc('day', requested_at) AS request_date, count(\*) AS cnt FROM ai_requests GROUP BY 1,2 | odświeżany nocą przez Supabase cron; wspiera limit 50 na dzień |
| `best_scores`    | SELECT user_id, board_id, MIN(elapsed_ms) AS best_time FROM scores GROUP BY 1,2                                 | odświeżany przy commicie (`ON COMMIT REFRESH`)                     |

---

## 2. Relacje

- **`auth.users` 1-do-1 `user_meta`** przez identyczne klucze główne.
- **`auth.users` 1-do-wielu `boards`** (`owner_id`).
- **`boards` 1-do-wielu `pairs`** (`board_id`).
- **`auth.users` 1-do-wielu `scores`** (`user_id`).
- **`boards` 1-do-wielu `scores`** (`board_id`).
- **`auth.users` 1-do-wielu `ai_requests`** (`user_id`).

W MVP nie są wymagane żadne tabele wiele-do-wielu.

---

## 3. Podsumowanie Indeksów

- `boards`: PK `id`, BTREE `(owner_id)`, BTREE `(is_public, archived, owner_id)`, GIN `search_vector`, GIN `tags`.
- `pairs`: PK `id`, BTREE `(board_id)`.
- `scores`: PK `id`, UNIQUE `(user_id, board_id)`, BTREE `(board_id)`, BTREE `(user_id)`.
- `ai_requests`: PK `id`, BTREE `(user_id, requested_at)`.
- Dodatkowe niejawne indeksy PK na wszystkich tabelach używających kluczy głównych UUID.

---

## 4. Bezpieczeństwo na Poziomie Wiersza (RLS)

RLS jest **włączony** na każdej tabeli dostępnej dla użytkownika. Przykładowe polityki używają funkcji pomocniczej PostgreSQL `auth.uid()` dostarczonej przez Supabase.

### 4.1 `boards`

- Polityka **owner_full_access**: (`auth.uid() = owner_id`) – ZEZWÓL NA WSZYSTKO.
- Polityka **public_read**: (`is_public = true AND archived = false`) – ZEZWÓL NA SELECT.
- Domyślnie odrzucaj. Rola anonimowa nie ma polityk → brak dostępu.

### 4.2 `pairs`

- Polityka **board_owner_or_public**: `EXISTS (SELECT 1 FROM boards b WHERE b.id = board_id AND (b.owner_id = auth.uid() OR (b.is_public AND NOT b.archived)))` – ZEZWÓL NA SELECT.
- Polityka **owner_write**: `EXISTS (SELECT 1 FROM boards b WHERE b.id = board_id AND b.owner_id = auth.uid())` – ZEZWÓL NA INSERT, UPDATE, DELETE.

### 4.3 `scores`

- Polityka **owner_full_access**: `auth.uid() = user_id` – ZEZWÓL NA WSZYSTKO.

### 4.4 `ai_requests`

- Polityka **owner_full_access**: `auth.uid() = user_id` – ZEZWÓL NA WSZYSTKO.

### 4.5 `user_meta`

- Polityka **owner_full_access**: `auth.uid() = id` – ZEZWÓL NA WSZYSTKO.

Role serwisowe (np. `service_role`) pomijają RLS dla zaplanowanych odświeżeń i wewnętrznej konserwacji.

---

## 5. Dodatkowe Uwagi

1. Zakładamy, że funkcja `gen_random_uuid()` z rozszerzenia `pgcrypto` jest włączona (`CREATE EXTENSION IF NOT EXISTS pgcrypto;`).
2. Wszystkie znaczniki czasu używają `timestamptz` aby zapewnić świadomość strefy czasowej.
3. Przy uruchomieniu nie jest stosowane partycjonowanie; monitoruj wzrost `ai_requests` i `scores` dla przyszłego partycjonowania.
4. `search_vector` obecnie indeksuje tylko tytuł planszy; rozszerz w razie potrzeby (np. o nazwę wyświetlaną właściciela) poprzez zmianę wygenerowanego wyrażenia.
5. Zmaterializowane widoki powinny być odświeżane przez zaplanowane funkcje Supabase lub zewnętrzny cron aby utrzymywać limity i tabele wyników w aktualności.
