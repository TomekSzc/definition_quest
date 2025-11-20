# E2E Test Helpers & Page Objects

Ten katalog zawiera Page Object Models (POM) i utility classes dla testów E2E.

## 📁 Struktura

```
helpers/
├── page-objects.ts    # Wszystkie POM classes
└── README.md          # Ta dokumentacja
```

## 🎯 Page Object Model (POM)

### Dlaczego POM?

Page Object Model to design pattern, który:
- ✅ Oddziela logikę testu od implementacji UI
- ✅ Zmniejsza duplikację kodu
- ✅ Ułatwia maintenance (zmiana selektora w jednym miejscu)
- ✅ Zwiększa czytelność testów
- ✅ Pozwala na łatwe refaktoryzacje

### Hierarchia klas

```
BasePage (abstrakcyjna bazowa klasa)
├── LoginPage
├── HomePage
├── BoardsPage
│   └── MyBoardsPage (extends BoardsPage)
├── CreateBoardPage
└── BoardGamePage
```

## 📚 Dostępne Page Objects

### 1. BasePage

Bazowa klasa dla wszystkich Page Objects. Zawiera wspólne metody.

```typescript
class BasePage {
  constructor(page: Page)
  
  // Metody nawigacji
  async goto(path: string): Promise<void>
  async waitForNavigation(url: string | RegExp): Promise<void>
  
  // Utility
  async getTitle(): Promise<string>
  async waitForElement(locator: Locator): Promise<void>
  async isVisible(locator: Locator): Promise<boolean>
  getByTestId(testId: string): Locator
}
```

**Przykład:**
```typescript
class MyPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }
  
  async goto() {
    await super.goto("/my-path");
  }
}
```

---

### 2. LoginPage

Obsługuje stronę logowania (`/`).

**Lokatory:**
- `loginForm` - formularz logowania
- `emailInput` - pole email
- `passwordInput` - pole hasła
- `passwordToggle` - przycisk pokazywania hasła
- `submitButton` - przycisk "Zaloguj"
- `signUpLink` - link do rejestracji
- `forgotPasswordLink` - link "Zapomniałeś hasła?"

**Metody:**
```typescript
// Nawigacja
await loginPage.goto()

// Wypełnianie formularza
await loginPage.fillEmail("user@example.com")
await loginPage.fillPassword("password123")
await loginPage.togglePasswordVisibility()

// Logowanie
await loginPage.login(email, password)
await loginPage.loginWithEnvCredentials() // używa E2E_USERNAME i E2E_PASSWORD

// Nawigacja
await loginPage.goToSignUp()
await loginPage.goToForgotPassword()

// Weryfikacje
await loginPage.verifyPageTitle()
const isVisible = await loginPage.isLoginFormVisible()
await loginPage.waitForSuccessfulLogin()
```

---

### 3. BoardsPage

Obsługuje stronę listy tablic (`/boards`).

**Lokatory:**
- `sidebar` - boczne menu
- `header` - nagłówek
- `boardsList` - lista tablic
- `breadcrumbs` - breadcrumbs

**Metody:**
```typescript
await boardsPage.goto()
const isLoggedIn = await boardsPage.isUserLoggedIn()
await boardsPage.verifyOnBoardsPage()
```

---

### 4. MyBoardsPage (extends BoardsPage)

Obsługuje stronę własnych tablic (`/my-boards`).

**Dodatkowe metody:**
```typescript
await myBoardsPage.goto()

// Znajdowanie tablic
myBoardsPage.getBoardTile(boardId)
myBoardsPage.getBoardTileByTitle(title)

// Klikanie
await myBoardsPage.clickBoardTile(boardId)
await myBoardsPage.clickBoardTileByTitle(title)
await myBoardsPage.clickFirstBoard()

// Weryfikacje
const count = await myBoardsPage.getBoardsCount()
const isVisible = await myBoardsPage.isBoardVisible(title)
await myBoardsPage.verifyOnMyBoardsPage()
```

---

### 5. CreateBoardPage

Obsługuje stronę tworzenia tablicy (`/boards/create`).

**Lokatory:**
- `titleInput` - pole tytułu
- `tagsInput` - pole dodawania tagów
- `tagsList` - lista tagów
- `cardCountToggle` - toggle liczby kart
- `cardCount16`, `cardCount24` - opcje 16/24
- `addPairButton` - przycisk dodawania pary
- `submitButton` - przycisk "Utwórz tablicę"

