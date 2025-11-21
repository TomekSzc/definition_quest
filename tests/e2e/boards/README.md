# Board Tests - E2E Test Suite

Ten katalog zawiera testy end-to-end dla funkcjonalności związanych z tablicami (boards).

## Struktura testów

### `create-board.spec.ts`

Testy dla procesu tworzenia nowych tablic, w tym:

- Tworzenie tablicy ręcznie z pełnym zestawem danych
- Dodawanie/usuwanie par dynamicznie
- Zarządzanie tagami
- Wybór liczby kart (16/24)
- Walidacja formularza
- Kompletny workflow: Create → My Boards → Play

## Page Object Models (POM)

### `CreateBoardPage`

Obsługuje stronę tworzenia nowej tablicy (`/boards/create`).

**Najważniejsze metody:**

```typescript
// Nawigacja
await createBoardPage.goto();
await createBoardPage.gotoViaNavigation(); // przez sidebar

// Wypełnianie formularza
await createBoardPage.fillTitle("Tytuł");
await createBoardPage.addTag("tag1");
await createBoardPage.addTags(["tag1", "tag2"]);
await createBoardPage.selectCardCount(16); // lub 24

// Zarządzanie parami
await createBoardPage.fillPair(0, "term", "definition");
await createBoardPage.fillPairs([
  { term: "term1", definition: "def1" },
  { term: "term2", definition: "def2" }
]);
await createBoardPage.addNewPair();
await createBoardPage.removePair(1);

// Pełny proces
await createBoardPage.createBoard({
  title: "Moja tablica",
  tags: ["test", "e2e"],
  cardCount: 16,
  pairs: [...]
});

// Submit
await createBoardPage.submit();
```

### `MyBoardsPage`

Rozszerza `BoardsPage` o funkcjonalność zarządzania własnymi tablicami (`/my-boards`).

**Najważniejsze metody:**

```typescript
// Nawigacja
await myBoardsPage.goto();

// Znajdowanie tablic
await myBoardsPage.clickBoardTile(boardId);
await myBoardsPage.clickBoardTileByTitle("Tytuł");
await myBoardsPage.clickFirstBoard();

// Weryfikacje
const isVisible = await myBoardsPage.isBoardVisible("Tytuł");
const count = await myBoardsPage.getBoardsCount();
```

### `BoardGamePage`

Obsługuje stronę gry/podglądu tablicy (`/boards/{id}`).

**Najważniejsze metody:**

```typescript
// Nawigacja
await boardGamePage.gotoBoard(boardId);

// Interakcje z grą
await boardGamePage.startGame();
await boardGamePage.clickCard(0);
await boardGamePage.stopGame();
await boardGamePage.resetGame();

// Weryfikacje
await boardGamePage.waitForBoardLoaded();
const time = await boardGamePage.getTimerValue();
```

## TestHelpers

Utility class z pomocniczymi metodami:

```typescript
// Szybkie logowanie
await TestHelpers.quickLogin(page);

// Logowanie + nawigacja
const createBoardPage = await TestHelpers.loginAndGoToCreateBoard(page);
const myBoardsPage = await TestHelpers.loginAndGoToMyBoards(page);

// Inne
await TestHelpers.waitForUrlPattern(page, /\/boards/);
await TestHelpers.typeSlowly(locator, "text", 50);
```

## Przykład kompletnego testu

```typescript
test("complete workflow", async ({ page }) => {
  // 1. Zaloguj się i przejdź do Create Board
  const createBoardPage = await TestHelpers.loginAndGoToCreateBoard(page);

  // 2. Utwórz tablicę
  await createBoardPage.createBoard({
    title: "Test Board",
    tags: ["test"],
    cardCount: 16,
    pairs: [
      { term: "apple", definition: "fruit" },
      { term: "car", definition: "vehicle" },
    ],
  });

  // 3. Zweryfikuj przekierowanie
  await expect(page).toHaveURL(/\/my-boards/);

  // 4. Przejdź do tablicy
  const myBoardsPage = new MyBoardsPage(page);
  await myBoardsPage.clickBoardTileByTitle("Test Board");

  // 5. Graj
  const boardGamePage = new BoardGamePage(page);
  await boardGamePage.waitForBoardLoaded();
  await boardGamePage.startGame();
});
```

## Uruchamianie testów

```bash
# Wszystkie testy board
npm run test:e2e -- tests/e2e/boards

# Konkretny plik
npm run test:e2e -- tests/e2e/boards/create-board.spec.ts

# Z UI mode
npm run test:e2e:ui -- tests/e2e/boards

# Tylko jeden test
npm run test:e2e -- tests/e2e/boards/create-board.spec.ts -g "should create board manually"
```

## Best Practices

1. **Zawsze używaj POM** - nie używaj bezpośrednio `page.locator()` w testach
2. **Używaj TestHelpers** - dla wspólnych operacji jak logowanie
3. **Waliduj każdy krok** - używaj `expect()` po każdej kluczowej akcji
4. **Używaj timeout** - React potrzebuje czasu na hydratację
5. **Cleanup** - global teardown czyści bazę po wszystkich testach

## Data-testid Convention

Wszystkie elementy używają atrybutu `data-testid`:

- `board-title-input` - pole tytułu
- `tags-input` - pole tagów
- `tag-{name}` - pojedynczy tag
- `card-count-16`, `card-count-24` - opcje liczby kart
- `pair-term-{index}`, `pair-definition-{index}` - pola par
- `add-pair-button` - dodawanie pary
- `create-board-submit` - submit formularza
- `board-tile-{id}` - kafelek tablicy
- `nav--boards-create` - link w nawigacji
