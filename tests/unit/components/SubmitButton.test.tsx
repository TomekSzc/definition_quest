import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SubmitButton } from "@/components/ui/SubmitButton";

/**
 * Testy jednostkowe dla komponentu SubmitButton
 *
 * Testowane funkcjonalności:
 * - Podstawowe renderowanie i struktura DOM
 * - Dynamiczny tekst (idleText vs loadingText) w zależności od stanu isLoading
 * - Stan disabled - bezpośredni i pośredni (przez isLoading)
 * - Logika onClick handler
 * - Przekazywanie custom className
 * - Stylowanie z Tailwind CSS (w tym arbitrary values)
 * - Stany hover i disabled
 * - Atrybuty HTML (type="submit")
 * - Accessibility
 * - Edge cases i kombinacje props
 */

describe("SubmitButton", () => {
  describe("Renderowanie i struktura DOM", () => {
    it("powinien wyrenderować button z podstawowymi atrybutami", () => {
      // Arrange & Act
      render(<SubmitButton loadingText="Loading..." idleText="Submit" isLoading={false} />);

      // Assert
      const button = screen.getByRole("button", { name: "Submit" });
      expect(button).toBeInTheDocument();
      expect(button.tagName).toBe("BUTTON");
    });

    it("powinien domyślnie mieć type='submit'", () => {
      // Arrange & Act
      render(<SubmitButton loadingText="Saving..." idleText="Save" isLoading={false} />);

      // Assert
      const button = screen.getByRole("button");
      expect(button).toHaveAttribute("type", "submit");
    });

    it("powinien zawierać idleText jako content gdy isLoading=false", () => {
      // Arrange & Act
      render(<SubmitButton loadingText="Processing..." idleText="Click Me" isLoading={false} />);

      // Assert
      const button = screen.getByRole("button");
      expect(button).toHaveTextContent("Click Me");
      expect(button).not.toHaveTextContent("Processing...");
    });

    it("powinien zawierać loadingText jako content gdy isLoading=true", () => {
      // Arrange & Act
      render(<SubmitButton loadingText="Please wait..." idleText="Submit" isLoading={true} />);

      // Assert
      const button = screen.getByRole("button");
      expect(button).toHaveTextContent("Please wait...");
      expect(button).not.toHaveTextContent("Submit");
    });
  });

  describe("Dynamiczny tekst w zależności od stanu isLoading", () => {
    it("powinien wyświetlić idleText gdy isLoading=false", () => {
      // Arrange & Act
      render(<SubmitButton loadingText="Uploading..." idleText="Upload" isLoading={false} />);

      // Assert
      expect(screen.getByText("Upload")).toBeInTheDocument();
      expect(screen.queryByText("Uploading...")).not.toBeInTheDocument();
    });

    it("powinien wyświetlić loadingText gdy isLoading=true", () => {
      // Arrange & Act
      render(<SubmitButton loadingText="Sending..." idleText="Send" isLoading={true} />);

      // Assert
      expect(screen.getByText("Sending...")).toBeInTheDocument();
      expect(screen.queryByText("Send")).not.toBeInTheDocument();
    });

    it("powinien przełączyć z idleText na loadingText przy zmianie isLoading na true", () => {
      // Arrange
      const { rerender } = render(<SubmitButton loadingText="Loading..." idleText="Submit" isLoading={false} />);

      // Assert - initial state
      expect(screen.getByText("Submit")).toBeInTheDocument();

      // Act - zmiana stanu
      rerender(<SubmitButton loadingText="Loading..." idleText="Submit" isLoading={true} />);

      // Assert - after change
      expect(screen.getByText("Loading...")).toBeInTheDocument();
      expect(screen.queryByText("Submit")).not.toBeInTheDocument();
    });

    it("powinien przełączyć z loadingText na idleText przy zmianie isLoading na false", () => {
      // Arrange
      const { rerender } = render(<SubmitButton loadingText="Saving..." idleText="Save" isLoading={true} />);

      // Assert - initial state
      expect(screen.getByText("Saving...")).toBeInTheDocument();

      // Act - zmiana stanu
      rerender(<SubmitButton loadingText="Saving..." idleText="Save" isLoading={false} />);

      // Assert - after change
      expect(screen.getByText("Save")).toBeInTheDocument();
      expect(screen.queryByText("Saving...")).not.toBeInTheDocument();
    });

    it("powinien obsłużyć wielokrotne przełączanie między stanami", () => {
      // Arrange
      const { rerender } = render(<SubmitButton loadingText="Working..." idleText="Work" isLoading={false} />);

      // Cycle 1: false -> true
      expect(screen.getByText("Work")).toBeInTheDocument();
      rerender(<SubmitButton loadingText="Working..." idleText="Work" isLoading={true} />);
      expect(screen.getByText("Working...")).toBeInTheDocument();

      // Cycle 2: true -> false
      rerender(<SubmitButton loadingText="Working..." idleText="Work" isLoading={false} />);
      expect(screen.getByText("Work")).toBeInTheDocument();

      // Cycle 3: false -> true
      rerender(<SubmitButton loadingText="Working..." idleText="Work" isLoading={true} />);
      expect(screen.getByText("Working...")).toBeInTheDocument();
    });
  });

  describe("Stan disabled", () => {
    it("powinien być disabled gdy disabled=true", () => {
      // Arrange & Act
      render(<SubmitButton loadingText="Loading..." idleText="Submit" isLoading={false} disabled={true} />);

      // Assert
      const button = screen.getByRole("button");
      expect(button).toBeDisabled();
    });

    it("powinien być enabled gdy disabled=false", () => {
      // Arrange & Act
      render(<SubmitButton loadingText="Loading..." idleText="Submit" isLoading={false} disabled={false} />);

      // Assert
      const button = screen.getByRole("button");
      expect(button).toBeEnabled();
    });

    it("powinien być disabled gdy isLoading=true (niezależnie od disabled prop)", () => {
      // Arrange & Act
      render(<SubmitButton loadingText="Processing..." idleText="Process" isLoading={true} />);

      // Assert
      const button = screen.getByRole("button");
      expect(button).toBeDisabled();
    });

    it("powinien być enabled gdy disabled=false jest explicite przekazane (nadpisuje isLoading)", () => {
      // Arrange & Act
      // Logika: disabled ?? isLoading - gdy disabled jest explicite false, używa false (nie isLoading)
      render(<SubmitButton loadingText="Loading..." idleText="Submit" isLoading={true} disabled={false} />);

      // Assert
      const button = screen.getByRole("button");
      expect(button).toBeEnabled(); // disabled=false ma priorytet nad isLoading=true
    });

    it("powinien być disabled gdy oba disabled=true i isLoading=true", () => {
      // Arrange & Act
      render(<SubmitButton loadingText="Saving..." idleText="Save" isLoading={true} disabled={true} />);

      // Assert
      const button = screen.getByRole("button");
      expect(button).toBeDisabled();
    });

    it("powinien być disabled gdy disabled=true nawet jeśli isLoading=false", () => {
      // Arrange & Act
      render(<SubmitButton loadingText="Loading..." idleText="Submit" isLoading={false} disabled={true} />);

      // Assert
      const button = screen.getByRole("button");
      expect(button).toBeDisabled();
    });

    it("powinien być enabled tylko gdy oba disabled i isLoading są false/undefined", () => {
      // Arrange & Act
      render(<SubmitButton loadingText="Loading..." idleText="Submit" isLoading={false} />);

      // Assert
      const button = screen.getByRole("button");
      expect(button).toBeEnabled();
    });

    it("powinien użyć nullish coalescing - disabled ?? isLoading (undefined fallback)", () => {
      // Arrange & Act - disabled nie przekazane (undefined), więc używa isLoading=false
      render(<SubmitButton loadingText="Loading..." idleText="Submit" isLoading={false} />);

      // Assert
      const button = screen.getByRole("button");
      expect(button).toBeEnabled(); // undefined ?? false = false
    });

    it("powinien użyć isLoading gdy disabled jest undefined", () => {
      // Arrange & Act - disabled nie przekazane (undefined), więc używa isLoading=true
      render(<SubmitButton loadingText="Loading..." idleText="Submit" isLoading={true} />);

      // Assert
      const button = screen.getByRole("button");
      expect(button).toBeDisabled(); // undefined ?? true = true
    });

    it("powinien obsłużyć zmianę disabled podczas re-renderowania", () => {
      // Arrange
      const { rerender } = render(
        <SubmitButton loadingText="Loading..." idleText="Submit" isLoading={false} disabled={false} />
      );

      // Assert - początkowo enabled
      let button = screen.getByRole("button");
      expect(button).toBeEnabled();

      // Act - zmiana na disabled
      rerender(<SubmitButton loadingText="Loading..." idleText="Submit" isLoading={false} disabled={true} />);

      // Assert - disabled
      button = screen.getByRole("button");
      expect(button).toBeDisabled();
    });
  });

  describe("Interakcje użytkownika - onClick", () => {
    it("powinien wywołać onClick handler po kliknięciu", async () => {
      // Arrange
      const user = userEvent.setup();
      const handleClick = vi.fn();

      // Act
      render(<SubmitButton loadingText="Loading..." idleText="Click me" isLoading={false} onClick={handleClick} />);
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
      render(<SubmitButton loadingText="Loading..." idleText="Submit" isLoading={false} onClick={handleClick} />);
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
        <SubmitButton
          loadingText="Loading..."
          idleText="Submit"
          isLoading={false}
          disabled={true}
          onClick={handleClick}
        />
      );
      const button = screen.getByRole("button");
      await user.click(button);

      // Assert
      expect(handleClick).not.toHaveBeenCalled();
    });

    it("nie powinien wywołać onClick gdy isLoading=true", async () => {
      // Arrange
      const user = userEvent.setup();
      const handleClick = vi.fn();

      // Act
      render(<SubmitButton loadingText="Processing..." idleText="Process" isLoading={true} onClick={handleClick} />);
      const button = screen.getByRole("button");
      await user.click(button);

      // Assert
      expect(handleClick).not.toHaveBeenCalled();
    });

    it("powinien wywołać onClick z event object", async () => {
      // Arrange
      const user = userEvent.setup();
      const handleClick = vi.fn();

      // Act
      render(<SubmitButton loadingText="Loading..." idleText="Submit" isLoading={false} onClick={handleClick} />);
      const button = screen.getByRole("button");
      await user.click(button);

      // Assert
      expect(handleClick).toHaveBeenCalledTimes(1);
      expect(handleClick.mock.calls[0][0]).toBeDefined(); // event object
    });

    it("powinien działać bez onClick handler (onClick jest optional)", () => {
      // Arrange & Act
      render(<SubmitButton loadingText="Loading..." idleText="Submit" isLoading={false} />);

      // Assert
      const button = screen.getByRole("button");
      expect(button).toBeInTheDocument();
      expect(button).toBeEnabled();
    });

    it("powinien obsłużyć keyboard navigation (Enter)", async () => {
      // Arrange
      const user = userEvent.setup();
      const handleClick = vi.fn();

      // Act
      render(<SubmitButton loadingText="Loading..." idleText="Submit" isLoading={false} onClick={handleClick} />);
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
      render(<SubmitButton loadingText="Loading..." idleText="Submit" isLoading={false} onClick={handleClick} />);
      const button = screen.getByRole("button");
      button.focus();
      await user.keyboard(" ");

      // Assert
      expect(handleClick).toHaveBeenCalledTimes(1);
    });
  });

  describe("Custom className", () => {
    it("powinien zastosować custom className", () => {
      // Arrange
      const customClass = "my-custom-button";

      // Act
      render(<SubmitButton loadingText="Loading..." idleText="Submit" isLoading={false} className={customClass} />);

      // Assert
      const button = screen.getByRole("button");
      expect(button).toHaveClass(customClass);
    });

    it("powinien zachować bazowe klasy po dodaniu className", () => {
      // Arrange
      const customClass = "extra-class";

      // Act
      render(<SubmitButton loadingText="Loading..." idleText="Submit" isLoading={false} className={customClass} />);

      // Assert
      const button = screen.getByRole("button");
      expect(button).toHaveClass("w-full");
      expect(button).toHaveClass("font-bold");
      expect(button).toHaveClass(customClass);
    });

    it("powinien domyślnie mieć pusty string jako className", () => {
      // Arrange & Act
      render(<SubmitButton loadingText="Loading..." idleText="Submit" isLoading={false} />);

      // Assert
      const button = screen.getByRole("button");
      expect(button).toBeInTheDocument();
      expect(button).toHaveClass("w-full");
    });

    it("powinien obsłużyć pusty string jako className", () => {
      // Arrange & Act
      render(<SubmitButton loadingText="Loading..." idleText="Submit" isLoading={false} className="" />);

      // Assert
      const button = screen.getByRole("button");
      expect(button).toBeInTheDocument();
      expect(button).toHaveClass("w-full");
    });

    it("powinien umożliwić nadpisanie szerokości przez className", () => {
      // Arrange
      const customClass = "w-auto";

      // Act
      render(<SubmitButton loadingText="Loading..." idleText="Submit" isLoading={false} className={customClass} />);

      // Assert
      const button = screen.getByRole("button");
      // Ponieważ className jest dodawany na końcu, może nadpisać w-full
      expect(button).toHaveClass(customClass);
    });

    it("powinien obsłużyć wiele klas w className", () => {
      // Arrange
      const customClasses = "shadow-lg hover:shadow-xl transition-shadow";

      // Act
      render(<SubmitButton loadingText="Loading..." idleText="Submit" isLoading={false} className={customClasses} />);

      // Assert
      const button = screen.getByRole("button");
      expect(button).toHaveClass("shadow-lg");
      expect(button).toHaveClass("hover:shadow-xl");
      expect(button).toHaveClass("transition-shadow");
    });
  });

  describe("Stylowanie Tailwind CSS", () => {
    it("powinien mieć wszystkie bazowe klasy stylowania", () => {
      // Arrange & Act
      render(<SubmitButton loadingText="Loading..." idleText="Submit" isLoading={false} />);

      // Assert
      const button = screen.getByRole("button");
      expect(button).toHaveClass("w-full");
      expect(button).toHaveClass("font-bold");
      expect(button).toHaveClass("px-4");
      expect(button).toHaveClass("py-2");
      expect(button).toHaveClass("rounded");
    });

    it("powinien mieć klasy kolorów z arbitrary values (CSS variables)", () => {
      // Arrange & Act
      render(<SubmitButton loadingText="Loading..." idleText="Submit" isLoading={false} />);

      // Assert
      const button = screen.getByRole("button");
      expect(button).toHaveClass("bg-[var(--color-white)]");
      expect(button).toHaveClass("text-[var(--color-primary)]");
    });

    it("powinien mieć klasy hover state", () => {
      // Arrange & Act
      render(<SubmitButton loadingText="Loading..." idleText="Submit" isLoading={false} />);

      // Assert
      const button = screen.getByRole("button");
      expect(button).toHaveClass("hover:bg-[var(--color-black)]");
      expect(button).toHaveClass("hover:text-[var(--color-white)]");
    });

    it("powinien mieć cursor-pointer class", () => {
      // Arrange & Act
      render(<SubmitButton loadingText="Loading..." idleText="Submit" isLoading={false} />);

      // Assert
      const button = screen.getByRole("button");
      expect(button).toHaveClass("cursor-pointer");
    });

    it("powinien mieć klasy disabled state", () => {
      // Arrange & Act
      render(<SubmitButton loadingText="Loading..." idleText="Submit" isLoading={false} />);

      // Assert
      const button = screen.getByRole("button");
      expect(button).toHaveClass("disabled:opacity-50");
      expect(button).toHaveClass("disabled:pointer-events-none");
    });

    it("powinien zawierać wszystkie klasy w odpowiedniej kolejności", () => {
      // Arrange & Act
      render(<SubmitButton loadingText="Loading..." idleText="Submit" isLoading={false} className="extra" />);

      // Assert
      const button = screen.getByRole("button");
      const className = button.className;

      // Sprawdzamy czy zawiera wszystkie ważne klasy
      expect(className).toContain("w-full");
      expect(className).toContain("font-bold");
      expect(className).toContain("bg-[var(--color-white)]");
      expect(className).toContain("text-[var(--color-primary)]");
      expect(className).toContain("hover:bg-[var(--color-black)]");
      expect(className).toContain("hover:text-[var(--color-white)]");
      expect(className).toContain("cursor-pointer");
      expect(className).toContain("disabled:opacity-50");
      expect(className).toContain("disabled:pointer-events-none");
      expect(className).toContain("px-4");
      expect(className).toContain("py-2");
      expect(className).toContain("rounded");
      expect(className).toContain("extra");
    });
  });

  describe("Accessibility", () => {
    it("powinien być dostępny dla screen readerów z odpowiednim tekstem", () => {
      // Arrange & Act
      render(<SubmitButton loadingText="Submitting form..." idleText="Submit form" isLoading={false} />);

      // Assert
      const button = screen.getByRole("button", { name: "Submit form" });
      expect(button).toBeInTheDocument();
    });

    it("powinien aktualizować accessible name przy zmianie stanu loading", () => {
      // Arrange
      const { rerender } = render(<SubmitButton loadingText="Please wait..." idleText="Continue" isLoading={false} />);

      // Assert - initial
      expect(screen.getByRole("button", { name: "Continue" })).toBeInTheDocument();

      // Act
      rerender(<SubmitButton loadingText="Please wait..." idleText="Continue" isLoading={true} />);

      // Assert - after loading
      expect(screen.getByRole("button", { name: "Please wait..." })).toBeInTheDocument();
    });

    it("powinien komunikować stan disabled dla screen readerów", () => {
      // Arrange & Act
      render(<SubmitButton loadingText="Loading..." idleText="Submit" isLoading={false} disabled={true} />);

      // Assert
      const button = screen.getByRole("button");
      expect(button).toBeDisabled();
      expect(button).toHaveAttribute("disabled");
    });

    it("powinien komunikować stan loading przez disabled dla screen readerów", () => {
      // Arrange & Act
      render(<SubmitButton loadingText="Loading..." idleText="Submit" isLoading={true} />);

      // Assert
      const button = screen.getByRole("button");
      expect(button).toBeDisabled();
    });

    it("powinien być możliwy do focusowania przez keyboard gdy jest enabled", async () => {
      // Arrange
      const user = userEvent.setup();

      // Act
      render(<SubmitButton loadingText="Loading..." idleText="Submit" isLoading={false} />);
      await user.tab();

      // Assert
      const button = screen.getByRole("button");
      expect(button).toHaveFocus();
    });

    it("nie powinien być możliwy do focusowania gdy jest disabled", async () => {
      // Arrange
      const user = userEvent.setup();

      // Act
      render(
        <>
          <SubmitButton loadingText="Loading..." idleText="Submit" isLoading={false} disabled={true} />
          <button>Other Button</button>
        </>
      );
      await user.tab();

      // Assert - disabled button jest pomijany
      expect(screen.getByRole("button", { name: "Other Button" })).toHaveFocus();
    });

    it("nie powinien być możliwy do focusowania gdy isLoading=true", async () => {
      // Arrange
      const user = userEvent.setup();

      // Act
      render(
        <>
          <SubmitButton loadingText="Processing..." idleText="Process" isLoading={true} />
          <button>Next Button</button>
        </>
      );
      await user.tab();

      // Assert - loading button jest pomijany
      expect(screen.getByRole("button", { name: "Next Button" })).toHaveFocus();
    });
  });

  describe("Kombinacje props", () => {
    it("powinien obsłużyć wszystkie props jednocześnie", async () => {
      // Arrange
      const user = userEvent.setup();
      const handleClick = vi.fn();

      // Act
      render(
        <SubmitButton
          loadingText="Uploading file..."
          idleText="Upload file"
          isLoading={false}
          disabled={false}
          className="custom-upload-btn"
          onClick={handleClick}
        />
      );

      const button = screen.getByRole("button");
      await user.click(button);

      // Assert
      expect(button).toBeInTheDocument();
      expect(button).toHaveTextContent("Upload file");
      expect(button).toBeEnabled();
      expect(button).toHaveClass("custom-upload-btn");
      expect(button).toHaveAttribute("type", "submit");
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it("powinien priorytetowo traktować disabled gdy oba disabled=true i isLoading=false", () => {
      // Arrange & Act
      render(<SubmitButton loadingText="Loading..." idleText="Submit" isLoading={false} disabled={true} />);

      // Assert
      const button = screen.getByRole("button");
      expect(button).toBeDisabled();
      expect(button).toHaveTextContent("Submit");
    });

    it("powinien pokazać loadingText ale być enabled gdy disabled=false (disabled ma priorytet)", () => {
      // Arrange & Act
      // Logika: disabled ?? isLoading - disabled=false ma priorytet, więc button jest enabled
      render(<SubmitButton loadingText="Processing..." idleText="Process" isLoading={true} disabled={false} />);

      // Assert
      const button = screen.getByRole("button");
      expect(button).toBeEnabled(); // disabled=false nadpisuje isLoading=true
      expect(button).toHaveTextContent("Processing..."); // ale tekst pokazuje loading
    });

    it("powinien obsłużyć zmianę wszystkich props podczas re-renderowania", () => {
      // Arrange
      const handleClick1 = vi.fn();
      const handleClick2 = vi.fn();

      const { rerender } = render(
        <SubmitButton
          loadingText="Saving..."
          idleText="Save"
          isLoading={false}
          disabled={false}
          className="class1"
          onClick={handleClick1}
        />
      );

      // Assert - initial state
      let button = screen.getByRole("button");
      expect(button).toHaveTextContent("Save");
      expect(button).toBeEnabled();
      expect(button).toHaveClass("class1");

      // Act - zmiana wszystkich props
      rerender(
        <SubmitButton
          loadingText="Uploading..."
          idleText="Upload"
          isLoading={true}
          disabled={true}
          className="class2"
          onClick={handleClick2}
        />
      );

      // Assert - after change
      button = screen.getByRole("button");
      expect(button).toHaveTextContent("Uploading...");
      expect(button).toBeDisabled();
      expect(button).toHaveClass("class2");
      expect(button).not.toHaveClass("class1");
    });
  });

  describe("Edge cases", () => {
    it("powinien obsłużyć bardzo długi loadingText", () => {
      // Arrange
      const longText = "Please wait while we process your request and save all the data to the server...".repeat(3);

      // Act
      render(<SubmitButton loadingText={longText} idleText="Submit" isLoading={true} />);

      // Assert
      const button = screen.getByRole("button");
      expect(button).toHaveTextContent(longText);
    });

    it("powinien obsłużyć bardzo długi idleText", () => {
      // Arrange
      const longText = "Click this button to submit your very important form data".repeat(3);

      // Act
      render(<SubmitButton loadingText="Loading..." idleText={longText} isLoading={false} />);

      // Assert
      const button = screen.getByRole("button");
      expect(button).toHaveTextContent(longText);
    });

    it("powinien obsłużyć pusty string jako loadingText", () => {
      // Arrange & Act
      render(<SubmitButton loadingText="" idleText="Submit" isLoading={true} />);

      // Assert
      const button = screen.getByRole("button");
      expect(button).toHaveTextContent("");
      expect(button).toBeInTheDocument();
    });

    it("powinien obsłużyć pusty string jako idleText", () => {
      // Arrange & Act
      render(<SubmitButton loadingText="Loading..." idleText="" isLoading={false} />);

      // Assert
      const button = screen.getByRole("button");
      expect(button).toHaveTextContent("");
      expect(button).toBeInTheDocument();
    });

    it("powinien obsłużyć oba teksty jako puste stringi", () => {
      // Arrange & Act
      render(<SubmitButton loadingText="" idleText="" isLoading={false} />);

      // Assert
      const button = screen.getByRole("button");
      expect(button).toHaveTextContent("");
      expect(button).toBeInTheDocument();
    });

    it("powinien obsłużyć specjalne znaki w tekstach", () => {
      // Arrange & Act
      render(<SubmitButton loadingText="Loading... ⏳" idleText="Submit ✓" isLoading={false} />);

      // Assert
      const button = screen.getByRole("button");
      expect(button).toHaveTextContent("Submit ✓");
    });

    it("powinien obsłużyć wielokrotne re-renderowanie bez błędów", () => {
      // Arrange
      const { rerender } = render(<SubmitButton loadingText="Loading..." idleText="Submit" isLoading={false} />);

      // Act & Assert - multiple re-renders
      expect(() => {
        for (let i = 0; i < 10; i++) {
          rerender(<SubmitButton loadingText="Loading..." idleText="Submit" isLoading={i % 2 === 0} />);
        }
      }).not.toThrow();
    });

    it("powinien obsłużyć szybkie przełączanie isLoading", () => {
      // Arrange
      const { rerender } = render(<SubmitButton loadingText="Loading..." idleText="Submit" isLoading={false} />);

      // Act - rapid toggling
      rerender(<SubmitButton loadingText="Loading..." idleText="Submit" isLoading={true} />);
      rerender(<SubmitButton loadingText="Loading..." idleText="Submit" isLoading={false} />);
      rerender(<SubmitButton loadingText="Loading..." idleText="Submit" isLoading={true} />);
      rerender(<SubmitButton loadingText="Loading..." idleText="Submit" isLoading={false} />);

      // Assert
      const button = screen.getByRole("button");
      expect(button).toHaveTextContent("Submit");
      expect(button).toBeEnabled();
    });

    it("powinien obsłużyć identyczne loadingText i idleText", () => {
      // Arrange & Act
      const sameText = "Submit";
      render(<SubmitButton loadingText={sameText} idleText={sameText} isLoading={false} />);

      // Assert
      const button = screen.getByRole("button");
      expect(button).toHaveTextContent(sameText);
    });

    it("powinien obsłużyć bardzo długi className", () => {
      // Arrange
      const longClassName =
        "class1 class2 class3 class4 class5 class6 class7 class8 class9 class10 " +
        "custom-class-a custom-class-b custom-class-c";

      // Act
      render(<SubmitButton loadingText="Loading..." idleText="Submit" isLoading={false} className={longClassName} />);

      // Assert
      const button = screen.getByRole("button");
      expect(button).toHaveClass("class1");
      expect(button).toHaveClass("custom-class-c");
    });
  });

  describe("Użycie w formularzu", () => {
    it("powinien submitować formularz gdy kliknięty (type='submit')", async () => {
      // Arrange
      const user = userEvent.setup();
      const handleSubmit = vi.fn((e) => e.preventDefault());

      // Act
      render(
        <form onSubmit={handleSubmit}>
          <SubmitButton loadingText="Submitting..." idleText="Submit Form" isLoading={false} />
        </form>
      );

      const button = screen.getByRole("button");
      await user.click(button);

      // Assert
      expect(handleSubmit).toHaveBeenCalledTimes(1);
    });

    it("nie powinien submitować formularza gdy isLoading=true", async () => {
      // Arrange
      const user = userEvent.setup();
      const handleSubmit = vi.fn((e) => e.preventDefault());

      // Act
      render(
        <form onSubmit={handleSubmit}>
          <SubmitButton loadingText="Submitting..." idleText="Submit" isLoading={true} />
        </form>
      );

      const button = screen.getByRole("button");
      await user.click(button);

      // Assert
      expect(handleSubmit).not.toHaveBeenCalled();
    });

    it("nie powinien submitować formularza gdy disabled=true", async () => {
      // Arrange
      const user = userEvent.setup();
      const handleSubmit = vi.fn((e) => e.preventDefault());

      // Act
      render(
        <form onSubmit={handleSubmit}>
          <SubmitButton loadingText="Loading..." idleText="Submit" isLoading={false} disabled={true} />
        </form>
      );

      const button = screen.getByRole("button");
      await user.click(button);

      // Assert
      expect(handleSubmit).not.toHaveBeenCalled();
    });

    it("powinien prawidłowo pracować w formularzu z innymi elementami", async () => {
      // Arrange
      const user = userEvent.setup();
      const handleSubmit = vi.fn((e) => e.preventDefault());

      // Act
      render(
        <form onSubmit={handleSubmit}>
          <input type="text" defaultValue="test" />
          <input type="email" defaultValue="test@example.com" />
          <SubmitButton loadingText="Sending..." idleText="Send" isLoading={false} />
        </form>
      );

      const button = screen.getByRole("button", { name: "Send" });
      await user.click(button);

      // Assert
      expect(handleSubmit).toHaveBeenCalledTimes(1);
    });

    it("powinien obsłużyć submit przez Enter w formularzu", async () => {
      // Arrange
      const user = userEvent.setup();
      const handleSubmit = vi.fn((e) => e.preventDefault());

      // Act
      render(
        <form onSubmit={handleSubmit}>
          <input type="text" />
          <SubmitButton loadingText="Submitting..." idleText="Submit" isLoading={false} />
        </form>
      );

      const input = screen.getByRole("textbox");
      input.focus();
      await user.keyboard("{Enter}");

      // Assert
      expect(handleSubmit).toHaveBeenCalled();
    });
  });

  describe("TypeScript type safety (runtime checks)", () => {
    it("powinien zaakceptować wszystkie wymagane props", () => {
      // Act & Assert - kompilacja bez błędów oznacza sukces
      render(<SubmitButton loadingText="Loading..." idleText="Submit" isLoading={false} />);

      expect(screen.getByRole("button")).toBeInTheDocument();
    });

    it("powinien zaakceptować wszystkie opcjonalne props", () => {
      // Act & Assert
      render(
        <SubmitButton
          loadingText="Loading..."
          idleText="Submit"
          isLoading={false}
          disabled={false}
          className="custom"
          onClick={vi.fn()}
        />
      );

      expect(screen.getByRole("button")).toBeInTheDocument();
    });

    it("powinien zaakceptować boolean true dla isLoading", () => {
      // Act & Assert
      render(<SubmitButton loadingText="Loading..." idleText="Submit" isLoading={true} />);

      expect(screen.getByRole("button")).toBeDisabled();
    });

    it("powinien zaakceptować boolean false dla isLoading", () => {
      // Act & Assert
      render(<SubmitButton loadingText="Loading..." idleText="Submit" isLoading={false} />);

      expect(screen.getByRole("button")).toBeEnabled();
    });

    it("powinien zaakceptować boolean dla disabled", () => {
      // Act & Assert
      render(<SubmitButton loadingText="Loading..." idleText="Submit" isLoading={false} disabled={true} />);
      render(<SubmitButton loadingText="Loading..." idleText="Submit" isLoading={false} disabled={false} />);

      const buttons = screen.getAllByRole("button");
      expect(buttons[0]).toBeDisabled();
      expect(buttons[1]).toBeEnabled();
    });

    it("powinien zaakceptować undefined dla opcjonalnych props", () => {
      // Act & Assert
      render(
        <SubmitButton
          loadingText="Loading..."
          idleText="Submit"
          isLoading={false}
          disabled={undefined}
          className={undefined}
          onClick={undefined}
        />
      );

      expect(screen.getByRole("button")).toBeInTheDocument();
    });
  });
});
