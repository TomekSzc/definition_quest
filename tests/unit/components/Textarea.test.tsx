import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React, { createRef } from "react";
import { Textarea } from "@/components/ui/Textarea";

/**
 * Testy jednostkowe dla komponentu Textarea
 *
 * Testowane funkcjonalności:
 * - Podstawowe renderowanie i struktura DOM
 * - Style bazowe i wariantowe z Tailwind
 * - ForwardRef - możliwość przekazania ref
 * - Przekazywanie dodatkowych props HTML
 * - Przekazywanie dodatkowych klas CSS
 * - Interakcje użytkownika (onChange, onFocus, onBlur)
 * - Accessibility (label, disabled state, focus)
 * - Edge cases (długi tekst, puste wartości, zmiana props)
 * - Kombinacje props (className + disabled + value)
 */

describe("Textarea", () => {
  describe("Renderowanie i struktura DOM", () => {
    it("powinien wyrenderować textarea z podstawowymi klasami Tailwind", () => {
      // Arrange & Act
      render(<Textarea />);

      // Assert
      const textarea = document.querySelector("textarea");
      expect(textarea).toBeInTheDocument();
      expect(textarea?.tagName).toBe("TEXTAREA");
      expect(textarea).toHaveClass("flex");
      expect(textarea).toHaveClass("min-h-[80px]");
      expect(textarea).toHaveClass("w-full");
      expect(textarea).toHaveClass("rounded-md");
    });

    it("powinien zawierać tekst przekazany jako value", () => {
      // Arrange
      const testValue = "Test content";

      // Act
      render(<Textarea value={testValue} readOnly />);

      // Assert
      const textarea = screen.getByDisplayValue(testValue);
      expect(textarea).toBeInTheDocument();
      expect(textarea).toHaveValue(testValue);
    });

    it("powinien renderować textarea bez wartości domyślnie", () => {
      // Arrange & Act
      render(<Textarea />);

      // Assert
      const textarea = document.querySelector("textarea") as HTMLTextAreaElement;
      expect(textarea).toBeInTheDocument();
      expect(textarea.value).toBe("");
    });

    it("powinien zachować defaultValue przekazane jako prop", () => {
      // Arrange
      const defaultText = "Default content";

      // Act
      render(<Textarea defaultValue={defaultText} />);

      // Assert
      const textarea = screen.getByDisplayValue(defaultText) as HTMLTextAreaElement;
      expect(textarea.value).toBe(defaultText);
    });
  });

  describe("Style bazowe z Tailwind", () => {
    it("powinien mieć wszystkie podstawowe klasy stylowania", () => {
      // Arrange & Act
      render(<Textarea />);

      // Assert
      const textarea = document.querySelector("textarea");
      expect(textarea).toHaveClass("flex");
      expect(textarea).toHaveClass("min-h-[80px]");
      expect(textarea).toHaveClass("w-full");
      expect(textarea).toHaveClass("rounded-md");
      expect(textarea).toHaveClass("border");
      expect(textarea).toHaveClass("border-input");
      expect(textarea).toHaveClass("bg-background");
      expect(textarea).toHaveClass("px-3");
      expect(textarea).toHaveClass("py-2");
      expect(textarea).toHaveClass("text-sm");
      expect(textarea).toHaveClass("text-foreground");
      expect(textarea).toHaveClass("shadow-sm");
    });

    it("powinien mieć klasy focus-visible state dla accessibility", () => {
      // Arrange & Act
      render(<Textarea />);

      // Assert
      const textarea = document.querySelector("textarea");
      expect(textarea).toHaveClass("focus-visible:outline-none");
      expect(textarea).toHaveClass("focus-visible:ring-2");
      expect(textarea).toHaveClass("focus-visible:ring-ring");
      expect(textarea).toHaveClass("focus-visible:ring-offset-2");
    });

    it("powinien mieć klasy disabled state", () => {
      // Arrange & Act
      render(<Textarea />);

      // Assert
      const textarea = document.querySelector("textarea");
      expect(textarea).toHaveClass("disabled:cursor-not-allowed");
      expect(textarea).toHaveClass("disabled:opacity-50");
    });

    it("powinien mieć klasę placeholder dla muted-foreground", () => {
      // Arrange & Act
      render(<Textarea />);

      // Assert
      const textarea = document.querySelector("textarea");
      expect(textarea).toHaveClass("placeholder:text-muted-foreground");
    });
  });

  describe("Przekazywanie dodatkowych klas CSS", () => {
    it("powinien przyjąć i zastosować dodatkowe klasy z prop className", () => {
      // Arrange
      const customClass = "custom-textarea-class";

      // Act
      render(<Textarea className={customClass} />);

      // Assert
      const textarea = document.querySelector("textarea");
      expect(textarea).toHaveClass(customClass);
    });

    it("powinien zachować wszystkie bazowe klasy po dodaniu className", () => {
      // Arrange
      const customClass = "my-custom-textarea";

      // Act
      render(<Textarea className={customClass} />);

      // Assert
      const textarea = document.querySelector("textarea");
      expect(textarea).toHaveClass("flex");
      expect(textarea).toHaveClass("min-h-[80px]");
      expect(textarea).toHaveClass("w-full");
      expect(textarea).toHaveClass("rounded-md");
      expect(textarea).toHaveClass(customClass);
    });

    it("powinien umożliwić nadpisanie stylów przez className", () => {
      // Arrange - nadpisanie minimalnej wysokości
      const overrideClass = "min-h-[120px]";

      // Act
      render(<Textarea className={overrideClass} />);

      // Assert - cn() inteligentnie merguje klasy
      const textarea = document.querySelector("textarea");
      expect(textarea).toHaveClass(overrideClass);
      expect(textarea).not.toHaveClass("min-h-[80px]");
    });

    it("powinien poprawnie działać bez przekazanego className", () => {
      // Arrange & Act
      render(<Textarea />);

      // Assert
      const textarea = document.querySelector("textarea");
      expect(textarea).toBeInTheDocument();
      expect(textarea).toHaveClass("flex");
    });

    it("powinien obsłużyć pusty string jako className", () => {
      // Arrange & Act
      render(<Textarea className="" />);

      // Assert
      const textarea = document.querySelector("textarea");
      expect(textarea).toBeInTheDocument();
      expect(textarea).toHaveClass("flex");
    });

    it("powinien obsłużyć undefined jako className", () => {
      // Arrange & Act
      render(<Textarea className={undefined} />);

      // Assert
      const textarea = document.querySelector("textarea");
      expect(textarea).toBeInTheDocument();
      expect(textarea).toHaveClass("flex");
    });
  });

  describe("ForwardRef - przekazywanie ref", () => {
    it("powinien umożliwić przekazanie ref do elementu textarea", () => {
      // Arrange
      const ref = createRef<HTMLTextAreaElement>();

      // Act
      render(<Textarea ref={ref} />);

      // Assert
      expect(ref.current).toBeInstanceOf(HTMLTextAreaElement);
      expect(ref.current?.tagName).toBe("TEXTAREA");
    });

    it("powinien umożliwić dostęp do DOM node przez ref", () => {
      // Arrange
      const ref = createRef<HTMLTextAreaElement>();

      // Act
      render(<Textarea ref={ref} defaultValue="Test content" />);

      // Assert
      expect(ref.current).not.toBeNull();
      expect(ref.current?.tagName).toBe("TEXTAREA");
      expect(ref.current?.className).toContain("flex");
      expect(ref.current?.value).toBe("Test content");
    });

    it("powinien umożliwić manipulację DOM przez ref", () => {
      // Arrange
      const ref = createRef<HTMLTextAreaElement>();

      // Act
      render(<Textarea ref={ref} />);

      // Assert - możemy wykonać operacje DOM
      expect(ref.current?.focus).toBeDefined();
      expect(ref.current?.blur).toBeDefined();
      expect(ref.current?.classList.contains("rounded-md")).toBe(true);
    });

    it("powinien umożliwić wywołanie metod textarea przez ref", () => {
      // Arrange
      const ref = createRef<HTMLTextAreaElement>();

      // Act
      render(<Textarea ref={ref} />);

      // Assert
      expect(ref.current?.select).toBeDefined();
      expect(ref.current?.setSelectionRange).toBeDefined();
      expect(ref.current?.focus).toBeDefined();
      expect(ref.current?.blur).toBeDefined();
    });

    it("powinien umożliwić ustawienie wartości przez ref", () => {
      // Arrange
      const ref = createRef<HTMLTextAreaElement>();

      // Act
      render(<Textarea ref={ref} />);

      // Assert - możemy ustawić wartość przez ref
      if (ref.current) {
        ref.current.value = "New value";
        expect(ref.current.value).toBe("New value");
      }
    });
  });

  describe("Przekazywanie dodatkowych props HTML", () => {
    it("powinien przyjąć i zastosować standardowe atrybuty HTML", () => {
      // Arrange & Act
      render(<Textarea data-testid="custom-textarea" id="textarea-1" title="Textarea Title" />);

      // Assert
      const textarea = screen.getByTestId("custom-textarea");
      expect(textarea).toHaveAttribute("id", "textarea-1");
      expect(textarea).toHaveAttribute("title", "Textarea Title");
    });

    it("powinien obsłużyć atrybut placeholder", () => {
      // Arrange & Act
      render(<Textarea placeholder="Enter your text here..." />);

      // Assert
      const textarea = screen.getByPlaceholderText("Enter your text here...");
      expect(textarea).toBeInTheDocument();
      expect(textarea).toHaveAttribute("placeholder", "Enter your text here...");
    });

    it("powinien obsłużyć atrybut disabled", () => {
      // Arrange & Act
      render(<Textarea disabled />);

      // Assert
      const textarea = document.querySelector("textarea");
      expect(textarea).toBeDisabled();
    });

    it("powinien obsłużyć atrybut readOnly", () => {
      // Arrange & Act
      render(<Textarea readOnly value="Read-only content" />);

      // Assert
      const textarea = document.querySelector("textarea");
      expect(textarea).toHaveAttribute("readOnly");
    });

    it("powinien obsłużyć atrybut required", () => {
      // Arrange & Act
      render(<Textarea required />);

      // Assert
      const textarea = document.querySelector("textarea");
      expect(textarea).toBeRequired();
    });

    it("powinien obsłużyć atrybut maxLength", () => {
      // Arrange & Act
      render(<Textarea maxLength={100} />);

      // Assert
      const textarea = document.querySelector("textarea");
      expect(textarea).toHaveAttribute("maxLength", "100");
    });

    it("powinien obsłużyć atrybut rows", () => {
      // Arrange & Act
      render(<Textarea rows={5} />);

      // Assert
      const textarea = document.querySelector("textarea");
      expect(textarea).toHaveAttribute("rows", "5");
    });

    it("powinien obsłużyć atrybut cols", () => {
      // Arrange & Act
      render(<Textarea cols={50} />);

      // Assert
      const textarea = document.querySelector("textarea");
      expect(textarea).toHaveAttribute("cols", "50");
    });

    it("powinien obsłużyć aria atrybuty", () => {
      // Arrange & Act
      render(<Textarea aria-label="Description field" aria-describedby="help-text" />);

      // Assert
      const textarea = screen.getByLabelText("Description field");
      expect(textarea).toBeInTheDocument();
      expect(textarea).toHaveAttribute("aria-describedby", "help-text");
    });

    it("powinien obsłużyć data-* atrybuty", () => {
      // Arrange & Act
      render(<Textarea data-category="feedback" data-priority="high" />);

      // Assert
      const textarea = document.querySelector("textarea");
      expect(textarea).toHaveAttribute("data-category", "feedback");
      expect(textarea).toHaveAttribute("data-priority", "high");
    });

    it("powinien obsłużyć style inline", () => {
      // Arrange & Act
      render(<Textarea style={{ marginTop: "20px" }} />);

      // Assert
      const textarea = document.querySelector("textarea");
      expect(textarea).toHaveStyle({ marginTop: "20px" });
    });

    it("powinien obsłużyć atrybut name", () => {
      // Arrange & Act
      render(<Textarea name="description" />);

      // Assert
      const textarea = document.querySelector("textarea");
      expect(textarea).toHaveAttribute("name", "description");
    });
  });

  describe("Interakcje użytkownika", () => {
    it("powinien obsłużyć onChange handler", async () => {
      // Arrange
      const user = userEvent.setup();
      const handleChange = vi.fn();

      // Act
      render(<Textarea onChange={handleChange} />);
      const textarea = document.querySelector("textarea") as HTMLTextAreaElement;
      await user.type(textarea, "Hello");

      // Assert
      expect(handleChange).toHaveBeenCalled();
      expect(textarea.value).toBe("Hello");
    });

    it("powinien obsłużyć wielokrotne wpisywanie tekstu", async () => {
      // Arrange
      const user = userEvent.setup();
      const handleChange = vi.fn();

      // Act
      render(<Textarea onChange={handleChange} />);
      const textarea = document.querySelector("textarea") as HTMLTextAreaElement;
      await user.type(textarea, "Test");

      // Assert
      expect(handleChange).toHaveBeenCalledTimes(4); // Po jednym dla każdej litery
      expect(textarea.value).toBe("Test");
    });

    it("nie powinien wywołać onChange gdy textarea jest disabled", async () => {
      // Arrange
      const user = userEvent.setup();
      const handleChange = vi.fn();

      // Act
      render(<Textarea onChange={handleChange} disabled />);
      const textarea = document.querySelector("textarea") as HTMLTextAreaElement;
      await user.type(textarea, "Test");

      // Assert
      expect(handleChange).not.toHaveBeenCalled();
      expect(textarea.value).toBe("");
    });

    it("nie powinien umożliwić edycji gdy textarea jest readOnly", async () => {
      // Arrange
      const user = userEvent.setup();
      const handleChange = vi.fn();

      // Act
      render(<Textarea onChange={handleChange} readOnly value="Read-only" />);
      const textarea = document.querySelector("textarea") as HTMLTextAreaElement;
      await user.type(textarea, "New text");

      // Assert
      expect(handleChange).not.toHaveBeenCalled();
      expect(textarea.value).toBe("Read-only");
    });

    it("powinien obsłużyć onFocus i onBlur", async () => {
      // Arrange
      const user = userEvent.setup();
      const handleFocus = vi.fn();
      const handleBlur = vi.fn();

      // Act
      render(<Textarea onFocus={handleFocus} onBlur={handleBlur} />);
      const textarea = document.querySelector("textarea") as HTMLTextAreaElement;
      await user.click(textarea); // ustawia focus
      await user.tab(); // przenosi focus na następny element, wywołując blur

      // Assert
      expect(handleFocus).toHaveBeenCalledTimes(1);
      expect(handleBlur).toHaveBeenCalledTimes(1);
    });

    it("powinien obsłużyć keyboard navigation (Tab)", async () => {
      // Arrange
      const user = userEvent.setup();

      // Act
      render(
        <>
          <Textarea data-testid="first" />
          <Textarea data-testid="second" />
        </>
      );
      await user.tab();

      // Assert - pierwszy textarea powinien mieć focus
      expect(screen.getByTestId("first")).toHaveFocus();
    });

    it("powinien obsłużyć Enter key (nowa linia)", async () => {
      // Arrange
      const user = userEvent.setup();
      const handleChange = vi.fn();

      // Act
      render(<Textarea onChange={handleChange} />);
      const textarea = document.querySelector("textarea") as HTMLTextAreaElement;
      await user.type(textarea, "Line 1{Enter}Line 2");

      // Assert
      expect(textarea.value).toContain("\n");
      expect(textarea.value).toBe("Line 1\nLine 2");
    });

    it("powinien obsłużyć onKeyDown handler", async () => {
      // Arrange
      const user = userEvent.setup();
      const handleKeyDown = vi.fn();

      // Act
      render(<Textarea onKeyDown={handleKeyDown} />);
      const textarea = document.querySelector("textarea") as HTMLTextAreaElement;
      await user.type(textarea, "a");

      // Assert
      expect(handleKeyDown).toHaveBeenCalled();
    });

    it("powinien obsłużyć onKeyUp handler", async () => {
      // Arrange
      const user = userEvent.setup();
      const handleKeyUp = vi.fn();

      // Act
      render(<Textarea onKeyUp={handleKeyUp} />);
      const textarea = document.querySelector("textarea") as HTMLTextAreaElement;
      await user.type(textarea, "a");

      // Assert
      expect(handleKeyUp).toHaveBeenCalled();
    });
  });

  describe("Kombinacje props", () => {
    it("powinien obsłużyć kombinację className + placeholder", () => {
      // Arrange & Act
      render(<Textarea className="w-full max-w-md" placeholder="Enter description" />);

      // Assert
      const textarea = screen.getByPlaceholderText("Enter description");
      expect(textarea).toHaveClass("flex");
      expect(textarea).toHaveClass("w-full");
      expect(textarea).toHaveClass("max-w-md");
    });

    it("powinien obsłużyć kombinację disabled + className", () => {
      // Arrange & Act
      render(<Textarea disabled className="opacity-75" />);

      // Assert
      const textarea = document.querySelector("textarea");
      expect(textarea).toBeDisabled();
      expect(textarea).toHaveClass("disabled:cursor-not-allowed");
      expect(textarea).toHaveClass("opacity-75");
    });

    it("powinien obsłużyć wszystkie props jednocześnie", () => {
      // Arrange
      const ref = createRef<HTMLTextAreaElement>();
      const handleChange = vi.fn();

      // Act
      render(
        <Textarea
          ref={ref}
          className="custom-class"
          data-testid="full-textarea"
          onChange={handleChange}
          placeholder="Complete textarea"
          rows={10}
          maxLength={500}
          required
          aria-label="Description field"
          name="description"
        />
      );

      // Assert
      const textarea = screen.getByTestId("full-textarea");
      expect(textarea).toBeInTheDocument();
      expect(textarea).toHaveClass("flex");
      expect(textarea).toHaveClass("custom-class");
      expect(textarea).toHaveAttribute("placeholder", "Complete textarea");
      expect(textarea).toHaveAttribute("rows", "10");
      expect(textarea).toHaveAttribute("maxLength", "500");
      expect(textarea).toHaveAttribute("aria-label", "Description field");
      expect(textarea).toHaveAttribute("name", "description");
      expect(textarea).toBeRequired();
      expect(ref.current).toBe(textarea);
    });

    it("powinien obsłużyć zmianę className podczas re-renderowania", () => {
      // Arrange
      const { rerender } = render(<Textarea className="min-h-[80px]" />);

      // Assert - początkowa klasa
      let textarea = document.querySelector("textarea");
      expect(textarea).toHaveClass("min-h-[80px]");

      // Act - zmiana className
      rerender(<Textarea className="min-h-[120px]" />);

      // Assert - nowa klasa
      textarea = document.querySelector("textarea");
      expect(textarea).toHaveClass("min-h-[120px]");
      expect(textarea).not.toHaveClass("min-h-[80px]");
    });

    it("powinien obsłużyć zmianę disabled podczas re-renderowania", () => {
      // Arrange
      const { rerender } = render(<Textarea disabled={false} />);

      // Assert - początkowy stan
      let textarea = document.querySelector("textarea");
      expect(textarea).not.toBeDisabled();

      // Act - zmiana na disabled
      rerender(<Textarea disabled={true} />);

      // Assert - nowy stan
      textarea = document.querySelector("textarea");
      expect(textarea).toBeDisabled();
    });
  });

  describe("Edge cases", () => {
    it("powinien obsłużyć bardzo długi tekst jako value", () => {
      // Arrange
      const longText = "Lorem ipsum dolor sit amet, consectetur adipiscing elit. ".repeat(50);

      // Act
      render(<Textarea value={longText} readOnly />);

      // Assert
      const textarea = document.querySelector("textarea") as HTMLTextAreaElement;
      expect(textarea).toBeInTheDocument();
      expect(textarea.value).toBe(longText);
    });

    it("powinien obsłużyć wielokrotne re-renderowanie bez błędów", () => {
      // Arrange
      const { rerender } = render(<Textarea value="Text 1" readOnly />);

      // Act & Assert
      expect(screen.getByDisplayValue("Text 1")).toBeInTheDocument();

      rerender(<Textarea value="Text 2" readOnly />);
      expect(screen.getByDisplayValue("Text 2")).toBeInTheDocument();

      rerender(<Textarea value="Text 3" readOnly />);
      expect(screen.getByDisplayValue("Text 3")).toBeInTheDocument();
    });

    it("powinien zachować identyczność ref między re-renderami", () => {
      // Arrange
      const ref = createRef<HTMLTextAreaElement>();
      const { rerender } = render(<Textarea ref={ref} />);
      const initialRef = ref.current;

      // Act
      rerender(<Textarea ref={ref} value="Updated" readOnly />);

      // Assert - ref wskazuje na ten sam element DOM
      expect(ref.current).toBe(initialRef);
    });

    it("powinien obsłużyć pusty string jako value", () => {
      // Arrange & Act
      render(<Textarea value="" readOnly />);

      // Assert
      const textarea = document.querySelector("textarea") as HTMLTextAreaElement;
      expect(textarea.value).toBe("");
    });

    it("powinien obsłużyć tekst z wieloma nowymi liniami", () => {
      // Arrange
      const multilineText = "Line 1\nLine 2\nLine 3\nLine 4";

      // Act
      render(<Textarea value={multilineText} readOnly />);

      // Assert
      const textarea = document.querySelector("textarea") as HTMLTextAreaElement;
      expect(textarea).toBeInTheDocument();
      expect(textarea.value).toBe(multilineText);
      expect(textarea.value.split("\n")).toHaveLength(4);
    });

    it("powinien obsłużyć tekst ze znakami specjalnymi", () => {
      // Arrange
      const specialText = "Special: <>&\"'`{}[]()";

      // Act
      render(<Textarea value={specialText} readOnly />);

      // Assert
      const textarea = screen.getByDisplayValue(specialText) as HTMLTextAreaElement;
      expect(textarea.value).toBe(specialText);
    });

    it("powinien obsłużyć emoji w value", () => {
      // Arrange
      const emojiText = "Hello 👋 World 🌍";

      // Act
      render(<Textarea value={emojiText} readOnly />);

      // Assert
      const textarea = screen.getByDisplayValue(emojiText) as HTMLTextAreaElement;
      expect(textarea.value).toBe(emojiText);
    });

    it("powinien obsłużyć zmianę value z zewnątrz", () => {
      // Arrange
      const initialValue = "Initial value";

      // Act - renderowanie z początową wartością
      const { rerender } = render(<Textarea value={initialValue} readOnly />);
      expect(screen.getByDisplayValue(initialValue)).toBeInTheDocument();

      // Act - zmiana value z zewnątrz
      const updatedValue = "Updated value";
      rerender(<Textarea value={updatedValue} readOnly />);

      // Assert
      expect(screen.getByDisplayValue(updatedValue)).toBeInTheDocument();
      expect(screen.queryByDisplayValue(initialValue)).not.toBeInTheDocument();
    });

    it("powinien obsłużyć maxLength ograniczenie", async () => {
      // Arrange
      const user = userEvent.setup();
      const maxLen = 10;

      // Act
      render(<Textarea maxLength={maxLen} />);
      const textarea = document.querySelector("textarea") as HTMLTextAreaElement;
      await user.type(textarea, "12345678901234567890"); // 20 znaków

      // Assert - textarea powinna mieć maksymalnie 10 znaków
      expect(textarea.value.length).toBeLessThanOrEqual(maxLen);
    });
  });

  describe("Accessibility", () => {
    it("powinien być dostępny dla screen readerów z aria-label", () => {
      // Arrange & Act
      render(<Textarea aria-label="Message field" />);

      // Assert
      const textarea = screen.getByLabelText("Message field");
      expect(textarea).toBeInTheDocument();
    });

    it("powinien wspierać aria-describedby dla dodatkowych opisów", () => {
      // Arrange & Act
      render(
        <>
          <Textarea aria-describedby="help-text" />
          <span id="help-text">Enter your message here</span>
        </>
      );

      // Assert
      const textarea = document.querySelector("textarea");
      expect(textarea).toHaveAttribute("aria-describedby", "help-text");
    });

    it("powinien mieć focus ring dla keyboard navigation", () => {
      // Arrange & Act
      render(<Textarea />);

      // Assert
      const textarea = document.querySelector("textarea");
      expect(textarea).toHaveClass("focus-visible:ring-2");
      expect(textarea).toHaveClass("focus-visible:ring-ring");
      expect(textarea).toHaveClass("focus-visible:outline-none");
    });

    it("powinien obsługiwać disabled state dla accessibility", () => {
      // Arrange & Act
      render(<Textarea disabled />);

      // Assert
      const textarea = document.querySelector("textarea");
      expect(textarea).toBeDisabled();
      expect(textarea).toHaveClass("disabled:opacity-50");
      expect(textarea).toHaveClass("disabled:cursor-not-allowed");
    });

    it("powinien być możliwy do focusowania przez keyboard", async () => {
      // Arrange
      const user = userEvent.setup();

      // Act
      render(
        <>
          <Textarea data-testid="first" />
          <Textarea data-testid="second" />
        </>
      );
      await user.tab();

      // Assert - pierwszy textarea powinien mieć focus
      expect(screen.getByTestId("first")).toHaveFocus();
    });

    it("nie powinien być możliwy do focusowania gdy jest disabled", async () => {
      // Arrange
      const user = userEvent.setup();

      // Act
      render(
        <>
          <Textarea disabled data-testid="first" />
          <Textarea data-testid="second" />
        </>
      );
      await user.tab();

      // Assert - disabled textarea jest pomijany, focus na drugim
      expect(screen.getByTestId("second")).toHaveFocus();
    });

    it("powinien wspierać aria-invalid dla stanów błędów", () => {
      // Arrange & Act
      render(<Textarea aria-invalid="true" />);

      // Assert
      const textarea = document.querySelector("textarea");
      expect(textarea).toHaveAttribute("aria-invalid", "true");
    });

    it("powinien wspierać aria-required dla wymaganych pól", () => {
      // Arrange & Act
      render(<Textarea required aria-required="true" />);

      // Assert
      const textarea = document.querySelector("textarea");
      expect(textarea).toBeRequired();
      expect(textarea).toHaveAttribute("aria-required", "true");
    });

    it("powinien mieć semantyczną strukturę (textarea element)", () => {
      // Arrange & Act
      render(<Textarea />);

      // Assert
      const textarea = document.querySelector("textarea");
      expect(textarea).toBeInTheDocument();
      expect(textarea?.tagName).toBe("TEXTAREA");
    });

    it("powinien obsłużyć placeholder jako opisową wskazówkę", () => {
      // Arrange & Act
      render(<Textarea placeholder="Describe your issue in detail..." />);

      // Assert
      const textarea = screen.getByPlaceholderText("Describe your issue in detail...");
      expect(textarea).toBeInTheDocument();
      expect(textarea).toHaveAttribute("placeholder", "Describe your issue in detail...");
    });
  });

  describe("Użycie w formularzu", () => {
    it("powinien zawierać wartość podczas submit formularza", async () => {
      // Arrange
      const user = userEvent.setup();
      const handleSubmit = vi.fn((e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        return formData.get("message");
      });

      // Act
      render(
        <form onSubmit={handleSubmit}>
          <Textarea name="message" defaultValue="Test message" />
          <button type="submit">Submit</button>
        </form>
      );
      const button = screen.getByRole("button", { name: "Submit" });
      await user.click(button);

      // Assert
      expect(handleSubmit).toHaveBeenCalledTimes(1);
    });

    it("powinien działać jako controlled component", async () => {
      // Arrange
      const user = userEvent.setup();
      const TestComponent = () => {
        const [value, setValue] = React.useState("");
        return <Textarea value={value} onChange={(e) => setValue(e.target.value)} data-testid="controlled" />;
      };

      // Act
      render(<TestComponent />);
      const textarea = screen.getByTestId("controlled") as HTMLTextAreaElement;
      await user.type(textarea, "Controlled value");

      // Assert
      expect(textarea.value).toBe("Controlled value");
    });

    it("powinien działać jako uncontrolled component", async () => {
      // Arrange
      const user = userEvent.setup();

      // Act
      render(<Textarea defaultValue="Uncontrolled initial" />);
      const textarea = screen.getByDisplayValue("Uncontrolled initial") as HTMLTextAreaElement;
      await user.clear(textarea);
      await user.type(textarea, "New value");

      // Assert
      expect(textarea.value).toBe("New value");
    });

    it("powinien walidować required field", async () => {
      // Arrange
      const user = userEvent.setup();
      const handleSubmit = vi.fn((e) => e.preventDefault());

      // Act
      render(
        <form onSubmit={handleSubmit}>
          <Textarea required name="message" />
          <button type="submit">Submit</button>
        </form>
      );
      const textarea = document.querySelector("textarea");
      const button = screen.getByRole("button", { name: "Submit" });

      // Assert - textarea jest wymagany
      expect(textarea).toBeRequired();

      // Act - próba submit pustego formularza
      await user.click(button);

      // Assert - HTML5 validation powinien powstrzymać submit
      expect(textarea?.validity.valid).toBe(false);
    });
  });

  describe("TypeScript type safety (runtime checks)", () => {
    it("powinien zaakceptować wszystkie standardowe atrybuty textarea", () => {
      // Act & Assert - kompilacja bez błędów oznacza sukces
      render(
        <Textarea
          placeholder="Test"
          disabled={false}
          readOnly={false}
          required={false}
          maxLength={100}
          rows={5}
          cols={50}
          name="test"
          id="test-id"
        />
      );

      expect(document.querySelector("textarea")).toBeInTheDocument();
    });

    it("powinien zaakceptować wszystkie standardowe event handlers", () => {
      // Arrange
      const handlers = {
        onChange: vi.fn(),
        onFocus: vi.fn(),
        onBlur: vi.fn(),
        onKeyDown: vi.fn(),
        onKeyUp: vi.fn(),
        onClick: vi.fn(),
      };

      // Act & Assert
      render(<Textarea {...handlers} />);

      expect(document.querySelector("textarea")).toBeInTheDocument();
    });
  });

  describe("Integracja z cn() utility", () => {
    it("powinien poprawnie łączyć klasy bazowe z className przez cn()", () => {
      // Arrange & Act
      render(<Textarea className="custom-padding" />);

      // Assert - klasy bazowe
      const textarea = document.querySelector("textarea");
      expect(textarea).toHaveClass("flex");
      expect(textarea).toHaveClass("min-h-[80px]");
      expect(textarea).toHaveClass("w-full");

      // Assert - custom className
      expect(textarea).toHaveClass("custom-padding");
    });

    it("powinien umożliwić inteligentne nadpisywanie klas przez cn()", () => {
      // Arrange & Act
      render(<Textarea className="bg-white text-black" />);

      // Assert
      const textarea = document.querySelector("textarea");
      // cn() inteligentnie merguje klasy - nowsze nadpisują starsze
      expect(textarea).toHaveClass("bg-white");
      expect(textarea).toHaveClass("text-black");
      expect(textarea).not.toHaveClass("bg-background");
      expect(textarea).not.toHaveClass("text-foreground");
    });
  });
});