**Metody:**
```typescript
// Nawigacja
await createBoardPage.goto()
await createBoardPage.gotoViaNavigation() // przez sidebar

// Tytuł
await createBoardPage.fillTitle("Tytuł")

// Tagi
await createBoardPage.addTag("tag1")
await createBoardPage.addTags(["tag1", "tag2", "tag3"])
await createBoardPage.removeTag("tag1")
const count = await createBoardPage.getTagsCount()

// Liczba kart
await createBoardPage.selectCardCount(16) // lub 24

// Pary
await createBoardPage.fillPair(0, "term", "definition")
await createBoardPage.fillPairs([
  { term: "apple", definition: "fruit" },
  { term: "car", definition: "vehicle" }
])
await createBoardPage.addNewPair()
await createBoardPage.removePair(1)
const pairsCount = await createBoardPage.getPairsCount()

// Lokatory dla konkretnej pary
createBoardPage.getPairTermInput(index)
createBoardPage.getPairDefinitionInput(index)
createBoardPage.getRemovePairButton(index)

// Pełny proces
await createBoardPage.createBoard({
  title: "Moja tablica",
  tags: ["test", "e2e"],
  cardCount: 16,
  pairs: [
    { term: "term1", definition: "def1" },
    { term: "term2", definition: "def2" }
  ]
})

// Submit i weryfikacje
await createBoardPage.submit()
await createBoardPage.verifyOnCreateBoardPage()
await createBoardPage.waitForBoardCreated()
```

---

### 6. BoardGamePage

Obsługuje stronę gry (`/boards/{id}`).

**Lokatory:**
- `board` - plansza do gry
- `startButton`, `stopButton`, `resetButton` - kontrolki gry
- `timer` - timer

**Metody:**
```typescript
// Nawigacja
await boardGamePage.gotoBoard(boardId)
await boardGamePage.waitForBoardLoaded()

// Gra
await boardGamePage.startGame()
await boardGamePage.stopGame()
await boardGamePage.resetGame()
await boardGamePage.clickCard(0)

// Weryfikacje
await boardGamePage.verifyOnBoardGamePage(boardId)
const time = await boardGamePage.getTimerValue()

// Lokatory
boardGamePage.getCard(index)
```

---

## 🛠️ TestHelpers

Utility class z helper methods.

```typescript
class TestHelpers {
  // Szybkie logowanie
  static async quickLogin(page: Page): Promise<void>
  
  // Logowanie + nawigacja
  static async loginAndGoToCreateBoard(page: Page): Promise<CreateBoardPage>
  static async loginAndGoToMyBoards(page: Page): Promise<MyBoardsPage>
  
  // Utility
  static async waitForUrlPattern(page: Page, pattern: RegExp, timeout?: number): Promise<void>
  static async isInViewport(locator: Locator): Promise<boolean>
  static async typeSlowly(locator: Locator, text: string, delay?: number): Promise<void>
}
```

**Przykład użycia:**
```typescript
test("my test", async ({ page }) => {
  // Zamiast całego procesu logowania:
  await TestHelpers.quickLogin(page);
  
  // Lub logowanie + nawigacja w jednym:
  const createBoardPage = await TestHelpers.loginAndGoToCreateBoard(page);
  
  // Wolniejsze wpisywanie (bardziej realistyczne)
  await TestHelpers.typeSlowly(someInput, "Hello World", 50);
});
```

---

## 📖 Przykłady użycia

### Prosty test logowania

```typescript
import { LoginPage, BoardsPage } from "../helpers/page-objects";

test("login flow", async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  
  await loginPage.login("user@example.com", "password123");
  await loginPage.waitForSuccessfulLogin();
  
  const boardsPage = new BoardsPage(page);
  await expect(boardsPage.sidebar).toBeVisible();
});
```

### Test tworzenia tablicy

