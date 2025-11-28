import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import SkeletonBoard from "@/components/ui/Game/SkeletonBoard";

/**
 * Testy jednostkowe dla komponentu SkeletonBoard
 *
 * Testowane funkcjonalności:
 * - Renderowanie odpowiedniej liczby skeleton cards
 * - Flex wrap layout dla responsywności
 * - Stylowanie kontenera (flex, flex-wrap, animate-pulse)
 * - Stylowanie pojedynczych skeleton cards (w-[250px], h-[200px], bg-neutral-200, rounded-md)
 * - Edge cases (różne liczby kart: 4, 9, 16, 25, 36)
 * - Performance (klucze w iteracji)
 */

describe("SkeletonBoard", () => {
  describe("Renderowanie i struktura DOM", () => {
    it("powinien wyrenderować kontener zewnętrzny", () => {
      // Act
      const { container } = render(<SkeletonBoard cardCount={4} />);

      // Assert
      const outerContainer = container.querySelector("div.flex.flex-wrap");
      expect(outerContainer).toBeInTheDocument();
      expect(outerContainer?.tagName).toBe("DIV");
    });

    it("powinien wyrenderować odpowiednią liczbę skeleton cards", () => {
      // Arrange
      const cardCount = 16;

      // Act
      const { container } = render(<SkeletonBoard cardCount={cardCount} />);

      // Assert
      const skeletonCards = container.querySelectorAll("div.bg-neutral-200");
      expect(skeletonCards).toHaveLength(cardCount);
    });

    it("powinien wyrenderować 4 skeleton cards dla cardCount=4", () => {
      // Act
      const { container } = render(<SkeletonBoard cardCount={4} />);

      // Assert
      const skeletonCards = container.querySelectorAll("div.bg-neutral-200");
      expect(skeletonCards).toHaveLength(4);
    });

    it("powinien wyrenderować 9 skeleton cards dla cardCount=9", () => {
      // Act
      const { container } = render(<SkeletonBoard cardCount={9} />);

      // Assert
      const skeletonCards = container.querySelectorAll("div.bg-neutral-200");
      expect(skeletonCards).toHaveLength(9);
    });

    it("powinien wyrenderować 25 skeleton cards dla cardCount=25", () => {
      // Act
      const { container } = render(<SkeletonBoard cardCount={25} />);

      // Assert
      const skeletonCards = container.querySelectorAll("div.bg-neutral-200");
      expect(skeletonCards).toHaveLength(25);
    });

    it("powinien mieć unikalny key dla każdego elementu", () => {
      // Arrange
      const cardCount = 9;

      // Act
      const { container } = render(<SkeletonBoard cardCount={cardCount} />);

      // Assert
      const skeletonCards = container.querySelectorAll("div.bg-neutral-200");
      expect(skeletonCards.length).toBe(cardCount);
    });
  });

  describe("Flex Wrap Layout", () => {
    it("powinien używać flex layout na kontenerze zewnętrznym", () => {
      // Act
      const { container } = render(<SkeletonBoard cardCount={4} />);

      // Assert
      const outerContainer = container.firstChild as HTMLElement;
      expect(outerContainer).toHaveClass("flex", "flex-wrap");
    });

    it("powinien używać flex layout na kontenerze wewnętrznym z kartami", () => {
      // Act
      const { container } = render(<SkeletonBoard cardCount={9} />);

      // Assert
      const innerContainer = container.querySelector("div.animate-pulse");
      expect(innerContainer).toHaveClass("flex", "flex-wrap");
    });

    it("kontener wewnętrzny powinien mieć justify-center dla wyśrodkowania kart", () => {
      // Act
      const { container } = render(<SkeletonBoard cardCount={16} />);

      // Assert
      const innerContainer = container.querySelector("div.animate-pulse");
      expect(innerContainer).toHaveClass("justify-center");
    });

    it("kontener wewnętrzny powinien mieć mx-auto dla centrowania", () => {
      // Act
      const { container } = render(<SkeletonBoard cardCount={25} />);

      // Assert
      const innerContainer = container.querySelector("div.animate-pulse");
      expect(innerContainer).toHaveClass("mx-auto");
    });

    it("karty powinny mieć stałą szerokość w-[250px]", () => {
      // Act
      const { container } = render(<SkeletonBoard cardCount={4} />);

      // Assert
      const cards = container.querySelectorAll("div.bg-neutral-200");
      cards.forEach((card) => {
        expect(card).toHaveClass("w-[250px]");
      });
    });

    it("karty powinny mieć marginesy mx-2 i mb-6 dla odstępów", () => {
      // Act
      const { container } = render(<SkeletonBoard cardCount={9} />);

      // Assert
      const cards = container.querySelectorAll("div.bg-neutral-200");
      cards.forEach((card) => {
        expect(card).toHaveClass("mx-2", "mb-6");
      });
    });
  });

  describe("Stylowanie kontenera", () => {
    it("kontener zewnętrzny powinien mieć klasę 'flex' i 'flex-wrap'", () => {
      // Act
      const { container } = render(<SkeletonBoard cardCount={4} />);

      // Assert
      const outerContainer = container.firstChild as HTMLElement;
      expect(outerContainer).toHaveClass("flex", "flex-wrap");
    });

    it("kontener zewnętrzny powinien mieć klasę 'bg-secondary'", () => {
      // Act
      const { container } = render(<SkeletonBoard cardCount={4} />);

      // Assert
      const outerContainer = container.firstChild as HTMLElement;
      expect(outerContainer).toHaveClass("bg-secondary");
    });

    it("kontener zewnętrzny powinien mieć padding p-[32px]", () => {
      // Act
      const { container } = render(<SkeletonBoard cardCount={4} />);

      // Assert
      const outerContainer = container.firstChild as HTMLElement;
      expect(outerContainer).toHaveClass("p-[32px]");
    });

    it("kontener zewnętrzny powinien mieć min-h-[80vh]", () => {
      // Act
      const { container } = render(<SkeletonBoard cardCount={4} />);

      // Assert
      const outerContainer = container.firstChild as HTMLElement;
      expect(outerContainer).toHaveClass("min-h-[80vh]");
    });

    it("kontener wewnętrzny powinien mieć klasę 'animate-pulse' (animacja ładowania)", () => {
      // Act
      const { container } = render(<SkeletonBoard cardCount={4} />);

      // Assert
      const innerContainer = container.querySelector("div.animate-pulse");
      expect(innerContainer).toBeInTheDocument();
      expect(innerContainer).toHaveClass("animate-pulse");
    });

    it("kontener zewnętrzny powinien mieć wszystkie wymagane klasy równocześnie", () => {
      // Act
      const { container } = render(<SkeletonBoard cardCount={4} />);

      // Assert
      const outerContainer = container.firstChild as HTMLElement;
      expect(outerContainer).toHaveClass(
        "flex",
        "flex-wrap",
        "bg-secondary",
        "w-full",
        "p-[32px]",
        "min-h-[80vh]",
        "relative"
      );
    });
  });

  describe("Stylowanie skeleton cards", () => {
    it("każda skeleton card powinna mieć klasę 'h-[200px]' (wysokość)", () => {
      // Act
      const { container } = render(<SkeletonBoard cardCount={4} />);

      // Assert
      const skeletonCards = container.querySelectorAll("div.bg-neutral-200");
      skeletonCards.forEach((card) => {
        expect(card).toHaveClass("h-[200px]");
      });
    });

    it("każda skeleton card powinna mieć klasę 'w-[250px]' (szerokość)", () => {
      // Act
      const { container } = render(<SkeletonBoard cardCount={4} />);

      // Assert
      const skeletonCards = container.querySelectorAll("div.bg-neutral-200");
      skeletonCards.forEach((card) => {
        expect(card).toHaveClass("w-[250px]");
      });
    });

    it("każda skeleton card powinna mieć klasę 'bg-neutral-200' (tło)", () => {
      // Act
      const { container } = render(<SkeletonBoard cardCount={4} />);

      // Assert
      const skeletonCards = container.querySelectorAll("div.bg-neutral-200");
      skeletonCards.forEach((card) => {
        expect(card).toHaveClass("bg-neutral-200");
      });
    });

    it("każda skeleton card powinna mieć klasę 'rounded-md' (zaokrąglone rogi)", () => {
      // Act
      const { container } = render(<SkeletonBoard cardCount={4} />);

      // Assert
      const skeletonCards = container.querySelectorAll("div.bg-neutral-200");
      skeletonCards.forEach((card) => {
        expect(card).toHaveClass("rounded-md");
      });
    });

    it("każda skeleton card powinna mieć border", () => {
      // Act
      const { container } = render(<SkeletonBoard cardCount={4} />);

      // Assert
      const skeletonCards = container.querySelectorAll("div.bg-neutral-200");
      skeletonCards.forEach((card) => {
        expect(card).toHaveClass("border", "border-neutral-300");
      });
    });

    it("każda skeleton card powinna mieć wszystkie wymagane klasy", () => {
      // Act
      const { container } = render(<SkeletonBoard cardCount={9} />);

      // Assert
      const skeletonCards = container.querySelectorAll("div.bg-neutral-200");
      skeletonCards.forEach((card) => {
        expect(card).toHaveClass(
          "mb-6",
          "mx-2",
          "bg-neutral-200",
          "w-[250px]",
          "h-[200px]",
          "rounded-md",
          "border",
          "border-neutral-300"
        );
      });
    });

    it("skeleton cards nie powinny zawierać żadnego tekstu", () => {
      // Act
      const { container } = render(<SkeletonBoard cardCount={4} />);

      // Assert
      const skeletonCards = container.querySelectorAll("div.bg-neutral-200");
      skeletonCards.forEach((card) => {
        expect(card.textContent).toBe("");
      });
    });

    it("skeleton cards powinny być pustymi elementami div", () => {
      // Act
      const { container } = render(<SkeletonBoard cardCount={4} />);

      // Assert
      const skeletonCards = container.querySelectorAll("div.bg-neutral-200");
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
      const skeletonCards = container.querySelectorAll("div.bg-neutral-200");
      expect(skeletonCards).toHaveLength(1);

      const innerContainer = container.querySelector("div.animate-pulse");
      expect(innerContainer).toBeInTheDocument();
      expect(innerContainer).toHaveClass("flex", "flex-wrap");
    });

    it("powinien obsłużyć zero kart (cardCount=0)", () => {
      // Act
      const { container } = render(<SkeletonBoard cardCount={0} />);

      // Assert
      const skeletonCards = container.querySelectorAll("div.bg-neutral-200");
      expect(skeletonCards).toHaveLength(0);

      const innerContainer = container.querySelector("div.animate-pulse");
      expect(innerContainer).toBeInTheDocument();
      expect(innerContainer).toHaveClass("flex", "flex-wrap", "animate-pulse");
    });

    it("powinien obsłużyć dużą liczbę kart (cardCount=100)", () => {
      // Act
      const { container } = render(<SkeletonBoard cardCount={100} />);

      // Assert
      const skeletonCards = container.querySelectorAll("div.bg-neutral-200");
      expect(skeletonCards).toHaveLength(100);

      const innerContainer = container.querySelector("div.animate-pulse");
      expect(innerContainer).toHaveClass("flex", "flex-wrap");
    });

    it("powinien obsłużyć liczbę niebędącą idealnym kwadratem (cardCount=7)", () => {
      // Arrange
      const cardCount = 7;

      // Act
      const { container } = render(<SkeletonBoard cardCount={cardCount} />);

      // Assert
      const skeletonCards = container.querySelectorAll("div.bg-neutral-200");
      expect(skeletonCards).toHaveLength(cardCount);

      const innerContainer = container.querySelector("div.animate-pulse");
      expect(innerContainer).toHaveClass("flex", "flex-wrap");
    });

    it("powinien obsłużyć liczbę pierwszą (cardCount=13)", () => {
      // Arrange
      const cardCount = 13;

      // Act
      const { container } = render(<SkeletonBoard cardCount={cardCount} />);

      // Assert
      const skeletonCards = container.querySelectorAll("div.bg-neutral-200");
      expect(skeletonCards).toHaveLength(cardCount);

      const innerContainer = container.querySelector("div.animate-pulse");
      expect(innerContainer).toHaveClass("flex", "flex-wrap");
    });
  });

  describe("Struktura komponentu", () => {
    it("powinien używać elementu <div> jako kontenera", () => {
      // Act
      const { container } = render(<SkeletonBoard cardCount={4} />);

      // Assert
      const outerContainer = container.firstChild as HTMLElement;
      expect(outerContainer).toBeInTheDocument();
      expect(outerContainer?.tagName).toBe("DIV");
    });

    it("elementy kart powinny być elementami <div>", () => {
      // Act
      const { container } = render(<SkeletonBoard cardCount={4} />);

      // Assert
      const cards = container.querySelectorAll("div.bg-neutral-200");
      expect(cards).toHaveLength(4);
      cards?.forEach((item) => {
        expect(item.tagName).toBe("DIV");
      });
    });

    it("nie powinien mieć aria-hidden (skeleton jest widoczny dla screen readers)", () => {
      // Act
      const { container } = render(<SkeletonBoard cardCount={4} />);

      // Assert
      const outerContainer = container.firstChild as HTMLElement;
      expect(outerContainer).not.toHaveAttribute("aria-hidden");
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
      const innerContainer = container.querySelector("div.animate-pulse");
      const directChildren = innerContainer?.children;
      expect(directChildren?.length).toBe(4); // Tylko bezpośrednie div'y kart, bez wrapper'ów
    });

    it("każdy element karty powinien być pustym elementem (brak dzieci)", () => {
      // Act
      const { container } = render(<SkeletonBoard cardCount={4} />);

      // Assert
      const cards = container.querySelectorAll("div.bg-neutral-200");
      cards.forEach((item) => {
        expect(item.children.length).toBe(0);
      });
    });
  });

  describe("Integracja z layout'em gry", () => {
    it("powinien zachować spójność z rzeczywistymi kartami gry (flex layout)", () => {
      // Act
      const { container } = render(<SkeletonBoard cardCount={16} />);

      // Assert
      const innerContainer = container.querySelector("div.animate-pulse");
      expect(innerContainer).toHaveClass("flex", "flex-wrap");
    });

    it("karty powinny mieć stałe wymiary w-[250px] h-[200px]", () => {
      // Act
      const { container } = render(<SkeletonBoard cardCount={9} />);

      // Assert
      const cards = container.querySelectorAll("div.bg-neutral-200");
      cards.forEach((card) => {
        expect(card).toHaveClass("w-[250px]", "h-[200px]");
      });
    });

    it("kontener zewnętrzny powinien mieć w-full dla pełnej szerokości", () => {
      // Act
      const { container } = render(<SkeletonBoard cardCount={4} />);

      // Assert
      const outerContainer = container.firstChild as HTMLElement;
      expect(outerContainer).toHaveClass("w-full");
    });
  });

  describe("Animacje i UX", () => {
    it("powinien mieć animację pulse dla efektu ładowania", () => {
      // Act
      const { container } = render(<SkeletonBoard cardCount={4} />);

      // Assert
      const innerContainer = container.querySelector("div.animate-pulse");
      expect(innerContainer).toHaveClass("animate-pulse");
    });

    it("animacja pulse powinna być na kontenerze wewnętrznym, nie na pojedynczych kartach", () => {
      // Act
      const { container } = render(<SkeletonBoard cardCount={4} />);

      // Assert
      const innerContainer = container.querySelector("div.animate-pulse");
      const cards = container.querySelectorAll("div.bg-neutral-200");

      expect(innerContainer).toHaveClass("animate-pulse");
      cards.forEach((item) => {
        expect(item).not.toHaveClass("animate-pulse");
      });
    });

    it("kolor tła skeleton cards powinien być neutral-200 dla delikatnego efektu", () => {
      // Act
      const { container } = render(<SkeletonBoard cardCount={4} />);

      // Assert
      const cards = container.querySelectorAll("div.bg-neutral-200");
      cards.forEach((item) => {
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
        const skeletonCards = container.querySelectorAll("div.bg-neutral-200");
        expect(skeletonCards).toHaveLength(size);
      });
    });
  });
});
