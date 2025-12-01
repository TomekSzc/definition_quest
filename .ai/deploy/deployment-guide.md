# 🚀 Deployment Guide - Digital Ocean

## Architektura

Aplikacja jest deployowana w następujący sposób:

1. **Docker** - Aplikacja jest pakowana w kontener Docker
2. **GitHub Actions** - Automatyczna budowa i deployment po pushu na `master`
3. **GitHub Container Registry (GHCR)** - Przechowywanie obrazów Docker
4. **Digital Ocean App Platform** - Hosting aplikacji

## Przepływ Deployment

```
Push na master
    ↓
GitHub Actions (master-docker.yml)
    ↓
1. Lint → 2. Tests → 3. Build Docker → 4. Push to GHCR → 5. Deploy to Digital Ocean
    ↓
Aplikacja live na Digital Ocean
```

## Krok 1: Przygotowanie Digital Ocean

### A. Utwórz aplikację w Digital Ocean

1. Zaloguj się do [Digital Ocean Dashboard](https://cloud.digitalocean.com/)
2. Przejdź do **Apps** → **Create App**
3. Wybierz **Docker Hub** lub **Container Registry**
4. Podaj: `ghcr.io/TomekSzc/definition_quest:latest`
5. Ustaw region (np. Frankfurt dla Europy)
6. Wybierz plan (Basic / Professional)
7. Zanotuj **App ID** (potrzebne dla GitHub Actions)

### B. Wygeneruj Digital Ocean API Token

1. Przejdź do [API Tokens](https://cloud.digitalocean.com/account/api/tokens)
2. Kliknij **Generate New Token**
3. Nadaj nazwę: `definition-quest-github-actions`
4. Zaznacz **Write** (full access)
5. Zapisz token (nie będzie ponownie widoczny!)

### C. Skonfiguruj zmienne środowiskowe w Digital Ocean

W Digital Ocean Dashboard → Twoja aplikacja → **Settings** → **App-Level Environment Variables**:

```bash
ENV_NAME=prod
SUPABASE_URL=<twój produkcyjny URL Supabase>
SUPABASE_KEY=<twój produkcyjny anon key Supabase>
OPENROUTER_API_KEY=<twój klucz API OpenRouter>
HOST=0.0.0.0
PORT=8080
```

⚠️ **Ważne**: Digital Ocean App Platform domyślnie używa portu `8080`, więc `PORT=8080`

## Krok 2: Konfiguracja GitHub Secrets

W repozytorium GitHub → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**

### Wymagane Secrets

```bash
# Digital Ocean
DIGITALOCEAN_ACCESS_TOKEN=<token z Kroku 1.B>
DIGITALOCEAN_APP_ID=<app ID z Kroku 1.A>

# Supabase (dla build-time)
SUPABASE_URL=<twój produkcyjny URL Supabase>
SUPABASE_KEY=<twój produkcyjny anon key Supabase>

# OpenRouter
OPENROUTER_API_KEY=<twój klucz API OpenRouter>

# Opcjonalnie
PUBLIC_ENV_NAME=prod
```

⚠️ **Uwaga**: `GITHUB_TOKEN` jest automatycznie dostępny w GitHub Actions

## Krok 3: Konfiguracja Environment w GitHub (opcjonalne)

Dla lepszej organizacji i bezpieczeństwa:

1. W repozytorium GitHub → **Settings** → **Environments**
2. Kliknij **New environment**
3. Nazwij: `production`
4. Dodaj opcjonalnie:
   - **Required reviewers** (wymagaj zatwierdzenia przed deploymentem)
   - **Deployment branches** → Only `master`
   - **Environment secrets** (przeniesiemy tutaj secrets)

## Krok 4: Deploy

### Automatyczny deployment

Po skonfigurowaniu wszystkiego, każdy push na `master` automatycznie uruchomi deployment:

```bash
git checkout master
git add .
git commit -m "feat: add new feature"
git push origin master
```

### Proces deployment

GitHub Actions wykona następujące kroki:

1. ✅ **Lint** - sprawdzenie jakości kodu
2. ✅ **Tests** - uruchomienie testów jednostkowych
3. ✅ **Build Docker** - zbudowanie obrazu Docker
4. ✅ **Push to GHCR** - wysłanie obrazu do GitHub Container Registry
5. ✅ **Deploy to Digital Ocean** - deployment na Digital Ocean

### Monitorowanie deployment

**GitHub Actions:**
- URL: `https://github.com/TomekSzc/definition_quest/actions`
- Sprawdź status workflow "Build and Deploy Docker Container"
- Sprawdź logi każdego kroku

**Digital Ocean:**
- Dashboard → Twoja aplikacja → **Activity**
- Sprawdź logi deployment
- Sprawdź status aplikacji

## Dockerfile - Struktura

Aplikacja używa **multi-stage build** dla optymalizacji:

```dockerfile
Stage 1: deps     → Instalacja dependencies
Stage 2: build    → Build aplikacji Astro
Stage 3: runner   → Finalna wersja (tylko prod dependencies)
```

### Bezpieczeństwo

- ✅ Używamy `node:22-alpine` (mały obraz)
- ✅ Uruchamiamy jako user `node` (non-root)
- ✅ Tylko production dependencies w finalnym obrazie
- ✅ Healthcheck włączony

## Krok 5: Weryfikacja

Po pomyślnym deploymencie sprawdź:

### 1. Status aplikacji
```bash
doctl apps get <APP_ID>
```

### 2. Logi aplikacji
```bash
doctl apps logs <APP_ID> --follow
```

### 3. Aplikacja w przeglądarce
- URL: `https://<twoja-aplikacja>.ondigitalocean.app`
- Sprawdź czy strona się ładuje
- Sprawdź czy możesz się zalogować
- Sprawdź konsolę przeglądarki (F12) pod kątem błędów

### Post-Deployment Checklist

- [ ] Strona główna ładuje się poprawnie
- [ ] Login działa
- [ ] Rejestracja działa
- [ ] API endpoints działają
- [ ] Brak błędów w konsoli przeglądarki
- [ ] Zmienne środowiskowe są poprawnie ustawione
- [ ] Feature flags działają (`ENV_NAME=prod`)

## Przydatne Komendy

### Digital Ocean CLI (doctl)

Instalacja:
```bash
# MacOS
brew install doctl

# Linux
snap install doctl

# Windows
# Pobierz z: https://github.com/digitalocean/doctl/releases
```

Autentykacja:
```bash
doctl auth init
```

Przydatne komendy:
```bash
# Lista aplikacji
doctl apps list

# Status aplikacji
doctl apps get <APP_ID>

# Logi aplikacji (live)
doctl apps logs <APP_ID> --follow

# Trigger manual deployment
doctl apps create-deployment <APP_ID>

# Lista deploymentów
doctl apps list-deployments <APP_ID>
```

### Git Commands

```bash
# Sprawdź status
git status

# Sprawdź aktualny branch
git branch --show-current

# Sprawdź ostatni commit
git log -1 --oneline

# Deploy (commit + push)
git add .
git commit -m "feat: new feature"
git push origin master
```

### Docker Commands (lokalne testowanie)

```bash
# Build obrazu lokalnie
docker build -t definition-quest:test .

# Uruchom lokalnie
docker run -p 3000:3000 \
  -e SUPABASE_URL=<url> \
  -e SUPABASE_KEY=<key> \
  -e OPENROUTER_API_KEY=<key> \
  -e ENV_NAME=dev \
  definition-quest:test

# Sprawdź czy działa
curl http://localhost:3000
```

## 🔧 Troubleshooting

### Deployment Failed

**1. Sprawdź logi GitHub Actions**
```
GitHub → Actions → Znajdź failed workflow → Sprawdź który krok nie powiódł się
```

**2. Najczęstsze problemy:**

| Problem | Rozwiązanie |
|---------|------------|
| Lint errors | Uruchom `npm run lint` lokalnie i popraw błędy |
| Test failures | Uruchom `npm test` lokalnie |
| Docker build failed | Sprawdź czy wszystkie secrets są ustawione |
| Push to GHCR failed | Sprawdź uprawnienia GITHUB_TOKEN |
| Deploy to DO failed | Sprawdź `DIGITALOCEAN_ACCESS_TOKEN` i `DIGITALOCEAN_APP_ID` |

### Aplikacja nie działa po deployment

**1. Sprawdź logi Digital Ocean:**
```bash
doctl apps logs <APP_ID> --follow
```

**2. Sprawdź zmienne środowiskowe:**
- Digital Ocean Dashboard → App → Settings → Environment Variables
- Upewnij się że wszystkie wymagane zmienne są ustawione

**3. Sprawdź port:**
- Digital Ocean App Platform używa portu `8080` domyślnie
- Upewnij się że `PORT=8080` w zmiennych środowiskowych

**4. Sprawdź Supabase:**
- Czy URL i KEY są poprawne?
- Czy Supabase projekt jest aktywny?

### Docker image too large

Jeśli obraz jest zbyt duży:

1. Sprawdź `.dockerignore` - upewnij się że wykluczamy:
   ```
   node_modules
   dist
   .git
   .env*
   tests
   ```

2. Rozważ użycie `npm prune` w build stage

3. Usuń dev dependencies w final stage (już zrobione)

### Slow deployment

- GitHub Actions cache jest włączony (`cache-from/cache-to: type=gha`)
- Kolejne buildy będą szybsze
- Pierwszy build zawsze trwa dłużej

## 📊 Monitoring & Maintenance

### Digital Ocean Monitoring

Dashboard → App → Insights:
- CPU usage
- Memory usage
- HTTP requests
- Response times
- Error rates

### Alerty (opcjonalne)

Możesz skonfigurować alerty w Digital Ocean:
- Dashboard → Monitoring → Alerts
- Ustaw alerty dla CPU, memory, response time

### Scaling

Digital Ocean App Platform pozwala na łatwe skalowanie:
- Dashboard → App → Settings → Resources
- Zmień plan (Basic / Professional / Enterprise)
- Dodaj więcej instancji (horizontal scaling)

## 🚀 Następne kroki

1. **Custom Domain**
   - Digital Ocean → App → Settings → Domains
   - Dodaj własną domenę (np. `definitionquest.com`)
   - Skonfiguruj DNS

2. **SSL Certificate**
   - Digital Ocean automatycznie generuje certyfikat SSL
   - Wymuszaj HTTPS dla wszystkich requestów

3. **Monitoring zewnętrzny**
   - Rozważ użycie Sentry dla error tracking
   - Użyj Uptime Robot dla monitoring uptime

4. **Backup strategy**
   - Supabase automatycznie robi backup
   - Digital Ocean także robi backup aplikacji

5. **CDN (opcjonalne)**
   - Digital Ocean oferuje CDN
   - Rozważ dla lepszej wydajności globalnej

## 📚 Przydatne linki

- [Digital Ocean App Platform Docs](https://docs.digitalocean.com/products/app-platform/)
- [Digital Ocean Docker Deployment](https://docs.digitalocean.com/products/app-platform/how-to/deploy-from-container-images/)
- [GitHub Actions Docs](https://docs.github.com/en/actions)
- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)
- [Astro Docker Deployment](https://docs.astro.build/en/recipes/docker/)

---

**Ostatnia aktualizacja:** Grudzień 2025  
**Stack:** Docker + GitHub Actions + Digital Ocean  
**Status:** ✅ Produkcyjny

