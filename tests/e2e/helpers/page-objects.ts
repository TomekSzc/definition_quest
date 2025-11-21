import type { Page, Locator } from "@playwright/test";
import { expect } from "@playwright/test";

/**
 * Utility functions dla wspólnych operacji nawigacji i autoryzacji
 */

/**
 * Szybkie logowanie użytkownika ze zmiennych środowiskowych
 * Przydatne w beforeEach hooks
 */
export async function quickLogin(page: Page): Promise<void> {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.loginWithEnvCredentials();
  await loginPage.waitForSuccessfulLogin();
}

/**
 * Szybkie logowanie i nawigacja do Create Board
 */
export async function loginAndGoToCreateBoard(page: Page): Promise<CreateBoardPage> {
  await quickLogin(page);
  const createBoardPage = new CreateBoardPage(page);

  // Bezpośrednia nawigacja zamiast przez sidebar (bardziej niezawodne w testach)
  await createBoardPage.goto();
  return createBoardPage;
}

/**
 * Szybkie logowanie i nawigacja do My Boards
 */
export async function loginAndGoToMyBoards(page: Page): Promise<MyBoardsPage> {
  await quickLogin(page);
  const myBoardsPage = new MyBoardsPage(page);
  await myBoardsPage.goto();
  return myBoardsPage;
}

/**
 * Szybkie logowanie i nawigacja do Edit Board
 */
export async function loginAndGoToEditBoard(page: Page, boardId: string): Promise<EditBoardPage> {
  await quickLogin(page);
  const editBoardPage = new EditBoardPage(page);
  await editBoardPage.goto(boardId);
  return editBoardPage;
}

/**
 * Czeka na konkretny URL pattern z retry
 */
export async function waitForUrlPattern(page: Page, pattern: RegExp, timeout = 10000): Promise<void> {
  await page.waitForURL(pattern, { timeout });
}

/**
 * Sprawdza czy element jest w viewport
 */
export async function isInViewport(locator: Locator): Promise<boolean> {
  return await locator.isVisible();
}

/**
 * Symuluje wolniejsze wpisywanie tekstu (bardziej realistyczne)
 */
export async function typeSlowly(locator: Locator, text: string, delay = 50): Promise<void> {
  await locator.click();
  for (const char of text) {
    await locator.type(char, { delay });
  }
}

/**
 * Bazowa klasa Page Object dla wszystkich stron
 * Zawiera wspólną funkcjonalność i metody pomocnicze
 */
export class BasePage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  /**
   * Przechodzi do określonego URL i czeka na pełne załadowanie (z React)
   */
  async goto(path: string) {
    await this.page.goto(path, { waitUntil: "networkidle" });
    // Dodatkowe czekanie na hydration Reacta
    await this.page.waitForLoadState("domcontentloaded");
  }

  /**
   * Czeka na nawigację do określonego URL
   */
  async waitForNavigation(url: string | RegExp) {
    await this.page.waitForURL(url);
  }

  /**
   * Pobiera tytuł strony
   */
  async getTitle() {
    return await this.page.title();
  }

  /**
   * Czeka na widoczność elementu
   */
  async waitForElement(locator: Locator) {
    await locator.waitFor({ state: "visible" });
  }

  /**
   * Sprawdza czy element jest widoczny
   */
  async isVisible(locator: Locator): Promise<boolean> {
    return await locator.isVisible();
  }

  /**
   * Znajduje element po data-test-id
   */
  getByTestId(testId: string): Locator {
    return this.page.getByTestId(testId);
  }
}

/**
 * Page Object Model dla strony logowania
 * Używa data-test-id dla stabilnych selektorów
 */
export class LoginPage extends BasePage {
  // Locators używające data-test-id
  readonly loginForm: Locator;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly passwordToggle: Locator;
  readonly submitButton: Locator;
  readonly signUpLink: Locator;
  readonly forgotPasswordLink: Locator;
  readonly pageTitle: Locator;

  constructor(page: Page) {
    super(page);

    // Używamy data-test-id dla stabilnych selektorów
    this.loginForm = this.getByTestId("login-form");
    this.emailInput = this.getByTestId("login-email-input");
    this.passwordInput = this.getByTestId("login-password-input");
    this.passwordToggle = this.getByTestId("login-password-input-toggle");
    this.submitButton = this.getByTestId("login-submit-button");
    this.signUpLink = this.getByTestId("signup-link");
    this.forgotPasswordLink = this.getByTestId("forgot-password-link");
    // Bardziej precyzyjny selektor dla tytułu strony logowania
    this.pageTitle = page.getByRole("heading", { name: "Definition quest" });
  }

  /**
   * Przechodzi do strony logowania i czeka na załadowanie formularza
   */
  async goto() {
    await super.goto("/");
    // Czekaj na pełne załadowanie DOM
    await this.page.waitForLoadState("domcontentloaded");
    // Czekaj aż React zahydratuje i formularz się wyrenderuje
    await this.loginForm.waitFor({ state: "visible", timeout: 15000 });
  }

  /**
   * Wypełnia pole email (czeka na widoczność)
   */
  async fillEmail(email: string) {
    await this.emailInput.waitFor({ state: "visible" });
    await this.emailInput.fill(email);
  }

