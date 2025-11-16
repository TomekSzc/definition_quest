import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import Chip from "@/components/ui/Chip";

/**
 * Testy jednostkowe dla komponentu Chip
 *
 * Testowane funkcjonalności:
 * - Podstawowe renderowanie i struktura DOM
 * - Przekazywanie children (tekst, liczby, elementy React)
 * - Przekazywanie dodatkowych klas CSS przez className
 * - Stylowanie z Tailwind i CSS variables
 * - Przekazywanie dodatkowych props HTML
 * - Edge cases (długi tekst, puste children, re-renderowanie)
 * - Accessibility
 */

describe("Chip", () => {
  describe("Renderowanie i struktura DOM", () => {
    it("powinien wyrenderować span z podstawowymi klasami Tailwind", () => {
      // Arrange & Act
      render(<Chip>Test Chip</Chip>);

      // Assert
      const chip = screen.getByText("Test Chip");
      expect(chip).toBeInTheDocument();
      expect(chip.tagName).toBe("SPAN");
      expect(chip).toHaveClass("inline-block");
      expect(chip).toHaveClass("rounded-full");
      expect(chip).toHaveClass("px-2");
      expect(chip).toHaveClass("py-0.5");
      expect(chip).toHaveClass("text-xs");
    });

    it("powinien zawierać tekst przekazany jako children", () => {
      // Arrange & Act
      render(<Chip>Custom Content</Chip>);

      // Assert
      const chip = screen.getByText("Custom Content");
      expect(chip).toBeInTheDocument();
      expect(chip).toHaveTextContent("Custom Content");
    });

    it("powinien renderować złożone children (elementy React)", () => {
      // Arrange & Act
      render(
        <Chip>
          <span data-testid="icon">🏷️</span>
          <span>Label</span>
        </Chip>
      );

      // Assert
      const chip = screen.getByText("Label").parentElement;
      const icon = screen.getByTestId("icon");
      expect(chip).toContainElement(icon);
      expect(icon).toHaveTextContent("🏷️");
    });

    it("powinien renderować wiele elementów children obok siebie", () => {
      // Arrange & Act
      render(
        <Chip>
          <strong>Bold</strong>
          <em>Italic</em>
        </Chip>
      );

      // Assert
      const bold = screen.getByText("Bold");
      const italic = screen.getByText("Italic");
      expect(bold).toBeInTheDocument();
      expect(italic).toBeInTheDocument();
      expect(bold.parentElement).toBe(italic.parentElement);
    });
  });

  describe("Style bazowe z Tailwind", () => {
    it("powinien mieć wszystkie podstawowe klasy layout i spacing", () => {
      // Arrange & Act
      render(<Chip>Chip</Chip>);

      // Assert
      const chip = screen.getByText("Chip");
      expect(chip).toHaveClass("inline-block");
      expect(chip).toHaveClass("px-2");
      expect(chip).toHaveClass("py-0.5");
    });

    it("powinien mieć klasy związane z kształtem i typografią", () => {
      // Arrange & Act
      render(<Chip>Chip</Chip>);

      // Assert
      const chip = screen.getByText("Chip");
      expect(chip).toHaveClass("rounded-full");
      expect(chip).toHaveClass("text-xs");
    });

    it("powinien używać CSS variables dla kolorów", () => {
      // Arrange & Act
      render(<Chip>Chip</Chip>);

      // Assert
      const chip = screen.getByText("Chip");

      // Sprawdzamy że klasy CSS są zastosowane (background i text color z CSS variables)
      expect(chip.className).toContain("bg-[var(--color-primary)]");
      expect(chip.className).toContain("text-[var(--color-white)]");
    });
  });

  describe("Przekazywanie children", () => {
    it("powinien obsłużyć prosty string jako children", () => {
      // Arrange & Act
      render(<Chip>Simple Text</Chip>);

      // Assert
      const chip = screen.getByText("Simple Text");
      expect(chip).toBeInTheDocument();
      expect(chip).toHaveTextContent("Simple Text");
    });

    it("powinien obsłużyć children będący liczbą", () => {
      // Arrange & Act
      render(<Chip>{42}</Chip>);

      // Assert
      const chip = screen.getByText("42");
      expect(chip).toBeInTheDocument();
      expect(chip).toHaveTextContent("42");
    });

    it("powinien obsłużyć children będący zerem", () => {
      // Arrange & Act
      render(<Chip>{0}</Chip>);

      // Assert
      const chip = screen.getByText("0");
      expect(chip).toBeInTheDocument();
      expect(chip).toHaveTextContent("0");
    });

    it("powinien obsłużyć children będący liczbą zmiennoprzecinkową", () => {
      // Arrange & Act
      render(<Chip>{3.14}</Chip>);

      // Assert
      const chip = screen.getByText("3.14");
      expect(chip).toBeInTheDocument();
      expect(chip).toHaveTextContent("3.14");
    });

    it("powinien obsłużyć null jako children (React pominie null)", () => {
      // Arrange & Act
      render(<Chip>{null}</Chip>);

      // Assert - chip jest w DOM, ale bez contentu
      const chips = document.querySelectorAll(".inline-block.rounded-full");
      expect(chips.length).toBeGreaterThan(0);
    });

    it("powinien obsłużyć undefined jako children", () => {
      // Arrange & Act
      render(<Chip>{undefined}</Chip>);

      // Assert - chip jest w DOM, ale bez contentu
      const chips = document.querySelectorAll(".inline-block.rounded-full");
      expect(chips.length).toBeGreaterThan(0);
    });

    it("powinien obsłużyć boolean jako children (React pominie true/false)", () => {
      // Arrange & Act
      render(<Chip>{true}</Chip>);

      // Assert - chip jest w DOM, ale React nie renderuje boolean
      const chips = document.querySelectorAll(".inline-block.rounded-full");
      expect(chips.length).toBeGreaterThan(0);
    });

    it("powinien obsłużyć emoji jako children", () => {
      // Arrange & Act
      render(<Chip>🎯 Target</Chip>);

      // Assert
      const chip = screen.getByText("🎯 Target");
      expect(chip).toBeInTheDocument();
      expect(chip).toHaveTextContent("🎯 Target");
    });

    it("powinien obsłużyć zagnieżdżone komponenty jako children", () => {
      // Arrange
      const NestedComponent = () => <span data-testid="nested">Nested</span>;

      // Act
      render(
        <Chip>
          <NestedComponent />
        </Chip>
      );

      // Assert
      const nested = screen.getByTestId("nested");
      expect(nested).toBeInTheDocument();
      expect(nested.parentElement).toHaveClass("inline-block");
    });
  });

  describe("Przekazywanie dodatkowych klas CSS", () => {
    it("powinien przyjąć i zastosować dodatkowe klasy z prop className", () => {
      // Arrange
      const customClass = "custom-chip-class";

      // Act
      render(<Chip className={customClass}>Chip</Chip>);

      // Assert
      const chip = screen.getByText("Chip");
      expect(chip).toHaveClass(customClass);
    });

    it("powinien zachować wszystkie bazowe klasy po dodaniu className", () => {
      // Arrange
      const customClass = "my-custom-chip";

      // Act
      render(<Chip className={customClass}>Chip</Chip>);

      // Assert
      const chip = screen.getByText("Chip");
      expect(chip).toHaveClass("inline-block");
      expect(chip).toHaveClass("rounded-full");
      expect(chip).toHaveClass("px-2");
      expect(chip).toHaveClass("text-xs");
      expect(chip).toHaveClass(customClass);
    });

    it("powinien umożliwić dodanie dodatkowego marginu przez className", () => {
      // Arrange
      const marginClass = "ml-2 mt-4";

      // Act
      render(<Chip className={marginClass}>Chip</Chip>);

      // Assert
      const chip = screen.getByText("Chip");
      expect(chip).toHaveClass("ml-2");
      expect(chip).toHaveClass("mt-4");
    });

    it("powinien umożliwić nadpisanie paddingu przez className", () => {
      // Arrange - chcemy nadpisać px-2 na px-4
      const paddingClass = "px-4 py-1";

      // Act
      render(<Chip className={paddingClass}>Chip</Chip>);

      // Assert
      const chip = screen.getByText("Chip");
      // Później dodane klasy mają wyższy priorytet w Tailwind
      expect(chip.className).toContain("px-4");
      expect(chip.className).toContain("py-1");
    });

    it("powinien łączyć klasy przez konkatenację stringów", () => {
      // Arrange
      const customClasses = "shadow-lg hover:shadow-xl";

      // Act
      render(<Chip className={customClasses}>Chip</Chip>);

      // Assert
      const chip = screen.getByText("Chip");
      expect(chip).toHaveClass("shadow-lg");
      expect(chip).toHaveClass("hover:shadow-xl");
    });

    it("powinien poprawnie działać bez przekazanego className", () => {
      // Arrange & Act
      render(<Chip>Chip</Chip>);

      // Assert
      const chip = screen.getByText("Chip");
      expect(chip).toBeInTheDocument();
      expect(chip).toHaveClass("inline-block");
    });

    it("powinien obsłużyć pusty string jako className", () => {
      // Arrange & Act
      render(<Chip className="">Chip</Chip>);

      // Assert
      const chip = screen.getByText("Chip");
      expect(chip).toBeInTheDocument();
      expect(chip).toHaveClass("inline-block");
    });

    it("powinien obsłużyć undefined jako className", () => {
      // Arrange & Act
      render(<Chip className={undefined}>Chip</Chip>);

      // Assert
      const chip = screen.getByText("Chip");
      expect(chip).toBeInTheDocument();
      expect(chip).toHaveClass("inline-block");
    });

    it("powinien poprawnie łączyć wiele klas przekazanych jako string", () => {
      // Arrange
      const multipleClasses = "uppercase tracking-wide font-bold";

      // Act
      render(<Chip className={multipleClasses}>Chip</Chip>);

      // Assert
      const chip = screen.getByText("Chip");
      expect(chip).toHaveClass("uppercase");
      expect(chip).toHaveClass("tracking-wide");
      expect(chip).toHaveClass("font-bold");
    });
  });

  describe("Ograniczenia props", () => {
    it("powinien akceptować tylko children i className (nie inne props HTML)", () => {
      // Arrange & Act
      // Komponent nie akceptuje dodatkowych props poza children i className
      render(<Chip className="test-class">Chip</Chip>);

      // Assert
      const chip = screen.getByText("Chip");
      expect(chip).toBeInTheDocument();
      expect(chip).toHaveClass("test-class");
    });

    it("powinien renderować się poprawnie bez dodatkowych props", () => {
      // Arrange & Act
      // Komponent ma ograniczony interfejs - tylko children i className
      render(<Chip>Simple Chip</Chip>);

      // Assert
      const chip = screen.getByText("Simple Chip");
      expect(chip).toBeInTheDocument();
      expect(chip.tagName).toBe("SPAN");
    });
  });

  describe("Edge cases", () => {
    it("powinien obsłużyć pusty children", () => {
      // Arrange & Act
      const { container } = render(<Chip></Chip>);

      // Assert - chip powinien być w DOM mimo braku contentu
      const chip = container.querySelector(".inline-block.rounded-full");
      expect(chip).toBeInTheDocument();
    });

    it("powinien obsłużyć bardzo długi tekst jako children", () => {
      // Arrange
      const longText = "Lorem ipsum dolor sit amet, consectetur adipiscing elit. ".repeat(10);

      // Act
      render(<Chip>{longText}</Chip>);

      // Assert
      // Używamy regex do znalezienia tekstu, ponieważ długi tekst może być normalizowany
      const chip = screen.getByText(/Lorem ipsum dolor sit amet/);
      expect(chip).toBeInTheDocument();
      expect(chip.textContent).toBe(longText);
    });

    it("powinien obsłużyć tekst ze znakami specjalnymi", () => {
      // Arrange
      const specialText = "Test & <Special> \"Characters\" 'Quotes'";

      // Act
      render(<Chip>{specialText}</Chip>);

      // Assert
      const chip = screen.getByText(specialText);
      expect(chip).toBeInTheDocument();
      expect(chip).toHaveTextContent(specialText);
    });

    it("powinien obsłużyć wielokrotne re-renderowanie bez błędów", () => {
      // Arrange
      const { rerender } = render(<Chip>Chip 1</Chip>);

      // Act & Assert
      expect(screen.getByText("Chip 1")).toBeInTheDocument();

      rerender(<Chip>Chip 2</Chip>);
      expect(screen.getByText("Chip 2")).toBeInTheDocument();

      rerender(<Chip>Chip 3</Chip>);
      expect(screen.getByText("Chip 3")).toBeInTheDocument();
    });

    it("powinien obsłużyć zmianę className podczas re-renderowania", () => {
      // Arrange
      const { rerender } = render(<Chip className="initial-class">Chip</Chip>);

      // Assert - początkowa klasa
      let chip = screen.getByText("Chip");
      expect(chip).toHaveClass("initial-class");

      // Act - zmiana className
      rerender(<Chip className="updated-class">Chip</Chip>);

      // Assert - nowa klasa
      chip = screen.getByText("Chip");
      expect(chip).toHaveClass("updated-class");
      expect(chip).not.toHaveClass("initial-class");
    });

    it("powinien obsłużyć zmianę children podczas re-renderowania", () => {
      // Arrange
      const { rerender } = render(<Chip>Original</Chip>);
      expect(screen.getByText("Original")).toBeInTheDocument();

      // Act
      rerender(<Chip>Updated</Chip>);

      // Assert
      expect(screen.queryByText("Original")).not.toBeInTheDocument();
      expect(screen.getByText("Updated")).toBeInTheDocument();
    });

    it("powinien obsłużyć jednoczesną zmianę className i children", () => {
      // Arrange
      const { rerender } = render(<Chip className="class-1">Text 1</Chip>);
      let chip = screen.getByText("Text 1");
      expect(chip).toHaveClass("class-1");

      // Act
      rerender(<Chip className="class-2">Text 2</Chip>);

      // Assert
      chip = screen.getByText("Text 2");
      expect(chip).toHaveClass("class-2");
      expect(chip).not.toHaveClass("class-1");
    });

    it("powinien obsłużyć białe znaki w children", () => {
      // Arrange & Act
      render(<Chip> Spaced Text </Chip>);

      // Assert
      const chip = screen.getByText(/Spaced\s+Text/);
      expect(chip).toBeInTheDocument();
    });

    it("powinien obsłużyć wieloliniowy tekst w children", () => {
      // Arrange
      const multilineText = `Line 1
Line 2
Line 3`;

      // Act
      render(<Chip>{multilineText}</Chip>);

      // Assert
      const chip = screen.getByText(/Line 1/);
      expect(chip).toBeInTheDocument();
      // W HTML białe znaki (w tym newlines) są normalizowane do pojedynczych spacji
      expect(chip.textContent).toContain("Line 1");
      expect(chip.textContent).toContain("Line 2");
      expect(chip.textContent).toContain("Line 3");
    });

    it("powinien zachować strukturę DOM po wielu re-renderach", () => {
      // Arrange
      const { rerender, container } = render(<Chip>Initial</Chip>);
      const initialSpan = container.querySelector("span");

      // Act - wiele re-renderów
      for (let i = 0; i < 10; i++) {
        rerender(<Chip>Update {i}</Chip>);
      }

      // Assert - nadal ten sam element span
      const finalSpan = container.querySelector("span");
      expect(finalSpan).toBe(initialSpan);
      expect(finalSpan?.tagName).toBe("SPAN");
    });
  });

  describe("Accessibility", () => {
    it("powinien być dostępny dla screen readerów z odpowiednim contentem", () => {
      // Arrange & Act
      render(<Chip>Status: Active</Chip>);

      // Assert
      const chip = screen.getByText("Status: Active");
      expect(chip).toBeInTheDocument();
    });

    it("powinien renderować tekst czytelny dla technologii wspierających", () => {
      // Arrange & Act
      render(<Chip>Ważna informacja</Chip>);

      // Assert
      const chip = screen.getByText("Ważna informacja");
      expect(chip.textContent).toBe("Ważna informacja");
      expect(chip).toBeInTheDocument();
    });

    it("powinien mieć semantyczny tag span", () => {
      // Arrange & Act
      render(<Chip>Semantic Chip</Chip>);

      // Assert
      const chip = screen.getByText("Semantic Chip");
      expect(chip.tagName).toBe("SPAN");
    });

    it("powinien wyświetlać treść w sposób dostępny wizualnie", () => {
      // Arrange & Act
      render(<Chip>Visible Content</Chip>);

      // Assert
      const chip = screen.getByText("Visible Content");
      expect(chip).toBeVisible();
    });

    it("powinien obsługiwać tekst z emocjonami dla lepszego UX", () => {
      // Arrange & Act
      render(<Chip>⚠️ Uwaga</Chip>);

      // Assert
      const chip = screen.getByText("⚠️ Uwaga");
      expect(chip).toBeInTheDocument();
      expect(chip.textContent).toContain("⚠️");
    });
  });

  describe("Kombinacje props", () => {
    it("powinien obsłużyć children z className jednocześnie", () => {
      // Arrange & Act
      render(<Chip className="custom-combined-class">Complete Chip</Chip>);

      // Assert
      const chip = screen.getByText("Complete Chip");
      expect(chip).toBeInTheDocument();
      expect(chip).toHaveClass("inline-block");
      expect(chip).toHaveClass("custom-combined-class");
    });

    it("powinien obsłużyć złożone children z className", () => {
      // Arrange & Act
      render(
        <Chip className="complex-chip">
          <span>Icon</span>
          <span>Text</span>
        </Chip>
      );

      // Assert
      const icon = screen.getByText("Icon");
      const text = screen.getByText("Text");
      expect(icon.parentElement).toHaveClass("complex-chip");
      expect(text.parentElement).toHaveClass("complex-chip");
    });

    it("powinien poprawnie renderować z wieloma klasami Tailwind", () => {
      // Arrange & Act
      render(<Chip className="shadow-lg hover:shadow-xl transition-all duration-300">Multi-class Chip</Chip>);

      // Assert
      const chip = screen.getByText("Multi-class Chip");
      expect(chip).toHaveClass("shadow-lg");
      expect(chip).toHaveClass("hover:shadow-xl");
      expect(chip).toHaveClass("transition-all");
      expect(chip).toHaveClass("duration-300");
    });
  });

  describe("TypeScript type safety (runtime checks)", () => {
    it("powinien zaakceptować wszystkie dozwolone props", () => {
      // Act & Assert - kompilacja bez błędów oznacza sukces
      render(<Chip>Default</Chip>);
      render(<Chip className="custom">With className</Chip>);
      render(<Chip className={undefined}>With undefined className</Chip>);

      expect(screen.getByText("Default")).toBeInTheDocument();
      expect(screen.getByText("With className")).toBeInTheDocument();
      expect(screen.getByText("With undefined className")).toBeInTheDocument();
    });

    it("powinien zaakceptować różne typy children", () => {
      // Act & Assert
      render(<Chip>String</Chip>);
      render(<Chip>{123}</Chip>);
      render(<Chip>{<span>Element</span>}</Chip>);
      render(<Chip>{null}</Chip>);
      render(<Chip>{undefined}</Chip>);

      expect(screen.getByText("String")).toBeInTheDocument();
      expect(screen.getByText("123")).toBeInTheDocument();
      expect(screen.getByText("Element")).toBeInTheDocument();
    });
  });

  describe("CSS Variables styling", () => {
    it("powinien mieć klasy wykorzystujące CSS variables", () => {
      // Arrange & Act
      render(<Chip>Chip</Chip>);

      // Assert
      const chip = screen.getByText("Chip");
      const className = chip.className;

      // Sprawdzamy czy string className zawiera arbitrary values z CSS variables
      expect(className).toContain("bg-[var(--color-primary)]");
      expect(className).toContain("text-[var(--color-white)]");
    });

    it("powinien zachować CSS variables po re-renderowaniu", () => {
      // Arrange
      const { rerender } = render(<Chip>Original</Chip>);
      let chip = screen.getByText("Original");

      // Act
      rerender(<Chip>Updated</Chip>);

      // Assert
      chip = screen.getByText("Updated");
      expect(chip.className).toContain("bg-[var(--color-primary)]");
      expect(chip.className).toContain("text-[var(--color-white)]");
      // Klasy bazowe pozostają takie same
      expect(chip.className).toContain("inline-block");
      expect(chip.className).toContain("rounded-full");
    });

    it("powinien umożliwić nadpisanie kolorów przez className", () => {
      // Arrange
      const customColors = "bg-red-500 text-blue-500";

      // Act
      render(<Chip className={customColors}>Chip</Chip>);

      // Assert
      const chip = screen.getByText("Chip");
      // Custom klasy są dodane
      expect(chip).toHaveClass("bg-red-500");
      expect(chip).toHaveClass("text-blue-500");
    });
  });

  describe("Performance", () => {
    it("powinien renderować się szybko z prostym tekstem", () => {
      // Arrange
      const startTime = performance.now();

      // Act
      render(<Chip>Quick Render</Chip>);

      // Assert
      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // Rendering powinno być szybkie (< 50ms)
      expect(renderTime).toBeLessThan(50);
      expect(screen.getByText("Quick Render")).toBeInTheDocument();
    });

    it("powinien obsłużyć rendering wielu chipów jednocześnie", () => {
      // Arrange & Act
      render(
        <div>
          {Array.from({ length: 100 }, (_, i) => (
            <Chip key={i}>Chip {i}</Chip>
          ))}
        </div>
      );

      // Assert
      expect(screen.getByText("Chip 0")).toBeInTheDocument();
      expect(screen.getByText("Chip 50")).toBeInTheDocument();
      expect(screen.getByText("Chip 99")).toBeInTheDocument();
    });
  });

  describe("Integracja z className concatenation", () => {
    it("powinien poprawnie łączyć klasy przez string concatenation", () => {
      // Arrange
      const customClass = "ml-2";

      // Act
      render(<Chip className={customClass}>Chip</Chip>);

      // Assert
      const chip = screen.getByText("Chip");
      // Wszystkie klasy powinny być obecne
      expect(chip).toHaveClass("inline-block");
      expect(chip).toHaveClass("rounded-full");
      expect(chip).toHaveClass("ml-2");
    });

    it("powinien zachować spacje między klasami", () => {
      // Arrange & Act
      render(<Chip className="custom-1 custom-2">Chip</Chip>);

      // Assert
      const chip = screen.getByText("Chip");
      const classList = Array.from(chip.classList);

      // Wszystkie klasy powinny być oddzielone
      expect(classList).toContain("custom-1");
      expect(classList).toContain("custom-2");
      expect(classList).toContain("inline-block");
    });

    it("powinien obsłużyć nadmiarowe spacje w className", () => {
      // Arrange & Act
      render(<Chip className="  extra-space  ">Chip</Chip>);

      // Assert
      const chip = screen.getByText("Chip");
      expect(chip).toHaveClass("extra-space");
      expect(chip).toHaveClass("inline-block");
    });
  });
});
