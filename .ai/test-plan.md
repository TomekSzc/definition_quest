# Plan testów dla projektu Definition Quest

## 1. Wprowadzenie i cele testowania

Celem testów jest zapewnienie wysokiej jakości, bezpieczeństwa i wydajności aplikacji Definition Quest, zbudowanej w oparciu o Astro 5, React 19, TypeScript 5, Tailwind 4, Shadcn/ui oraz Supabase. Plan obejmuje pełny cykl testowy – od testów jednostkowych po testy akceptacyjne – gwarantując:

- poprawność logiki biznesowej (tworzenie/rozgrywanie plansz, zarządzanie kontem),
- niezawodność interfejsu użytkownika,
- bezpieczeństwo uwierzytelniania i autoryzacji,
- stabilność integracji z usługą OpenRouter AI,
- skalowalność i wydajność kluczowych operacji.

## 2. Zakres testów

1. Backend – API (`src/pages/api/**`)
   • moduły auth, boards, scores, openrouter  
   • warstwy usług (`src/lib/services/**`)
2. Middleware (uwierzytelnianie, dodawanie Supabase do kontekstu).
3. Frontend – komponenty React (`src/components/**`), strony Astro (`src/pages/**`).
4. Sklep Redux (`src/store/**`) i hooki React (`src/hooks/**`).
5. Integracja z Supabase (RLS, procedury, widoki materializowane).
6. Integracja z OpenRouter AI (limity, koszty, obsługa błędów).
7. Statyczne zasoby i konfiguracje (Tailwind, Astro, tsconfig).

## 3. Typy testów do przeprowadzenia

| Typ testu              | Zakres                           | Narzędzie                              |
| ---------------------- | -------------------------------- | -------------------------------------- |
| Testy jednostkowe      | Funkcje/serwisy TS, hooki React  | Vitest + Testing Library               |
| Testy integracyjne API | Endpointy REST, błędy walidacji  | Vitest + Supertest                     |
| Testy kontraktowe DB   | RLS, widoki, migracje            | Supabase CLI + pgTap                   |
| Testy e2e              | Scenariusze UI (desktop/mobile)  | Playwright                             |
| Testy wydajności       | AI generation, listowanie plansz | k6 / Playwright Tracing                |
| Testy bezpieczeństwa   | Auth flow, RLS, XSS/CSRF         | OWASP ZAP, jwt.io, Supabase RLS checks |
| Testy dostępności      | Komponenty UI, strony Astro      | Playwright + axe-core, Lighthouse      |
| Testy regresyjne       | Pakiet smoke po każdym PR        | GitHub Actions                         |

## 4. Scenariusze testowe dla kluczowych funkcjonalności

1. **Rejestracja i logowanie**  
   • poprawne dane → 200 + tokeny  
   • niepotwierdzony email → 403  
   • niepoprawne hasło → 401
2. **Odświeżenie tokenu**  
   • ważny refreshToken → nowy accessToken  
   • przeterminowany/niepoprawny → 401
3. **Tworzenie planszy**  
   • właściciel tworzy publiczną planszę (16/24 karty) → 201  
   • brak par/niezgodna liczba → 400
4. **Dodawanie poziomu**  
   • zachowanie spójności tytułu, `card_count`, ograniczeń RLS.
5. **Rozgrywka**  
   • logika dobierania kart, timer, zapis wyniku (`score.service`)  
   • przekroczenie limitu czasu → onTimeout()
6. **AI – generowanie par**  
   • quota < 50 → zwraca `pairs[]`  
   • quota >= 50 → 429/”QUOTA*EXCEEDED”  
   • nieprawidłowy input → “INPUT_TEXT*\*”
7. **Uprawnienia**  
   • dostęp do prywatnej planszy przez właściciela vs obcego użytkownika  
   • archiwizacja planszy blokuje modyfikacje/punkty.