```typescript
import { TestHelpers, CreateBoardPage, MyBoardsPage } from "../helpers/page-objects";

test("create board", async ({ page }) => {
  // Logowanie i nawigacja
  const createBoardPage = await TestHelpers.loginAndGoToCreateBoard(page);
  
  // Tworzenie tablicy
  await createBoardPage.createBoard({
    title: "My Test Board",
    tags: ["test"],
    cardCount: 16,
    pairs: [
      { term: "apple", definition: "fruit" },
      { term: "car", definition: "vehicle" }
    ]
  });
  
  // Weryfikacja
  await expect(page).toHaveURL(/\/my-boards/);
  
  const myBoardsPage = new MyBoardsPage(page);
  const isVisible = await myBoardsPage.isBoardVisible("My Test Board");
  expect(isVisible).toBeTruthy();
});
```

### Test z wieloma Page Objects

```typescript
test("complete workflow", async ({ page }) => {
  // Login
  await TestHelpers.quickLogin(page);
  
  // Create
  const createBoardPage = new CreateBoardPage(page);
  await createBoardPage.gotoViaNavigation();
  await createBoardPage.fillTitle("Complete Test");
  await createBoardPage.fillPairs([
    { term: "test1", definition: "def1" },
    { term: "test2", definition: "def2" }
  ]);
  await createBoardPage.submit();
  
  // My Boards
  const myBoardsPage = new MyBoardsPage(page);
  await myBoardsPage.clickBoardTileByTitle("Complete Test");
  
  // Play
  const boardGamePage = new BoardGamePage(page);
  await boardGamePage.waitForBoardLoaded();
  await boardGamePage.startGame();
});
```

---

## 🎨 Konwencje

### Nazewnictwo lokatorów
- Używamy `camelCase`
- Końcówka wskazuje typ: `Input`, `Button`, `Link`, `Toggle`, itp.
- Przykłady: `emailInput`, `submitButton`, `signUpLink`

### Nazewnictwo metod
- Akcje: `fill...()`, `click...()`, `goto...()`, `select...()`
- Gettery: `get...()`, `is...()`
- Waity: `waitFor...()`, `waitUntil...()`
- Weryfikacje: `verify...()`

### data-testid
- Używamy `data-testid` jako głównego selektora
- Format: `kebab-case`
- Przykłady: `board-title-input`, `add-pair-button`, `nav--boards-create`

---

## 🔧 Dodawanie nowego Page Object

1. **Rozszerz BasePage:**
```typescript
export class MyNewPage extends BasePage {
  // Lokatory
  readonly myButton: Locator;
  
  constructor(page: Page) {
    super(page);
    this.myButton = this.getByTestId("my-button");
  }
  
  // Nawigacja
  async goto() {
    await super.goto("/my-path");
    await this.myButton.waitFor({ state: "visible", timeout: 15000 });
  }
  
  // Metody akcji
  async clickMyButton() {
    await this.myButton.click();
  }
}
```

2. **Dodaj do exportów w page-objects.ts**

3. **Użyj w testach:**
```typescript
import { MyNewPage } from "../helpers/page-objects";

test("my test", async ({ page }) => {
  const myPage = new MyNewPage(page);
  await myPage.goto();
  await myPage.clickMyButton();
});
```

---

## 📝 Best Practices

1. ✅ **Zawsze używaj POM** - nie pisz selektorów bezpośrednio w testach
2. ✅ **Używaj TestHelpers** - dla powtarzalnych operacji
3. ✅ **Czekaj na elementy** - `waitFor({ state: "visible" })`
4. ✅ **Oddzielaj logikę** - testy opisują "co", POM opisują "jak"
5. ✅ **Jeden POM = jedna strona** - jasny podział odpowiedzialności
6. ✅ **Metody wysokiego poziomu** - `createBoard()` zamiast kilku `fill()`
7. ✅ **Używaj data-testid** - stabilne selektory
8. ✅ **Timeout dla React** - hydration potrzebuje czasu

---

## 🚀 Tips & Tricks

### Debugowanie
```typescript
// Zatrzymaj execution
await page.pause();

// Screenshot
await page.screenshot({ path: "debug.png" });

// Console logs
page.on("console", msg => console.log(msg.text()));
```

### Reusable assertions
```typescript
class CreateBoardPage extends BasePage {
  async verifyFormFilled() {
    await expect(this.titleInput).not.toBeEmpty();
    await expect(this.getPairTermInput(0)).not.toBeEmpty();
  }
}
```

### Chaining
```typescript
await createBoardPage
  .fillTitle("Test")
  .then(() => createBoardPage.addTag("tag1"))
  .then(() => createBoardPage.submit());
```