  /**
   * Wypełnia pole hasła (czeka na widoczność)
   */
  async fillPassword(password: string) {
    await this.passwordInput.waitFor({ state: "visible" });
    await this.passwordInput.fill(password);
  }

  /**
   * Klika przycisk pokazujący/ukrywającego hasło (czeka na widoczność)
   */
  async togglePasswordVisibility() {
    await this.passwordToggle.waitFor({ state: "visible" });
    await this.passwordToggle.click();
  }

  /**
   * Klika przycisk logowania (czeka na enabled state)
   */
  async clickSubmit() {
    await this.submitButton.waitFor({ state: "visible" });
    await this.submitButton.click();
  }

  /**
   * Wykonuje pełny proces logowania
   * @param email - adres email użytkownika
   * @param password - hasło użytkownika
   */
  async login(email: string, password: string) {
    await this.fillEmail(email);
    await this.fillPassword(password);
    await this.clickSubmit();
  }

  /**
   * Wykonuje logowanie ze zmiennych środowiskowych
   * Używa E2E_USERNAME i E2E_PASSWORD
   */
  async loginWithEnvCredentials() {
    const email = process.env.E2E_USERNAME;
    const password = process.env.E2E_PASSWORD;

    if (!email || !password) {
      throw new Error("E2E_USERNAME and E2E_PASSWORD environment variables must be set");
    }

    await this.login(email, password);
  }

  /**
   * Przechodzi do strony rejestracji (czeka na widoczność linku)
   */
  async goToSignUp() {
    await this.signUpLink.waitFor({ state: "visible" });
    await this.signUpLink.click();
  }

  /**
   * Przechodzi do strony przypomnienia hasła (czeka na widoczność linku)
   */
  async goToForgotPassword() {
    await this.forgotPasswordLink.waitFor({ state: "visible" });
    await this.forgotPasswordLink.click();
  }

  /**
   * Sprawdza czy formularz logowania jest widoczny
   */
  async isLoginFormVisible(): Promise<boolean> {
    return await this.isVisible(this.loginForm);
  }

  /**
   * Sprawdza czy tytuł strony jest poprawny
   */
  async verifyPageTitle() {
    await expect(this.pageTitle).toHaveText("Definition quest");
  }

  /**
   * Czeka na przekierowanie po pomyślnym logowaniu
   */
  async waitForSuccessfulLogin() {
    await this.waitForNavigation(/\/boards/);
  }
}

/**
 * Page Object Model dla strony Boards (po zalogowaniu)
 */
export class BoardsPage extends BasePage {
  readonly sidebar: Locator;
  readonly header: Locator;
  readonly boardsList: Locator;
  readonly breadcrumbs: Locator;

  constructor(page: Page) {
    super(page);

    this.sidebar = page.locator("aside");
    this.header = page.locator("header");
    this.boardsList = page.locator("[data-boards-list]");
    // Używamy bardziej precyzyjnego selektora dla breadcrumbs
    this.breadcrumbs = page.locator("header h1").first();
  }

  /**
   * Przechodzi do strony Boards i czeka na załadowanie
   */
  async goto() {
    await super.goto("/boards");
    // Czekaj na pełne załadowanie DOM
    await this.page.waitForLoadState("domcontentloaded");
    // Czekaj aż React zahydratuje i sidebar się wyrenderuje
    await this.sidebar.waitFor({ state: "visible", timeout: 15000 });
  }

  /**
   * Sprawdza czy użytkownik jest zalogowany (sidebar widoczny)
   */
  async isUserLoggedIn(): Promise<boolean> {
    return await this.isVisible(this.sidebar);
  }

  /**
   * Weryfikuje czy użytkownik jest na stronie Boards
   */
  async verifyOnBoardsPage() {
    await expect(this.page).toHaveURL(/\/boards/);
    await expect(this.breadcrumbs).toContainText("Boards");
  }
}

/**
 * Page Object Model dla strony Home (publiczna)
 */
export class HomePage extends BasePage {
  readonly header: Locator;
  readonly mainContent: Locator;

  constructor(page: Page) {
    super(page);
    this.header = page.locator("header");
    this.mainContent = page.locator("main");
  }

  /**
   * Przechodzi do strony głównej
   */
  async goto() {
    await super.goto("/");
  }
}

/**
 * Page Object Model dla strony Create Board
 * Obsługuje formularz tworzenia nowej tablicy
 */
export class CreateBoardPage extends BasePage {
  // Form fields
  readonly titleInput: Locator;
  readonly tagsInput: Locator;
  readonly tagsList: Locator;
  readonly cardCountToggle: Locator;
  readonly cardCount16: Locator;
  readonly cardCount24: Locator;
  readonly addPairButton: Locator;
  readonly submitButton: Locator;

  // Navigation
  readonly navCreateBoard: Locator;

  // Sidebar
  readonly sidebar: Locator;

