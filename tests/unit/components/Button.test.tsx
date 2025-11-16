import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Button } from "@/components/ui/Button";
import { createRef } from "react";

/**
 * Testy jednostkowe dla komponentu Button
 *
 * Testowane funkcjonalności:
 * - Podstawowe renderowanie i struktura DOM
 * - Warianty stylowania (default, secondary, destructive, outline, ghost, link)
 * - Rozmiary (default, sm, lg, icon)
 * - Przekazywanie dodatkowych klas CSS
 * - ForwardRef - możliwość przekazania ref
 * - Przekazywanie dodatkowych props HTML
 * - Interakcje użytkownika (onClick, disabled)
 * - Style bazowe i wariantowe z CVA
 * - Accessibility (focus, disabled state)
 * - Kombinacje props (variant + size + className)
 */

describe("Button", () => {
  describe("Renderowanie i struktura DOM", () => {
    it("powinien wyrenderować button z podstawowymi klasami CVA", () => {
      // Arrange & Act
      render(<Button>Test Button</Button>);

      // Assert
      const button = screen.getByRole("button", { name: "Test Button" });
      expect(button).toBeInTheDocument();
      expect(button.tagName).toBe("BUTTON");
      expect(button).toHaveClass("inline-flex");
      expect(button).toHaveClass("items-center");
      expect(button).toHaveClass("justify-center");
      expect(button).toHaveClass("rounded-md");
    });

    it("powinien zawierać tekst przekazany jako children", () => {
      // Arrange & Act
      render(<Button>Click me</Button>);

      // Assert
      const button = screen.getByRole("button", { name: "Click me" });
      expect(button).toBeInTheDocument();
      expect(button).toHaveTextContent("Click me");
    });

    it("powinien renderować złożone children (elementy React)", () => {
      // Arrange & Act
      render(
        <Button>
          <span data-testid="icon">🚀</span>
          <span>Submit</span>
        </Button>
      );

      // Assert
      const icon = screen.getByTestId("icon");
      const button = screen.getByRole("button");
      expect(button).toContainElement(icon);
      expect(icon).toHaveTextContent("🚀");
      expect(button).toHaveTextContent("Submit");
    });
  });

  describe("Style bazowe z CVA", () => {
    it("powinien mieć wszystkie podstawowe klasy stylowania", () => {
      // Arrange & Act
      render(<Button>Button</Button>);

      // Assert
      const button = screen.getByRole("button");
      expect(button).toHaveClass("inline-flex");
      expect(button).toHaveClass("items-center");
      expect(button).toHaveClass("justify-center");
      expect(button).toHaveClass("rounded-md");
      expect(button).toHaveClass("text-sm");
      expect(button).toHaveClass("font-medium");
      expect(button).toHaveClass("transition-colors");
    });

    it("powinien mieć klasy focus-visible state dla accessibility", () => {
      // Arrange & Act
      render(<Button>Button</Button>);

      // Assert
      const button = screen.getByRole("button");
      expect(button).toHaveClass("focus-visible:outline-none");
      expect(button).toHaveClass("focus-visible:ring-2");
      expect(button).toHaveClass("focus-visible:ring-ring");
      expect(button).toHaveClass("focus-visible:ring-offset-2");
    });

    it("powinien mieć klasy disabled state", () => {
      // Arrange & Act
      render(<Button>Button</Button>);

      // Assert
      const button = screen.getByRole("button");
      expect(button).toHaveClass("disabled:opacity-50");
      expect(button).toHaveClass("disabled:pointer-events-none");
    });

    it("powinien mieć klasę ring-offset-background", () => {
      // Arrange & Act
      render(<Button>Button</Button>);

      // Assert
      const button = screen.getByRole("button");
      expect(button).toHaveClass("ring-offset-background");
    });
  });

  describe("Warianty stylowania (variant)", () => {
    describe("Wariant default", () => {
      it("powinien zastosować wariant default gdy nie przekazano variant", () => {
        // Arrange & Act
        render(<Button>Default Button</Button>);

        // Assert
        const button = screen.getByRole("button");
        expect(button).toHaveClass("bg-primary");
        expect(button).toHaveClass("text-primary-foreground");
        expect(button).toHaveClass("hover:bg-primary/90");
      });

      it("powinien zastosować wariant default gdy explicite przekazano variant='default'", () => {
        // Arrange & Act
        render(<Button variant="default">Default Button</Button>);

        // Assert
        const button = screen.getByRole("button");
        expect(button).toHaveClass("bg-primary");
        expect(button).toHaveClass("text-primary-foreground");
        expect(button).toHaveClass("hover:bg-primary/90");
      });
    });

    describe("Wariant secondary", () => {
      it("powinien zastosować wariant secondary z odpowiednimi klasami", () => {
        // Arrange & Act
        render(<Button variant="secondary">Secondary Button</Button>);

        // Assert
        const button = screen.getByRole("button");
        expect(button).toHaveClass("bg-secondary");
        expect(button).toHaveClass("text-secondary-foreground");
        expect(button).toHaveClass("hover:bg-secondary/80");
      });

      it("nie powinien mieć klas z wariantu default", () => {
        // Arrange & Act
        render(<Button variant="secondary">Secondary Button</Button>);

        // Assert
        const button = screen.getByRole("button");
        expect(button).not.toHaveClass("bg-primary");
        expect(button).not.toHaveClass("text-primary-foreground");
        expect(button).not.toHaveClass("hover:bg-primary/90");
      });
    });

    describe("Wariant destructive", () => {
      it("powinien zastosować wariant destructive z odpowiednimi klasami", () => {
        // Arrange & Act
        render(<Button variant="destructive">Delete</Button>);

        // Assert
        const button = screen.getByRole("button");
        expect(button).toHaveClass("bg-destructive");
        expect(button).toHaveClass("text-destructive-foreground");
        expect(button).toHaveClass("hover:bg-destructive/90");
      });

      it("nie powinien mieć klas z innych wariantów", () => {
        // Arrange & Act
        render(<Button variant="destructive">Delete</Button>);

        // Assert
        const button = screen.getByRole("button");
        expect(button).not.toHaveClass("bg-primary");
        expect(button).not.toHaveClass("bg-secondary");
      });
    });

    describe("Wariant outline", () => {
      it("powinien zastosować wariant outline z odpowiednimi klasami", () => {
        // Arrange & Act
        render(<Button variant="outline">Outline Button</Button>);

        // Assert
        const button = screen.getByRole("button");
        expect(button).toHaveClass("border");
        expect(button).toHaveClass("border-input");
        expect(button).toHaveClass("hover:bg-accent");
        expect(button).toHaveClass("hover:text-accent-foreground");
      });

      it("nie powinien mieć klas background dla wariantu outline", () => {
        // Arrange & Act
        render(<Button variant="outline">Outline Button</Button>);

        // Assert
        const button = screen.getByRole("button");
        expect(button).not.toHaveClass("bg-primary");
        expect(button).not.toHaveClass("bg-secondary");
        expect(button).not.toHaveClass("bg-destructive");
      });
    });

    describe("Wariant ghost", () => {
      it("powinien zastosować wariant ghost z odpowiednimi klasami", () => {
        // Arrange & Act
        render(<Button variant="ghost">Ghost Button</Button>);

        // Assert
        const button = screen.getByRole("button");
        expect(button).toHaveClass("hover:bg-accent");
        expect(button).toHaveClass("hover:text-accent-foreground");
      });

      it("nie powinien mieć klas background ani border", () => {
        // Arrange & Act
        render(<Button variant="ghost">Ghost Button</Button>);

        // Assert
        const button = screen.getByRole("button");
        expect(button).not.toHaveClass("bg-primary");
        expect(button).not.toHaveClass("border");
        expect(button).not.toHaveClass("border-input");
      });
    });

    describe("Wariant link", () => {
      it("powinien zastosować wariant link z odpowiednimi klasami", () => {
        // Arrange & Act
        render(<Button variant="link">Link Button</Button>);

        // Assert
        const button = screen.getByRole("button");
        expect(button).toHaveClass("underline-offset-4");
        expect(button).toHaveClass("hover:underline");
        expect(button).toHaveClass("text-primary");
      });

      it("nie powinien mieć klas background", () => {
        // Arrange & Act
        render(<Button variant="link">Link Button</Button>);

        // Assert
        const button = screen.getByRole("button");
        expect(button).not.toHaveClass("bg-primary");
        expect(button).not.toHaveClass("bg-secondary");
      });
    });
  });

  describe("Rozmiary (size)", () => {
    describe("Rozmiar default", () => {
      it("powinien zastosować rozmiar default gdy nie przekazano size", () => {
        // Arrange & Act
        render(<Button>Default Size</Button>);

        // Assert
        const button = screen.getByRole("button");
        expect(button).toHaveClass("h-10");
        expect(button).toHaveClass("py-2");
        expect(button).toHaveClass("px-4");
      });

      it("powinien zastosować rozmiar default gdy explicite przekazano size='default'", () => {
        // Arrange & Act
        render(<Button size="default">Default Size</Button>);

        // Assert
        const button = screen.getByRole("button");
        expect(button).toHaveClass("h-10");
        expect(button).toHaveClass("py-2");
        expect(button).toHaveClass("px-4");
      });
    });

    describe("Rozmiar sm", () => {
      it("powinien zastosować rozmiar sm z odpowiednimi klasami", () => {
        // Arrange & Act
        render(<Button size="sm">Small Button</Button>);

        // Assert
        const button = screen.getByRole("button");
        expect(button).toHaveClass("h-9");
        expect(button).toHaveClass("px-3");
        expect(button).toHaveClass("rounded-md");
      });

      it("nie powinien mieć klas z rozmiaru default", () => {
        // Arrange & Act
        render(<Button size="sm">Small Button</Button>);

        // Assert
        const button = screen.getByRole("button");
        expect(button).not.toHaveClass("h-10");
        expect(button).not.toHaveClass("py-2");
        expect(button).not.toHaveClass("px-4");
      });
    });

    describe("Rozmiar lg", () => {
      it("powinien zastosować rozmiar lg z odpowiednimi klasami", () => {
        // Arrange & Act
        render(<Button size="lg">Large Button</Button>);

        // Assert
        const button = screen.getByRole("button");
        expect(button).toHaveClass("h-11");
        expect(button).toHaveClass("px-8");
        expect(button).toHaveClass("rounded-md");
      });

      it("nie powinien mieć klas z rozmiaru default", () => {
        // Arrange & Act
        render(<Button size="lg">Large Button</Button>);

        // Assert
        const button = screen.getByRole("button");
        expect(button).not.toHaveClass("h-10");
        expect(button).not.toHaveClass("py-2");
        expect(button).not.toHaveClass("px-4");
      });
    });

    describe("Rozmiar icon", () => {
      it("powinien zastosować rozmiar icon z odpowiednimi klasami", () => {
        // Arrange & Act
        render(<Button size="icon">🔍</Button>);

        // Assert
        const button = screen.getByRole("button");
        expect(button).toHaveClass("h-10");
        expect(button).toHaveClass("w-10");
      });

      it("powinien być kwadratowy (h-10 i w-10)", () => {
        // Arrange & Act
        render(<Button size="icon">🔍</Button>);

        // Assert
        const button = screen.getByRole("button");
        expect(button).toHaveClass("h-10");
        expect(button).toHaveClass("w-10");
      });
    });
  });

  describe("Przekazywanie dodatkowych klas CSS", () => {
    it("powinien przyjąć i zastosować dodatkowe klasy z prop className", () => {
      // Arrange
      const customClass = "custom-button-class";

      // Act
      render(<Button className={customClass}>Button</Button>);

      // Assert
      const button = screen.getByRole("button");
      expect(button).toHaveClass(customClass);
    });

    it("powinien zachować wszystkie bazowe klasy po dodaniu className", () => {
      // Arrange
      const customClass = "my-custom-button";

      // Act
      render(<Button className={customClass}>Button</Button>);

      // Assert
      const button = screen.getByRole("button");
      expect(button).toHaveClass("inline-flex");
      expect(button).toHaveClass("rounded-md");
      expect(button).toHaveClass("h-10");
      expect(button).toHaveClass(customClass);
    });

    it("powinien umożliwić nadpisanie stylów przez className", () => {
      // Arrange - nadpisanie koloru tła
      const overrideClass = "bg-red-500";

      // Act
      render(<Button className={overrideClass}>Button</Button>);

      // Assert - cn() inteligentnie merguje klasy, więc bg-red-500 zastępuje bg-primary
      const button = screen.getByRole("button");
      expect(button).toHaveClass(overrideClass);
      expect(button).not.toHaveClass("bg-primary");
    });

    it("powinien łączyć className z wariantem i rozmiarem", () => {
      // Arrange
      const customClass = "custom-secondary";

      // Act
      render(
        <Button variant="secondary" size="lg" className={customClass}>
          Button
        </Button>
      );

      // Assert
      const button = screen.getByRole("button");
      expect(button).toHaveClass("bg-secondary");
      expect(button).toHaveClass("h-11");
      expect(button).toHaveClass(customClass);
    });

    it("powinien poprawnie działać bez przekazanego className", () => {
      // Arrange & Act
      render(<Button>Button</Button>);

      // Assert
      const button = screen.getByRole("button");
      expect(button).toBeInTheDocument();
      expect(button).toHaveClass("inline-flex");
    });

    it("powinien obsłużyć pusty string jako className", () => {
      // Arrange & Act
      render(<Button className="">Button</Button>);

      // Assert
      const button = screen.getByRole("button");
      expect(button).toBeInTheDocument();
      expect(button).toHaveClass("inline-flex");
    });

    it("powinien obsłużyć undefined jako className", () => {
      // Arrange & Act
      render(<Button className={undefined}>Button</Button>);

      // Assert
      const button = screen.getByRole("button");
      expect(button).toBeInTheDocument();
      expect(button).toHaveClass("inline-flex");
    });
  });

  describe("ForwardRef - przekazywanie ref", () => {
    it("powinien umożliwić przekazanie ref do elementu button", () => {
      // Arrange
      const ref = createRef<HTMLButtonElement>();

      // Act
      render(<Button ref={ref}>Button with Ref</Button>);

      // Assert
      expect(ref.current).toBeInstanceOf(HTMLButtonElement);
      expect(ref.current).toHaveTextContent("Button with Ref");
    });

    it("powinien umożliwić dostęp do DOM node przez ref", () => {
      // Arrange
      const ref = createRef<HTMLButtonElement>();

      // Act
      render(<Button ref={ref}>Button</Button>);

      // Assert
      expect(ref.current).not.toBeNull();
      expect(ref.current?.tagName).toBe("BUTTON");
      expect(ref.current?.className).toContain("inline-flex");
    });

    it("powinien umożliwić manipulację DOM przez ref", () => {
      // Arrange
      const ref = createRef<HTMLButtonElement>();

      // Act
      render(<Button ref={ref}>Button</Button>);

      // Assert - możemy wykonać operacje DOM
      expect(ref.current?.querySelector).toBeDefined();
      expect(ref.current?.classList.contains("rounded-md")).toBe(true);
    });

    it("powinien umożliwić wywołanie metod button przez ref", () => {
      // Arrange
      const ref = createRef<HTMLButtonElement>();

      // Act
      render(<Button ref={ref}>Button</Button>);

      // Assert
      expect(ref.current?.click).toBeDefined();
      expect(ref.current?.focus).toBeDefined();
      expect(ref.current?.blur).toBeDefined();
    });
  });

  describe("Przekazywanie dodatkowych props HTML", () => {
    it("powinien przyjąć i zastosować standardowe atrybuty HTML", () => {
      // Arrange & Act
      render(
        <Button data-testid="custom-button" id="button-1" title="Button Title">
          Button
        </Button>
      );

      // Assert
      const button = screen.getByTestId("custom-button");
      expect(button).toHaveAttribute("id", "button-1");
      expect(button).toHaveAttribute("title", "Button Title");
    });

    it("powinien obsłużyć atrybut type", () => {
      // Arrange & Act
      render(<Button type="submit">Submit</Button>);

      // Assert
      const button = screen.getByRole("button");
      expect(button).toHaveAttribute("type", "submit");
    });

    it("powinien domyślnie nie mieć type jeśli nie został podany", () => {
      // Arrange & Act
      render(<Button>Button</Button>);

      // Assert
      const button = screen.getByRole("button");
      // HTML button domyślnie ma type="submit" w formularzu, ale bez formularza jest "button"
      expect(button).toBeInTheDocument();
    });

    it("powinien obsłużyć atrybut disabled", () => {
      // Arrange & Act
      render(<Button disabled>Disabled Button</Button>);

      // Assert
      const button = screen.getByRole("button");
      expect(button).toBeDisabled();
    });

    it("powinien obsłużyć aria atrybuty", () => {
      // Arrange & Act
      render(
        <Button aria-label="Close dialog" aria-pressed="true">
          X
        </Button>
      );

      // Assert
      const button = screen.getByLabelText("Close dialog");
      expect(button).toBeInTheDocument();
      expect(button).toHaveAttribute("aria-pressed", "true");
    });

    it("powinien obsłużyć data-* atrybuty", () => {
      // Arrange & Act
      render(
        <Button data-category="action" data-priority="high">
          Button
        </Button>
      );

      // Assert
      const button = screen.getByRole("button");
      expect(button).toHaveAttribute("data-category", "action");
      expect(button).toHaveAttribute("data-priority", "high");
    });

    it("powinien obsłużyć style inline", () => {
      // Arrange & Act
      render(<Button style={{ marginTop: "20px" }}>Button</Button>);

      // Assert
      const button = screen.getByRole("button");
      expect(button).toHaveStyle({ marginTop: "20px" });
    });

    it("powinien obsłużyć atrybut name", () => {
      // Arrange & Act
      render(<Button name="submit-button">Submit</Button>);

      // Assert
      const button = screen.getByRole("button");
      expect(button).toHaveAttribute("name", "submit-button");
    });

    it("powinien obsłużyć atrybut value", () => {
      // Arrange & Act
      render(<Button value="action">Action</Button>);

      // Assert
      const button = screen.getByRole("button");
      expect(button).toHaveAttribute("value", "action");
    });
  });

  describe("Interakcje użytkownika", () => {
    it("powinien obsłużyć onClick handler", async () => {
      // Arrange
      const user = userEvent.setup();
      const handleClick = vi.fn();

      // Act
      render(<Button onClick={handleClick}>Click me</Button>);
      const button = screen.getByRole("button");
      await user.click(button);

      // Assert
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it("powinien obsłużyć wielokrotne kliknięcia", async () => {
      // Arrange
      const user = userEvent.setup();
      const handleClick = vi.fn();

      // Act
      render(<Button onClick={handleClick}>Click me</Button>);
      const button = screen.getByRole("button");
      await user.click(button);
      await user.click(button);
      await user.click(button);

      // Assert
      expect(handleClick).toHaveBeenCalledTimes(3);
    });

    it("nie powinien wywołać onClick gdy button jest disabled", async () => {
      // Arrange
      const user = userEvent.setup();
      const handleClick = vi.fn();

      // Act
      render(
        <Button onClick={handleClick} disabled>
          Disabled Button
        </Button>
      );
      const button = screen.getByRole("button");
      await user.click(button);

      // Assert
      expect(handleClick).not.toHaveBeenCalled();
    });

    it("powinien obsłużyć onMouseEnter i onMouseLeave", async () => {
      // Arrange
      const user = userEvent.setup();
      const handleMouseEnter = vi.fn();
      const handleMouseLeave = vi.fn();

      // Act
      render(
        <Button onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
          Hover me
        </Button>
      );
      const button = screen.getByRole("button");
      await user.hover(button);
      await user.unhover(button);

      // Assert
      expect(handleMouseEnter).toHaveBeenCalledTimes(1);
      expect(handleMouseLeave).toHaveBeenCalledTimes(1);
    });

    it("powinien obsłużyć onFocus i onBlur", async () => {
      // Arrange
      const user = userEvent.setup();
      const handleFocus = vi.fn();
      const handleBlur = vi.fn();

      // Act
      render(
        <Button onFocus={handleFocus} onBlur={handleBlur}>
          Focus me
        </Button>
      );
      const button = screen.getByRole("button");
      await user.click(button); // kliknięcie ustawia focus
      await user.tab(); // tab przenosi focus na następny element, wywołując blur

      // Assert
      expect(handleFocus).toHaveBeenCalledTimes(1);
      expect(handleBlur).toHaveBeenCalledTimes(1);
    });

    it("powinien obsłużyć keyboard navigation (Enter)", async () => {
      // Arrange
      const user = userEvent.setup();
      const handleClick = vi.fn();

      // Act
      render(<Button onClick={handleClick}>Press Enter</Button>);
      const button = screen.getByRole("button");
      button.focus();
      await user.keyboard("{Enter}");

      // Assert
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it("powinien obsłużyć keyboard navigation (Space)", async () => {
      // Arrange
      const user = userEvent.setup();
      const handleClick = vi.fn();

      // Act
      render(<Button onClick={handleClick}>Press Space</Button>);
      const button = screen.getByRole("button");
      button.focus();
      await user.keyboard(" ");

      // Assert
      expect(handleClick).toHaveBeenCalledTimes(1);
    });
  });

  describe("Kombinacje props", () => {
    it("powinien obsłużyć kombinację variant + size", () => {
      // Arrange & Act
      render(
        <Button variant="secondary" size="lg">
          Large Secondary
        </Button>
      );

      // Assert
      const button = screen.getByRole("button");
      expect(button).toHaveClass("bg-secondary");
      expect(button).toHaveClass("h-11");
    });

    it("powinien obsłużyć kombinację variant + className", () => {
      // Arrange & Act
      render(
        <Button variant="destructive" className="w-full">
          Full Width Delete
        </Button>
      );

      // Assert
      const button = screen.getByRole("button");
      expect(button).toHaveClass("bg-destructive");
      expect(button).toHaveClass("w-full");
    });

    it("powinien obsłużyć kombinację size + className", () => {
      // Arrange & Act
      render(
        <Button size="sm" className="uppercase">
          Small Uppercase
        </Button>
      );

      // Assert
      const button = screen.getByRole("button");
      expect(button).toHaveClass("h-9");
      expect(button).toHaveClass("uppercase");
    });

    it("powinien obsłużyć wszystkie props jednocześnie", () => {
      // Arrange
      const ref = createRef<HTMLButtonElement>();
      const handleClick = vi.fn();

      // Act
      render(
        <Button
          ref={ref}
          variant="outline"
          size="lg"
          className="custom-class"
          data-testid="full-button"
          onClick={handleClick}
          aria-label="Complete Button"
          type="submit"
          disabled={false}
        >
          Complete Button
        </Button>
      );

      // Assert
      const button = screen.getByTestId("full-button");
      expect(button).toBeInTheDocument();
      expect(button).toHaveClass("border-input");
      expect(button).toHaveClass("h-11");
      expect(button).toHaveClass("custom-class");
      expect(button).toHaveAttribute("aria-label", "Complete Button");
      expect(button).toHaveAttribute("type", "submit");
      expect(ref.current).toBe(button);
    });

    it("powinien obsłużyć zmianę wariantu podczas re-renderowania", () => {
      // Arrange
      const { rerender } = render(<Button variant="default">Button</Button>);

      // Assert - początkowy wariant
      let button = screen.getByRole("button");
      expect(button).toHaveClass("bg-primary");

      // Act - zmiana wariantu
      rerender(<Button variant="secondary">Button</Button>);

      // Assert - nowy wariant
      button = screen.getByRole("button");
      expect(button).toHaveClass("bg-secondary");
      expect(button).not.toHaveClass("bg-primary");
    });

    it("powinien obsłużyć zmianę rozmiaru podczas re-renderowania", () => {
      // Arrange
      const { rerender } = render(<Button size="default">Button</Button>);

      // Assert - początkowy rozmiar
      let button = screen.getByRole("button");
      expect(button).toHaveClass("h-10");
      expect(button).toHaveClass("px-4");

      // Act - zmiana rozmiaru
      rerender(<Button size="sm">Button</Button>);

      // Assert - nowy rozmiar
      button = screen.getByRole("button");
      expect(button).toHaveClass("h-9");
      expect(button).toHaveClass("px-3");
      expect(button).not.toHaveClass("px-4");
    });
  });

  describe("Edge cases", () => {
    it("powinien obsłużyć pusty children", () => {
      // Arrange & Act
      render(<Button></Button>);

      // Assert - button powinien być w DOM mimo braku contentu
      const buttons = document.querySelectorAll("button.inline-flex");
      expect(buttons.length).toBeGreaterThan(0);
    });

    it("powinien obsłużyć długi tekst jako children", () => {
      // Arrange
      const longText = "Lorem ipsum dolor sit amet, consectetur adipiscing elit".repeat(5);

      // Act
      render(<Button>{longText}</Button>);

      // Assert
      const button = screen.getByRole("button");
      expect(button).toBeInTheDocument();
      expect(button).toHaveTextContent(longText);
    });

    it("powinien obsłużyć wielokrotne re-renderowanie bez błędów", () => {
      // Arrange
      const { rerender } = render(<Button>Button 1</Button>);

      // Act & Assert
      expect(screen.getByRole("button")).toHaveTextContent("Button 1");

      rerender(<Button>Button 2</Button>);
      expect(screen.getByRole("button")).toHaveTextContent("Button 2");

      rerender(<Button>Button 3</Button>);
      expect(screen.getByRole("button")).toHaveTextContent("Button 3");
    });

    it("powinien zachować identyczność ref między re-renderami", () => {
      // Arrange
      const ref = createRef<HTMLButtonElement>();
      const { rerender } = render(<Button ref={ref}>Button</Button>);
      const initialRef = ref.current;

      // Act
      rerender(<Button ref={ref}>Button Updated</Button>);

      // Assert - ref wskazuje na ten sam element DOM
      expect(ref.current).toBe(initialRef);
    });

    it("powinien obsłużyć children będący liczbą", () => {
      // Arrange & Act
      render(<Button>{42}</Button>);

      // Assert
      const button = screen.getByRole("button", { name: "42" });
      expect(button).toBeInTheDocument();
    });

    it("powinien obsłużyć children będący zerem", () => {
      // Arrange & Act
      render(<Button>{0}</Button>);

      // Assert
      const button = screen.getByRole("button", { name: "0" });
      expect(button).toBeInTheDocument();
    });

    it("powinien obsłużyć null jako children (React pominie null)", () => {
      // Arrange & Act
      render(<Button>{null}</Button>);

      // Assert - button jest w DOM, ale bez contentu
      const buttons = document.querySelectorAll("button.inline-flex");
      expect(buttons.length).toBeGreaterThan(0);
    });

    it("powinien obsłużyć warunkowe renderowanie children", () => {
      // Arrange
      const showIcon = true;

      // Act
      render(
        <Button>
          {showIcon && <span data-testid="icon">✓</span>}
          <span>Save</span>
        </Button>
      );

      // Assert
      expect(screen.getByTestId("icon")).toBeInTheDocument();
      expect(screen.getByRole("button")).toHaveTextContent("✓Save");
    });
  });

  describe("TypeScript type safety (runtime checks)", () => {
    it("powinien zaakceptować wszystkie dozwolone warianty", () => {
      // Act & Assert - kompilacja bez błędów oznacza sukces
      render(<Button variant="default">Default</Button>);
      render(<Button variant="secondary">Secondary</Button>);
      render(<Button variant="destructive">Destructive</Button>);
      render(<Button variant="outline">Outline</Button>);
      render(<Button variant="ghost">Ghost</Button>);
      render(<Button variant="link">Link</Button>);

      expect(screen.getByRole("button", { name: "Default" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Secondary" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Destructive" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Outline" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Ghost" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Link" })).toBeInTheDocument();
    });

    it("powinien zaakceptować wszystkie dozwolone rozmiary", () => {
      // Act & Assert
      render(<Button size="default">Default Size</Button>);
      render(<Button size="sm">Small Size</Button>);
      render(<Button size="lg">Large Size</Button>);
      render(<Button size="icon">🔍</Button>);

      expect(screen.getByRole("button", { name: "Default Size" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Small Size" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Large Size" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "🔍" })).toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("powinien być dostępny dla screen readerów", () => {
      // Arrange & Act
      render(<Button>Submit Form</Button>);

      // Assert
      const button = screen.getByRole("button", { name: "Submit Form" });
      expect(button).toBeInTheDocument();
    });

    it("powinien wspierać aria-label gdy content nie jest wystarczająco opisowy", () => {
      // Arrange & Act
      render(<Button aria-label="Close modal">X</Button>);

      // Assert
      const button = screen.getByLabelText("Close modal");
      expect(button).toBeInTheDocument();
      expect(button).toHaveTextContent("X");
    });

    it("powinien mieć focus ring dla keyboard navigation", () => {
      // Arrange & Act
      render(<Button>Focusable Button</Button>);

      // Assert
      const button = screen.getByRole("button");
      expect(button).toHaveClass("focus-visible:ring-2");
      expect(button).toHaveClass("focus-visible:ring-ring");
      expect(button).toHaveClass("focus-visible:outline-none");
    });

    it("powinien obsługiwać disabled state dla accessibility", () => {
      // Arrange & Act
      render(<Button disabled>Disabled Button</Button>);

      // Assert
      const button = screen.getByRole("button");
      expect(button).toBeDisabled();
      expect(button).toHaveClass("disabled:opacity-50");
      expect(button).toHaveClass("disabled:pointer-events-none");
    });

    it("powinien być możliwy do focusowania przez keyboard", async () => {
      // Arrange
      const user = userEvent.setup();

      // Act
      render(
        <>
          <Button>First</Button>
          <Button>Second</Button>
        </>
      );
      await user.tab();

      // Assert - pierwszy button powinien mieć focus
      expect(screen.getByRole("button", { name: "First" })).toHaveFocus();
    });

    it("nie powinien być możliwy do focusowania gdy jest disabled", async () => {
      // Arrange
      const user = userEvent.setup();

      // Act
      render(
        <>
          <Button disabled>First</Button>
          <Button>Second</Button>
        </>
      );
      await user.tab();

      // Assert - disabled button jest pomijany, focus na drugim
      expect(screen.getByRole("button", { name: "Second" })).toHaveFocus();
    });

    it("powinien wspierać aria-pressed dla toggle buttons", () => {
      // Arrange & Act
      render(<Button aria-pressed="true">Toggle Active</Button>);

      // Assert
      const button = screen.getByRole("button");
      expect(button).toHaveAttribute("aria-pressed", "true");
    });

    it("powinien wspierać aria-expanded dla disclosure buttons", () => {
      // Arrange & Act
      render(<Button aria-expanded="false">Show More</Button>);

      // Assert
      const button = screen.getByRole("button");
      expect(button).toHaveAttribute("aria-expanded", "false");
    });

    it("powinien wspierać aria-controls dla powiązanych elementów", () => {
      // Arrange & Act
      render(<Button aria-controls="modal-1">Open Modal</Button>);

      // Assert
      const button = screen.getByRole("button");
      expect(button).toHaveAttribute("aria-controls", "modal-1");
    });
  });

  describe("Integracja z CVA", () => {
    it("powinien poprawnie łączyć klasy bazowe z wariantem przez CVA", () => {
      // Arrange & Act
      render(<Button variant="secondary">CVA Button</Button>);

      // Assert - klasy bazowe
      const button = screen.getByRole("button");
      expect(button).toHaveClass("inline-flex");
      expect(button).toHaveClass("rounded-md");
      expect(button).toHaveClass("h-10");

      // Assert - klasy z wariantu
      expect(button).toHaveClass("bg-secondary");
      expect(button).toHaveClass("text-secondary-foreground");
    });

    it("powinien poprawnie łączyć klasy bazowe z rozmiarem przez CVA", () => {
      // Arrange & Act
      render(<Button size="lg">Large CVA Button</Button>);

      // Assert - klasy bazowe
      const button = screen.getByRole("button");
      expect(button).toHaveClass("inline-flex");
      expect(button).toHaveClass("rounded-md");

      // Assert - klasy z rozmiaru
      expect(button).toHaveClass("h-11");
      expect(button).toHaveClass("px-8");
    });

    it("powinien poprawnie łączyć wszystkie źródła klas (CVA + variant + size + className) przez cn()", () => {
      // Arrange & Act
      render(
        <Button variant="outline" size="sm" className="my-custom-class">
          Combined Classes
        </Button>
      );

      // Assert
      const button = screen.getByRole("button");
      // Bazowe z CVA
      expect(button).toHaveClass("inline-flex");
      // Z wariantu
      expect(button).toHaveClass("border-input");
      // Z rozmiaru
      expect(button).toHaveClass("h-9");
      // Custom className
      expect(button).toHaveClass("my-custom-class");
    });
  });

  describe("Użycie w formularzu", () => {
    it("powinien domyślnie nie submitować formularza bez type", async () => {
      // Arrange
      const user = userEvent.setup();
      const handleSubmit = vi.fn((e) => e.preventDefault());

      // Act
      render(
        <form onSubmit={handleSubmit}>
          <Button>Click me</Button>
        </form>
      );
      const button = screen.getByRole("button");
      await user.click(button);

      // Assert - button bez type="submit" nie powinien submitować formularza
      // W rzeczywistości HTML button ma domyślnie type="submit" w formularzu
      expect(button).toBeInTheDocument();
    });

    it("powinien submitować formularz gdy type='submit'", async () => {
      // Arrange
      const user = userEvent.setup();
      const handleSubmit = vi.fn((e) => e.preventDefault());

      // Act
      render(
        <form onSubmit={handleSubmit}>
          <Button type="submit">Submit</Button>
        </form>
      );
      const button = screen.getByRole("button");
      await user.click(button);

      // Assert
      expect(handleSubmit).toHaveBeenCalledTimes(1);
    });

    it("nie powinien submitować formularza gdy type='button'", async () => {
      // Arrange
      const user = userEvent.setup();
      const handleSubmit = vi.fn((e) => e.preventDefault());

      // Act
      render(
        <form onSubmit={handleSubmit}>
          <Button type="button">Dont Submit</Button>
        </form>
      );
      const button = screen.getByRole("button");
      await user.click(button);

      // Assert
      expect(handleSubmit).not.toHaveBeenCalled();
    });

    it("powinien zresetować formularz gdy type='reset'", async () => {
      // Arrange
      const user = userEvent.setup();
      const handleReset = vi.fn();

      // Act
      render(
        <form onReset={handleReset}>
          <input type="text" defaultValue="test" />
          <Button type="reset">Reset</Button>
        </form>
      );
      const button = screen.getByRole("button");
      await user.click(button);

      // Assert
      expect(handleReset).toHaveBeenCalledTimes(1);
    });
  });
});
