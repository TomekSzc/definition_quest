import { test, expect } from "@playwright/test";
import { 
  TestHelpers, 
  CreateBoardPage, 
  MyBoardsPage, 
  EditBoardPage, 
  AddLevelPage 
} from "../helpers/page-objects";

/**
 * Test suite dla scenariusza edycji tablicy i dodawania poziomu
 * Scenariusz:
 * 1. Zaloguj się i przejdź na stronę My Boards
 * 2. Jeżeli na liście jest board kliknij edit pierwszej tablicy, 
 *    jeżeli nie ma to utwórz nową tablicę
 * 3. Na stronie edycji:
 *    - Usuń parę
 *    - Edytuj pierwszą parę (dodaj "edit" na końcu definition)
 *    - Dodaj nową parę "plane - flying"
 * 4. Przejdź do kolejnego widoku klikając przycisk "utwórz level"
 * 5. Na stronie utwórz level dodaj pary:
 *    - butter - food
 *    - banana - fruit
 *    - carrot - vegetable
 *    Następnie zapisz level
 */
test.describe("Edit Board and Add Level Flow", () => {
  // Ustaw viewport na desktop
  test.use({
    viewport: { width: 1280, height: 720 },
  });

  /**
   * Test przypadek: Edycja tablicy i dodanie poziomu
   * 
   * Scenariusz:
   * 1. Zaloguj się i utwórz nową tablicę
   * 2. Przejdź do edycji z My Boards
   * 3. Usuń drugą parę, edytuj pierwszą (dodaj "edit" do definition), dodaj nową parę "plane - flying"
   * 4. Przejdź do Add Level
   * 5. Dodaj pary: butter-food, banana-fruit, carrot-vegetable i zapisz
   */
  test("should edit existing board and add level", async ({ page }) => {
    test.setTimeout(120000); // 2 minuty timeout

    // ARRANGE - Utwórz nową tablicę do edycji
    const createBoardPage = await TestHelpers.loginAndGoToCreateBoard(page);

    const boardData = {
      title: `E2E Edit Test ${Date.now()}`,
      tags: ["e2e", "edit-test"],
      cardCount: 16 as const,
      pairs: [
        { term: "apple", definition: "fruit" },
        { term: "car", definition: "vehicle" },
        { term: "book", definition: "reading" },
        { term: "water", definition: "drink" },
      ],
    };

    await createBoardPage.createBoard(boardData);
    await expect(page).toHaveURL(/\/my-boards/, { timeout: 15000 });

    // Znajdź nowo utworzoną tablicę i kliknij Edit
    const myBoardsPage = new MyBoardsPage(page);
    const tile = myBoardsPage.getBoardTileByTitle(boardData.title);
    await tile.waitFor({ state: "visible", timeout: 15000 });
    
    const href = await tile.getAttribute("href");
    const boardIdToEdit = href?.split("/").pop() || "";
    expect(boardIdToEdit).toBeTruthy();

    const editButton = page.getByTestId(`edit-board-${boardIdToEdit}`);
    await editButton.click();

    // ACT - Edytuj tablicę
    const editBoardPage = new EditBoardPage(page);
    await editBoardPage.verifyOnEditBoardPage(boardIdToEdit);

    // Pobierz początkową liczbę par
    const initialPairsCount = await editBoardPage.getPairsCount();
    expect(initialPairsCount).toBeGreaterThan(1);

    // Pobierz aktualną definition pierwszej pary
    const firstPairId = await editBoardPage.getFirstPairId();
    expect(firstPairId).toBeTruthy();
    
    const firstPairDefLocator = page.getByTestId(`pair-definition-${firstPairId}`);
    const currentDefinition = await firstPairDefLocator.textContent();

    // Wykonaj operacje edycji
    await editBoardPage.editBoard({
      deletePairAtIndex: 1, // Usuń drugą parę
      editFirstPair: { definition: `${currentDefinition}edit` }, // Dodaj "edit" do definition
      addNewPairs: [{ term: "plane", definition: "flying" }],
    });

    // ASSERT - Weryfikuj zmiany
    const newPairsCount = await editBoardPage.getPairsCount();
    expect(newPairsCount).toBe(initialPairsCount); // -1 usunięta +1 dodana = bez zmian

    const updatedDefinition = await firstPairDefLocator.textContent();
    expect(updatedDefinition).toContain("edit");

    // ACT - Przejdź do Add Level i utwórz level
    await editBoardPage.clickAddLevel();

    const addLevelPage = new AddLevelPage(page);
    await addLevelPage.verifyOnAddLevelPage(boardIdToEdit);

    // AddLevel wymaga dokładnie cardCount/2 par (dla cardCount=16 to 8 par)
    const levelData = [
      { term: "butter", definition: "food" },
      { term: "banana", definition: "fruit" },
      { term: "carrot", definition: "vegetable" },
      { term: "milk", definition: "drink" },
      { term: "cheese", definition: "dairy" },
      { term: "bread", definition: "bakery" },
      { term: "chicken", definition: "meat" },
      { term: "rice", definition: "grain" },
    ];

    await addLevelPage.createLevel(levelData);

    // ASSERT - Sprawdź przekierowanie
    await expect(page).toHaveURL(/\/boards$/, { timeout: 15000 });
  });

  /**
   * Test przypadek: Tworzenie tablicy, edycja i dodanie poziomu
   * 
   * Scenariusz:
   * 1. Utwórz nową tablicę
   * 2. Przejdź do edycji z My Boards
   * 3. Wykonaj operacje edycji (usuń parę, edytuj pierwszą, dodaj nową)
   * 4. Dodaj nowy level
   */
  test("should create board, go to edit, modify and add level", async ({ page }) => {
    test.setTimeout(120000);

    // ARRANGE - Utwórz nową tablicę
    const createBoardPage = await TestHelpers.loginAndGoToCreateBoard(page);

    const boardData = {
      title: `E2E Edit Flow ${Date.now()}`,
      tags: ["e2e"],
      cardCount: 16 as const,
      pairs: [
        { term: "dog", definition: "animal" },
        { term: "pizza", definition: "food" },
        { term: "house", definition: "building" },
        { term: "rain", definition: "weather" },
      ],
    };

    await createBoardPage.createBoard(boardData);
    await expect(page).toHaveURL(/\/my-boards/, { timeout: 15000 });

    // Znajdź nowo utworzoną tablicę
    const myBoardsPage = new MyBoardsPage(page);
    const tile = myBoardsPage.getBoardTileByTitle(boardData.title);
    await tile.waitFor({ state: "visible", timeout: 15000 });
    
    const href = await tile.getAttribute("href");
    const boardId = href?.split("/").pop() || "";
    expect(boardId).toBeTruthy();

    // Kliknij Edit
    const editButton = page.getByTestId(`edit-board-${boardId}`);
    await editButton.click();

    // ACT - Edytuj tablicę
    const editBoardPage = new EditBoardPage(page);
    await editBoardPage.verifyOnEditBoardPage(boardId);

    const firstPairId = await editBoardPage.getFirstPairId();
    const firstPairDefLocator = page.getByTestId(`pair-definition-${firstPairId}`);
    const currentDefinition = await firstPairDefLocator.textContent();

    await editBoardPage.editBoard({
      deletePairAtIndex: 1,
      editFirstPair: { definition: `${currentDefinition}edit` },
      addNewPairs: [{ term: "plane", definition: "flying" }],
    });

    // ACT - Utwórz nowy level
    await editBoardPage.clickAddLevel();

    const addLevelPage = new AddLevelPage(page);
    await addLevelPage.verifyOnAddLevelPage(boardId);

    // AddLevel wymaga dokładnie cardCount/2 par (dla cardCount=16 to 8 par)
    await addLevelPage.createLevel([
      { term: "butter", definition: "food" },
      { term: "banana", definition: "fruit" },
      { term: "carrot", definition: "vegetable" },
      { term: "milk", definition: "drink" },
      { term: "cheese", definition: "dairy" },
      { term: "bread", definition: "bakery" },
      { term: "chicken", definition: "meat" },
      { term: "rice", definition: "grain" },
    ]);

    // ASSERT - Przekierowanie do Boards
    await expect(page).toHaveURL(/\/boards$/, { timeout: 15000 });
  });

  /**
   * Test przypadek: Edycja wielu par i dodanie większej liczby par
   */
  test("should edit multiple pairs and add multiple new pairs", async ({ page }) => {
    test.setTimeout(120000);

    // ARRANGE - Utwórz tablicę z wieloma parami
    const createBoardPage = await TestHelpers.loginAndGoToCreateBoard(page);

    const boardData = {
      title: `E2E Multi Edit ${Date.now()}`,
      tags: ["multi-edit"],
      cardCount: 16 as const,
      pairs: [
        { term: "cat", definition: "pet" },
        { term: "tree", definition: "plant" },
        { term: "bike", definition: "transport" },
        { term: "phone", definition: "device" },
        { term: "chair", definition: "furniture" },
      ],
    };

    await createBoardPage.createBoard(boardData);
    await expect(page).toHaveURL(/\/my-boards/, { timeout: 15000 });

    // Przejdź do edycji
    const myBoardsPage = new MyBoardsPage(page);
    const tile = myBoardsPage.getBoardTileByTitle(boardData.title);
    await tile.waitFor({ state: "visible", timeout: 15000 });
    
    const href = await tile.getAttribute("href");
    const boardId = href?.split("/").pop() || "";

    const editButton = page.getByTestId(`edit-board-${boardId}`);
    await editButton.click();

    // ACT - Edytuj wiele par
    const editBoardPage = new EditBoardPage(page);
    await editBoardPage.verifyOnEditBoardPage(boardId);

    // Edytuj pierwszą i drugą parę ręcznie (pokazuje elastyczność API)
    const firstPairId = await editBoardPage.getFirstPairId();
    if (firstPairId) {
      await editBoardPage.editPair(firstPairId, "edited-cat", "edited-pet");
    }

    const secondPairRow = page.locator('[data-testid^="pair-edit-row-"]').nth(1);
    const secondPairTestId = await secondPairRow.getAttribute("data-testid");
    const secondPairId = secondPairTestId?.replace("pair-edit-row-", "") || "";
    if (secondPairId) {
      await editBoardPage.editPair(secondPairId, undefined, "edited-plant");
    }

    // Dodaj nowe pary używając metody high-level
    await editBoardPage.editBoard({
      addNewPairs: [
        { term: "sun", definition: "star" },
        { term: "moon", definition: "satellite" },
      ],
    });

    // ACT - Dodaj level z wieloma parami
    await editBoardPage.clickAddLevel();

    const addLevelPage = new AddLevelPage(page);
    await addLevelPage.verifyOnAddLevelPage(boardId);

    // AddLevel wymaga dokładnie cardCount/2 par (dla cardCount=16 to 8 par)
    await addLevelPage.createLevel([
      { term: "coffee", definition: "drink" },
      { term: "tea", definition: "beverage" },
      { term: "bread", definition: "food" },
      { term: "shirt", definition: "clothing" },
      { term: "pen", definition: "tool" },
      { term: "lamp", definition: "light" },
      { term: "table", definition: "furniture" },
      { term: "window", definition: "opening" },
    ]);

    // ASSERT - Przekierowanie do Boards
    await expect(page).toHaveURL(/\/boards$/, { timeout: 15000 });
  });

  /**
   * Test przypadek: Anulowanie edycji pary
   * 
   * Scenariusz:
   * 1. Utwórz prostą tablicę
   * 2. Przejdź do edycji
   * 3. Rozpocznij edycję pary i zmień wartości
   * 4. Anuluj edycję
   * 5. Weryfikuj że oryginalne wartości zostały zachowane
   */
  test("should cancel pair editing", async ({ page }) => {
    test.setTimeout(90000);

    // ARRANGE - Utwórz prostą tablicę
    const createBoardPage = await TestHelpers.loginAndGoToCreateBoard(page);

    const boardData = {
      title: `E2E Cancel Edit ${Date.now()}`,
      tags: ["cancel"],
      cardCount: 16 as const,
      pairs: [
        { term: "original", definition: "original-def" },
        { term: "keep", definition: "keep-def" },
      ],
    };

    await createBoardPage.createBoard(boardData);
    await expect(page).toHaveURL(/\/my-boards/, { timeout: 15000 });

    // Przejdź do edycji
    const myBoardsPage = new MyBoardsPage(page);
    const tile = myBoardsPage.getBoardTileByTitle(boardData.title);
    await tile.waitFor({ state: "visible", timeout: 15000 });
    
    const href = await tile.getAttribute("href");
    const boardId = href?.split("/").pop() || "";

    const editButton = page.getByTestId(`edit-board-${boardId}`);
    await editButton.click();

    const editBoardPage = new EditBoardPage(page);
    await editBoardPage.verifyOnEditBoardPage(boardId);

    // ACT - Rozpocznij edycję i anuluj
    const firstPairId = await editBoardPage.getFirstPairId();
    expect(firstPairId).toBeTruthy();

    if (firstPairId) {
      // Kliknij edycję
      await editBoardPage.clickEditPair(firstPairId);

      // Zmień wartości
      const termInput = editBoardPage.getPairTermInput(firstPairId);
      const defInput = editBoardPage.getPairDefinitionInput(firstPairId);
      await termInput.fill("changed");
      await defInput.fill("changed-def");

      // Anuluj edycję
      const cancelButton = editBoardPage.getCancelPairButton(firstPairId);
      await cancelButton.click();

      // ASSERT - Weryfikuj że wartości nie zostały zmienione
      await page.waitForTimeout(500);
      const termLocator = page.getByTestId(`pair-term-${firstPairId}`);
      const defLocator = page.getByTestId(`pair-definition-${firstPairId}`);
      
      const termText = await termLocator.textContent();
      const defText = await defLocator.textContent();
      
      expect(termText).toBe("original");
      expect(defText).toBe("original-def");
    }
  });
});