  constructor(page: Page) {
    super(page);

    // Form inputs
    this.titleInput = this.getByTestId("board-title-input");
    this.tagsInput = this.getByTestId("tags-input");
    this.tagsList = this.getByTestId("tags-list");
    this.cardCountToggle = this.getByTestId("card-count-toggle");
    this.cardCount16 = this.getByTestId("card-count-16");
    this.cardCount24 = this.getByTestId("card-count-24");
    this.addPairButton = this.getByTestId("add-pair-button");
    this.submitButton = this.getByTestId("create-board-submit");

    // Navigation
    this.navCreateBoard = this.getByTestId("nav--boards-create");

    // Sidebar (może przysłaniać formularz)
    this.sidebar = page.locator("aside");
  }

  /**
   * Klika poza sidebar aby go zwinąć (jeśli przysłania formularz)
   */
  async collapseSidebarIfNeeded() {
    const sidebarVisible = await this.sidebar.isVisible().catch(() => false);
    if (sidebarVisible) {
      // Kliknij w main content area aby zwinąć sidebar
      await this.page
        .locator("main, form, body")
        .first()
        .click({ position: { x: 500, y: 200 } })
        .catch(() => {
          /* Ignore click errors - dropdown may already be closed */
        });
      await this.page.waitForTimeout(300); // Czekaj na animację
    }
  }

  /**
   * Przechodzi do strony Create Board
   */
  async goto() {
    await super.goto("/boards/create");
    await this.titleInput.waitFor({ state: "visible", timeout: 15000 });
    // Zwiń sidebar jeśli przysłania formularz
    await this.collapseSidebarIfNeeded();
  }

  /**
   * Przechodzi do strony Create Board przez nawigację (kliknięcie w ikonę + w sidebar)
   */
  async gotoViaNavigation() {
    // Czekaj aż sidebar będzie załadowany (React hydration)
    await this.page.waitForLoadState("domcontentloaded");
    await this.page.waitForTimeout(500); // Dodatkowe czekanie na React hydration

    // Sprawdź czy element jest w DOM
    const navElement = this.navCreateBoard;
    await navElement.waitFor({ state: "attached", timeout: 10000 });

    // Sprawdź czy element jest widoczny (może być ukryty na mobile)
    const isVisible = await navElement.isVisible().catch(() => false);

    if (!isVisible) {
      // Jeśli nie jest widoczny, może być poza viewport - spróbuj zescrollować
      await navElement.scrollIntoViewIfNeeded().catch(() => {
        /* Ignore scroll errors - element may have moved */
      });
    }

    // Kliknij bezpośrednio w link (ikona + jest częścią <a>)
    await navElement.click({ timeout: 10000 });

    // Czekaj na nawigację i załadowanie formularza
    await this.page.waitForURL(/\/boards\/create/, { timeout: 15000 });
    await this.titleInput.waitFor({ state: "visible", timeout: 15000 });
  }

  /**
   * Wypełnia pole tytułu tablicy
   */
  async fillTitle(title: string) {
    await this.titleInput.waitFor({ state: "visible" });
    await this.titleInput.fill(title);
  }

  /**
   * Dodaje tag (wpisuje i naciska Enter)
   */
  async addTag(tag: string) {
    await this.tagsInput.waitFor({ state: "visible" });
    await this.tagsInput.fill(tag);
    await this.tagsInput.press("Enter");
  }

  /**
   * Dodaje wiele tagów
   */
  async addTags(tags: string[]) {
    for (const tag of tags) {
      await this.addTag(tag);
    }
  }

  /**
   * Usuwa tag po nazwie
   */
  async removeTag(tagName: string) {
    const removeButton = this.getByTestId(`remove-tag-${tagName}`);
    await removeButton.scrollIntoViewIfNeeded();
    await removeButton.click({ force: true });
  }

  /**
   * Pobiera liczbę wyświetlanych tagów
   */
  async getTagsCount(): Promise<number> {
    const tags = await this.tagsList.locator('[data-testid^="tag-"]').count();
    return tags;
  }

  /**
   * Wybiera liczbę kart (16 lub 24)
   */
  async selectCardCount(count: 16 | 24) {
    const selector = count === 16 ? this.cardCount16 : this.cardCount24;
    // Scroll do elementu i kliknij (force jeśli sidebar przysłania)
    await selector.scrollIntoViewIfNeeded();
    await selector.click({ force: true });
  }

  /**
   * Pobiera locator dla pola termin na określonym indeksie
   */
  getPairTermInput(index: number): Locator {
    return this.getByTestId(`pair-term-${index}`);
  }

  /**
   * Pobiera locator dla pola definicja na określonym indeksie
   */
  getPairDefinitionInput(index: number): Locator {
    return this.getByTestId(`pair-definition-${index}`);
  }

  /**
   * Pobiera locator dla przycisku usuwania pary na określonym indeksie
   */
  getRemovePairButton(index: number): Locator {
    return this.getByTestId(`remove-pair-${index}`);
  }

  /**
   * Wypełnia parę term-definition na określonym indeksie
   */
  async fillPair(index: number, term: string, definition: string) {
    const termInput = this.getPairTermInput(index);
    const definitionInput = this.getPairDefinitionInput(index);

    await termInput.waitFor({ state: "visible" });
    await termInput.fill(term);

    await definitionInput.waitFor({ state: "visible" });
    await definitionInput.fill(definition);
  }

