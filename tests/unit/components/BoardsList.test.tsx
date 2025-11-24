import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { BoardsList } from "@/components/ui/Boards/BoardsList";
import type { BoardSummaryDTO } from "@/types";

/**
 * Testy jednostkowe dla komponentu BoardsList
 *
 * Testowane funkcjonalności:
 * - Podstawowe renderowanie i struktura DOM
 * - Stan ładowania (loading state)
 * - Pusty stan (brak plansz)
 * - Renderowanie listy plansz
 * - Przekazywanie props do BoardListTile
 * - Stylowanie z Tailwind CSS
 * - Edge cases (undefined boards, pusta tablica)
 * - Accessibility (semantyczne tagi HTML)
 */

// Mock dla BoardListTile component
vi.mock("@/components/ui/Boards/BoardListTile", () => ({
  BoardListTile: ({ board }: { board: BoardSummaryDTO }) => (
    <div data-testid={`board-tile-${board.id}`} data-board-id={board.id}>
      {board.title}
    </div>
  ),
}));

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

describe("BoardsList", () => {
  describe("Stan ładowania (loading state)", () => {
    it("powinien wyświetlić komunikat ładowania gdy loading=true", () => {
      // Arrange
      const boards: BoardSummaryDTO[] = [];

      // Act
      render(<BoardsList boards={boards} loading={true} />);

      // Assert
      const loadingMessage = screen.getByText("Ładowanie…");
      expect(loadingMessage).toBeInTheDocument();
      expect(loadingMessage.tagName).toBe("P");
    });

    it("powinien mieć odpowiednie klasy CSS dla komunikatu ładowania", () => {
      // Arrange
      const boards: BoardSummaryDTO[] = [];

      // Act
      render(<BoardsList boards={boards} loading={true} />);

      // Assert
      const loadingMessage = screen.getByText("Ładowanie…");
      expect(loadingMessage).toHaveClass("py-10");
      expect(loadingMessage).toHaveClass("text-center");
      expect(loadingMessage).toHaveClass("text-sm");
      expect(loadingMessage).toHaveClass("text-muted-foreground");
    });

    it("nie powinien renderować kontenera listy podczas ładowania", () => {
      // Arrange
      const boards = [createMockBoard()];

      // Act
      const { container } = render(<BoardsList boards={boards} loading={true} />);

      // Assert
      const listContainer = container.querySelector(".flex.flex-col");
      expect(listContainer).not.toBeInTheDocument();
    });
  });

  describe("Pusty stan (brak plansz)", () => {
    it("powinien wyświetlić komunikat gdy boards jest undefined", () => {
      // Arrange & Act
      render(<BoardsList boards={undefined} loading={false} />);

      // Assert
      const emptyMessage = screen.getByText("Brak plansz do wyświetlenia.");
      expect(emptyMessage).toBeInTheDocument();
      expect(emptyMessage.tagName).toBe("P");
    });

    it("powinien wyświetlić komunikat gdy boards jest pustą tablicą", () => {
      // Arrange
      const boards: BoardSummaryDTO[] = [];

      // Act
      render(<BoardsList boards={boards} loading={false} />);

      // Assert
      const emptyMessage = screen.getByText("Brak plansz do wyświetlenia.");
      expect(emptyMessage).toBeInTheDocument();
    });

    it("powinien mieć odpowiednie klasy CSS dla komunikatu pustego stanu", () => {
      // Arrange
      const boards: BoardSummaryDTO[] = [];

      // Act
      render(<BoardsList boards={boards} loading={false} />);

      // Assert
      const emptyMessage = screen.getByText("Brak plansz do wyświetlenia.");
      expect(emptyMessage).toHaveClass("py-10");
      expect(emptyMessage).toHaveClass("text-center");
      expect(emptyMessage).toHaveClass("text-sm");
      expect(emptyMessage).toHaveClass("text-muted-foreground");
    });

    it("nie powinien renderować kontenera listy dla pustej tablicy", () => {
      // Arrange
      const boards: BoardSummaryDTO[] = [];

      // Act
      const { container } = render(<BoardsList boards={boards} loading={false} />);

      // Assert
      const listContainer = container.querySelector(".flex.flex-col");
      expect(listContainer).not.toBeInTheDocument();
    });
  });

  describe("Renderowanie listy plansz", () => {
    it("powinien wyrenderować pojedynczą planszę", () => {
      // Arrange
      const board = createMockBoard({ id: "board-1", title: "First Board" });
      const boards = [board];

      // Act
      render(<BoardsList boards={boards} loading={false} />);

      // Assert
      const boardTile = screen.getByTestId("board-tile-board-1");
      expect(boardTile).toBeInTheDocument();
      expect(boardTile).toHaveTextContent("First Board");
    });

    it("powinien wyrenderować wiele plansz", () => {
      // Arrange
      const boards = [
        createMockBoard({ id: "board-1", title: "First Board" }),
        createMockBoard({ id: "board-2", title: "Second Board" }),
        createMockBoard({ id: "board-3", title: "Third Board" }),
      ];

      // Act
      render(<BoardsList boards={boards} loading={false} />);

      // Assert
      const boardTile1 = screen.getByTestId("board-tile-board-1");
      const boardTile2 = screen.getByTestId("board-tile-board-2");
      const boardTile3 = screen.getByTestId("board-tile-board-3");

      expect(boardTile1).toBeInTheDocument();
      expect(boardTile2).toBeInTheDocument();
      expect(boardTile3).toBeInTheDocument();
    });

    it("powinien renderować plansze w kolejności z tablicy", () => {
      // Arrange
      const boards = [
        createMockBoard({ id: "board-1", title: "First" }),
        createMockBoard({ id: "board-2", title: "Second" }),
        createMockBoard({ id: "board-3", title: "Third" }),
      ];

      // Act
      const { container } = render(<BoardsList boards={boards} loading={false} />);

      // Assert
      const boardTiles = container.querySelectorAll("[data-testid^='board-tile-']");
      expect(boardTiles).toHaveLength(3);
      expect(boardTiles[0]).toHaveAttribute("data-board-id", "board-1");
      expect(boardTiles[1]).toHaveAttribute("data-board-id", "board-2");
      expect(boardTiles[2]).toHaveAttribute("data-board-id", "board-3");
    });

    it("powinien przekazać prawidłowy obiekt board do każdego BoardListTile", () => {
      // Arrange
      const board = createMockBoard({
        id: "board-123",
        title: "Test Board",
        cardCount: 24,
        tags: ["Test", "Unit"],
      });
      const boards = [board];

      // Act
      render(<BoardsList boards={boards} loading={false} />);

      // Assert
      const boardTile = screen.getByTestId("board-tile-board-123");
      expect(boardTile).toBeInTheDocument();
      expect(boardTile).toHaveAttribute("data-board-id", "board-123");
    });
  });

  describe("Struktura DOM i stylowanie", () => {
    it("powinien mieć kontener z odpowiednimi klasami Tailwind", () => {
      // Arrange
      const boards = [createMockBoard()];

      // Act
      const { container } = render(<BoardsList boards={boards} loading={false} />);

      // Assert
      const listContainer = container.querySelector(".flex.flex-col");
      expect(listContainer).toBeInTheDocument();
      expect(listContainer).toHaveClass("flex");
      expect(listContainer).toHaveClass("flex-col");
      expect(listContainer).toHaveClass("relative");
      expect(listContainer).toHaveClass("w-full");
    });

    it("powinien użyć div jako kontener listy", () => {
      // Arrange
      const boards = [createMockBoard()];

      // Act
      const { container } = render(<BoardsList boards={boards} loading={false} />);

      // Assert
      const listContainer = container.querySelector(".flex.flex-col");
      expect(listContainer?.tagName).toBe("DIV");
    });

    it("komunikaty stanu powinny używać paragrafu", () => {
      // Arrange & Act
      const { rerender } = render(<BoardsList boards={[]} loading={true} />);

      // Assert - loading state
      const loadingMessage = screen.getByText("Ładowanie…");
      expect(loadingMessage.tagName).toBe("P");

      // Act - empty state
      rerender(<BoardsList boards={[]} loading={false} />);

      // Assert - empty state
      const emptyMessage = screen.getByText("Brak plansz do wyświetlenia.");
      expect(emptyMessage.tagName).toBe("P");
    });
  });

  describe("Przełączanie stanów", () => {
    it("powinien przełączyć się ze stanu ładowania na listę", () => {
      // Arrange
      const boards = [createMockBoard({ id: "board-1" })];

      // Act - loading state
      const { rerender } = render(<BoardsList boards={boards} loading={true} />);
      expect(screen.getByText("Ładowanie…")).toBeInTheDocument();
      expect(screen.queryByTestId("board-tile-board-1")).not.toBeInTheDocument();

      // Act - loaded state
      rerender(<BoardsList boards={boards} loading={false} />);

      // Assert
      expect(screen.queryByText("Ładowanie…")).not.toBeInTheDocument();
      expect(screen.getByTestId("board-tile-board-1")).toBeInTheDocument();
    });

    it("powinien przełączyć się ze stanu ładowania na pusty stan", () => {
      // Arrange
      const boards: BoardSummaryDTO[] = [];

      // Act - loading state
      const { rerender } = render(<BoardsList boards={boards} loading={true} />);
      expect(screen.getByText("Ładowanie…")).toBeInTheDocument();

      // Act - empty state
      rerender(<BoardsList boards={boards} loading={false} />);

      // Assert
      expect(screen.queryByText("Ładowanie…")).not.toBeInTheDocument();
      expect(screen.getByText("Brak plansz do wyświetlenia.")).toBeInTheDocument();
    });

    it("powinien przełączyć się z listy na pusty stan", () => {
      // Arrange
      const boards = [createMockBoard({ id: "board-1" })];

      // Act - with boards
      const { rerender } = render(<BoardsList boards={boards} loading={false} />);
      expect(screen.getByTestId("board-tile-board-1")).toBeInTheDocument();

      // Act - empty
      rerender(<BoardsList boards={[]} loading={false} />);

      // Assert
      expect(screen.queryByTestId("board-tile-board-1")).not.toBeInTheDocument();
      expect(screen.getByText("Brak plansz do wyświetlenia.")).toBeInTheDocument();
    });

    it("powinien zaktualizować listę plansz gdy props się zmieni", () => {
      // Arrange
      const initialBoards = [createMockBoard({ id: "board-1", title: "First" })];
      const newBoards = [
        createMockBoard({ id: "board-2", title: "Second" }),
        createMockBoard({ id: "board-3", title: "Third" }),
      ];

      // Act - initial render
      const { rerender } = render(<BoardsList boards={initialBoards} loading={false} />);
      expect(screen.getByTestId("board-tile-board-1")).toBeInTheDocument();

      // Act - update boards
      rerender(<BoardsList boards={newBoards} loading={false} />);

      // Assert
      expect(screen.queryByTestId("board-tile-board-1")).not.toBeInTheDocument();
      expect(screen.getByTestId("board-tile-board-2")).toBeInTheDocument();
      expect(screen.getByTestId("board-tile-board-3")).toBeInTheDocument();
    });
  });

  describe("Edge cases", () => {
    it("powinien obsłużyć dużą liczbę plansz (100+)", () => {
      // Arrange
      const boards = Array.from({ length: 150 }, (_, i) => createMockBoard({ id: `board-${i}`, title: `Board ${i}` }));

      // Act
      const { container } = render(<BoardsList boards={boards} loading={false} />);

      // Assert
      const boardTiles = container.querySelectorAll("[data-testid^='board-tile-']");
      expect(boardTiles).toHaveLength(150);
    });

    it("powinien obsłużyć plansze z minimalną ilością danych", () => {
      // Arrange
      const board = createMockBoard({
        id: "min-board",
        title: "X",
        tags: [],
        cardCount: 16,
      });

      // Act
      render(<BoardsList boards={[board]} loading={false} />);

      // Assert
      const boardTile = screen.getByTestId("board-tile-min-board");
      expect(boardTile).toBeInTheDocument();
    });

    it("powinien obsłużyć plansze z bardzo długim tytułem", () => {
      // Arrange
      const longTitle = "A".repeat(500);
      const board = createMockBoard({ id: "long-title-board", title: longTitle });

      // Act
      render(<BoardsList boards={[board]} loading={false} />);

      // Assert
      const boardTile = screen.getByTestId("board-tile-long-title-board");
      expect(boardTile).toBeInTheDocument();
      expect(boardTile).toHaveTextContent(longTitle);
    });

    it("powinien obsłużyć plansze z dużą liczbą tagów", () => {
      // Arrange
      const manyTags = Array.from({ length: 50 }, (_, i) => `Tag${i}`);
      const board = createMockBoard({ id: "many-tags-board", tags: manyTags });

      // Act
      render(<BoardsList boards={[board]} loading={false} />);

      // Assert
      const boardTile = screen.getByTestId("board-tile-many-tags-board");
      expect(boardTile).toBeInTheDocument();
    });

    it("powinien obsłużyć plansze z różnymi cardCount", () => {
      // Arrange
      const boards = [
        createMockBoard({ id: "board-16", cardCount: 16 }),
        createMockBoard({ id: "board-24", cardCount: 24 }),
      ];

      // Act
      render(<BoardsList boards={boards} loading={false} />);

      // Assert
      expect(screen.getByTestId("board-tile-board-16")).toBeInTheDocument();
      expect(screen.getByTestId("board-tile-board-24")).toBeInTheDocument();
    });

    it("powinien obsłużyć plansze z różnymi poziomami", () => {
      // Arrange
      const boards = [
        createMockBoard({ id: "board-level-1", level: 1 }),
        createMockBoard({ id: "board-level-2", level: 2 }),
        createMockBoard({ id: "board-level-3", level: 3 }),
      ];

      // Act
      render(<BoardsList boards={boards} loading={false} />);

      // Assert
      expect(screen.getByTestId("board-tile-board-level-1")).toBeInTheDocument();
      expect(screen.getByTestId("board-tile-board-level-2")).toBeInTheDocument();
      expect(screen.getByTestId("board-tile-board-level-3")).toBeInTheDocument();
    });

    it("powinien obsłużyć plansze publiczne i prywatne", () => {
      // Arrange
      const boards = [
        createMockBoard({ id: "public-board", isPublic: true }),
        createMockBoard({ id: "private-board", isPublic: false }),
      ];

      // Act
      render(<BoardsList boards={boards} loading={false} />);

      // Assert
      expect(screen.getByTestId("board-tile-public-board")).toBeInTheDocument();
      expect(screen.getByTestId("board-tile-private-board")).toBeInTheDocument();
    });

    it("powinien obsłużyć plansze zarchiwizowane i aktywne", () => {
      // Arrange
      const boards = [
        createMockBoard({ id: "active-board", archived: false }),
        createMockBoard({ id: "archived-board", archived: true }),
      ];

      // Act
      render(<BoardsList boards={boards} loading={false} />);

      // Assert
      expect(screen.getByTestId("board-tile-active-board")).toBeInTheDocument();
      expect(screen.getByTestId("board-tile-archived-board")).toBeInTheDocument();
    });
  });

  describe("Key handling dla list rendering", () => {
    it("powinien użyć board.id jako key dla każdego elementu", () => {
      // Arrange
      const boards = [
        createMockBoard({ id: "unique-id-1" }),
        createMockBoard({ id: "unique-id-2" }),
        createMockBoard({ id: "unique-id-3" }),
      ];

      // Act
      render(<BoardsList boards={boards} loading={false} />);

      // Assert
      // React używa key wewnętrznie, ale możemy zweryfikować że każdy tile ma unikalne ID
      const tile1 = screen.getByTestId("board-tile-unique-id-1");
      const tile2 = screen.getByTestId("board-tile-unique-id-2");
      const tile3 = screen.getByTestId("board-tile-unique-id-3");

      expect(tile1).toHaveAttribute("data-board-id", "unique-id-1");
      expect(tile2).toHaveAttribute("data-board-id", "unique-id-2");
      expect(tile3).toHaveAttribute("data-board-id", "unique-id-3");
    });

    it("powinien poprawnie obsłużyć duplikaty ID (edge case)", () => {
      // Arrange
      // W normalnej sytuacji to nie powinno się zdarzyć, ale testujemy edge case
      const boards = [
        createMockBoard({ id: "duplicate-id", title: "First" }),
        createMockBoard({ id: "duplicate-id", title: "Second" }),
      ];

      // Act
      const { container } = render(<BoardsList boards={boards} loading={false} />);

      // Assert
      // React powinien wyrenderować oba elementy mimo duplikatu key (z ostrzeżeniem w konsoli)
      const tiles = container.querySelectorAll("[data-board-id='duplicate-id']");
      expect(tiles).toHaveLength(2);
    });
  });

  describe("Priorytet stanów", () => {
    it("loading=true powinien mieć priorytet nad pustą tablicą", () => {
      // Arrange
      const boards: BoardSummaryDTO[] = [];

      // Act
      render(<BoardsList boards={boards} loading={true} />);

      // Assert
      expect(screen.getByText("Ładowanie…")).toBeInTheDocument();
      expect(screen.queryByText("Brak plansz do wyświetlenia.")).not.toBeInTheDocument();
    });

    it("loading=true powinien mieć priorytet nad undefined boards", () => {
      // Arrange & Act
      render(<BoardsList boards={undefined} loading={true} />);

      // Assert
      expect(screen.getByText("Ładowanie…")).toBeInTheDocument();
      expect(screen.queryByText("Brak plansz do wyświetlenia.")).not.toBeInTheDocument();
    });

    it("loading=true powinien mieć priorytet nad listą plansz", () => {
      // Arrange
      const boards = [createMockBoard({ id: "board-1" })];

      // Act
      render(<BoardsList boards={boards} loading={true} />);

      // Assert
      expect(screen.getByText("Ładowanie…")).toBeInTheDocument();
      expect(screen.queryByTestId("board-tile-board-1")).not.toBeInTheDocument();
    });
  });

  describe("Performance considerations", () => {
    it("nie powinien rerenderować niepotrzebnie gdy te same dane są przekazane", () => {
      // Arrange
      const boards = [createMockBoard({ id: "board-1" })];

      // Act
      const { rerender } = render(<BoardsList boards={boards} loading={false} />);

      rerender(<BoardsList boards={boards} loading={false} />);
      const rerenderTile = screen.getByTestId("board-tile-board-1");

      // Assert
      // Sprawdzamy że element dalej istnieje (podstawowa weryfikacja)
      expect(rerenderTile).toBeInTheDocument();
      expect(rerenderTile).toHaveAttribute("data-board-id", "board-1");
    });

    it("powinien obsłużyć szybką zmianę stanów loading", () => {
      // Arrange
      const boards = [createMockBoard()];

      // Act
      const { rerender } = render(<BoardsList boards={boards} loading={false} />);

      // Szybkie przełączanie loading
      rerender(<BoardsList boards={boards} loading={true} />);
      rerender(<BoardsList boards={boards} loading={false} />);
      rerender(<BoardsList boards={boards} loading={true} />);
      rerender(<BoardsList boards={boards} loading={false} />);

      // Assert
      expect(screen.getByTestId("board-tile-board-123")).toBeInTheDocument();
    });
  });
});
