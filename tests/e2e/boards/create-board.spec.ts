import { test, expect } from "@playwright/test";
import { TestHelpers, CreateBoardPage, MyBoardsPage, BoardGamePage } from "../helpers/page-objects";

/**
 * Test suite dla scenariusza tworzenia tablicy
 * Używa Page Object Model dla maintainable tests
 */
test.describe("Create Board Flow", () => {
  // Ustaw viewport na desktop (sidebar jest zawsze widoczny)
  test.use({
    viewport: { width: 1280, height: 720 },
  });
  /**
   * Test przypadek: Użytkownik tworzy tablicę ręcznie i przechodzi do niej
   * 
   * Scenariusz:
   * 1. Zaloguj się i przejdź na stronę create board
   * 2. Wypełnij formularz:
   *    - Tytuł: Testowy tytuł 1
   *    - Tagi: test, e2e
   *    - Liczba kart: 16
   *    - Pary: 8 par (rower=pojazd, koszula=ubranie, etc.)
   * 3. Utwórz tablicę i przejdź do nowo utworzonej tablicy
   */
  test("should create board manually and navigate to it", async ({ page }) => {
    // ARRANGE - Zaloguj się i przejdź do Create Board
    const createBoardPage = await TestHelpers.loginAndGoToCreateBoard(page);

    // ACT - Wypełnij formularz
    const boardData = {
      title: "Testowy tytuł 1",
      tags: ["test", "e2e"],
      cardCount: 16 as const,
      pairs: [
        { term: "rower", definition: "pojazd" },
        { term: "koszula", definition: "ubranie" },
        { term: "glan", definition: "but" },
        { term: "kiwi", definition: "owoc" },
        { term: "marchew", definition: "warzywo" },
        { term: "kania", definition: "grzyb" },
        { term: "fasola", definition: "strąk" },
        { term: "wino", definition: "alkohol" },
      ],
    };

    await createBoardPage.createBoard(boardData);

    // ASSERT - Sprawdź czy nastąpiło przekierowanie do My Boards
    await expect(page).toHaveURL(/\/my-boards/, { timeout: 15000 });

    // Przejdź do nowo utworzonej tablicy
    const myBoardsPage = new MyBoardsPage(page);
    
    // Zweryfikuj czy tablica jest widoczna
    const isBoardVisible = await myBoardsPage.isBoardVisible(boardData.title);
    expect(isBoardVisible).toBeTruthy();

    // Kliknij w nowo utworzoną tablicę
    await myBoardsPage.clickBoardTileByTitle(boardData.title);

    // ASSERT - Sprawdź czy jesteśmy na stronie gry
    await expect(page).toHaveURL(/\/boards\/[a-z0-9-]+$/, { timeout: 10000 });
  });

  /**
   * Test: Tworzenie tablicy z minimalną liczbą par
   */
  test("should create board with minimum required pairs", async ({ page }) => {
    const createBoardPage = await TestHelpers.loginAndGoToCreateBoard(page);

    await createBoardPage.fillTitle("Minimalna tablica");
    await createBoardPage.selectCardCount(16);

    // Wypełnij tylko pierwszą parę (która już istnieje w formularzu)
    await createBoardPage.fillPair(0, "test", "definition");

    await createBoardPage.submit();

    // Sprawdź przekierowanie
    await expect(page).toHaveURL(/\/my-boards/, { timeout: 15000 });
  });

  /**
   * Test: Dodawanie i usuwanie par
   */
  test("should add and remove pairs dynamically", async ({ page }) => {
    const createBoardPage = await TestHelpers.loginAndGoToCreateBoard(page);

    await createBoardPage.fillTitle("Test dynamicznych par");

    // Dodaj 3 pary
    await createBoardPage.addNewPair();
    await createBoardPage.addNewPair();
    await createBoardPage.addNewPair();

    // Sprawdź liczbę par (1 domyślna + 3 dodane = 4)
    let pairsCount = await createBoardPage.getPairsCount();
    expect(pairsCount).toBe(4);

    // Usuń drugą parę
    await createBoardPage.removePair(1);

    // Sprawdź czy została usunięta
    pairsCount = await createBoardPage.getPairsCount();
    expect(pairsCount).toBe(3);
  });

  /**
   * Test: Dodawanie i usuwanie tagów
   */
  test("should add and remove tags", async ({ page }) => {
    const createBoardPage = await TestHelpers.loginAndGoToCreateBoard(page);

    await createBoardPage.fillTitle("Test tagów");

    // Dodaj tagi
    await createBoardPage.addTag("javascript");
    await createBoardPage.addTag("typescript");
    await createBoardPage.addTag("react");

    // Sprawdź liczbę tagów
    let tagsCount = await createBoardPage.getTagsCount();
    expect(tagsCount).toBe(3);

    // Usuń jeden tag
    await createBoardPage.removeTag("typescript");

    // Sprawdź czy został usunięty
    tagsCount = await createBoardPage.getTagsCount();
    expect(tagsCount).toBe(2);
  });

  /**
   * Test: Wybór liczby kart
   */
  test("should select card count", async ({ page }) => {
    const createBoardPage = await TestHelpers.loginAndGoToCreateBoard(page);

    await createBoardPage.fillTitle("Test liczby kart");

    // Wybierz 24 karty
    await createBoardPage.selectCardCount(24);

    // Sprawdź czy przycisk 24 jest aktywny (data-state="on")
    await expect(createBoardPage.cardCount24).toHaveAttribute("data-state", "on");

    // Zmień na 16 kart
    await createBoardPage.selectCardCount(16);

    // Sprawdź czy przycisk 16 jest aktywny
    await expect(createBoardPage.cardCount16).toHaveAttribute("data-state", "on");
  });

  /**
   * Test: Walidacja formularza - pusty tytuł
   */
  test("should not submit with empty title", async ({ page }) => {
    const createBoardPage = await TestHelpers.loginAndGoToCreateBoard(page);

    // Wypełnij tylko parę, bez tytułu
    await createBoardPage.fillPair(0, "test", "definition");
    await createBoardPage.submit();

    // Powinniśmy zostać na tej samej stronie
    await expect(page).toHaveURL(/\/boards\/create/);
  });

  /**
   * Test: Wypełnianie formularza krok po kroku
   */
  test("should fill form step by step with validations", async ({ page }) => {
    const createBoardPage = await TestHelpers.loginAndGoToCreateBoard(page);

    // Krok 1: Tytuł
    await createBoardPage.fillTitle("Testowa tablica krok po kroku");
    await expect(createBoardPage.titleInput).toHaveValue("Testowa tablica krok po kroku");

    // Krok 2: Tagi
    await createBoardPage.addTags(["krok1", "krok2"]);
    const tagsCount = await createBoardPage.getTagsCount();
    expect(tagsCount).toBe(2);

    // Krok 3: Liczba kart
    await createBoardPage.selectCardCount(16);
    await expect(createBoardPage.cardCount16).toHaveAttribute("data-state", "on");

    // Krok 4: Pary
    const pairs = [
      { term: "pierwszy", definition: "first" },
      { term: "drugi", definition: "second" },
      { term: "trzeci", definition: "third" },
    ];
    await createBoardPage.fillPairs(pairs);

    // Weryfikuj czy pary zostały wypełnione
    await expect(createBoardPage.getPairTermInput(0)).toHaveValue("pierwszy");
    await expect(createBoardPage.getPairDefinitionInput(0)).toHaveValue("first");
    await expect(createBoardPage.getPairTermInput(2)).toHaveValue("trzeci");

    // Krok 5: Submit
    await createBoardPage.submit();

    // Weryfikuj przekierowanie
    await expect(page).toHaveURL(/\/my-boards/, { timeout: 15000 });
  });
});