  /**
   * Dodaje nową pustą parę (klika przycisk + Dodaj parę)
   */
  async addNewPair() {
    await this.addPairButton.scrollIntoViewIfNeeded();
    await this.addPairButton.click({ force: true });
    // Czekaj chwilę na dodanie nowego wiersza do DOM
    await this.page.waitForTimeout(200);
  }

  /**
   * Usuwa parę na określonym indeksie
   */
  async removePair(index: number) {
    const removeButton = this.getRemovePairButton(index);
    await removeButton.scrollIntoViewIfNeeded();
    await removeButton.click({ force: true });
  }

  /**
   * Wypełnia wiele par (automatycznie dodaje brakujące)
   * @param pairs - tablica obiektów {term, definition}
   */
  async fillPairs(pairs: { term: string; definition: string }[]) {
    for (let i = 0; i < pairs.length; i++) {
      // Jeśli to nie pierwsza para, dodaj nowy wiersz
      if (i > 0) {
        await this.addNewPair();
      }
      await this.fillPair(i, pairs[i].term, pairs[i].definition);
    }
  }

  /**
   * Pobiera liczbę par w formularzu
   */
  async getPairsCount(): Promise<number> {
    return await this.page.locator('[data-testid^="pair-row-"]').count();
  }

  /**
   * Wysyła formularz (klika "Utwórz tablicę")
   */
  async submit() {
    await this.submitButton.scrollIntoViewIfNeeded();
    await this.submitButton.click({ force: true });
  }

  /**
   * Pełny proces tworzenia tablicy z podstawowymi danymi
   */
  async createBoard(data: {
    title: string;
    tags?: string[];
    cardCount?: 16 | 24;
    pairs: { term: string; definition: string }[];
  }) {
    await this.fillTitle(data.title);

    if (data.tags && data.tags.length > 0) {
      await this.addTags(data.tags);
    }

    if (data.cardCount) {
      await this.selectCardCount(data.cardCount);
    }

    await this.fillPairs(data.pairs);
    await this.submit();
  }

  /**
   * Weryfikuje czy jesteśmy na stronie Create Board
   */
  async verifyOnCreateBoardPage() {
    await expect(this.page).toHaveURL(/\/boards\/create/);
    await expect(this.titleInput).toBeVisible();
  }

  /**
   * Czeka na przekierowanie po utworzeniu tablicy
   */
  async waitForBoardCreated() {
    await this.waitForNavigation(/\/my-boards/);
  }
}

/**
 * Page Object Model dla strony My Boards
 * Rozszerza BoardsPage o funkcjonalność zarządzania własnymi tablicami
 */
export class MyBoardsPage extends BoardsPage {
  /**
   * Przechodzi do strony My Boards
   */
  async goto() {
    await this.page.goto("/my-boards", { waitUntil: "networkidle" });
    await this.page.waitForLoadState("domcontentloaded");
    await this.sidebar.waitFor({ state: "visible", timeout: 15000 });

    // Czekaj na załadowanie listy tablic z API
    await this.page.waitForLoadState("networkidle", { timeout: 10000 }).catch(() => {
      /* Ignore timeout - page may load differently */
    });
    await this.page.waitForTimeout(1000);
  }

  /**
   * Pobiera kafelek tablicy po ID
   */
  getBoardTile(boardId: string): Locator {
    return this.page.getByTestId(`board-tile-${boardId}`);
  }

  /**
   * Pobiera kafelek tablicy po tytule
   */
  getBoardTileByTitle(title: string): Locator {
    return this.page.locator(`[data-board-title="${title}"]`);
  }

  /**
   * Klika w kafelek tablicy po ID
   * Czeka na załadowanie danych z API
   */
  async clickBoardTile(boardId: string) {
    // Czekaj na zakończenie ładowania
    await this.page.waitForLoadState("networkidle", { timeout: 10000 }).catch(() => {
      /* Ignore timeout - page may load differently */
    });
    await this.page.waitForTimeout(1000);

    const tile = this.getBoardTile(boardId);
    await tile.waitFor({ state: "visible", timeout: 15000 });
    await tile.click();
  }

  /**
   * Klika w kafelek tablicy po tytule
   * Czeka na załadowanie danych z API
   */
  async clickBoardTileByTitle(title: string) {
    // Czekaj na zakończenie ładowania (może być komunikat "Ładowanie...")
    await this.page.waitForLoadState("networkidle", { timeout: 10000 }).catch(() => {
      /* Ignore timeout - page may load differently */
    });

    // Poczekaj chwilę na rendering po fetch
    await this.page.waitForTimeout(1000);

    // Czekaj aż tablica pojawi się w DOM
    const tile = this.getBoardTileByTitle(title);
    await tile.waitFor({ state: "visible", timeout: 15000 });

    // Kliknij w tablicę
    await tile.click();
  }

  /**
   * Pobiera pierwszy kafelek z listy
   * Czeka na załadowanie danych z API
   */
  async clickFirstBoard() {
    // Czekaj na zakończenie ładowania
    await this.page.waitForLoadState("networkidle", { timeout: 10000 }).catch(() => {
      /* Ignore timeout - page may load differently */
    });
    await this.page.waitForTimeout(1000);

    const firstTile = this.page.locator('[data-testid^="board-tile-"]').first();
    await firstTile.waitFor({ state: "visible", timeout: 15000 });
    await firstTile.click();
  }

