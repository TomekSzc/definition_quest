import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BoardGrid } from "@/components/ui/Game/BoardGrid";
import type { CardStatus, CardVM } from "@/hooks/useBoardGame";

/**
 * Testy jednostkowe dla komponentu BoardGrid
 *
 * Testowane funkcjonalności:
 * - Renderowanie siatki kart
 * - Stan running - aktywna gra vs. gra zatrzymana
 * - Overlay z komunikatem i przyciski nawigacji
 * - Kliknięcia w karty i wywołanie onCardClick
 * - Disabled state podczas animacji (success/failure)
 * - Nawigacja między poziomami (prev/next)
 * - Renderowanie przycisków nawigacji w zależności od dostępnych poziomów
 * - Komunikaty w zależności od stanu gry (Start vs Reset)
 * - Responsywne układy (mobile vs desktop)
 * - Edge cases (pusta tablica kart, brak poziomów)
 */

// Mock dla komponentu Card
vi.mock("@/components/ui/Game/Card", () => ({
  default: ({
    text,
    status,
    disabled,
    onClick,
  }: {
    text: string;
    status: CardStatus;
    disabled?: boolean;
    onClick: () => void;
  }) => (
    <button
      data-testid={`card-${text}`}
      data-status={status}
      disabled={disabled}
      onClick={onClick}
      className="card-mock"
    >
      {text}
    </button>
  ),
}));

// Helper do tworzenia mock kart
const createMockCard = (
  value: string,
  pairId: string,
  status: CardStatus = "idle"
): CardVM & { status: CardStatus } => ({
  value,
  pairId,
  status,
});

