import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Badge } from "@/components/ui/Badge";
import { createRef } from "react";
import { vi } from "vitest";

/**
 * Testy jednostkowe dla komponentu Badge
 *
 * Testowane funkcjonalności:
 * - Podstawowe renderowanie i struktura DOM
 * - Warianty stylowania (default, secondary, outline)
 * - Przekazywanie dodatkowych klas CSS
 * - ForwardRef - możliwość przekazania ref
 * - Przekazywanie dodatkowych props HTML
 * - Style bazowe i wariantowe z CVA
 * - Accessibility
 */

describe("Badge", () => {
  describe("Renderowanie i struktura DOM", () => {
    it("powinien wyrenderować div z podstawowymi klasami CVA", () => {
      // Arrange & Act
      render(<Badge>Test Badge</Badge>);

      // Assert
      const badge = screen.getByText("Test Badge");
      expect(badge).toBeInTheDocument();
      expect(badge.tagName).toBe("DIV");
      expect(badge).toHaveClass("inline-flex");
      expect(badge).toHaveClass("items-center");
      expect(badge).toHaveClass("rounded-full");
    });

    it("powinien zawierać tekst przekazany jako children", () => {
      // Arrange & Act
      render(<Badge>Custom Content</Badge>);

      // Assert
      const badge = screen.getByText("Custom Content");
      expect(badge).toBeInTheDocument();
    });

    it("powinien renderować złożone children (elementy React)", () => {
      // Arrange & Act
      render(
        <Badge>
          <span data-testid="icon">🎯</span>
          <span>Label</span>
        </Badge>
      );

      // Assert
      const badge = screen.getByText("Label").parentElement;
      const icon = screen.getByTestId("icon");
      expect(badge).toContainElement(icon);
      expect(icon).toHaveTextContent("🎯");
    });
  });

  describe("Style bazowe z CVA", () => {
    it("powinien mieć wszystkie podstawowe klasy stylowania", () => {
      // Arrange & Act
      render(<Badge>Badge</Badge>);

      // Assert
      const badge = screen.getByText("Badge");
      expect(badge).toHaveClass("inline-flex");
      expect(badge).toHaveClass("items-center");
      expect(badge).toHaveClass("rounded-full");
      expect(badge).toHaveClass("border");
      expect(badge).toHaveClass("px-2.5");
      expect(badge).toHaveClass("py-0.5");
      expect(badge).toHaveClass("text-xs");
      expect(badge).toHaveClass("font-semibold");
      expect(badge).toHaveClass("transition-colors");
    });

    it("powinien mieć klasy focus state dla accessibility", () => {
      // Arrange & Act
      render(<Badge>Badge</Badge>);

      // Assert
      const badge = screen.getByText("Badge");
      expect(badge).toHaveClass("focus:outline-none");
      expect(badge).toHaveClass("focus:ring-2");
      expect(badge).toHaveClass("focus:ring-ring");
      expect(badge).toHaveClass("focus:ring-offset-2");
    });
  });

  describe("Warianty stylowania", () => {
    describe("Wariant default", () => {
      it("powinien zastosować wariant default gdy nie przekazano variant", () => {
        // Arrange & Act
        render(<Badge>Default Badge</Badge>);

        // Assert
        const badge = screen.getByText("Default Badge");
        expect(badge).toHaveClass("bg-primary");
        expect(badge).toHaveClass("text-primary-foreground");
        expect(badge).toHaveClass("border-transparent");
      });

      it("powinien zastosować wariant default gdy explicite przekazano variant='default'", () => {
        // Arrange & Act
        render(<Badge variant="default">Default Badge</Badge>);

        // Assert
        const badge = screen.getByText("Default Badge");
        expect(badge).toHaveClass("bg-primary");
        expect(badge).toHaveClass("text-primary-foreground");
        expect(badge).toHaveClass("border-transparent");
      });
    });

    describe("Wariant secondary", () => {
      it("powinien zastosować wariant secondary z odpowiednimi klasami", () => {
        // Arrange & Act
        render(<Badge variant="secondary">Secondary Badge</Badge>);

        // Assert
        const badge = screen.getByText("Secondary Badge");
        expect(badge).toHaveClass("bg-secondary");
        expect(badge).toHaveClass("text-secondary-foreground");
        expect(badge).toHaveClass("border-transparent");
      });

      it("nie powinien mieć klas z wariantu default", () => {
        // Arrange & Act
        render(<Badge variant="secondary">Secondary Badge</Badge>);

        // Assert
        const badge = screen.getByText("Secondary Badge");
        expect(badge).not.toHaveClass("bg-primary");
        expect(badge).not.toHaveClass("text-primary-foreground");
      });
    });

    describe("Wariant outline", () => {
      it("powinien zastosować wariant outline z odpowiednimi klasami", () => {
        // Arrange & Act
        render(<Badge variant="outline">Outline Badge</Badge>);

        // Assert
        const badge = screen.getByText("Outline Badge");
        expect(badge).toHaveClass("text-foreground");
      });

      it("nie powinien mieć klas background dla wariantu outline", () => {
        // Arrange & Act
        render(<Badge variant="outline">Outline Badge</Badge>);

        // Assert
        const badge = screen.getByText("Outline Badge");
        expect(badge).not.toHaveClass("bg-primary");
        expect(badge).not.toHaveClass("bg-secondary");
        expect(badge).not.toHaveClass("border-transparent");
      });

      it("powinien zachować border z klas bazowych dla wariantu outline", () => {
        // Arrange & Act
        render(<Badge variant="outline">Outline Badge</Badge>);

        // Assert - border z klas bazowych
        const badge = screen.getByText("Outline Badge");
        expect(badge).toHaveClass("border");
      });
    });
  });

  describe("Przekazywanie dodatkowych klas CSS", () => {
    it("powinien przyjąć i zastosować dodatkowe klasy z prop className", () => {
      // Arrange
      const customClass = "custom-badge-class";

      // Act
      render(<Badge className={customClass}>Badge</Badge>);

      // Assert
      const badge = screen.getByText("Badge");
      expect(badge).toHaveClass(customClass);
    });

    it("powinien zachować wszystkie bazowe klasy po dodaniu className", () => {
      // Arrange
      const customClass = "my-custom-badge";

      // Act
      render(<Badge className={customClass}>Badge</Badge>);

      // Assert
      const badge = screen.getByText("Badge");
      expect(badge).toHaveClass("inline-flex");
      expect(badge).toHaveClass("rounded-full");
      expect(badge).toHaveClass("px-2.5");
      expect(badge).toHaveClass(customClass);
    });

    it("powinien umożliwić nadpisanie stylów przez className", () => {
      // Arrange - nadpisanie koloru tła
      const overrideClass = "bg-red-500";

      // Act
      render(<Badge className={overrideClass}>Badge</Badge>);

      // Assert - cn() inteligentnie merguje klasy, więc bg-red-500 zastępuje bg-primary
      const badge = screen.getByText("Badge");
      expect(badge).toHaveClass(overrideClass);
      expect(badge).not.toHaveClass("bg-primary"); // bg-primary zostało zastąpione przez bg-red-500
    });

    it("powinien łączyć className z wariantem", () => {
      // Arrange
      const customClass = "custom-secondary";

      // Act
      render(
        <Badge variant="secondary" className={customClass}>
          Badge
        </Badge>
      );

      // Assert
      const badge = screen.getByText("Badge");
      expect(badge).toHaveClass("bg-secondary");
      expect(badge).toHaveClass(customClass);
    });

    it("powinien poprawnie działać bez przekazanego className", () => {
      // Arrange & Act
      render(<Badge>Badge</Badge>);

      // Assert
      const badge = screen.getByText("Badge");
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveClass("inline-flex");
    });

    it("powinien obsłużyć pusty string jako className", () => {
      // Arrange & Act
      render(<Badge className="">Badge</Badge>);

      // Assert
      const badge = screen.getByText("Badge");
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveClass("inline-flex");
    });

    it("powinien obsłużyć undefined jako className", () => {
      // Arrange & Act
      render(<Badge className={undefined}>Badge</Badge>);

      // Assert
      const badge = screen.getByText("Badge");
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveClass("inline-flex");
    });
  });

  describe("ForwardRef - przekazywanie ref", () => {
    it("powinien umożliwić przekazanie ref do elementu div", () => {
      // Arrange
      const ref = createRef<HTMLDivElement>();

      // Act
      render(<Badge ref={ref}>Badge with Ref</Badge>);

      // Assert
      expect(ref.current).toBeInstanceOf(HTMLDivElement);
      expect(ref.current).toHaveTextContent("Badge with Ref");
    });

    it("powinien umożliwić dostęp do DOM node przez ref", () => {
      // Arrange
      const ref = createRef<HTMLDivElement>();

      // Act
      render(<Badge ref={ref}>Badge</Badge>);

      // Assert
      expect(ref.current).not.toBeNull();
      expect(ref.current?.tagName).toBe("DIV");
      expect(ref.current?.className).toContain("inline-flex");
    });

    it("powinien umożliwić manipulację DOM przez ref", () => {
      // Arrange
      const ref = createRef<HTMLDivElement>();

      // Act
      render(<Badge ref={ref}>Badge</Badge>);

      // Assert - możemy wykonać operacje DOM
      expect(ref.current?.querySelector).toBeDefined();
      expect(ref.current?.classList.contains("rounded-full")).toBe(true);
    });
  });

  describe("Przekazywanie dodatkowych props HTML", () => {
    it("powinien przyjąć i zastosować standardowe atrybuty HTML", () => {
      // Arrange & Act
      render(
        <Badge data-testid="custom-badge" id="badge-1" title="Badge Title">
          Badge
        </Badge>
      );

      // Assert
      const badge = screen.getByTestId("custom-badge");
      expect(badge).toHaveAttribute("id", "badge-1");
      expect(badge).toHaveAttribute("title", "Badge Title");
    });

    it("powinien obsłużyć onClick handler", () => {
      // Arrange
      let clicked = false;
      const handleClick = () => {
        clicked = true;
      };

      // Act
      render(<Badge onClick={handleClick}>Clickable Badge</Badge>);
      const badge = screen.getByText("Clickable Badge");
      badge.click();

      // Assert
      expect(clicked).toBe(true);
    });

    it("powinien obsłużyć role i aria-label dla accessibility", () => {
      // Arrange & Act
      render(
        <Badge role="status" aria-label="Status Badge">
          Active
        </Badge>
      );

      // Assert
      const badge = screen.getByRole("status");
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveAttribute("aria-label", "Status Badge");
    });

    it("powinien obsłużyć data-* atrybuty", () => {
      // Arrange & Act
      render(
        <Badge data-category="feature" data-priority="high">
          Badge
        </Badge>
      );

      // Assert
      const badge = screen.getByText("Badge");
      expect(badge).toHaveAttribute("data-category", "feature");
      expect(badge).toHaveAttribute("data-priority", "high");
    });

    it("powinien obsłużyć style inline", () => {
      // Arrange & Act
      render(<Badge style={{ marginTop: "10px" }}>Badge</Badge>);

      // Assert
      const badge = screen.getByText("Badge");
      expect(badge).toHaveStyle({ marginTop: "10px" });
    });
  });

  describe("Kombinacje props", () => {
    it("powinien obsłużyć wszystkie props jednocześnie", () => {
      // Arrange
      const ref = createRef<HTMLDivElement>();
      const handleClick = () => vi.fn();

      // Act
      render(
        <Badge
          ref={ref}
          variant="secondary"
          className="custom-class"
          data-testid="full-badge"
          onClick={handleClick}
          aria-label="Full Badge"
        >
          Complete Badge
        </Badge>
      );

      // Assert
      const badge = screen.getByTestId("full-badge");
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveClass("bg-secondary");
      expect(badge).toHaveClass("custom-class");
      expect(badge).toHaveAttribute("aria-label", "Full Badge");
      expect(ref.current).toBe(badge);
    });

    it("powinien obsłużyć zmianę wariantu podczas re-renderowania", () => {
      // Arrange
      const { rerender } = render(<Badge variant="default">Badge</Badge>);

      // Assert - początkowy wariant
      let badge = screen.getByText("Badge");
      expect(badge).toHaveClass("bg-primary");

      // Act - zmiana wariantu
      rerender(<Badge variant="secondary">Badge</Badge>);

      // Assert - nowy wariant
      badge = screen.getByText("Badge");
      expect(badge).toHaveClass("bg-secondary");
      expect(badge).not.toHaveClass("bg-primary");
    });
  });

  describe("Edge cases", () => {
    it("powinien obsłużyć pusty children", () => {
      // Arrange & Act
      render(<Badge></Badge>);

      // Assert - badge powinien być w DOM mimo braku contentu
      const badges = document.querySelectorAll(".inline-flex.rounded-full");
      expect(badges.length).toBeGreaterThan(0);
    });

    it("powinien obsłużyć długi tekst jako children", () => {
      // Arrange
      const longText = "Lorem ipsum dolor sit amet, consectetur adipiscing elit".repeat(5);

      // Act
      render(<Badge>{longText}</Badge>);

      // Assert
      const badge = screen.getByText(longText);
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveTextContent(longText);
    });

    it("powinien obsłużyć wielokrotne re-renderowanie bez błędów", () => {
      // Arrange
      const { rerender } = render(<Badge>Badge 1</Badge>);

      // Act & Assert
      expect(screen.getByText("Badge 1")).toBeInTheDocument();

      rerender(<Badge>Badge 2</Badge>);
      expect(screen.getByText("Badge 2")).toBeInTheDocument();

      rerender(<Badge>Badge 3</Badge>);
      expect(screen.getByText("Badge 3")).toBeInTheDocument();
    });

    it("powinien zachować identyczność ref między re-renderami", () => {
      // Arrange
      const ref = createRef<HTMLDivElement>();
      const { rerender } = render(<Badge ref={ref}>Badge</Badge>);
      const initialRef = ref.current;

      // Act
      rerender(<Badge ref={ref}>Badge Updated</Badge>);

      // Assert - ref wskazuje na ten sam element DOM
      expect(ref.current).toBe(initialRef);
    });

    it("powinien obsłużyć children będący liczbą", () => {
      // Arrange & Act
      render(<Badge>{42}</Badge>);

      // Assert
      const badge = screen.getByText("42");
      expect(badge).toBeInTheDocument();
    });

    it("powinien obsłużyć children będący zerem", () => {
      // Arrange & Act
      render(<Badge>{0}</Badge>);

      // Assert
      const badge = screen.getByText("0");
      expect(badge).toBeInTheDocument();
    });

    it("powinien obsłużyć null jako children (React pominie null)", () => {
      // Arrange & Act
      render(<Badge>{null}</Badge>);

      // Assert - badge jest w DOM, ale bez contentu
      const badges = document.querySelectorAll(".inline-flex.rounded-full");
      expect(badges.length).toBeGreaterThan(0);
    });
  });

  describe("TypeScript type safety (runtime checks)", () => {
    it("powinien zaakceptować wszystkie dozwolone warianty", () => {
      // Act & Assert - kompilacja bez błędów oznacza sukces
      render(<Badge variant="default">Default</Badge>);
      render(<Badge variant="secondary">Secondary</Badge>);
      render(<Badge variant="outline">Outline</Badge>);

      expect(screen.getByText("Default")).toBeInTheDocument();
      expect(screen.getByText("Secondary")).toBeInTheDocument();
      expect(screen.getByText("Outline")).toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("powinien być dostępny dla screen readerów z odpowiednim contentem", () => {
      // Arrange & Act
      render(<Badge>Status: Active</Badge>);

      // Assert
      const badge = screen.getByText("Status: Active");
      expect(badge).toBeInTheDocument();
    });

    it("powinien wspierać aria-label gdy content nie jest wystarczająco opisowy", () => {
      // Arrange & Act
      render(<Badge aria-label="High Priority">!</Badge>);

      // Assert
      const badge = screen.getByLabelText("High Priority");
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveTextContent("!");
    });

    it("powinien mieć focus ring dla keyboard navigation", () => {
      // Arrange & Act
      render(<Badge tabIndex={0}>Focusable Badge</Badge>);

      // Assert
      const badge = screen.getByText("Focusable Badge");
      expect(badge).toHaveClass("focus:ring-2");
      expect(badge).toHaveClass("focus:ring-ring");
      expect(badge).toHaveClass("focus:outline-none");
    });

    it("powinien wspierać role dla semantic meaning", () => {
      // Arrange & Act
      render(
        <Badge role="status" aria-live="polite">
          Processing
        </Badge>
      );

      // Assert
      const badge = screen.getByRole("status");
      expect(badge).toHaveAttribute("aria-live", "polite");
    });
  });

  describe("Integracja z CVA", () => {
    it("powinien poprawnie łączyć klasy bazowe z wariantem przez CVA", () => {
      // Arrange & Act
      render(<Badge variant="secondary">CVA Badge</Badge>);

      // Assert - klasy bazowe
      const badge = screen.getByText("CVA Badge");
      expect(badge).toHaveClass("inline-flex");
      expect(badge).toHaveClass("rounded-full");
      expect(badge).toHaveClass("px-2.5");

      // Assert - klasy z wariantu
      expect(badge).toHaveClass("bg-secondary");
      expect(badge).toHaveClass("text-secondary-foreground");
    });

    it("powinien poprawnie łączyć wszystkie źródła klas (CVA + className) przez cn()", () => {
      // Arrange & Act
      render(
        <Badge variant="outline" className="my-custom-class">
          Combined Classes
        </Badge>
      );

      // Assert
      const badge = screen.getByText("Combined Classes");
      // Bazowe z CVA
      expect(badge).toHaveClass("inline-flex");
      // Z wariantu
      expect(badge).toHaveClass("text-foreground");
      // Custom className
      expect(badge).toHaveClass("my-custom-class");
    });
  });
});