  /**
   * Pobiera liczbę wyświetlanych tablic
   * Czeka na załadowanie danych z API
   */
  async getBoardsCount(): Promise<number> {
    // Czekaj na załadowanie listy
    await this.page.waitForLoadState("networkidle", { timeout: 10000 }).catch(() => {
      /* Ignore timeout - page may load differently */
    });
    await this.page.waitForTimeout(500);

    return await this.page.locator('[data-testid^="board-tile-"]').count();
  }

  /**
   * Sprawdza czy tablica o podanym tytule istnieje
   * Czeka na załadowanie danych z API
   */
  async isBoardVisible(title: string): Promise<boolean> {
    // Czekaj na załadowanie listy z API
    await this.page.waitForLoadState("networkidle", { timeout: 10000 }).catch(() => {
      /* Ignore timeout - page may load differently */
    });
    await this.page.waitForTimeout(1000);

    const tile = this.getBoardTileByTitle(title);
    return await tile.isVisible({ timeout: 5000 }).catch(() => false);
  }

  /**
   * Weryfikuje czy jesteśmy na stronie My Boards
   */
  async verifyOnMyBoardsPage() {
    await expect(this.page).toHaveURL(/\/my-boards/);
    await expect(this.breadcrumbs).toContainText("My Boards");
  }
}

/**
 * Page Object Model dla strony Board Game (play/edit)
 * Obsługuje grę w memory oraz edycję tablicy
 */
export class BoardGamePage extends BasePage {
  readonly startButton: Locator;
  readonly stopButton: Locator;
  readonly resetButton: Locator;
  readonly timer: Locator;
  readonly boardGrid: Locator;
  readonly cards: Locator;
  readonly sidebar: Locator;

  constructor(page: Page) {
    super(page);

    // Board grid - główny kontener z kartami
    this.boardGrid = page.locator("div.flex.flex-wrap.bg-secondary").first();
    this.cards = page.locator("[data-card]"); // Zakładam że karty mają ten atrybut
    this.sidebar = page.locator("aside");

    // Game controls
    this.startButton = page.getByRole("button", { name: /start/i });
    this.stopButton = page.getByRole("button", { name: /stop/i });
    this.resetButton = page.getByRole("button", { name: /reset/i });
    this.timer = page.locator("text=/\\d+:\\d+/"); // Timer w formacie MM:SS
  }

  /**
   * Przechodzi do strony gry/podglądu tablicy
   */
  async gotoBoard(boardId: string) {
    await super.goto(`/boards/${boardId}`);
    await this.page.waitForLoadState("domcontentloaded");
  }

  /**
   * Pobiera wszystkie karty gry (z właściwymi klasami CSS)
   * Karty mają specyficzne klasy: w-[250px] h-[200px] i są w kontenerze BoardGrid
   */
  getAllCards(): Locator {
    // Karty są buttonami z klasą "w-[250px] h-[200px]" i mają tekst (term lub definition)
    return this.page.locator('button.mb-6.mx-2.bg-white[type="button"]');
  }

  /**
   * Pobiera kartę po indeksie (0-based)
   */
  getCardByIndex(index: number): Locator {
    return this.getAllCards().nth(index);
  }

  /**
   * Znajduje kartę po tekście
   */
  getCardByText(text: string): Locator {
    return this.page.locator(`button.mb-6.mx-2.bg-white[type="button"]:has-text("${text}")`);
  }

  /**
   * Klika w kartę o określonym tekście
   */
  async clickCardByText(text: string) {
    const card = this.getCardByText(text);

    // Sprawdź czy karta istnieje i jest widoczna (może już być dopasowana)
    const isVisible = await card.isVisible().catch(() => false);
    if (!isVisible) {
      // Karta już dopasowana lub nie istnieje
      return;
    }

    await card.click();
    // Czekaj chwilę na animację
    await this.page.waitForTimeout(300);
  }

  /**
   * Klika w kartę po indeksie
   */
  async clickCard(index: number) {
    const card = this.getCardByIndex(index);
    // Sprawdź czy karta istnieje i jest widoczna (może już być dopasowana)
    const isVisible = await card.isVisible().catch(() => false);
    if (!isVisible) {
      // Karta już dopasowana lub nie istnieje
      return;
    }

    await card.click();
    // Czekaj chwilę na animację
    await this.page.waitForTimeout(200);
  }

  /**
   * Pobiera tekst z karty (term lub definition)
   */
  async getCardText(index: number): Promise<string> {
    const card = this.getCardByIndex(index);
    return (await card.textContent()) || "";
  }

  /**
   * Pobiera liczbę kart na planszy
   */
  async getCardsCount(): Promise<number> {
    return await this.getAllCards().count();
  }

  /**
   * Rozpoczyna grę
   */
  async startGame() {
    await this.startButton.waitFor({ state: "visible" });
    await this.startButton.click();
    // Czekaj aż overlay zniknie
    await this.page.waitForTimeout(500);
  }

  /**
   * Zatrzymuje grę
   */
  async stopGame() {
    await this.stopButton.waitFor({ state: "visible" });
    await this.stopButton.click();
  }

