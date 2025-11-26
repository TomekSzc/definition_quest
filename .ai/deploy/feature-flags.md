# Feature Flags – Plan & Guidelines

## 1. Cel

Feature-flagi pozwalają oddzielić proces _deploymentu_ od _release’u_ (udostępnienia funkcji użytkownikom).

- Umożliwiają włączanie/wyłączanie funkcjonalności per-środowisko (`dev`, `test`, `prod`).
- Pozwalają na stopniowe wdrażanie (canary / progressive rollout) bez konieczności tworzenia oddzielnych gałęzi kodu.
- Ułatwiają szybkie wycofanie problematycznej funkcji (kill-switch).

---

## 2. Zakres pierwszej iteracji (statyczne flagi)

1. **Moduł TS**: `src/features/featureFlags.ts` (już zaimplementowany).
2. **Wspierane środowiska**: `dev`, `test`, `prod` (pobierane z `ENV_NAME`).
3. **Zdefiniowane flagi**:
   - `auth`
   - `collections`
4. **API**: funkcja `isEnabled(feature)` do użycia na frontendzie i backendzie.
5. **Zastosowanie**:
   - Strony Astro (`index.astro`, `signup.astro`, `reset-password.astro`).
   - Endpointy API (`src/pages/api/*`).

---

## 3. Przykłady użycia

```ts
import { isEnabled } from "@/features/featureFlags";

if (!isEnabled("auth")) {
  return new Response("Auth temporarily disabled", { status: 503 });
}
```

```astro
---
import { isEnabled } from "@/features/featureFlags";
if (!isEnabled("collections")) redirect("/coming-soon");
---
```

---

## 4. Roadmap kolejnych kroków

| Etap  | Opis                                                                       | Priorytet |
| ----- | -------------------------------------------------------------------------- | --------- |
| **1** | Integracja flag w krytycznych miejscach (strony & API)                     | 🔥        |
| **2** | Middleware globalny blokujący ruch do wyłączonych features                 | 🔥        |
| **3** | Automatyczne generowanie typów TS na podstawie pliku konfiguracyjnego      | ⚡        |
| **4** | Przechowywanie konfiguracji w Supabase / konsoli admina (dynamiczne flagi) | ⭐        |
| **5** | Rollout per-user (sampling, allow-list, AB-test)                           | 🚀        |
| **6** | Telemetria: raportowanie użycia flag do logów/analytics                    | 🚀        |

Legenda:
_🔥 – must-have, ⚡ – nice-to-have, ⭐ – important future, 🚀 – advanced_

---

## 5. Dobre praktyki

1. **Domyślnie false** – funkcja niedostępna jeśli flaga nie została zdefiniowana.
2. **Brak logiki biznesowej w module flag** – tylko proste mapowanie → łatwa migracja na system dynamiczny.
3. **Unikaj zagnieżdżania** – każda funkcja ma własną flagę, bez zależności pomiędzy flagami.
4. **Nazewnictwo** – małe litery, słowa rozdzielone myślnikiem lub camelCase (`paymentBeta`, `referral-links`).
5. **Usuwaj nieużywane flagi** – po pełnym rolloutcie usuń wpis z macierzy oraz kod warunkowy.
