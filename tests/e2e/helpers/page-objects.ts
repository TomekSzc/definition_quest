import { Page, Locator, expect } from "@playwright/test";

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