  /**
   * Resetuje grę
   */
  async resetGame() {
    await this.resetButton.waitFor({ state: "visible" });
    await this.resetButton.click();
    // Czekaj na zresetowanie stanu
    await this.page.waitForTimeout(500);
  }

  /**
   * Rozwiązuje całą planszę automatycznie
   * Używa znanych par term-definition do dopasowania kart
   * Szuka kart po tekście (nie po indeksie, bo są shufflowane)
   * @param pairs - tablica par {term, definition} używana do stworzenia tablicy
   */
  async solveBoard(pairs: { term: string; definition: string }[]) {
    // Dla każdej pary, znajdź karty po tekście i kliknij
    for (const pair of pairs) {
      // Kliknij w kartę z term (np. "book")
      await this.clickCardByText(pair.term);

      // Kliknij w kartę z definition (np. "reading")
      await this.clickCardByText(pair.definition);

      // Czekaj na animację dopasowania (karty staną się zielone)
      await this.page.waitForTimeout(800);
    }

    // Poczekaj na fanfare lub animację końcową
    await this.page.waitForTimeout(2000);
  }

  /**
   * Sprawdza czy gra została ukończona (wszystkie karty zielone)
   */
  async isGameCompleted(): Promise<boolean> {
    // Poczekaj chwilę na aktualizację stanu
    await this.page.waitForTimeout(500);

    const cardsCount = await this.getCardsCount();
    let successCount = 0;

    for (let i = 0; i < cardsCount; i++) {
      const card = this.getCardByIndex(i);
      const classes = await card.getAttribute("class");
      if (classes?.includes("border-green") || classes?.includes("bg-green")) {
        successCount++;
      }
    }

    return successCount === cardsCount;
  }

  /**
   * Pobiera aktualny czas z timera
   */
  async getTimerValue(): Promise<string> {
    return (await this.timer.textContent()) || "0";
  }

  /**
   * Weryfikuje czy jesteśmy na stronie gry
   */
  async verifyOnBoardGamePage(boardId: string) {
    await expect(this.page).toHaveURL(new RegExp(`/boards/${boardId}`));
  }

  /**
   * Czeka na załadowanie planszy
   */
  async waitForBoardLoaded() {
    // Czekaj na załadowanie danych
    await this.page.waitForLoadState("networkidle", { timeout: 10000 }).catch(() => {
      /* Ignore timeout - page may load differently */
    });

    // Czekaj na pojawienie się głównego kontenera planszy lub komunikatu
    await this.page.waitForSelector("div.flex.flex-wrap.bg-secondary", { timeout: 15000 }).catch(() => {
      /* Ignore timeout - element may not appear */
    });

    // Poczekaj chwilę na pełne renderowanie
    await this.page.waitForTimeout(1000);
  }
}

/**
 * Page Object Model dla strony Edit Board
 * Obsługuje edycję tablicy - tytuł, pary, tagi
 */
export class EditBoardPage extends BasePage {
  readonly pairEditList: Locator;
  readonly addPairButton: Locator;
  readonly addLevelButton: Locator;
  readonly backButton: Locator;
  readonly sidebar: Locator;

  constructor(page: Page) {
    super(page);

    this.pairEditList = this.getByTestId("pair-edit-list");
    this.addPairButton = this.getByTestId("add-pair-button");
    this.addLevelButton = this.getByTestId("add-level-button");
    this.backButton = this.getByTestId("edit-board-back-button");
    this.sidebar = page.locator("aside");
  }

  /**
   * Przechodzi do strony edycji tablicy
   */
  async goto(boardId: string) {
    await super.goto(`/boards/${boardId}/edit`);
    await this.page.waitForLoadState("domcontentloaded");
    await this.pairEditList.waitFor({ state: "visible", timeout: 15000 });
  }

  /**
   * Pobiera liczbę par w liście edycji
   * Czeka na załadowanie listy par
   */
  async getPairsCount(): Promise<number> {
    // Czekaj na pojawienie się przynajmniej jednej pary
    await this.page
      .locator('[data-testid^="pair-edit-row-"]')
      .first()
      .waitFor({ state: "visible", timeout: 10000 })
      .catch(() => {
        /* Ignore timeout - rows may not be present */
      });
    await this.page.waitForTimeout(500);
    return await this.page.locator('[data-testid^="pair-edit-row-"]').count();
  }

  /**
   * Pobiera locator dla wiersza edycji pary po ID pary
   */
  getPairRow(pairId: string): Locator {
    return this.getByTestId(`pair-edit-row-${pairId}`);
  }

  /**
   * Pobiera locator dla przycisku edycji pary po ID
   */
  getEditPairButton(pairId: string): Locator {
    return this.getByTestId(`pair-edit-button-${pairId}`);
  }

  /**
   * Pobiera locator dla przycisku usuwania pary po ID
   */
  getDeletePairButton(pairId: string): Locator {
    return this.getByTestId(`pair-delete-button-${pairId}`);
  }

  /**
   * Pobiera locator dla input term w trybie edycji
   */
  getPairTermInput(pairId: string): Locator {
    return this.getByTestId(`pair-edit-term-${pairId}`);
  }

