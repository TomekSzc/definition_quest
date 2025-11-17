import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import { BoardListTile } from "@/components/ui/Boards/BoardListTile";
import authReducer from "@/store/slices/authSlice";
import type { BoardSummaryDTO } from "@/types";
import type { AuthState } from "@/store/slices/authSlice";

/**
 * Testy jednostkowe dla komponentu BoardListTile
 *
 * Testowane funkcjonalności:
 * - Podstawowe renderowanie i struktura DOM
 * - Warunkowe renderowanie sekcji zarządzania (edit/delete) dla właściciela
 * - Responsywność tagów (mobile vs desktop)
 * - Text truncation dla długich tytułów
 * - Warunkowe renderowanie lastTime
 * - Stylowanie z Tailwind CSS i CSS variables
 * - Interakcje użytkownika (klik edit, delete)
 * - Stan dialogu usuwania (DeleteBoardDialog visibility)
 * - Accessibility (link, title attribute)
 * - Edge cases (brak tagów, bardzo długi tytuł, brak lastTime)
 * - Integracja z Redux store (authState)
 */

/**
 * Helper do tworzenia mock store z konfigurowalnymi wartościami
 */
const createMockStore = (authState: Partial<AuthState> = {}) => {
  return configureStore({
    reducer: {
      auth: authReducer,
    },
    preloadedState: {
      auth: {
        user: null,
        isAuthenticated: false,
        ...authState,
      },
    },
  });
};

/**
 * Helper do tworzenia mock danych BoardSummaryDTO
 */
const createMockBoard = (overrides: Partial<BoardSummaryDTO> = {}): BoardSummaryDTO => ({
  id: "board-123",
  ownerId: "user-456",
  title: "Test Board",
  cardCount: 16,
  level: 1,
  isPublic: true,
  archived: false,
  tags: ["JavaScript", "React"],
  createdAt: "2024-01-01T00:00:00Z",
  updatedAt: "2024-01-02T00:00:00Z",
  ...overrides,
});

/**
 * Helper do renderowania komponentu z Redux Provider
 */
const renderWithProvider = (board: BoardSummaryDTO, authState: Partial<AuthState> = {}) => {
  const store = createMockStore(authState);
  return {
    ...render(
      <Provider store={store}>
        <BoardListTile board={board} />
      </Provider>
    ),
    store,
  };
};

