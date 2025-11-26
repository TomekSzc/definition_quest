# ⚡ Szybkie komendy do deploymentu

## Sprawdź status przed deploymentem

```bash
# Sprawdź aktualny branch
git branch --show-current

# Sprawdź czy są niezacommitowane zmiany
git status

# Sprawdź ostatni commit
git log -1 --oneline

# Sprawdź czy jesteś zsynchronizowany z remote
git fetch origin
git status
```

## Commituj i deployuj

```bash
# Dodaj wszystkie zmiany
git add .

# Commit z opisem
git commit -m "feat: configure Cloudflare deployment"

# Push na master (uruchamia deployment)
git push origin master
```

## Przejdź na master z innego brancha

```bash
# Zapisz zmiany na obecnym branchu
git add .
git commit -m "wip: save changes"

# Przejdź na master
git checkout master

# Zmerguj zmiany z feature brancha
git merge feature/deploy-on-production-config

# Push na master
git push origin master
```

## Wycofaj deployment (rollback)

```bash
# Zobacz ostatnie commity
git log --oneline -5

# Wróć do poprzedniej wersji (soft - zachowa zmiany)
git reset --soft HEAD~1

# Lub wróć do konkretnego commita
git reset --soft <commit-hash>

# Push (wymaga force, OSTROŻNIE!)
git push origin master --force
```

## Monitoruj deployment

```bash
# Otwórz GitHub Actions w przeglądarce
# Linux/Mac:
open https://github.com/$(git remote get-url origin | sed 's/.*github.com[:/]\(.*\)\.git/\1/')/actions

# Windows (PowerShell):
start https://github.com/$(git remote get-url origin).replace('git@github.com:', '').replace('.git', '')/actions
```

## Cloudflare CLI (opcjonalne)

```bash
# Zainstaluj Wrangler globalnie
npm install -g wrangler

# Zaloguj się do Cloudflare
wrangler login

# Zobacz listę projektów
wrangler pages project list

# Zobacz szczegóły deploymentu
wrangler pages deployment list --project-name=definition-quest

# Zobacz logi na żywo
wrangler pages deployment tail --project-name=definition-quest
```

## Testuj lokalnie z Cloudflare runtime

```bash
# Build projektu
npm run build

# Uruchom lokalnie z Cloudflare Workers runtime
npx wrangler pages dev dist

# Aplikacja będzie dostępna na http://localhost:8788
```

## Debug po deploymencie

```bash
# Sprawdź zmienne środowiskowe (lokalnie)
printenv | grep SUPABASE
printenv | grep OPENROUTER

# Test API endpoints lokalnie przed deploymentem
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

## Przydatne aliasy Git (dodaj do ~/.gitconfig)

```bash
[alias]
  # Quick status
  st = status -sb

  # Quick commit and push
  deploy = !git add -A && git commit -m 'deploy' && git push origin master

  # Beautiful log
  lg = log --graph --pretty=format:'%Cred%h%Creset -%C(yellow)%d%Creset %s %Cgreen(%cr) %C(bold blue)<%an>%Creset' --abbrev-commit

  # Undo last commit (keep changes)
  undo = reset --soft HEAD~1

  # Show current branch
  current = branch --show-current
```

Użyj aliasów:

```bash
git st          # status
git deploy      # add, commit, push w jednej komendzie
git lg          # ładny log
git undo        # cofnij ostatni commit
git current     # pokaż obecny branch
```