/**
 * Test suite dla integracji Create Board -> My Boards -> Board Game
 */
test.describe("Complete Board Workflow", () => {
  // Ustaw viewport na desktop
  test.use({
    viewport: { width: 1280, height: 720 },
  });
  test("should create board and play it", async ({ page }) => {
    // 1. Utwórz tablicę
    const createBoardPage = await TestHelpers.loginAndGoToCreateBoard(page);

    const boardTitle = `E2E Test Board ${Date.now()}`;
    await createBoardPage.createBoard({
      title: boardTitle,
      tags: ["e2e", "automated"],
      cardCount: 16,
      pairs: [
        { term: "apple", definition: "fruit" },
        { term: "car", definition: "vehicle" },
        { term: "book", definition: "reading" },
        { term: "water", definition: "drink" },
      ],
    });

    // 2. Poczekaj na przekierowanie do My Boards
    await expect(page).toHaveURL(/\/my-boards/, { timeout: 15000 });

    // 3. Znajdź i kliknij w nowo utworzoną tablicę
    const myBoardsPage = new MyBoardsPage(page);
    await myBoardsPage.clickBoardTileByTitle(boardTitle);

    // 4. Sprawdź czy jesteśmy na stronie gry
    await expect(page).toHaveURL(/\/boards\/[a-z0-9-]+$/, { timeout: 10000 });

    // 5. Zweryfikuj czy plansza się załadowała
    const boardGamePage = new BoardGamePage(page);
    await boardGamePage.waitForBoardLoaded();
  });
});