describe("BoardGrid", () => {
  let mockOnCardClick: ReturnType<typeof vi.fn>;
  let mockNavigateToLevel: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockOnCardClick = vi.fn();
    mockNavigateToLevel = vi.fn();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("Renderowanie i struktura DOM", () => {
    it("powinien wyrenderować wszystkie karty", () => {
      // Arrange
      const cards = [
        createMockCard("Apple", "pair-1"),
        createMockCard("Jabłko", "pair-1"),
        createMockCard("Dog", "pair-2"),
        createMockCard("Pies", "pair-2"),
      ];

      // Act
      render(<BoardGrid cards={cards} running={true} onCardClick={mockOnCardClick} />);

      // Assert
      expect(screen.getByTestId("card-Apple")).toBeInTheDocument();
      expect(screen.getByTestId("card-Jabłko")).toBeInTheDocument();
      expect(screen.getByTestId("card-Dog")).toBeInTheDocument();
      expect(screen.getByTestId("card-Pies")).toBeInTheDocument();
    });

    it("powinien wyrenderować pustą siatkę gdy brak kart", () => {
      // Arrange
      const cards: (CardVM & { status: CardStatus })[] = [];

      // Act
      const { container } = render(<BoardGrid cards={cards} running={false} onCardClick={mockOnCardClick} />);

      // Assert
      const cardContainer = container.querySelector(".flex.flex-wrap.h-fit");
      expect(cardContainer).toBeInTheDocument();
      expect(cardContainer?.children.length).toBe(0);
    });

    it("powinien mieć responsywne klasy (mobile: w-full, desktop: calc)", () => {
      // Arrange
      const cards = [createMockCard("Test", "pair-1")];

      // Act
      const { container } = render(<BoardGrid cards={cards} running={true} onCardClick={mockOnCardClick} />);

      // Assert
      const mainContainer = container.firstChild as HTMLElement;
      expect(mainContainer).toHaveClass("w-full");
      expect(mainContainer).toHaveClass("md:w-[calc(100%-199px)]");
    });

    it("powinien mieć padding i min-height", () => {
      // Arrange
      const cards = [createMockCard("Test", "pair-1")];

      // Act
      const { container } = render(<BoardGrid cards={cards} running={true} onCardClick={mockOnCardClick} />);

      // Assert
      const mainContainer = container.firstChild as HTMLElement;
      expect(mainContainer).toHaveClass("p-[32px]");
      expect(mainContainer).toHaveClass("min-h-[80vh]");
    });

    it("powinien mieć position relative dla absolute children", () => {
      // Arrange
      const cards = [createMockCard("Test", "pair-1")];

      // Act
      const { container } = render(<BoardGrid cards={cards} running={false} onCardClick={mockOnCardClick} />);

      // Assert
      const mainContainer = container.firstChild as HTMLElement;
      expect(mainContainer).toHaveClass("relative");
    });
  });

  describe("Obsługa kliknięć w karty", () => {
    it("powinien wywołać onCardClick z poprawnym indeksem przy kliknięciu", async () => {
      // Arrange
      const user = userEvent.setup();
      const cards = [
        createMockCard("Apple", "pair-1"),
        createMockCard("Jabłko", "pair-1"),
        createMockCard("Dog", "pair-2"),
      ];

      // Act
      render(<BoardGrid cards={cards} running={true} onCardClick={mockOnCardClick} />);
      await user.click(screen.getByTestId("card-Apple"));

      // Assert
      expect(mockOnCardClick).toHaveBeenCalledTimes(1);
      expect(mockOnCardClick).toHaveBeenCalledWith(0);
    });

    it("powinien wywołać onCardClick z właściwym indeksem dla każdej karty", async () => {
      // Arrange
      const user = userEvent.setup();
      const cards = [
        createMockCard("Apple", "pair-1"),
        createMockCard("Jabłko", "pair-1"),
        createMockCard("Dog", "pair-2"),
      ];

      // Act
      render(<BoardGrid cards={cards} running={true} onCardClick={mockOnCardClick} />);
      await user.click(screen.getByTestId("card-Jabłko"));

      // Assert
      expect(mockOnCardClick).toHaveBeenCalledWith(1);
    });

    it("powinien umożliwić wielokrotne kliknięcia w różne karty", async () => {
      // Arrange
      const user = userEvent.setup();
      const cards = [
        createMockCard("Apple", "pair-1"),
        createMockCard("Jabłko", "pair-1"),
        createMockCard("Dog", "pair-2"),
      ];

      // Act
      render(<BoardGrid cards={cards} running={true} onCardClick={mockOnCardClick} />);
      await user.click(screen.getByTestId("card-Apple"));
      await user.click(screen.getByTestId("card-Dog"));

      // Assert
      expect(mockOnCardClick).toHaveBeenCalledTimes(2);
      expect(mockOnCardClick).toHaveBeenNthCalledWith(1, 0);
      expect(mockOnCardClick).toHaveBeenNthCalledWith(2, 2);
    });
  });

  describe("Stan running - aktywna vs zatrzymana gra", () => {
    it("nie powinien wyświetlać overlay gdy running=true", () => {
      // Arrange
      const cards = [createMockCard("Test", "pair-1")];

      // Act
      render(<BoardGrid cards={cards} running={true} onCardClick={mockOnCardClick} />);

      // Assert
      expect(screen.queryByText(/Wciśnij/)).not.toBeInTheDocument();
    });

    it("powinien wyświetlić overlay z komunikatem gdy running=false i cards.length > 0", () => {
      // Arrange
      const cards = [createMockCard("Test", "pair-1")];

      // Act
      render(<BoardGrid cards={cards} running={false} onCardClick={mockOnCardClick} />);

      // Assert
      expect(screen.getByText("Wciśnij Start aby zacząć")).toBeInTheDocument();
    });

    it("powinien wyświetlić overlay z komunikatem Reset gdy running=false i cards.length = 0", () => {
      // Arrange
      const cards: (CardVM & { status: CardStatus })[] = [];

      // Act
      render(<BoardGrid cards={cards} running={false} onCardClick={mockOnCardClick} />);

      // Assert
      expect(screen.getByText("Wciśnij Reset aby powtórzyć")).toBeInTheDocument();
    });

    it("overlay powinien mieć półprzezroczystą nakładkę", () => {
      // Arrange
      const cards = [createMockCard("Test", "pair-1")];

      // Act
      const { container } = render(<BoardGrid cards={cards} running={false} onCardClick={mockOnCardClick} />);

      // Assert
      const overlay = container.querySelector(".absolute.inset-0.bg-white.opacity-50");
      expect(overlay).toBeInTheDocument();
    });

    it("overlay powinien mieć centrowany tekst", () => {
      // Arrange
      const cards = [createMockCard("Test", "pair-1")];

      // Act
      const { container } = render(<BoardGrid cards={cards} running={false} onCardClick={mockOnCardClick} />);

      // Assert
      const overlay = container.querySelector(".absolute.inset-0");
      expect(overlay).toHaveClass("flex", "items-center", "justify-center");
    });
  });

  describe("Disabled state podczas animacji", () => {
    it("karty powinny być disabled gdy jakakolwiek karta ma status success", () => {
      // Arrange
      const cards = [createMockCard("Apple", "pair-1"), createMockCard("Jabłko", "pair-1", "success")];

      // Act
      render(<BoardGrid cards={cards} running={true} onCardClick={mockOnCardClick} />);

      // Assert
      const card1 = screen.getByTestId("card-Apple");
      const card2 = screen.getByTestId("card-Jabłko");
      expect(card1).toBeDisabled();
      expect(card2).toBeDisabled();
    });

    it("karty powinny być disabled gdy jakakolwiek karta ma status failure", () => {
      // Arrange
      const cards = [createMockCard("Apple", "pair-1"), createMockCard("Dog", "pair-2", "failure")];

      // Act
      render(<BoardGrid cards={cards} running={true} onCardClick={mockOnCardClick} />);

      // Assert
      const card1 = screen.getByTestId("card-Apple");
      const card2 = screen.getByTestId("card-Dog");
      expect(card1).toBeDisabled();
      expect(card2).toBeDisabled();
    });

    it("karty nie powinny być disabled gdy wszystkie mają status idle lub selected", () => {
      // Arrange
      const cards = [createMockCard("Apple", "pair-1", "idle"), createMockCard("Jabłko", "pair-1", "selected")];

      // Act
      render(<BoardGrid cards={cards} running={true} onCardClick={mockOnCardClick} />);

      // Assert
      const card1 = screen.getByTestId("card-Apple");
      const card2 = screen.getByTestId("card-Jabłko");
      expect(card1).not.toBeDisabled();
      expect(card2).not.toBeDisabled();
    });

    it("karty powinny być disabled gdy wiele kart animuje się jednocześnie", () => {
      // Arrange
      const cards = [
        createMockCard("Apple", "pair-1", "success"),
        createMockCard("Jabłko", "pair-1", "success"),
        createMockCard("Dog", "pair-2", "failure"),
        createMockCard("Pies", "pair-2", "failure"),
      ];

      // Act
      render(<BoardGrid cards={cards} running={true} onCardClick={mockOnCardClick} />);

      // Assert
      const allCards = screen.getAllByRole("button");
      allCards.forEach((card) => {
        expect(card).toBeDisabled();
      });
    });
  });

  describe("Nawigacja między poziomami", () => {
    it("powinien wyświetlić przycisk Poprzedni level gdy hasPrev=true", () => {
      // Arrange
      const cards: (CardVM & { status: CardStatus })[] = [];
      const levels = [1, 2, 3];
      const currentLevel = 2;

      // Act
      render(
        <BoardGrid
          cards={cards}
          running={false}
          onCardClick={mockOnCardClick}
          levels={levels}
          currentLevel={currentLevel}
          navigateToLevel={mockNavigateToLevel}
        />
      );

      // Assert
      expect(screen.getByText("Poprzedni level")).toBeInTheDocument();
    });

    it("powinien wyświetlić przycisk Następny level gdy hasNext=true", () => {
      // Arrange
      const cards: (CardVM & { status: CardStatus })[] = [];
      const levels = [1, 2, 3];
      const currentLevel = 2;

      // Act
      render(
        <BoardGrid
          cards={cards}
          running={false}
          onCardClick={mockOnCardClick}
          levels={levels}
          currentLevel={currentLevel}
          navigateToLevel={mockNavigateToLevel}
        />
      );

      // Assert
      expect(screen.getByText("Następny level")).toBeInTheDocument();
    });

    it("nie powinien wyświetlić przycisku Poprzedni level gdy jesteśmy na pierwszym poziomie", () => {
      // Arrange
      const cards: (CardVM & { status: CardStatus })[] = [];
      const levels = [1, 2, 3];
      const currentLevel = 1;

      // Act
      render(
        <BoardGrid
          cards={cards}
          running={false}
          onCardClick={mockOnCardClick}
          levels={levels}
          currentLevel={currentLevel}
          navigateToLevel={mockNavigateToLevel}
        />
      );

      // Assert
      expect(screen.queryByText("Poprzedni level")).not.toBeInTheDocument();
    });

    it("nie powinien wyświetlić przycisku Następny level gdy jesteśmy na ostatnim poziomie", () => {
      // Arrange
      const cards: (CardVM & { status: CardStatus })[] = [];
      const levels = [1, 2, 3];
      const currentLevel = 3;

      // Act
      render(
        <BoardGrid
          cards={cards}
          running={false}
          onCardClick={mockOnCardClick}
          levels={levels}
          currentLevel={currentLevel}
          navigateToLevel={mockNavigateToLevel}
        />
      );

      // Assert
      expect(screen.queryByText("Następny level")).not.toBeInTheDocument();
    });

    it("powinien wywołać navigateToLevel z poprzednim poziomem przy kliknięciu Poprzedni", async () => {
      // Arrange
      const user = userEvent.setup();
      const cards: (CardVM & { status: CardStatus })[] = [];
      const levels = [1, 2, 3];
      const currentLevel = 2;

      // Act
      render(
        <BoardGrid
          cards={cards}
          running={false}
          onCardClick={mockOnCardClick}
          levels={levels}
          currentLevel={currentLevel}
          navigateToLevel={mockNavigateToLevel}
        />
      );
      await user.click(screen.getByText("Poprzedni level"));

      // Assert
      expect(mockNavigateToLevel).toHaveBeenCalledTimes(1);
      expect(mockNavigateToLevel).toHaveBeenCalledWith(1);
    });

    it("powinien wywołać navigateToLevel z następnym poziomem przy kliknięciu Następny", async () => {
      // Arrange
      const user = userEvent.setup();
      const cards: (CardVM & { status: CardStatus })[] = [];
      const levels = [1, 2, 3];
      const currentLevel = 2;

      // Act
      render(
        <BoardGrid
          cards={cards}
          running={false}
          onCardClick={mockOnCardClick}
          levels={levels}
          currentLevel={currentLevel}
          navigateToLevel={mockNavigateToLevel}
        />
      );
      await user.click(screen.getByText("Następny level"));

      // Assert
      expect(mockNavigateToLevel).toHaveBeenCalledTimes(1);
      expect(mockNavigateToLevel).toHaveBeenCalledWith(3);
    });

    it("nie powinien wyświetlać przycisków nawigacji gdy cards.length > 0", () => {
      // Arrange
      const cards = [createMockCard("Test", "pair-1")];
      const levels = [1, 2, 3];
      const currentLevel = 2;

      // Act
      render(
        <BoardGrid
          cards={cards}
          running={false}
          onCardClick={mockOnCardClick}
          levels={levels}
          currentLevel={currentLevel}
          navigateToLevel={mockNavigateToLevel}
        />
      );

      // Assert
      expect(screen.queryByText("Poprzedni level")).not.toBeInTheDocument();
      expect(screen.queryByText("Następny level")).not.toBeInTheDocument();
    });

    it("nie powinien wyświetlać przycisków nawigacji gdy running=true", () => {
      // Arrange
      const cards: (CardVM & { status: CardStatus })[] = [];
      const levels = [1, 2, 3];
      const currentLevel = 2;

      // Act
      render(
        <BoardGrid
          cards={cards}
          running={true}
          onCardClick={mockOnCardClick}
          levels={levels}
          currentLevel={currentLevel}
          navigateToLevel={mockNavigateToLevel}
        />
      );

      // Assert
      expect(screen.queryByText("Poprzedni level")).not.toBeInTheDocument();
      expect(screen.queryByText("Następny level")).not.toBeInTheDocument();
    });

    it("przyciski nawigacji powinny być disabled gdy currentLevel=undefined", () => {
      // Arrange
      const cards: (CardVM & { status: CardStatus })[] = [];
      const levels = [1, 2, 3];

      // Act
      render(
        <BoardGrid
          cards={cards}
          running={false}
          onCardClick={mockOnCardClick}
          levels={levels}
          currentLevel={undefined}
          navigateToLevel={mockNavigateToLevel}
        />
      );

      // Assert
      // Przyciski nie powinny być widoczne gdy currentLevel undefined
      expect(screen.queryByText("Poprzedni level")).not.toBeInTheDocument();
      expect(screen.queryByText("Następny level")).not.toBeInTheDocument();
    });
  });

  describe("Edge cases i warunki brzegowe", () => {
    it("powinien poprawnie renderować pojedynczą kartę", () => {
      // Arrange
      const cards = [createMockCard("Single", "pair-1")];

      // Act
      render(<BoardGrid cards={cards} running={true} onCardClick={mockOnCardClick} />);

      // Assert
      expect(screen.getByTestId("card-Single")).toBeInTheDocument();
    });

    it("powinien poprawnie renderować dużą liczbę kart (12 par = 24 karty)", () => {
      // Arrange
      const cards: (CardVM & { status: CardStatus })[] = [];
      for (let i = 1; i <= 12; i++) {
        cards.push(createMockCard(`Term${i}`, `pair-${i}`));
        cards.push(createMockCard(`Definition${i}`, `pair-${i}`));
      }

      // Act
      render(<BoardGrid cards={cards} running={true} onCardClick={mockOnCardClick} />);

      // Assert
      const allCards = screen.getAllByRole("button");
      expect(allCards.length).toBe(24);
    });

    it("powinien zachować unikalne klucze dla kart z tym samym tekstem", () => {
      // Arrange
      const cards = [createMockCard("Test", "pair-1"), createMockCard("Test", "pair-2")];

      // Act
      const { container } = render(<BoardGrid cards={cards} running={true} onCardClick={mockOnCardClick} />);

      // Assert
      const buttons = container.querySelectorAll('button[data-testid="card-Test"]');
      expect(buttons.length).toBe(2);
    });

    it("powinien działać bez opcjonalnych props levels i navigateToLevel", () => {
      // Arrange
      const cards = [createMockCard("Test", "pair-1")];

      // Act
      render(<BoardGrid cards={cards} running={false} onCardClick={mockOnCardClick} />);

      // Assert
      expect(screen.getByText("Wciśnij Start aby zacząć")).toBeInTheDocument();
      expect(screen.queryByText("Poprzedni level")).not.toBeInTheDocument();
      expect(screen.queryByText("Następny level")).not.toBeInTheDocument();
    });

    it("powinien działać z pustą tablicą levels", () => {
      // Arrange
      const cards: (CardVM & { status: CardStatus })[] = [];
      const levels: number[] = [];

      // Act
      render(
        <BoardGrid
          cards={cards}
          running={false}
          onCardClick={mockOnCardClick}
          levels={levels}
          currentLevel={1}
          navigateToLevel={mockNavigateToLevel}
        />
      );

      // Assert
      expect(screen.queryByText("Poprzedni level")).not.toBeInTheDocument();
      expect(screen.queryByText("Następny level")).not.toBeInTheDocument();
    });

    it("powinien obsłużyć currentLevel=0", () => {
      // Arrange
      const cards: (CardVM & { status: CardStatus })[] = [];
      const levels = [0, 1, 2];
      const currentLevel = 0;

      // Act
      render(
        <BoardGrid
          cards={cards}
          running={false}
          onCardClick={mockOnCardClick}
          levels={levels}
          currentLevel={currentLevel}
          navigateToLevel={mockNavigateToLevel}
        />
      );

      // Assert
      expect(screen.queryByText("Poprzedni level")).not.toBeInTheDocument();
      expect(screen.getByText("Następny level")).toBeInTheDocument();
    });

    it("nie powinien wywołać navigateToLevel gdy nie jest przekazana", async () => {
      // Arrange
      const user = userEvent.setup();
      const cards: (CardVM & { status: CardStatus })[] = [];
      const levels = [1, 2, 3];
      const currentLevel = 2;

      // Act
      render(
        <BoardGrid
          cards={cards}
          running={false}
          onCardClick={mockOnCardClick}
          levels={levels}
          currentLevel={currentLevel}
        />
      );

      // Assert
      // Przyciski powinny istnieć
      const prevButton = screen.getByText("Poprzedni level");
      expect(prevButton).toBeInTheDocument();

      // Kliknięcie nie powinno spowodować błędu
      await user.click(prevButton);
      // Brak asercji - test przechodzi jeśli nie ma błędu
    });
  });

  describe("Integracja między kartami a stanem animacji", () => {
    it("wszystkie karty powinny być disabled podczas animacji sukcesu jednej pary", () => {
      // Arrange
      const cards = [
        createMockCard("Apple", "pair-1", "success"),
        createMockCard("Jabłko", "pair-1", "success"),
        createMockCard("Dog", "pair-2", "idle"),
        createMockCard("Pies", "pair-2", "idle"),
      ];

      // Act
      render(<BoardGrid cards={cards} running={true} onCardClick={mockOnCardClick} />);

      // Assert
      const allCards = screen.getAllByRole("button");
      allCards.forEach((card) => {
        expect(card).toBeDisabled();
      });
    });

    it("wszystkie karty powinny być disabled podczas animacji błędu", () => {
      // Arrange
      const cards = [
        createMockCard("Apple", "pair-1", "failure"),
        createMockCard("Dog", "pair-2", "failure"),
        createMockCard("Jabłko", "pair-1", "idle"),
        createMockCard("Pies", "pair-2", "idle"),
      ];

      // Act
      render(<BoardGrid cards={cards} running={true} onCardClick={mockOnCardClick} />);

      // Assert
      const allCards = screen.getAllByRole("button");
      allCards.forEach((card) => {
        expect(card).toBeDisabled();
      });
    });

    it("karty z statusem selected nie powinny powodować disable innych kart", () => {
      // Arrange
      const cards = [
        createMockCard("Apple", "pair-1", "selected"),
        createMockCard("Jabłko", "pair-1", "idle"),
        createMockCard("Dog", "pair-2", "idle"),
      ];

      // Act
      render(<BoardGrid cards={cards} running={true} onCardClick={mockOnCardClick} />);

      // Assert
      const allCards = screen.getAllByRole("button");
      allCards.forEach((card) => {
        expect(card).not.toBeDisabled();
      });
    });
  });

  describe("Pozycjonowanie i layout", () => {
    it("container przycisków nawigacji powinien być na top-[60%]", () => {
      // Arrange
      const cards: (CardVM & { status: CardStatus })[] = [];
      const levels = [1, 2, 3];
      const currentLevel = 2;

      // Act
      const { container } = render(
        <BoardGrid
          cards={cards}
          running={false}
          onCardClick={mockOnCardClick}
          levels={levels}
          currentLevel={currentLevel}
          navigateToLevel={mockNavigateToLevel}
        />
      );

      // Assert
      const navContainer = container.querySelector(".absolute.left-0.right-0.top-\\[60\\%\\]");
      expect(navContainer).toBeInTheDocument();
    });

    it("karty powinny być w flex-wrap kontenerze z justify-center", () => {
      // Arrange
      const cards = [createMockCard("Test", "pair-1")];

      // Act
      const { container } = render(<BoardGrid cards={cards} running={true} onCardClick={mockOnCardClick} />);

      // Assert
      const cardsContainer = container.querySelector(".flex.flex-wrap.h-fit.justify-center.mx-auto");
      expect(cardsContainer).toBeInTheDocument();
    });

    it("główny kontener powinien mieć bg-secondary", () => {
      // Arrange
      const cards = [createMockCard("Test", "pair-1")];

      // Act
      const { container } = render(<BoardGrid cards={cards} running={true} onCardClick={mockOnCardClick} />);

      // Assert
      const mainContainer = container.firstChild as HTMLElement;
      expect(mainContainer).toHaveClass("bg-secondary");
    });
  });

  describe("Teksty i komunikaty", () => {
    it("powinien wyświetlić właściwy komunikat dla Start", () => {
      // Arrange
      const cards = [createMockCard("Test", "pair-1")];

      // Act
      render(<BoardGrid cards={cards} running={false} onCardClick={mockOnCardClick} />);

      // Assert
      const message = screen.getByText("Wciśnij Start aby zacząć");
      expect(message).toBeInTheDocument();
      expect(message.tagName).toBe("SPAN");
    });

    it("powinien wyświetlić właściwy komunikat dla Reset", () => {
      // Arrange
      const cards: (CardVM & { status: CardStatus })[] = [];

      // Act
      render(<BoardGrid cards={cards} running={false} onCardClick={mockOnCardClick} />);

      // Assert
      const message = screen.getByText("Wciśnij Reset aby powtórzyć");
      expect(message).toBeInTheDocument();
      expect(message.tagName).toBe("SPAN");
    });

    it("komunikaty powinny mieć odpowiednie style (bold, xl, select-none)", () => {
      // Arrange
      const cards = [createMockCard("Test", "pair-1")];

      // Act
      const { container } = render(<BoardGrid cards={cards} running={false} onCardClick={mockOnCardClick} />);

      // Assert
      const overlay = container.querySelector(".absolute.inset-0");
      expect(overlay).toHaveClass("text-xl", "font-bold", "select-none", "cursor-default");
    });
  });

  describe("Renderowanie z różnymi kombinacjami statusów", () => {
    it("powinien poprawnie renderować mix wszystkich statusów", () => {
      // Arrange
      const cards = [
        createMockCard("Card1", "pair-1", "idle"),
        createMockCard("Card2", "pair-2", "selected"),
        createMockCard("Card3", "pair-3", "success"),
        createMockCard("Card4", "pair-4", "failure"),
      ];

      // Act
      render(<BoardGrid cards={cards} running={true} onCardClick={mockOnCardClick} />);

      // Assert
      expect(screen.getByTestId("card-Card1")).toHaveAttribute("data-status", "idle");
      expect(screen.getByTestId("card-Card2")).toHaveAttribute("data-status", "selected");
      expect(screen.getByTestId("card-Card3")).toHaveAttribute("data-status", "success");
      expect(screen.getByTestId("card-Card4")).toHaveAttribute("data-status", "failure");
    });

    it("powinien przekazać disabled=true do wszystkich kart gdy któraś ma success", () => {
      // Arrange
      const cards = [createMockCard("Card1", "pair-1", "idle"), createMockCard("Card2", "pair-1", "success")];

      // Act
      render(<BoardGrid cards={cards} running={true} onCardClick={mockOnCardClick} />);

      // Assert
      expect(screen.getByTestId("card-Card1")).toBeDisabled();
      expect(screen.getByTestId("card-Card2")).toBeDisabled();
    });

    it("powinien przekazać disabled=false do wszystkich kart gdy żadna nie animuje", () => {
      // Arrange
      const cards = [
        createMockCard("Card1", "pair-1", "idle"),
        createMockCard("Card2", "pair-1", "idle"),
        createMockCard("Card3", "pair-2", "selected"),
      ];

      // Act
      render(<BoardGrid cards={cards} running={true} onCardClick={mockOnCardClick} />);

      // Assert
      expect(screen.getByTestId("card-Card1")).not.toBeDisabled();
      expect(screen.getByTestId("card-Card2")).not.toBeDisabled();
      expect(screen.getByTestId("card-Card3")).not.toBeDisabled();
    });
  });

  describe("Poziomy - logika hasPrev i hasNext", () => {
    it("hasPrev powinien być true gdy currentLevel-1 istnieje w levels", () => {
      // Arrange
      const cards: (CardVM & { status: CardStatus })[] = [];
      const levels = [1, 2, 3, 5]; // Brak 4
      const currentLevel = 3;

      // Act
      render(
        <BoardGrid
          cards={cards}
          running={false}
          onCardClick={mockOnCardClick}
          levels={levels}
          currentLevel={currentLevel}
          navigateToLevel={mockNavigateToLevel}
        />
      );

      // Assert
      expect(screen.getByText("Poprzedni level")).toBeInTheDocument();
    });

    it("hasNext powinien być true gdy currentLevel+1 istnieje w levels", () => {
      // Arrange
      const cards: (CardVM & { status: CardStatus })[] = [];
      const levels = [1, 2, 3, 5]; // Brak 4
      const currentLevel = 2;

      // Act
      render(
        <BoardGrid
          cards={cards}
          running={false}
          onCardClick={mockOnCardClick}
          levels={levels}
          currentLevel={currentLevel}
          navigateToLevel={mockNavigateToLevel}
        />
      );

      // Assert
      expect(screen.getByText("Następny level")).toBeInTheDocument();
    });

    it("hasNext powinien być false gdy currentLevel+1 nie istnieje w levels", () => {
      // Arrange
      const cards: (CardVM & { status: CardStatus })[] = [];
      const levels = [1, 2, 5]; // Brak 3
      const currentLevel = 2;

      // Act
      render(
        <BoardGrid
          cards={cards}
          running={false}
          onCardClick={mockOnCardClick}
          levels={levels}
          currentLevel={currentLevel}
          navigateToLevel={mockNavigateToLevel}
        />
      );

      // Assert
      expect(screen.queryByText("Następny level")).not.toBeInTheDocument();
    });

    it("powinien obsługiwać nieciągłe numery poziomów - brak przycisku gdy brak sąsiadów", () => {
      // Arrange
      const cards: (CardVM & { status: CardStatus })[] = [];
      const levels = [1, 5, 10, 15];
      const currentLevel = 10;

      // Act
      render(
        <BoardGrid
          cards={cards}
          running={false}
          onCardClick={mockOnCardClick}
          levels={levels}
          currentLevel={currentLevel}
          navigateToLevel={mockNavigateToLevel}
        />
      );

      // Assert
      // currentLevel=10, więc prev=9 (nie ma w levels), next=11 (nie ma w levels)
      expect(screen.queryByText("Poprzedni level")).not.toBeInTheDocument();
      expect(screen.queryByText("Następny level")).not.toBeInTheDocument();
    });

    it("powinien obsługiwać nieciągłe numery poziomów - wyświetlanie przycisku gdy jest sąsiad", () => {
      // Arrange
      const cards: (CardVM & { status: CardStatus })[] = [];
      const levels = [5, 6, 10, 15];
      const currentLevel = 6;

      // Act
      render(
        <BoardGrid
          cards={cards}
          running={false}
          onCardClick={mockOnCardClick}
          levels={levels}
          currentLevel={currentLevel}
          navigateToLevel={mockNavigateToLevel}
        />
      );

      // Assert
      // currentLevel=6, więc prev=5 (jest w levels!), next=7 (nie ma w levels)
      expect(screen.getByText("Poprzedni level")).toBeInTheDocument();
      expect(screen.queryByText("Następny level")).not.toBeInTheDocument();
    });
  });

  describe("Kliknięcia w przyciski nawigacji - edge cases", () => {
    it("wielokrotne kliknięcia w przycisk Poprzedni powinny wywołać funkcję wiele razy", async () => {
      // Arrange
      const user = userEvent.setup();
      const cards: (CardVM & { status: CardStatus })[] = [];
      const levels = [1, 2, 3];
      const currentLevel = 3;

      // Act
      render(
        <BoardGrid
          cards={cards}
          running={false}
          onCardClick={mockOnCardClick}
          levels={levels}
          currentLevel={currentLevel}
          navigateToLevel={mockNavigateToLevel}
        />
      );
      const prevButton = screen.getByText("Poprzedni level");
      await user.click(prevButton);
      await user.click(prevButton);
      await user.click(prevButton);

      // Assert
      expect(mockNavigateToLevel).toHaveBeenCalledTimes(3);
      expect(mockNavigateToLevel).toHaveBeenCalledWith(2);
    });

    it("wielokrotne kliknięcia w przycisk Następny powinny wywołać funkcję wiele razy", async () => {
      // Arrange
      const user = userEvent.setup();
      const cards: (CardVM & { status: CardStatus })[] = [];
      const levels = [1, 2, 3];
      const currentLevel = 1;

      // Act
      render(
        <BoardGrid
          cards={cards}
          running={false}
          onCardClick={mockOnCardClick}
          levels={levels}
          currentLevel={currentLevel}
          navigateToLevel={mockNavigateToLevel}
        />
      );
      const nextButton = screen.getByText("Następny level");
      await user.click(nextButton);
      await user.click(nextButton);

      // Assert
      expect(mockNavigateToLevel).toHaveBeenCalledTimes(2);
      expect(mockNavigateToLevel).toHaveBeenCalledWith(2);
    });
  });

  describe("Style przycisków nawigacji", () => {
    it("przyciski nawigacji powinny mieć odpowiednie klasy stylu", () => {
      // Arrange
      const cards: (CardVM & { status: CardStatus })[] = [];
      const levels = [1, 2, 3];
      const currentLevel = 2;

      // Act
      render(
        <BoardGrid
          cards={cards}
          running={false}
          onCardClick={mockOnCardClick}
          levels={levels}
          currentLevel={currentLevel}
          navigateToLevel={mockNavigateToLevel}
        />
      );

      // Assert
      const prevButton = screen.getByText("Poprzedni level");
      const nextButton = screen.getByText("Następny level");

      expect(prevButton).toHaveClass("cursor-pointer", "bg-[var(--color-primary)]", "text-white", "rounded");
      expect(nextButton).toHaveClass("cursor-pointer", "bg-[var(--color-primary)]", "text-white", "rounded");
    });

    it("kontener przycisków powinien mieć gap-4", () => {
      // Arrange
      const cards: (CardVM & { status: CardStatus })[] = [];
      const levels = [1, 2, 3];
      const currentLevel = 2;

      // Act
      const { container } = render(
        <BoardGrid
          cards={cards}
          running={false}
          onCardClick={mockOnCardClick}
          levels={levels}
          currentLevel={currentLevel}
          navigateToLevel={mockNavigateToLevel}
        />
      );

      // Assert
      const buttonsContainer = container.querySelector(".flex.gap-4");
      expect(buttonsContainer).toBeInTheDocument();
    });
  });
});