8. **UI**  
   • nawigacja sidebar, responsywność, skróty klawiszowe  
   • tryb dźwięku on/off (`soundSlice`)  
   • obsługa błędów (toastSlice).

## 5. Środowisko testowe

- **CI**: GitHub Actions z macierzami (node 20 / pnpm 9 / ubuntu-latest).
- **Baza**: kontener Supabase (docker-compose) z migracjami `supabase/migrations`.
- **Dane początkowe**: seed JSON + ładowanie pgTap.
- **Klucze**: zmienne `.env.test` (Supabase anon service, OpenRouter stub).
- **Przeglądarki**: Chromium, WebKit, Firefox (Playwright).
- **Urządzenia**: viewporty 1280×800, 768×1024, 390×844.

## 6. Narzędzia do testowania

- Vitest + ts-vitest (unit/integration).
- React Testing Library (komponenty).
- Supertest (API).
- Playwright (e2e, a11y, trace).
- k6 (load).
- pgTap + Supabase CLI (kontrakty DB).
- ESLint, Prettier, tsc – jako bramka jakości w CI.

## 7. Harmonogram testów

| Faza                       | Tydzień | Zadania                                             |
| -------------------------- | ------- | --------------------------------------------------- |
| Przygotowanie środowiska   | 1       | Konfiguracja CI, kontener Supabase, stub OpenRouter |
| Testy jednostkowe + DB     | 2–3     | Pokrycie 80 % usług, migracje pgTap                 |
| Testy integracyjne API     | 3–4     | Scenariusze happy / edge                            |
| Testy e2e & dostępność     | 4–5     | Główne ścieżki użytkownika, axe-core                |
| Wydajność & bezpieczeństwo | 6       | k6 (1k VU), ZAP skan                                |
| Testy regresyjne           | 2–6     | Po każdym mergu do `main`                           |
| UAT / Testy akceptacyjne   | 7       | Sesja z PM + QA, kryteria akceptacji                |

## 8. Kryteria akceptacji testów

- Pokrycie kodu usług i hooków ≥ 80 % (statements).
- Wszystkie scenariusze krytyczne zakończone statusem **PASS**.
- Brak błędów wysokiego i krytycznego poziomu w backlogu.
- Wynik Lighthouse PWA ≥ 90 / 100 dla Performance & Accessibility.
- Średni czas odpowiedzi API < 300 ms (p95) przy 1k RPS.
- Koszt AI per request ≤ 0,01 USD.

## 9. Role i odpowiedzialności

| Rola         | Odpowiedzialności                                                 |
| ------------ | ----------------------------------------------------------------- |
| QA Lead      | koordynacja planu testów, raporty, definicja kryteriów akceptacji |
| QA Engineer  | implementacja skryptów Vitest/Playwright, testy wydajności        |
| Backend Dev  | fixy błędów API/DB, testy jednostkowe usług                       |
| Frontend Dev | fixy UI, testy komponentów, a11y                                  |
| DevOps       | utrzymanie CI/CD, monitorowanie wydajności                        |
| PM           | akceptacja UAT, priorytetyzacja błędów                            |

## 10. Procedury raportowania błędów

1. Błąd rejestrowany w GitHub Issues z etykietą `bug`, `priority: high/medium/low`.
2. Szablon zgłoszenia: **Kroki**, **Oczekiwany rezultat**, **Rzeczywisty rezultat**, **Środowisko**, **Załączniki** (zrzut ekranu, trace).
3. Automatyczne logowanie Playwright Trace + video do artefaktów CI.
4. Triaż co 24 h – przypisanie Ownera i planowana wersja naprawy.
5. Błąd **critical/high** musi mieć naprawę lub obejście w < 24 h; **medium** – w sprint; **low** – backlog.

---

Plan zapewnia kompleksowe pokrycie testowe adaptowane do specyfiki stosu technologicznego i kluczowych obszarów ryzyka projektu Definition Quest.