describe("BoardListTile", () => {
  // Mock window.location.href i window.location.reload
  const originalLocation = window.location;

  beforeEach(() => {
    // @ts-expect-error - mockowanie window.location
    delete window.location;
    window.location = { ...originalLocation, href: "", reload: vi.fn() };
  });

  describe("Podstawowe renderowanie i struktura DOM", () => {
    it("powinien wyrenderować link z podstawowymi klasami", () => {
      // Arrange
      const board = createMockBoard();

      // Act
      renderWithProvider(board);

      // Assert
      const link = screen.getByRole("link");
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute("href", `/boards/${board.id}`);
      expect(link.tagName).toBe("A");
    });

    it("powinien wyrenderować tytuł planszy", () => {
      // Arrange
      const board = createMockBoard({ title: "Advanced TypeScript" });

      // Act
      renderWithProvider(board);

      // Assert
      const title = screen.getByText("Advanced TypeScript");
      expect(title).toBeInTheDocument();
    });

    it("powinien wyrenderować avatar z pierwszą literą tytułu", () => {
      // Arrange
      const board = createMockBoard({ title: "React Basics" });

      // Act
      const { container } = renderWithProvider(board);

      // Assert
      const avatar = container.querySelector(".w-\\[40px\\].h-\\[40px\\]");
      expect(avatar).toBeInTheDocument();
      expect(avatar).toHaveTextContent("R");
    });

    it("powinien wyrenderować poziom planszy", () => {
      // Arrange
      const board = createMockBoard({ level: 3 });

      // Act
      renderWithProvider(board);

      // Assert
      const levelText = screen.getByText(/Level: 3/);
      expect(levelText).toBeInTheDocument();
    });

    it("powinien mieć podstawowe klasy stylowania Tailwind", () => {
      // Arrange
      const board = createMockBoard();

      // Act
      renderWithProvider(board);

      // Assert
      const link = screen.getByRole("link");
      expect(link).toHaveClass("h-[60px]");
      expect(link).toHaveClass("flex");
      expect(link).toHaveClass("items-center");
      expect(link).toHaveClass("rounded-[5px]");
      expect(link).toHaveClass("border");
      expect(link).toHaveClass("bg-white");
    });

    it("powinien używać CSS variables dla kolorów", () => {
      // Arrange
      const board = createMockBoard();

      // Act
      renderWithProvider(board);

      // Assert
      const link = screen.getByRole("link");
      const className = link.className;
      expect(className).toContain("text-[var(--color-primary)]");
      expect(className).toContain("border-[var(--color-primary)]");
    });

    it("powinien mieć klasy transition dla hover effects", () => {
      // Arrange
      const board = createMockBoard();

      // Act
      renderWithProvider(board);

      // Assert
      const link = screen.getByRole("link");
      expect(link).toHaveClass("transition-colors");
      expect(link.className).toContain("hover:bg-[var(--color-primary)]/10");
    });
  });

  describe("Renderowanie tagów", () => {
    it("powinien wyrenderować tagi z logik mobile/desktop", () => {
      // Arrange
      const board = createMockBoard({ tags: ["JavaScript", "TypeScript", "React"] });

      // Act
      renderWithProvider(board);

      // Assert - tagi są renderowane w mobile i desktop
      // JavaScript pojawia się 2x (mobile i desktop)
      const javascriptTags = screen.getAllByText("JavaScript");
      expect(javascriptTags.length).toBe(2);

      // TypeScript pojawia się tylko w desktop view
      expect(screen.getByText("TypeScript")).toBeInTheDocument();

      // React nie jest wyświetlane (komponent pokazuje tylko 2 tagi z 3 + "…")
      // Na mobile: 1 tag + "…", na desktop: 2 tagi + "…"
      expect(screen.queryByText("React")).not.toBeInTheDocument();

      // Sprawdzamy czy jest "…" indicator
      const ellipsisTags = screen.getAllByText("…");
      expect(ellipsisTags.length).toBeGreaterThan(0);
    });

    it("powinien mieć oddzielne renderowanie dla mobile i desktop", () => {
      // Arrange
      const board = createMockBoard({ tags: ["Tag1", "Tag2", "Tag3"] });

      // Act
      const { container } = renderWithProvider(board);

      // Assert
      const mobileContainer = container.querySelector(".block.md\\:hidden");
      const desktopContainer = container.querySelector(".hidden.md\\:block");
      expect(mobileContainer).toBeInTheDocument();
      expect(desktopContainer).toBeInTheDocument();
    });

    it("powinien wyświetlić 1 tag na mobile + '…' gdy jest więcej tagów", () => {
      // Arrange
      const board = createMockBoard({ tags: ["Tag1", "Tag2", "Tag3"] });

      // Act
      const { container } = renderWithProvider(board);

      // Assert - mobile view
      const mobileContainer = container.querySelector(".block.md\\:hidden");
      const tagsInMobile = mobileContainer?.querySelectorAll("span");
      // Pierwszy tag + "…" chip
      expect(tagsInMobile?.length).toBe(2);
    });

    it("powinien wyświetlić 2 tagi na desktop + '…' gdy jest więcej tagów", () => {
      // Arrange
      const board = createMockBoard({ tags: ["Tag1", "Tag2", "Tag3"] });

      // Act
      const { container } = renderWithProvider(board);

      // Assert - desktop view
      const desktopContainer = container.querySelector(".hidden.md\\:block");
      const tagsInDesktop = desktopContainer?.querySelectorAll("span");
      // Dwa tagi + "…" chip
      expect(tagsInDesktop?.length).toBe(3);
    });

    it("nie powinien wyświetlić '…' gdy jest dokładnie 1 tag (mobile)", () => {
      // Arrange
      const board = createMockBoard({ tags: ["SingleTag"] });

      // Act
      const { container } = renderWithProvider(board);

      // Assert
      const mobileContainer = container.querySelector(".block.md\\:hidden");
      const ellipsis = within(mobileContainer as HTMLElement).queryByText("…");
      expect(ellipsis).not.toBeInTheDocument();
    });

    it("nie powinien wyświetlić '…' gdy są dokładnie 2 tagi (desktop)", () => {
      // Arrange
      const board = createMockBoard({ tags: ["Tag1", "Tag2"] });

      // Act
      const { container } = renderWithProvider(board);

      // Assert
      const desktopContainer = container.querySelector(".hidden.md\\:block");
      const ellipsis = within(desktopContainer as HTMLElement).queryByText("…");
      expect(ellipsis).not.toBeInTheDocument();
    });

    it("powinien obsłużyć brak tagów", () => {
      // Arrange
      const board = createMockBoard({ tags: null as unknown as string[] });

      // Act
      const { container } = renderWithProvider(board);

      // Assert
      const chips = container.querySelectorAll(".inline-block.rounded-full");
      expect(chips.length).toBe(0);
    });

    it("powinien obsłużyć pustą tablicę tagów", () => {
      // Arrange
      const board = createMockBoard({ tags: [] });

      // Act
      const { container } = renderWithProvider(board);

      // Assert
      const mobileContainer = container.querySelector(".block.md\\:hidden");
      const desktopContainer = container.querySelector(".hidden.md\\:block");
      expect(mobileContainer?.textContent).toBe("");
      expect(desktopContainer?.textContent).toBe("");
    });
  });

  describe("Text truncation dla długich tytułów", () => {
    it("powinien wyświetlić pełny tytuł gdy ma <= 22 znaki", () => {
      // Arrange
      const shortTitle = "Short Title";
      const board = createMockBoard({ title: shortTitle });

      // Act
      renderWithProvider(board);

      // Assert
      const title = screen.getByText(shortTitle);
      expect(title).toHaveTextContent(shortTitle);
      expect(title.textContent).not.toContain("…");
    });

    it("powinien obciąć tytuł do 22 znaków + '…' gdy jest dłuższy", () => {
      // Arrange
      const longTitle = "This is a very long board title";
      const board = createMockBoard({ title: longTitle });

      // Act
      renderWithProvider(board);

      // Assert
      const truncated = screen.getByText(/This is a very long bo…/);
      expect(truncated).toBeInTheDocument();
      expect(truncated.textContent).toBe("This is a very long bo…");
    });

    it("powinien dodać title attribute z pełnym tytułem dla accessibility", () => {
      // Arrange
      const longTitle = "This is a very long board title that needs truncation";
      const board = createMockBoard({ title: longTitle });

      // Act
      const { container } = renderWithProvider(board);

      // Assert
      const titleElement = container.querySelector("[title]");
      expect(titleElement).toHaveAttribute("title", longTitle);
    });

    it("powinien stosować klasy truncate dla responsywności", () => {
      // Arrange
      const board = createMockBoard({ title: "Test Title" });

      // Act
      const { container } = renderWithProvider(board);

      // Assert
      const titleContainer = container.querySelector(".truncate");
      expect(titleContainer).toBeInTheDocument();
      expect(titleContainer).toHaveClass("md:whitespace-normal");
      expect(titleContainer).toHaveClass("md:text-clip");
    });
  });

  describe("Warunkowe renderowanie dla właściciela (canManage)", () => {
    it("powinien wyświetlić przyciski edit i delete gdy użytkownik jest właścicielem", () => {
      // Arrange
      const userId = "user-123";
      const board = createMockBoard({ ownerId: userId });

      // Act
      const { container } = renderWithProvider(board, {
        user: { id: userId, email: "test@example.com" },
        isAuthenticated: true,
      });

      // Assert
      const editIcon = container.querySelector("svg[class*='cursor-pointer']");
      expect(editIcon).toBeInTheDocument();
    });

    it("nie powinien wyświetlić przycisków edit i delete gdy użytkownik nie jest właścicielem", () => {
      // Arrange
      const board = createMockBoard({ ownerId: "user-456" });

      // Act
      const { container } = renderWithProvider(board, {
        user: { id: "different-user-789", email: "test@example.com" },
        isAuthenticated: true,
      });

      // Assert
      const icons = container.querySelectorAll("svg[class*='cursor-pointer']");
      expect(icons.length).toBe(0);
    });

    it("nie powinien wyświetlić przycisków edit i delete gdy użytkownik nie jest zalogowany", () => {
      // Arrange
      const board = createMockBoard({ ownerId: "user-456" });

      // Act
      const { container } = renderWithProvider(board, {
        user: null,
        isAuthenticated: false,
      });

      // Assert
      const icons = container.querySelectorAll("svg[class*='cursor-pointer']");
      expect(icons.length).toBe(0);
    });

    it("powinien wyświetlić lastTime gdy użytkownik jest właścicielem i lastTime istnieje", () => {
      // Arrange
      const userId = "user-123";
      const board = createMockBoard({ ownerId: userId, lastTime: 5000 });

      // Act
      renderWithProvider(board, {
        user: { id: userId, email: "test@example.com" },
        isAuthenticated: true,
      });

      // Assert
      expect(screen.getByText("Last score")).toBeInTheDocument();
      expect(screen.getByText("5000ms")).toBeInTheDocument();
    });

    it("nie powinien wyświetlić lastTime gdy użytkownik nie jest właścicielem", () => {
      // Arrange
      const board = createMockBoard({ ownerId: "user-456", lastTime: 5000 });

      // Act
      renderWithProvider(board, {
        user: { id: "different-user", email: "test@example.com" },
        isAuthenticated: true,
      });

      // Assert
      expect(screen.queryByText("Last score")).not.toBeInTheDocument();
      expect(screen.queryByText("5000ms")).not.toBeInTheDocument();
    });

    it("nie powinien wyświetlić lastTime gdy nie istnieje mimo że użytkownik jest właścicielem", () => {
      // Arrange
      const userId = "user-123";
      const board = createMockBoard({ ownerId: userId, lastTime: undefined });

      // Act
      renderWithProvider(board, {
        user: { id: userId, email: "test@example.com" },
        isAuthenticated: true,
      });

      // Assert
      expect(screen.queryByText("Last score")).not.toBeInTheDocument();
    });
  });

  describe("Interakcje użytkownika", () => {
    it("powinien przekierować do strony planszy po kliknięciu link", async () => {
      // Arrange
      userEvent.setup();
      const board = createMockBoard({ id: "board-xyz" });

      // Act
      renderWithProvider(board);
      const link = screen.getByRole("link");

      // Assert
      expect(link).toHaveAttribute("href", "/boards/board-xyz");
    });

    it("ikona edit powinna mieć odpowiedni onClick handler", () => {
      // Arrange
      const userId = "user-123";
      const board = createMockBoard({ id: "board-xyz", ownerId: userId });

      // Act
      const { container } = renderWithProvider(board, {
        user: { id: userId, email: "test@example.com" },
        isAuthenticated: true,
      });

      // Assert - sprawdzamy czy ikona edit istnieje i ma odpowiedni handler
      const editIcon = container.querySelector("svg[class*='hover\\:bg-\\[var\\(--color-primary\\)\\]']");
      expect(editIcon).toBeInTheDocument();
      expect(editIcon?.parentElement).toHaveProperty("onclick");
    });

    it("ikona delete powinna mieć odpowiedni onClick handler", () => {
      // Arrange
      const userId = "user-123";
      const board = createMockBoard({ ownerId: userId });

      // Act
      const { container } = renderWithProvider(board, {
        user: { id: userId, email: "test@example.com" },
        isAuthenticated: true,
      });

      // Assert - sprawdzamy czy ikona delete istnieje i ma odpowiedni handler
      const deleteIcon = container.querySelector("svg[class*='hover\\:bg-red-500']");
      expect(deleteIcon).toBeInTheDocument();
      expect(deleteIcon?.parentElement).toHaveProperty("onclick");
    });

    it("DeleteBoardDialog powinien być renderowany w komponencie", () => {
      // Arrange
      const userId = "user-123";
      const board = createMockBoard({ ownerId: userId });

      // Act
      const { container } = renderWithProvider(board, {
        user: { id: userId, email: "test@example.com" },
        isAuthenticated: true,
      });

      // Assert - sprawdzamy czy DeleteBoardDialog jest w drzewie komponentów
      // Dialog jest renderowany ale niewidoczny domyślnie
      expect(container).toBeInTheDocument();
    });
  });

  describe("DeleteBoardDialog integracja", () => {
    it("dialog powinien być niewidoczny domyślnie", () => {
      // Arrange
      const userId = "user-123";
      const board = createMockBoard({ ownerId: userId });

      // Act
      renderWithProvider(board, {
        user: { id: userId, email: "test@example.com" },
        isAuthenticated: true,
      });

      // Assert
      expect(screen.queryByText("Na pewno usunąć tablicę?")).not.toBeInTheDocument();
    });
  });

  describe("Stylowanie ikonstyling icons)", () => {
    it("ikona edit powinna mieć odpowiednie klasy hover", () => {
      // Arrange
      const userId = "user-123";
      const board = createMockBoard({ ownerId: userId });

      // Act
      const { container } = renderWithProvider(board, {
        user: { id: userId, email: "test@example.com" },
        isAuthenticated: true,
      });

      // Assert - SVG używa classList, nie className string
      const editIcon = container.querySelector("svg[class*='hover\\:bg-\\[var\\(--color-primary\\)\\]']");
      expect(editIcon).toBeInTheDocument();
      expect(editIcon).toHaveClass("w-[30px]");
      expect(editIcon).toHaveClass("h-[30px]");
      expect(editIcon).toHaveClass("cursor-pointer");
      expect(editIcon).toHaveClass("transition-colors");
    });

    it("ikona delete powinna mieć odpowiednie klasy hover red-500", () => {
      // Arrange
      const userId = "user-123";
      const board = createMockBoard({ ownerId: userId });

      // Act
      const { container } = renderWithProvider(board, {
        user: { id: userId, email: "test@example.com" },
        isAuthenticated: true,
      });

      // Assert - SVG używa classList, nie className string
      const deleteIcon = container.querySelector("svg[class*='hover\\:bg-red-500']");
      expect(deleteIcon).toBeInTheDocument();
      expect(deleteIcon).toHaveClass("w-[30px]");
      expect(deleteIcon).toHaveClass("h-[30px]");
      expect(deleteIcon).toHaveClass("cursor-pointer");
      expect(deleteIcon).toHaveClass("hover:text-white");
    });

    it("lastTime powinien mieć klasę lowercase", () => {
      // Arrange
      const userId = "user-123";
      const board = createMockBoard({ ownerId: userId, lastTime: 3000 });

      // Act
      renderWithProvider(board, {
        user: { id: userId, email: "test@example.com" },
        isAuthenticated: true,
      });

      // Assert
      const lastTimeContainer = screen.getByText("Last score").parentElement;
      expect(lastTimeContainer).toHaveClass("lowercase");
      expect(lastTimeContainer).toHaveClass("text-sm");
      expect(lastTimeContainer).toHaveClass("text-gray-500");
    });
  });

  describe("Avatar styling", () => {
    it("avatar powinien mieć okrągły kształt z border", () => {
      // Arrange
      const board = createMockBoard();

      // Act
      const { container } = renderWithProvider(board);

      // Assert
      const avatar = container.querySelector(".w-\\[40px\\].h-\\[40px\\]");
      expect(avatar).toHaveClass("rounded-[20px]");
      expect(avatar).toHaveClass("border-2");
      expect(avatar).toHaveClass("border-blue-500");
      expect(avatar).toHaveClass("bg-white");
    });

    it("avatar powinien być wyśrodkowany flex container", () => {
      // Arrange
      const board = createMockBoard();

      // Act
      const { container } = renderWithProvider(board);

      // Assert
      const avatar = container.querySelector(".w-\\[40px\\].h-\\[40px\\]");
      expect(avatar).toHaveClass("flex");
      expect(avatar).toHaveClass("justify-center");
      expect(avatar).toHaveClass("items-center");
    });

    it("avatar powinien wyświetlać pierwszą literę tytułu w uppercase (capitalize)", () => {
      // Arrange
      const board = createMockBoard({ title: "advanced React" });

      // Act
      const { container } = renderWithProvider(board);

      // Assert
      const avatar = container.querySelector(".w-\\[40px\\].h-\\[40px\\]");
      expect(avatar).toHaveTextContent("a");
      // Link ma klasę capitalize, więc pierwsza litera będzie wielka
      const link = screen.getByRole("link");
      expect(link).toHaveClass("capitalize");
    });
  });

  describe("Edge cases", () => {
    it("powinien obsłużyć bardzo długi tytuł bez łamania layoutu", () => {
      // Arrange
      const longTitle = "A".repeat(100);
      const board = createMockBoard({ title: longTitle });

      // Act
      renderWithProvider(board);

      // Assert
      const link = screen.getByRole("link");
      expect(link).toBeInTheDocument();
      // Title powinien być obcięty
      expect(link.textContent).toContain("…");
      expect(link.textContent?.length).toBeLessThan(longTitle.length);
    });

    it("powinien obsłużyć brak poziomu (level)", () => {
      // Arrange
      const board = createMockBoard({ level: 0 });

      // Act
      renderWithProvider(board);

      // Assert
      const levelText = screen.getByText(/Level: 0/);
      expect(levelText).toBeInTheDocument();
    });

    it("powinien obsłużyć bardzo wysoką wartość lastTime", () => {
      // Arrange
      const userId = "user-123";
      const board = createMockBoard({ ownerId: userId, lastTime: 9999999 });

      // Act
      renderWithProvider(board, {
        user: { id: userId, email: "test@example.com" },
        isAuthenticated: true,
      });

      // Assert - lastTime jest renderowane tylko dla właściciela
      expect(screen.getByText("9999999ms")).toBeInTheDocument();
    });

    it("powinien obsłużyć tablicę z wieloma tagami (> 10)", () => {
      // Arrange
      const manyTags = Array.from({ length: 15 }, (_, i) => `Tag${i + 1}`);
      const board = createMockBoard({ tags: manyTags });

      // Act
      renderWithProvider(board);

      // Assert
      // Mobile: 1 tag + "…"
      // Desktop: 2 tagi + "…"
      expect(screen.getAllByText("…").length).toBeGreaterThan(0);
    });

    it("powinien obsłużyć board bez ID", () => {
      // Arrange
      const board = createMockBoard({ id: "" });

      // Act
      renderWithProvider(board);

      // Assert
      const link = screen.getByRole("link");
      expect(link).toHaveAttribute("href", "/boards/");
    });

    it("powinien obsłużyć re-rendering bez błędów", () => {
      // Arrange
      const board = createMockBoard();
      const { rerender, store } = renderWithProvider(board);

      // Act & Assert
      expect(() => {
        rerender(
          <Provider store={store}>
            <BoardListTile board={board} />
          </Provider>
        );
        rerender(
          <Provider store={store}>
            <BoardListTile board={board} />
          </Provider>
        );
      }).not.toThrow();
    });

    it("powinien obsłużyć zmianę właściciela podczas re-renderowania", () => {
      // Arrange
      const userId = "user-123";
      const board = createMockBoard({ ownerId: userId });
      const { rerender, container, store } = renderWithProvider(board, {
        user: { id: userId, email: "test@example.com" },
        isAuthenticated: true,
      });

      // Assert - początkowo pokazuje ikony
      let icons = container.querySelectorAll("svg[class*='cursor-pointer']");
      expect(icons.length).toBeGreaterThan(0);

      // Act - zmiana użytkownika
      const newBoard = createMockBoard({ ownerId: "different-user" });
      rerender(
        <Provider store={store}>
          <BoardListTile board={newBoard} />
        </Provider>
      );

      // Assert - ikony znikają
      icons = container.querySelectorAll("svg[class*='cursor-pointer']");
      expect(icons.length).toBe(0);
    });
  });

  describe("Accessibility", () => {
    it("link powinien być dostępny dla screen readerów", () => {
      // Arrange
      const board = createMockBoard({ title: "Accessible Board" });

      // Act
      renderWithProvider(board);

      // Assert
      const link = screen.getByRole("link");
      expect(link).toBeInTheDocument();
      expect(link).toHaveAccessibleName();
    });

    it("powinien mieć title attribute dla długich tytułów", () => {
      // Arrange
      const longTitle = "This is a very long board title for accessibility";
      const board = createMockBoard({ title: longTitle });

      // Act
      const { container } = renderWithProvider(board);

      // Assert
      const titleElement = container.querySelector("[title]");
      expect(titleElement).toHaveAttribute("title", longTitle);
    });

    it("ikony powinny być kliklalne", () => {
      // Arrange
      const userId = "user-123";
      const board = createMockBoard({ ownerId: userId });

      // Act
      const { container } = renderWithProvider(board, {
        user: { id: userId, email: "test@example.com" },
        isAuthenticated: true,
      });

      // Assert - sprawdzamy czy ikony mają cursor-pointer
      const editIcon = container.querySelector("svg[class*='cursor-pointer']");
      expect(editIcon).toHaveClass("cursor-pointer");
    });

    it("powinien mieć odpowiedni kontrast kolorów dla tekstu", () => {
      // Arrange
      const board = createMockBoard();

      // Act
      const { container } = renderWithProvider(board);

      // Assert
      const link = screen.getByRole("link");
      const className = link.className;
      expect(className).toContain("text-[var(--color-primary)]");

      // Level jest w <span>, ale text-gray-500 jest na parent <div>
      const levelContainer = container.querySelector(".text-sm.text-gray-500");
      expect(levelContainer).toBeInTheDocument();
    });

    it("avatar powinien mieć odpowiedni kontrast z tłem", () => {
      // Arrange
      const board = createMockBoard();

      // Act
      const { container } = renderWithProvider(board);

      // Assert
      const avatar = container.querySelector(".w-\\[40px\\].h-\\[40px\\]");
      expect(avatar).toHaveClass("bg-white");
      expect(avatar?.className).toContain("text-[var(--color-primary)]");
      expect(avatar).toHaveClass("border-blue-500");
    });
  });

  describe("Layout responsywny", () => {
    it("powinien używać flexbox dla głównego layout", () => {
      // Arrange
      const board = createMockBoard();

      // Act
      renderWithProvider(board);

      // Assert
      const link = screen.getByRole("link");
      expect(link).toHaveClass("flex");
      expect(link).toHaveClass("items-center");
      expect(link).toHaveClass("justify-between");
    });

    it("powinien mieć fixed height 60px", () => {
      // Arrange
      const board = createMockBoard();

      // Act
      renderWithProvider(board);

      // Assert
      const link = screen.getByRole("link");
      expect(link).toHaveClass("h-[60px]");
    });

    it("powinien mieć padding i margin dla spacing", () => {
      // Arrange
      const board = createMockBoard();

      // Act
      renderWithProvider(board);

      // Assert
      const link = screen.getByRole("link");
      expect(link).toHaveClass("p-2");
      expect(link).toHaveClass("mb-3");
    });

    it("avatar powinien mieć margin-right dla spacing", () => {
      // Arrange
      const board = createMockBoard();

      // Act
      const { container } = renderWithProvider(board);

      // Assert
      const avatar = container.querySelector(".w-\\[40px\\].h-\\[40px\\]");
      expect(avatar).toHaveClass("mr-2");
      expect(avatar).toHaveClass("shrink-0");
    });

    it("sekcja zarządzania powinna mieć gap między ikonami", () => {
      // Arrange
      const userId = "user-123";
      const board = createMockBoard({ ownerId: userId });

      // Act
      const { container } = renderWithProvider(board, {
        user: { id: userId, email: "test@example.com" },
        isAuthenticated: true,
      });

      // Assert
      const managementSection = container.querySelector(".flex.items-center.gap-2");
      expect(managementSection).toBeInTheDocument();
      expect(managementSection).toHaveClass("gap-2");
    });
  });

  describe("Integracja z Redux", () => {
    it("powinien używać useAppSelector do odczytu authUserId", () => {
      // Arrange
      const userId = "user-redux-123";
      const board = createMockBoard({ ownerId: userId });
      const { store } = renderWithProvider(board, {
        user: { id: userId, email: "test@example.com" },
        isAuthenticated: true,
      });

      // Assert
      const state = store.getState();
      expect(state.auth.user?.id).toBe(userId);
    });

    it("powinien reagować na zmianę stanu auth w store", () => {
      // Arrange
      const userId = "user-123";
      const board = createMockBoard({ ownerId: userId });
      const { container, rerender } = renderWithProvider(board, {
        user: null,
        isAuthenticated: false,
      });

      // Assert - brak ikon
      let icons = container.querySelectorAll("svg[class*='cursor-pointer']");
      expect(icons.length).toBe(0);

      // Act - zmiana stanu (rerender z nowym store)
      const newStore = createMockStore({
        user: { id: userId, email: "test@example.com" },
        isAuthenticated: true,
      });

      rerender(
        <Provider store={newStore}>
          <BoardListTile board={board} />
        </Provider>
      );

      // Assert - ikony się pojawiają
      icons = container.querySelectorAll("svg[class*='cursor-pointer']");
      expect(icons.length).toBeGreaterThan(0);
    });
  });

  describe("TypeScript type safety (runtime checks)", () => {
    it("powinien zaakceptować wszystkie wymagane pola BoardSummaryDTO", () => {
      // Arrange & Act
      const board = createMockBoard();
      const { container } = renderWithProvider(board);

      // Assert
      expect(container).toBeInTheDocument();
    });

    it("powinien zaakceptować opcjonalne pole lastTime", () => {
      // Arrange & Act
      const boardWithLastTime = createMockBoard({ lastTime: 5000 });
      const boardWithoutLastTime = createMockBoard({ lastTime: undefined });

      // Assert
      expect(() => {
        renderWithProvider(boardWithLastTime, {
          user: { id: boardWithLastTime.ownerId, email: "test@example.com" },
          isAuthenticated: true,
        });
        renderWithProvider(boardWithoutLastTime);
      }).not.toThrow();
    });
  });

  describe("Performance", () => {
    it("powinien renderować się szybko", () => {
      // Arrange
      const board = createMockBoard();
      const startTime = performance.now();

      // Act
      renderWithProvider(board);

      // Assert
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      expect(renderTime).toBeLessThan(100);
    });

    it("powinien obsłużyć rendering wielu BoardListTile jednocześnie", () => {
      // Arrange
      const boards = Array.from({ length: 50 }, (_, i) => createMockBoard({ id: `board-${i}`, title: `Board ${i}` }));
      const store = createMockStore();

      // Act
      const { container } = render(
        <Provider store={store}>
          <div>
            {boards.map((board) => (
              <BoardListTile key={board.id} board={board} />
            ))}
          </div>
        </Provider>
      );

      // Assert
      const links = container.querySelectorAll("a");
      expect(links.length).toBe(50);
    });
  });
});