  /**
   * Pobiera locator dla textarea definition w trybie edycji
   */
  getPairDefinitionInput(pairId: string): Locator {
    return this.getByTestId(`pair-edit-definition-${pairId}`);
  }

  /**
   * Pobiera locator dla przycisku zapisz w trybie edycji
   */
  getSavePairButton(pairId: string): Locator {
    return this.getByTestId(`pair-edit-save-${pairId}`);
  }

  /**
   * Pobiera locator dla przycisku anuluj w trybie edycji
   */
  getCancelPairButton(pairId: string): Locator {
    return this.getByTestId(`pair-edit-cancel-${pairId}`);
  }

  /**
   * Pobiera ID pierwszej pary z listy
   */
  async getFirstPairId(): Promise<string | null> {
    const firstPairRow = this.page.locator('[data-testid^="pair-edit-row-"]').first();
    const testId = await firstPairRow.getAttribute("data-testid");
    return testId ? testId.replace("pair-edit-row-", "") : null;
  }

  /**
   * Klika przycisk edycji dla określonej pary
   */
  async clickEditPair(pairId: string) {
    const editButton = this.getEditPairButton(pairId);
    await editButton.waitFor({ state: "visible" });
    await editButton.click();
  }

  /**
   * Klika przycisk usuwania dla określonej pary
   */
  async clickDeletePair(pairId: string) {
    const deleteButton = this.getDeletePairButton(pairId);
    await deleteButton.waitFor({ state: "visible" });
    await deleteButton.click();
    // Czekaj na usunięcie z DOM
    await this.page.waitForTimeout(500);
  }

  /**
   * Edytuje parę - zmienia term i/lub definition
   */
  async editPair(pairId: string, newTerm?: string, newDefinition?: string) {
    // Kliknij edycję
    await this.clickEditPair(pairId);

    // Zmień term jeśli podano
    if (newTerm !== undefined) {
      const termInput = this.getPairTermInput(pairId);
      await termInput.waitFor({ state: "visible" });
      await termInput.fill(newTerm);
    }

    // Zmień definition jeśli podano
    if (newDefinition !== undefined) {
      const defInput = this.getPairDefinitionInput(pairId);
      await defInput.waitFor({ state: "visible" });
      await defInput.fill(newDefinition);
    }

    // Zapisz
    const saveButton = this.getSavePairButton(pairId);
    await saveButton.click();

    // Czekaj na zakończenie zapisu
    await this.page.waitForTimeout(1000);
  }

  /**
   * Pobiera input term dla nowego draft pair (przy dodawaniu pary)
   */
  getAddPairTermInput(index: number): Locator {
    return this.getByTestId(`add-pair-term-${index}`);
  }

  /**
   * Pobiera input definition dla nowego draft pair
   */
  getAddPairDefinitionInput(index: number): Locator {
    return this.getByTestId(`add-pair-definition-${index}`);
  }

  /**
   * Pobiera przycisk zapisz dla nowego draft pair
   */
  getAddPairSaveButton(index: number): Locator {
    return this.getByTestId(`add-pair-save-${index}`);
  }

  /**
   * Dodaje nową parę
   */
  async addNewPair(term: string, definition: string) {
    // Kliknij przycisk dodawania pary
    await this.addPairButton.scrollIntoViewIfNeeded();
    await this.addPairButton.click();
    await this.page.waitForTimeout(300);

    // Wypełnij pola (zawsze index 0 bo dodajemy jedną naraz)
    const termInput = this.getAddPairTermInput(0);
    const defInput = this.getAddPairDefinitionInput(0);
    const saveButton = this.getAddPairSaveButton(0);

    await termInput.waitFor({ state: "visible" });
    await termInput.fill(term);
    await defInput.fill(definition);

    // Zapisz
    await saveButton.click();

    // Czekaj na zapisanie
    await this.page.waitForTimeout(1000);
  }

  /**
   * Klika przycisk "Dodaj level"
   */
  async clickAddLevel() {
    await this.addLevelButton.scrollIntoViewIfNeeded();
    await this.addLevelButton.click();
  }

  /**
   * Weryfikuje czy jesteśmy na stronie edycji
   */
  async verifyOnEditBoardPage(boardId: string) {
    await expect(this.page).toHaveURL(new RegExp(`/boards/${boardId}/edit`));
  }

  /**
   * High-level metoda: Wykonuje pełną edycję tablicy
   * @param operations - obiekt z operacjami do wykonania
   */
  async editBoard(operations: {
    deletePairAtIndex?: number;
    editFirstPair?: { term?: string; definition?: string };
    addNewPairs?: { term: string; definition: string }[];
  }) {
    // Usuń parę jeśli podano
    if (operations.deletePairAtIndex !== undefined) {
      const pairRow = this.page.locator('[data-testid^="pair-edit-row-"]').nth(operations.deletePairAtIndex);
      const pairTestId = await pairRow.getAttribute("data-testid");
      const pairId = pairTestId?.replace("pair-edit-row-", "") || "";

      if (pairId) {
        await this.clickDeletePair(pairId);
      }
    }

    // Edytuj pierwszą parę jeśli podano
    if (operations.editFirstPair) {
      const firstPairId = await this.getFirstPairId();
      if (firstPairId) {
        await this.editPair(firstPairId, operations.editFirstPair.term, operations.editFirstPair.definition);
      }
    }

    // Dodaj nowe pary jeśli podano
    if (operations.addNewPairs) {
      for (const pair of operations.addNewPairs) {
        await this.addNewPair(pair.term, pair.definition);
      }
    }
  }
}

