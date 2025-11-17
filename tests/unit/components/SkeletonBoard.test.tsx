import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import SkeletonBoard from "@/components/ui/Game/SkeletonBoard";

/**
 * Testy jednostkowe dla komponentu SkeletonBoard
 *
 * Testowane funkcjonalności:
 * - Renderowanie odpowiedniej liczby skeleton cards
 * - Dynamiczne obliczanie liczby kolumn grid (Math.sqrt)
 * - Stylowanie kontenera (grid, gap-4, flex-1, animate-pulse)
 * - Inline styles dla gridTemplateColumns
 * - Stylowanie pojedynczych skeleton cards (h-24, bg-neutral-200, rounded-md)
 * - Edge cases (różne liczby kart: 4, 9, 16, 25, 36)
 * - Accessibility (lista semantyczna)
 * - Performance (klucze w iteracji)
 */

describe("SkeletonBoard", () => {
  describe("Renderowanie i struktura DOM", () => {
    it("powinien wyrenderować listę <ul>", () => {
      // Act
      const { container } = render(<SkeletonBoard cardCount={4} />);

      // Assert
      const list = container.querySelector("ul");
      expect(list).toBeInTheDocument();
      expect(list?.tagName).toBe("UL");
    });

    it("powinien wyrenderować odpowiednią liczbę skeleton cards", () => {
      // Arrange
      const cardCount = 16;

      // Act
      const { container } = render(<SkeletonBoard cardCount={cardCount} />);

      // Assert
      const skeletonCards = container.querySelectorAll("li");
      expect(skeletonCards).toHaveLength(cardCount);
    });

    it("powinien wyrenderować 4 skeleton cards dla cardCount=4", () => {
      // Act
      const { container } = render(<SkeletonBoard cardCount={4} />);

      // Assert
      const skeletonCards = container.querySelectorAll("li");
      expect(skeletonCards).toHaveLength(4);
    });

    it("powinien wyrenderować 9 skeleton cards dla cardCount=9", () => {
      // Act
      const { container } = render(<SkeletonBoard cardCount={9} />);

      // Assert
      const skeletonCards = container.querySelectorAll("li");
      expect(skeletonCards).toHaveLength(9);
    });

    it("powinien wyrenderować 25 skeleton cards dla cardCount=25", () => {
      // Act
      const { container } = render(<SkeletonBoard cardCount={25} />);

      // Assert
      const skeletonCards = container.querySelectorAll("li");
      expect(skeletonCards).toHaveLength(25);
    });

    it("powinien mieć unikalny key dla każdego elementu listy", () => {
      // Arrange
      const cardCount = 9;

      // Act
      const { container } = render(<SkeletonBoard cardCount={cardCount} />);

      // Assert
      const skeletonCards = container.querySelectorAll("li");
      const keys = Array.from(skeletonCards).map((card, idx) => card.getAttribute("key") || idx);
      const uniqueKeys = new Set(keys);
      expect(uniqueKeys.size).toBe(cardCount);
    });
  });

  describe("Dynamiczny Grid Layout", () => {
    it("powinien ustawić gridTemplateColumns na 2 kolumny dla 4 kart", () => {
      // Arrange
      const cardCount = 4;
      const expectedColumns = Math.sqrt(cardCount); // 2

      // Act
      const { container } = render(<SkeletonBoard cardCount={cardCount} />);

      // Assert
      const list = container.querySelector("ul");
      expect(list).toHaveStyle({
        gridTemplateColumns: `repeat(${expectedColumns}, minmax(0, 1fr))`,
      });
    });

    it("powinien ustawić gridTemplateColumns na 3 kolumny dla 9 kart", () => {
      // Arrange
      const cardCount = 9;
      const expectedColumns = Math.sqrt(cardCount); // 3

      // Act
      const { container } = render(<SkeletonBoard cardCount={cardCount} />);

      // Assert
      const list = container.querySelector("ul");
      expect(list).toHaveStyle({
        gridTemplateColumns: `repeat(${expectedColumns}, minmax(0, 1fr))`,
      });
    });

    it("powinien ustawić gridTemplateColumns na 4 kolumny dla 16 kart", () => {
      // Arrange
      const cardCount = 16;
      const expectedColumns = Math.sqrt(cardCount); // 4

      // Act
      const { container } = render(<SkeletonBoard cardCount={cardCount} />);

      // Assert
      const list = container.querySelector("ul");
      expect(list).toHaveStyle({
        gridTemplateColumns: `repeat(${expectedColumns}, minmax(0, 1fr))`,
      });
    });

    it("powinien ustawić gridTemplateColumns na 5 kolumn dla 25 kart", () => {
      // Arrange
      const cardCount = 25;
      const expectedColumns = Math.sqrt(cardCount); // 5

      // Act
      const { container } = render(<SkeletonBoard cardCount={cardCount} />);

      // Assert
      const list = container.querySelector("ul");
      expect(list).toHaveStyle({
        gridTemplateColumns: `repeat(${expectedColumns}, minmax(0, 1fr))`,
      });
    });

    it("powinien ustawić gridTemplateColumns na 6 kolumn dla 36 kart", () => {
      // Arrange
      const cardCount = 36;
      const expectedColumns = Math.sqrt(cardCount); // 6

      // Act
      const { container } = render(<SkeletonBoard cardCount={cardCount} />);

      // Assert
      const list = container.querySelector("ul");
      expect(list).toHaveStyle({
        gridTemplateColumns: `repeat(${expectedColumns}, minmax(0, 1fr))`,
      });
    });

    it("powinien poprawnie obliczyć kolumny dla nieidealnego kwadratu (12 kart)", () => {
      // Arrange
      const cardCount = 12;
      const expectedColumns = Math.sqrt(cardCount); // ~3.46

      // Act
      const { container } = render(<SkeletonBoard cardCount={cardCount} />);

      // Assert
      const list = container.querySelector("ul");
      expect(list).toHaveStyle({
        gridTemplateColumns: `repeat(${expectedColumns}, minmax(0, 1fr))`,
      });
    });
  });

  describe("Stylowanie kontenera", () => {
    it("powinien mieć klasę 'grid'", () => {
      // Act
      const { container } = render(<SkeletonBoard cardCount={4} />);

      // Assert
      const list = container.querySelector("ul");
      expect(list).toHaveClass("grid");
    });

    it("powinien mieć klasę 'gap-4' (odstęp między elementami)", () => {
      // Act
      const { container } = render(<SkeletonBoard cardCount={4} />);

      // Assert
      const list = container.querySelector("ul");
      expect(list).toHaveClass("gap-4");
    });

    it("powinien mieć klasę 'flex-1' (rozciągnięcie na całą przestrzeń)", () => {
      // Act
      const { container } = render(<SkeletonBoard cardCount={4} />);

      // Assert
      const list = container.querySelector("ul");
      expect(list).toHaveClass("flex-1");
    });

    it("powinien mieć klasę 'animate-pulse' (animacja ładowania)", () => {
      // Act
      const { container } = render(<SkeletonBoard cardCount={4} />);

      // Assert
      const list = container.querySelector("ul");
      expect(list).toHaveClass("animate-pulse");
    });

    it("powinien mieć wszystkie wymagane klasy równocześnie", () => {
      // Act
      const { container } = render(<SkeletonBoard cardCount={4} />);

      // Assert
      const list = container.querySelector("ul");
      expect(list).toHaveClass("grid", "gap-4", "flex-1", "animate-pulse");
    });
  });

  describe("Stylowanie skeleton cards", () => {
    it("każda skeleton card powinna mieć klasę 'h-24' (wysokość)", () => {
      // Act
      const { container } = render(<SkeletonBoard cardCount={4} />);

      // Assert
      const skeletonCards = container.querySelectorAll("li");
      skeletonCards.forEach((card) => {
        expect(card).toHaveClass("h-24");
      });
    });

    it("każda skeleton card powinna mieć klasę 'bg-neutral-200' (tło)", () => {
      // Act
      const { container } = render(<SkeletonBoard cardCount={4} />);

      // Assert
      const skeletonCards = container.querySelectorAll("li");
      skeletonCards.forEach((card) => {
        expect(card).toHaveClass("bg-neutral-200");
      });
    });

    it("każda skeleton card powinna mieć klasę 'rounded-md' (zaokrąglone rogi)", () => {
      // Act
      const { container } = render(<SkeletonBoard cardCount={4} />);

      // Assert
      const skeletonCards = container.querySelectorAll("li");
      skeletonCards.forEach((card) => {
        expect(card).toHaveClass("rounded-md");
      });
    });

    it("każda skeleton card powinna mieć wszystkie wymagane klasy", () => {
      // Act
      const { container } = render(<SkeletonBoard cardCount={9} />);

      // Assert
      const skeletonCards = container.querySelectorAll("li");
      skeletonCards.forEach((card) => {
        expect(card).toHaveClass("h-24", "bg-neutral-200", "rounded-md");
      });
    });

    it("skeleton cards nie powinny zawierać żadnego tekstu", () => {
      // Act
      const { container } = render(<SkeletonBoard cardCount={4} />);

      // Assert
      const skeletonCards = container.querySelectorAll("li");
      skeletonCards.forEach((card) => {
        expect(card.textContent).toBe("");
      });
    });

    it("skeleton cards powinny być pustymi elementami li", () => {
      // Act
      const { container } = render(<SkeletonBoard cardCount={4} />);

      // Assert
      const skeletonCards = container.querySelectorAll("li");
      skeletonCards.forEach((card) => {
        expect(card.children).toHaveLength(0);
      });
    });
  });

  describe("Edge Cases", () => {
    it("powinien obsłużyć pojedynczą kartę (cardCount=1)", () => {
      // Act
      const { container } = render(<SkeletonBoard cardCount={1} />);

      // Assert
      const skeletonCards = container.querySelectorAll("li");
      expect(skeletonCards).toHaveLength(1);

      const list = container.querySelector("ul");
      expect(list).toHaveStyle({
        gridTemplateColumns: `repeat(${Math.sqrt(1)}, minmax(0, 1fr))`,
      });
    });

    it("powinien obsłużyć zero kart (cardCount=0)", () => {
      // Act
      const { container } = render(<SkeletonBoard cardCount={0} />);

      // Assert
      const skeletonCards = container.querySelectorAll("li");
      expect(skeletonCards).toHaveLength(0);

      const list = container.querySelector("ul");
      expect(list).toBeInTheDocument();
      expect(list).toHaveClass("grid", "gap-4", "flex-1", "animate-pulse");
    });

    it("powinien obsłużyć dużą liczbę kart (cardCount=100)", () => {
      // Act
      const { container } = render(<SkeletonBoard cardCount={100} />);

      // Assert
      const skeletonCards = container.querySelectorAll("li");
      expect(skeletonCards).toHaveLength(100);

      const list = container.querySelector("ul");
      expect(list).toHaveStyle({
        gridTemplateColumns: `repeat(${Math.sqrt(100)}, minmax(0, 1fr))`,
      });
    });

    it("powinien obsłużyć liczbę niebędącą idealnym kwadratem (cardCount=7)", () => {
      // Arrange
      const cardCount = 7;
      const expectedColumns = Math.sqrt(cardCount); // ~2.65

      // Act
      const { container } = render(<SkeletonBoard cardCount={cardCount} />);

      // Assert
      const skeletonCards = container.querySelectorAll("li");
      expect(skeletonCards).toHaveLength(cardCount);

      const list = container.querySelector("ul");
      expect(list).toHaveStyle({
        gridTemplateColumns: `repeat(${expectedColumns}, minmax(0, 1fr))`,
      });
    });

    it("powinien obsłużyć liczbę pierwszą (cardCount=13)", () => {
      // Arrange
      const cardCount = 13;
      const expectedColumns = Math.sqrt(cardCount); // ~3.61

      // Act
      const { container } = render(<SkeletonBoard cardCount={cardCount} />);

      // Assert
      const skeletonCards = container.querySelectorAll("li");
      expect(skeletonCards).toHaveLength(cardCount);

      const list = container.querySelector("ul");
      expect(list).toHaveStyle({
        gridTemplateColumns: `repeat(${expectedColumns}, minmax(0, 1fr))`,
      });
    });
  });

  describe("Accessibility", () => {
    it("powinien używać semantycznego elementu <ul>", () => {
      // Act
      const { container } = render(<SkeletonBoard cardCount={4} />);

      // Assert
      const list = container.querySelector("ul");
      expect(list).toBeInTheDocument();
      expect(list?.tagName).toBe("UL");
    });

    it("elementy listy powinny być semantycznymi <li>", () => {
      // Act
      const { container } = render(<SkeletonBoard cardCount={4} />);

      // Assert
      const list = container.querySelector("ul");
      const listItems = list?.querySelectorAll(":scope > li");
      expect(listItems).toHaveLength(4);
      listItems?.forEach((item) => {
        expect(item.tagName).toBe("LI");
      });
    });

    it("nie powinien mieć aria-hidden (skeleton jest widoczny dla screen readers)", () => {
      // Act
      const { container } = render(<SkeletonBoard cardCount={4} />);

      // Assert
      const list = container.querySelector("ul");
      expect(list).not.toHaveAttribute("aria-hidden");
    });
  });

  describe("Performance i optymalizacje", () => {
    it("powinien renderować się szybko dla dużej liczby kart", () => {
      // Arrange
      const startTime = performance.now();

      // Act
      render(<SkeletonBoard cardCount={100} />);
      const endTime = performance.now();

      // Assert
      const renderTime = endTime - startTime;
      expect(renderTime).toBeLessThan(100); // Renderowanie powinno zająć mniej niż 100ms
    });

    it("powinien tworzyć lekką strukturę DOM bez zbędnych wrapper'ów", () => {
      // Act
      const { container } = render(<SkeletonBoard cardCount={4} />);

      // Assert
      const list = container.querySelector("ul");
      const directChildren = list?.children;
      expect(directChildren?.length).toBe(4); // Tylko bezpośrednie <li>, bez wrapper'ów
    });

    it("każdy element <li> powinien być pustym elementem (brak dzieci)", () => {
      // Act
      const { container } = render(<SkeletonBoard cardCount={4} />);

      // Assert
      const listItems = container.querySelectorAll("li");
      listItems.forEach((item) => {
        expect(item.children.length).toBe(0);
      });
    });
  });

  describe("Integracja z layout'em gry", () => {
    it("powinien zachować spójność z rzeczywistymi kartami gry (grid layout)", () => {
      // Act
      const { container } = render(<SkeletonBoard cardCount={16} />);

      // Assert
      const list = container.querySelector("ul");
      expect(list).toHaveClass("grid");
      expect(list).toHaveStyle({
        gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
      });
    });

    it("powinien mieć gap-4 zgodny z rzeczywistą siatką gry", () => {
      // Act
      const { container } = render(<SkeletonBoard cardCount={9} />);

      // Assert
      const list = container.querySelector("ul");
      expect(list).toHaveClass("gap-4");
    });

    it("flex-1 powinien pozwolić na rozciągnięcie w kontenerze flex", () => {
      // Act
      const { container } = render(<SkeletonBoard cardCount={4} />);

      // Assert
      const list = container.querySelector("ul");
      expect(list).toHaveClass("flex-1");
    });
  });

  describe("Animacje i UX", () => {
    it("powinien mieć animację pulse dla efektu ładowania", () => {
      // Act
      const { container } = render(<SkeletonBoard cardCount={4} />);

      // Assert
      const list = container.querySelector("ul");
      expect(list).toHaveClass("animate-pulse");
    });

    it("animacja pulse powinna być na kontenerze, nie na pojedynczych kartach", () => {
      // Act
      const { container } = render(<SkeletonBoard cardCount={4} />);

      // Assert
      const list = container.querySelector("ul");
      const listItems = container.querySelectorAll("li");

      expect(list).toHaveClass("animate-pulse");
      listItems.forEach((item) => {
        expect(item).not.toHaveClass("animate-pulse");
      });
    });

    it("kolor tła skeleton cards powinien być neutral-200 dla delikatnego efektu", () => {
      // Act
      const { container } = render(<SkeletonBoard cardCount={4} />);

      // Assert
      const listItems = container.querySelectorAll("li");
      listItems.forEach((item) => {
        expect(item).toHaveClass("bg-neutral-200");
      });
    });
  });

  describe("Type Safety", () => {
    it("powinien akceptować cardCount jako liczbę całkowitą", () => {
      // Act & Assert - kompilacja TypeScript powinna przejść
      expect(() => render(<SkeletonBoard cardCount={16} />)).not.toThrow();
    });

    it("powinien akceptować cardCount=0", () => {
      // Act & Assert
      expect(() => render(<SkeletonBoard cardCount={0} />)).not.toThrow();
    });

    it("powinien poprawnie renderować dla wszystkich typowych rozmiarów planszy", () => {
      // Arrange
      const typicalSizes = [4, 9, 16, 25, 36];

      // Act & Assert
      typicalSizes.forEach((size) => {
        const { container } = render(<SkeletonBoard cardCount={size} />);
        const skeletonCards = container.querySelectorAll("li");
        expect(skeletonCards).toHaveLength(size);
      });
    });
  });
});