/**
 * Page Object Model dla strony Add Level
 * Obsługuje dodawanie nowego poziomu do istniejącej tablicy
 */
export class AddLevelPage extends BasePage {
  readonly addPairButton: Locator;
  readonly saveLevelButton: Locator;
  readonly saveAndContinueButton: Locator;
  readonly sidebar: Locator;

  constructor(page: Page) {
    super(page);

    this.addPairButton = this.getByTestId("add-pair-button");
    this.saveLevelButton = this.getByTestId("save-level-button");
    this.saveAndContinueButton = this.getByTestId("save-and-continue-level-button");
    this.sidebar = page.locator("aside");
  }

  /**
   * Przechodzi do strony dodawania poziomu
   */
  async goto(boardId: string) {
    await super.goto(`/boards/${boardId}/add-level`);
    await this.page.waitForLoadState("domcontentloaded");
    // Czekaj na załadowanie formularza
    await this.page.waitForTimeout(1000);
  }

  /**
   * Pobiera locator dla input term na określonym indeksie
   */
  getPairTermInput(index: number): Locator {
    return this.getByTestId(`pair-term-${index}`);
  }

  /**
   * Pobiera locator dla input definition na określonym indeksie
   */
  getPairDefinitionInput(index: number): Locator {
    return this.getByTestId(`pair-definition-${index}`);
  }

  /**
   * Pobiera locator dla przycisku usuwania pary
   */
  getRemovePairButton(index: number): Locator {
    return this.getByTestId(`remove-pair-${index}`);
  }

  /**
   * Wypełnia parę na określonym indeksie
   */
  async fillPair(index: number, term: string, definition: string) {
    const termInput = this.getPairTermInput(index);
    const defInput = this.getPairDefinitionInput(index);

    await termInput.waitFor({ state: "visible" });
    await termInput.fill(term);
    await defInput.fill(definition);
  }

  /**
   * Dodaje nową pustą parę (klika przycisk + Dodaj parę)
   */
  async addNewPair() {
    await this.addPairButton.scrollIntoViewIfNeeded();
    await this.addPairButton.click();
    await this.page.waitForTimeout(200);
  }

  /**
   * Wypełnia wiele par (automatycznie dodaje brakujące)
   * Uwaga: AddLevelForm domyślnie ma jedną pustą parę (index 0)
   */
  async fillPairs(pairs: { term: string; definition: string }[]) {
    for (let i = 0; i < pairs.length; i++) {
      // Jeśli to nie pierwsza para, sprawdź czy musimy dodać nowy wiersz
      if (i > 0) {
        // Czekaj chwilę na re-render po wypełnieniu poprzedniej pary
        await this.page.waitForTimeout(300);

        // Sprawdź czy para o tym indeksie już istnieje
        const pairExists = await this.getPairTermInput(i)
          .count()
          .then((c) => c > 0);

        if (!pairExists) {
          // Para nie istnieje - musimy ją dodać
          const addButtonExists = await this.addPairButton.isVisible().catch(() => false);
          if (addButtonExists) {
            await this.addNewPair();
          } else {
            // Brak przycisku - osiągnęliśmy limit par
            throw new Error(`Cannot add more pairs. Limit reached at ${i} pairs. Button not visible.`);
          }
        }
      }

      // Wypełnij parę
      await this.fillPair(i, pairs[i].term, pairs[i].definition);
    }
  }

  /**
   * Pobiera liczbę par w formularzu
   */
  async getPairsCount(): Promise<number> {
    return await this.page.locator('[data-testid^="pair-row-"]').count();
  }

  /**
   * Zapisuje level (przycisk "Zapisz")
   */
  async saveLevel() {
    await this.saveLevelButton.scrollIntoViewIfNeeded();
    await this.saveLevelButton.click();
  }

  /**
   * Zapisuje level i kontynuuje (przycisk "Zapisz i utwórz kolejny level")
   */
  async saveAndContinueLevel() {
    await this.saveAndContinueButton.scrollIntoViewIfNeeded();
    await this.saveAndContinueButton.click();
  }

  /**
   * Weryfikuje czy jesteśmy na stronie dodawania poziomu
   */
  async verifyOnAddLevelPage(boardId: string) {
    await expect(this.page).toHaveURL(new RegExp(`/boards/${boardId}/add-level`));
  }

  /**
   * High-level metoda: Tworzy level z podanymi parami i zapisuje
   * @param pairs - tablica par do dodania
   * @param saveAndContinue - czy użyć przycisku "Zapisz i kontynuuj" zamiast "Zapisz"
   */
  async createLevel(pairs: { term: string; definition: string }[], saveAndContinue = false) {
    await this.fillPairs(pairs);

    if (saveAndContinue) {
      await this.saveAndContinueLevel();
    } else {
      await this.saveLevel();
    }
  }
}
