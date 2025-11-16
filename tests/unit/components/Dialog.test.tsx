import { describe, it, expect, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React, { createRef } from "react";
import { Dialog, DialogTrigger, DialogPortal, DialogOverlay, DialogContent, DialogTitle } from "@/components/ui/Dialog";

/**
 * Testy jednostkowe dla komponentu Dialog
 *
 * Testowane funkcjonalności:
 * - Podstawowe renderowanie i struktura DOM
 * - DialogOverlay - stylowanie i pozycjonowanie
 * - DialogContent - stylowanie, wyśrodkowanie, przycisk zamykania
 * - DialogTitle - stylowanie typograficzne
 * - Portal rendering
 * - Interakcje użytkownika (otwieranie, zamykanie)
 * - ForwardRef dla DialogOverlay, DialogContent, DialogTitle
 * - Przekazywanie dodatkowych klas CSS
 * - Przekazywanie dodatkowych props HTML
 * - Accessibility (focus management, keyboard navigation)
 * - Edge cases
 * - Kombinacje props
 */

describe("Dialog", () => {
  describe("Podstawowe renderowanie", () => {
    it("powinien wyrenderować Dialog root component", () => {
      // Arrange & Act
      const { container } = render(
        <Dialog>
          <DialogTrigger>Open</DialogTrigger>
        </Dialog>
      );

      // Assert
      expect(container).toBeInTheDocument();
    });

    it("powinien wyrenderować trigger button", () => {
      // Arrange & Act
      render(
        <Dialog>
          <DialogTrigger>Open Dialog</DialogTrigger>
        </Dialog>
      );

      // Assert
      const trigger = screen.getByText("Open Dialog");
      expect(trigger).toBeInTheDocument();
    });

    it("powinien nie wyświetlać contentu gdy dialog jest zamknięty", () => {
      // Arrange & Act
      render(
        <Dialog>
          <DialogTrigger>Open</DialogTrigger>
          <DialogContent>
            <DialogTitle>Test Title</DialogTitle>
            <p>Dialog Content</p>
          </DialogContent>
        </Dialog>
      );

      // Assert
      expect(screen.queryByText("Test Title")).not.toBeInTheDocument();
      expect(screen.queryByText("Dialog Content")).not.toBeInTheDocument();
    });

    it("powinien wyświetlić content gdy dialog jest otwarty", async () => {
      // Arrange
      const user = userEvent.setup();
      render(
        <Dialog>
          <DialogTrigger>Open</DialogTrigger>
          <DialogContent>
            <DialogTitle>Test Title</DialogTitle>
            <p>Dialog Content</p>
          </DialogContent>
        </Dialog>
      );

      // Act
      await user.click(screen.getByText("Open"));

      // Assert
      expect(screen.getByText("Test Title")).toBeInTheDocument();
      expect(screen.getByText("Dialog Content")).toBeInTheDocument();
    });

    it("powinien wyrenderować złożone children w DialogContent", async () => {
      // Arrange
      const user = userEvent.setup();
      render(
        <Dialog>
          <DialogTrigger>Open</DialogTrigger>
          <DialogContent>
            <DialogTitle>Complex Content</DialogTitle>
            <div data-testid="nested-div">
              <span>Nested Span</span>
              <button>Action</button>
            </div>
          </DialogContent>
        </Dialog>
      );

      // Act
      await user.click(screen.getByText("Open"));

      // Assert
      const nestedDiv = screen.getByTestId("nested-div");
      expect(nestedDiv).toBeInTheDocument();
      expect(within(nestedDiv).getByText("Nested Span")).toBeInTheDocument();
      expect(within(nestedDiv).getByText("Action")).toBeInTheDocument();
    });
  });

  describe("DialogOverlay - Style i pozycjonowanie", () => {
    it("powinien mieć podstawowe klasy pozycjonowania fixed i inset-0", async () => {
      // Arrange
      const user = userEvent.setup();
      render(
        <Dialog>
          <DialogTrigger>Open</DialogTrigger>
          <DialogContent>Content</DialogContent>
        </Dialog>
      );

      // Act
      await user.click(screen.getByText("Open"));

      // Assert
      // Overlay jest renderowany w portalu, znajdźmy go przez DOM
      const overlays = document.querySelectorAll('[class*="fixed"]');
      const overlay = Array.from(overlays).find((el) => el.className.includes("inset-0"));
      expect(overlay).toBeTruthy();
      expect(overlay?.className).toContain("fixed");
      expect(overlay?.className).toContain("inset-0");
    });

    it("powinien mieć klasy tła bg-black/50 i backdrop-blur-sm", async () => {
      // Arrange
      const user = userEvent.setup();
      render(
        <Dialog>
          <DialogTrigger>Open</DialogTrigger>
          <DialogContent>Content</DialogContent>
        </Dialog>
      );

      // Act
      await user.click(screen.getByText("Open"));

      // Assert
      const overlays = document.querySelectorAll('[class*="backdrop-blur-sm"]');
      expect(overlays.length).toBeGreaterThan(0);
      const overlay = overlays[0];
      expect(overlay.className).toContain("bg-black/50");
      expect(overlay.className).toContain("backdrop-blur-sm");
    });

    it("powinien mieć z-index z-50 dla layering", async () => {
      // Arrange
      const user = userEvent.setup();
      render(
        <Dialog>
          <DialogTrigger>Open</DialogTrigger>
          <DialogContent>Content</DialogContent>
        </Dialog>
      );

      // Act
      await user.click(screen.getByText("Open"));

      // Assert
      const overlays = document.querySelectorAll('[class*="z-50"]');
      expect(overlays.length).toBeGreaterThan(0);
    });

    it("powinien przyjąć dodatkowe klasy przez className prop", async () => {
      // Arrange
      const user = userEvent.setup();
      const CustomOverlay = () => (
        <Dialog>
          <DialogTrigger>Open</DialogTrigger>
          <DialogPortal>
            <DialogOverlay className="custom-overlay-class" />
            <div>Content</div>
          </DialogPortal>
        </Dialog>
      );

      render(<CustomOverlay />);

      // Act
      await user.click(screen.getByText("Open"));

      // Assert
      const overlays = document.querySelectorAll('[class*="custom-overlay-class"]');
      expect(overlays.length).toBeGreaterThan(0);
      const overlay = overlays[0];
      expect(overlay.className).toContain("fixed");
      expect(overlay.className).toContain("custom-overlay-class");
    });
  });

  describe("DialogContent - Style i struktura", () => {
    it("powinien mieć podstawowe klasy stylowania", async () => {
      // Arrange
      const user = userEvent.setup();
      render(
        <Dialog>
          <DialogTrigger>Open</DialogTrigger>
          <DialogContent>
            <p>Test Content</p>
          </DialogContent>
        </Dialog>
      );

      // Act
      await user.click(screen.getByText("Open"));

      // Assert
      const content = screen.getByText("Test Content").closest("div[role='dialog']");
      expect(content).toHaveClass("fixed");
      expect(content).toHaveClass("z-50");
      expect(content).toHaveClass("grid");
      expect(content).toHaveClass("w-full");
      expect(content).toHaveClass("max-w-lg");
      expect(content).toHaveClass("gap-4");
    });

    it("powinien mieć klasy związane z appearance", async () => {
      // Arrange
      const user = userEvent.setup();
      render(
        <Dialog>
          <DialogTrigger>Open</DialogTrigger>
          <DialogContent>
            <p>Test Content</p>
          </DialogContent>
        </Dialog>
      );

      // Act
      await user.click(screen.getByText("Open"));

      // Assert
      const content = screen.getByText("Test Content").closest("div[role='dialog']");
      expect(content).toHaveClass("bg-background");
      expect(content).toHaveClass("p-6");
      expect(content).toHaveClass("shadow-lg");
      expect(content).toHaveClass("rounded-lg");
    });

    it("powinien mieć klasy wyśrodkowania left-1/2 top-1/2 translate", async () => {
      // Arrange
      const user = userEvent.setup();
      render(
        <Dialog>
          <DialogTrigger>Open</DialogTrigger>
          <DialogContent>
            <p>Test Content</p>
          </DialogContent>
        </Dialog>
      );

      // Act
      await user.click(screen.getByText("Open"));

      // Assert
      const content = screen.getByText("Test Content").closest("div[role='dialog']");
      expect(content).toHaveClass("left-1/2");
      expect(content).toHaveClass("top-1/2");
      expect(content).toHaveClass("-translate-x-1/2");
      expect(content).toHaveClass("-translate-y-1/2");
    });

    it("powinien zawierać przycisk zamykania", async () => {
      // Arrange
      const user = userEvent.setup();
      render(
        <Dialog>
          <DialogTrigger>Open</DialogTrigger>
          <DialogContent>
            <p>Test Content</p>
          </DialogContent>
        </Dialog>
      );

      // Act
      await user.click(screen.getByText("Open"));

      // Assert
      const closeButton = document.querySelector('button[class*="absolute"]');
      expect(closeButton).toBeInTheDocument();
      expect(closeButton?.className).toContain("top-4");
      expect(closeButton?.className).toContain("right-4");
    });

    it("powinien zawierać ikonę zamykania w przycisku close", async () => {
      // Arrange
      const user = userEvent.setup();
      render(
        <Dialog>
          <DialogTrigger>Open</DialogTrigger>
          <DialogContent>
            <p>Test Content</p>
          </DialogContent>
        </Dialog>
      );

      // Act
      await user.click(screen.getByText("Open"));

      // Assert
      const closeButton = document.querySelector('button[class*="absolute"]');
      const icon = closeButton?.querySelector("svg");
      expect(icon).toBeInTheDocument();
      // Sprawdzamy klasę ikony przez classList (SVG może mieć baseVal)
      const iconClasses = icon?.getAttribute("class") || "";
      expect(iconClasses).toContain("w-6");
      expect(iconClasses).toContain("h-6");
    });

    it("powinien przyjąć dodatkowe klasy przez className prop", async () => {
      // Arrange
      const user = userEvent.setup();
      render(
        <Dialog>
          <DialogTrigger>Open</DialogTrigger>
          <DialogContent className="custom-dialog-class">
            <p>Test Content</p>
          </DialogContent>
        </Dialog>
      );

      // Act
      await user.click(screen.getByText("Open"));

      // Assert
      const content = screen.getByText("Test Content").closest("div[role='dialog']");
      expect(content).toHaveClass("custom-dialog-class");
      expect(content).toHaveClass("fixed"); // klasy bazowe pozostają
    });

    it("powinien zachować wszystkie bazowe klasy po dodaniu className", async () => {
      // Arrange
      const user = userEvent.setup();
      render(
        <Dialog>
          <DialogTrigger>Open</DialogTrigger>
          <DialogContent className="my-custom-dialog">
            <p>Test Content</p>
          </DialogContent>
        </Dialog>
      );

      // Act
      await user.click(screen.getByText("Open"));

      // Assert
      const content = screen.getByText("Test Content").closest("div[role='dialog']");
      expect(content).toHaveClass("my-custom-dialog");
      expect(content).toHaveClass("fixed");
      expect(content).toHaveClass("z-50");
      expect(content).toHaveClass("bg-background");
      expect(content).toHaveClass("rounded-lg");
    });
  });

  describe("DialogTitle - Style typograficzne", () => {
    it("powinien wyrenderować tytuł jako h2", async () => {
      // Arrange
      const user = userEvent.setup();
      render(
        <Dialog>
          <DialogTrigger>Open</DialogTrigger>
          <DialogContent>
            <DialogTitle>My Dialog Title</DialogTitle>
          </DialogContent>
        </Dialog>
      );

      // Act
      await user.click(screen.getByText("Open"));

      // Assert
      const title = screen.getByText("My Dialog Title");
      expect(title).toBeInTheDocument();
      // Radix UI używa h2 dla DialogTitle domyślnie
      expect(title.tagName).toBe("H2");
    });

    it("powinien mieć klasy text-lg i font-semibold", async () => {
      // Arrange
      const user = userEvent.setup();
      render(
        <Dialog>
          <DialogTrigger>Open</DialogTrigger>
          <DialogContent>
            <DialogTitle>Styled Title</DialogTitle>
          </DialogContent>
        </Dialog>
      );

      // Act
      await user.click(screen.getByText("Open"));

      // Assert
      const title = screen.getByText("Styled Title");
      expect(title).toHaveClass("text-lg");
      expect(title).toHaveClass("font-semibold");
    });

    it("powinien przyjąć dodatkowe klasy przez className prop", async () => {
      // Arrange
      const user = userEvent.setup();
      render(
        <Dialog>
          <DialogTrigger>Open</DialogTrigger>
          <DialogContent>
            <DialogTitle className="custom-title-class">Custom Title</DialogTitle>
          </DialogContent>
        </Dialog>
      );

      // Act
      await user.click(screen.getByText("Open"));

      // Assert
      const title = screen.getByText("Custom Title");
      expect(title).toHaveClass("custom-title-class");
      expect(title).toHaveClass("text-lg");
      expect(title).toHaveClass("font-semibold");
    });

    it("powinien obsłużyć różne typy children", async () => {
      // Arrange
      const user = userEvent.setup();
      render(
        <Dialog>
          <DialogTrigger>Open</DialogTrigger>
          <DialogContent>
            <DialogTitle>
              <span data-testid="icon">🔔</span> Notification
            </DialogTitle>
          </DialogContent>
        </Dialog>
      );

      // Act
      await user.click(screen.getByText("Open"));

      // Assert
      const title = screen.getByText("Notification").closest("h2");
      const icon = screen.getByTestId("icon");
      expect(title).toContainElement(icon);
      expect(icon).toHaveTextContent("🔔");
    });
  });

  describe("Interakcje użytkownika", () => {
    it("powinien otworzyć dialog po kliknięciu trigger", async () => {
      // Arrange
      const user = userEvent.setup();
      render(
        <Dialog>
          <DialogTrigger>Open Dialog</DialogTrigger>
          <DialogContent>
            <DialogTitle>Dialog Title</DialogTitle>
            <p>Dialog opened successfully</p>
          </DialogContent>
        </Dialog>
      );

      // Assert - dialog zamknięty
      expect(screen.queryByText("Dialog opened successfully")).not.toBeInTheDocument();

      // Act
      await user.click(screen.getByText("Open Dialog"));

      // Assert - dialog otwarty
      expect(screen.getByText("Dialog opened successfully")).toBeInTheDocument();
    });

    it("powinien zamknąć dialog po kliknięciu przycisku close", async () => {
      // Arrange
      const user = userEvent.setup();
      render(
        <Dialog>
          <DialogTrigger>Open</DialogTrigger>
          <DialogContent>
            <DialogTitle>Title</DialogTitle>
            <p>Content</p>
          </DialogContent>
        </Dialog>
      );

      // Act - otwórz dialog
      await user.click(screen.getByText("Open"));
      expect(screen.getByText("Content")).toBeInTheDocument();

      // Act - zamknij dialog
      const closeButton = document.querySelector('button[class*="absolute"]') as HTMLElement;
      await user.click(closeButton);

      // Assert - dialog zamknięty
      expect(screen.queryByText("Content")).not.toBeInTheDocument();
    });

    it("powinien zamknąć dialog po kliknięciu overlay (domyślne zachowanie Radix)", async () => {
      // Arrange
      const user = userEvent.setup();
      render(
        <Dialog>
          <DialogTrigger>Open</DialogTrigger>
          <DialogContent>
            <DialogTitle>Title</DialogTitle>
            <p>Content</p>
          </DialogContent>
        </Dialog>
      );

      // Act - otwórz dialog
      await user.click(screen.getByText("Open"));
      expect(screen.getByText("Content")).toBeInTheDocument();

      // Act - kliknij overlay
      const overlay = document.querySelector('[class*="backdrop-blur-sm"]') as HTMLElement;
      await user.click(overlay);

      // Assert - dialog powinien być zamknięty (domyślne zachowanie Radix)
      expect(screen.queryByText("Content")).not.toBeInTheDocument();
    });

    it("powinien obsłużyć zamykanie przez Escape key", async () => {
      // Arrange
      const user = userEvent.setup();
      render(
        <Dialog>
          <DialogTrigger>Open</DialogTrigger>
          <DialogContent>
            <DialogTitle>Title</DialogTitle>
            <p>Content</p>
          </DialogContent>
        </Dialog>
      );

      // Act - otwórz dialog
      await user.click(screen.getByText("Open"));
      expect(screen.getByText("Content")).toBeInTheDocument();

      // Act - naciśnij Escape
      await user.keyboard("{Escape}");

      // Assert - dialog zamknięty
      expect(screen.queryByText("Content")).not.toBeInTheDocument();
    });

    it("powinien obsłużyć wielokrotne otwieranie i zamykanie", async () => {
      // Arrange
      const user = userEvent.setup();
      render(
        <Dialog>
          <DialogTrigger>Open</DialogTrigger>
          <DialogContent>
            <p>Content</p>
          </DialogContent>
        </Dialog>
      );

      // Act & Assert - cykl 1
      await user.click(screen.getByText("Open"));
      expect(screen.getByText("Content")).toBeInTheDocument();
      await user.keyboard("{Escape}");
      expect(screen.queryByText("Content")).not.toBeInTheDocument();

      // Act & Assert - cykl 2
      await user.click(screen.getByText("Open"));
      expect(screen.getByText("Content")).toBeInTheDocument();
      await user.keyboard("{Escape}");
      expect(screen.queryByText("Content")).not.toBeInTheDocument();

      // Act & Assert - cykl 3
      await user.click(screen.getByText("Open"));
      expect(screen.getByText("Content")).toBeInTheDocument();
    });
  });

  describe("Portal rendering", () => {
    it("powinien renderować content w portalu", async () => {
      // Arrange
      const user = userEvent.setup();
      const { baseElement } = render(
        <Dialog>
          <DialogTrigger>Open</DialogTrigger>
          <DialogContent>
            <p>Portal Content</p>
          </DialogContent>
        </Dialog>
      );

      // Act
      await user.click(screen.getByText("Open"));

      // Assert
      // Portal renderuje się w body, nie w głównym kontenerze
      const portalContent = screen.getByText("Portal Content");
      expect(portalContent).toBeInTheDocument();
      // Content powinien być poza głównym kontenerem render
      expect(baseElement).toContainElement(portalContent);
    });

    it("powinien renderować overlay w portalu", async () => {
      // Arrange
      const user = userEvent.setup();
      render(
        <Dialog>
          <DialogTrigger>Open</DialogTrigger>
          <DialogContent>
            <p>Content</p>
          </DialogContent>
        </Dialog>
      );

      // Act
      await user.click(screen.getByText("Open"));

      // Assert
      const overlay = document.querySelector('[class*="backdrop-blur-sm"]');
      expect(overlay).toBeInTheDocument();
      // Overlay powinien być w body
      expect(document.body).toContainElement(overlay);
    });
  });

  describe("ForwardRef functionality", () => {
    it("DialogOverlay powinien akceptować ref", async () => {
      // Arrange
      const overlayRef = createRef<HTMLDivElement>();
      const user = userEvent.setup();

      const CustomDialog = () => (
        <Dialog>
          <DialogTrigger>Open</DialogTrigger>
          <DialogPortal>
            <DialogOverlay ref={overlayRef} data-testid="overlay" />
            <div role="dialog">
              <p>Content</p>
            </div>
          </DialogPortal>
        </Dialog>
      );

      render(<CustomDialog />);

      // Act
      await user.click(screen.getByText("Open"));

      // Assert
      const overlay = screen.getByTestId("overlay");
      expect(overlayRef.current).toBe(overlay);
    });

    it("DialogContent powinien akceptować ref", async () => {
      // Arrange
      const contentRef = createRef<HTMLDivElement>();
      const user = userEvent.setup();

      render(
        <Dialog>
          <DialogTrigger>Open</DialogTrigger>
          <DialogContent ref={contentRef}>
            <p>Content</p>
          </DialogContent>
        </Dialog>
      );

      // Act
      await user.click(screen.getByText("Open"));

      // Assert
      expect(contentRef.current).toBeInstanceOf(HTMLDivElement);
      expect(contentRef.current).toContainElement(screen.getByText("Content"));
    });

    it("DialogTitle powinien akceptować ref", async () => {
      // Arrange
      const titleRef = createRef<HTMLHeadingElement>();
      const user = userEvent.setup();

      render(
        <Dialog>
          <DialogTrigger>Open</DialogTrigger>
          <DialogContent>
            <DialogTitle ref={titleRef}>Title with ref</DialogTitle>
          </DialogContent>
        </Dialog>
      );

      // Act
      await user.click(screen.getByText("Open"));

      // Assert
      expect(titleRef.current).toBeInstanceOf(HTMLHeadingElement);
      expect(titleRef.current).toHaveTextContent("Title with ref");
    });
  });

  describe("Accessibility", () => {
    it("powinien mieć odpowiednie role dla dialog", async () => {
      // Arrange
      const user = userEvent.setup();
      render(
        <Dialog>
          <DialogTrigger>Open</DialogTrigger>
          <DialogContent>
            <DialogTitle>Accessible Dialog</DialogTitle>
            <p>Content</p>
          </DialogContent>
        </Dialog>
      );

      // Act
      await user.click(screen.getByText("Open"));

      // Assert
      const dialog = screen.getByRole("dialog");
      expect(dialog).toBeInTheDocument();
    });

    it("DialogTitle powinien być powiązany z dialogiem przez aria-labelledby", async () => {
      // Arrange
      const user = userEvent.setup();
      render(
        <Dialog>
          <DialogTrigger>Open</DialogTrigger>
          <DialogContent>
            <DialogTitle>Dialog Title</DialogTitle>
            <p>Content</p>
          </DialogContent>
        </Dialog>
      );

      // Act
      await user.click(screen.getByText("Open"));

      // Assert
      const dialog = screen.getByRole("dialog");
      const title = screen.getByText("Dialog Title");

      // Radix UI automatycznie ustawia aria-labelledby
      const ariaLabelledBy = dialog.getAttribute("aria-labelledby");
      expect(ariaLabelledBy).toBeTruthy();
      expect(title.id).toBe(ariaLabelledBy);
    });

    it("powinien być widoczny dla screen readerów po otwarciu", async () => {
      // Arrange
      const user = userEvent.setup();
      render(
        <Dialog>
          <DialogTrigger>Open</DialogTrigger>
          <DialogContent>
            <DialogTitle>Screen Reader Title</DialogTitle>
            <p>Screen Reader Content</p>
          </DialogContent>
        </Dialog>
      );

      // Act
      await user.click(screen.getByText("Open"));

      // Assert
      const dialog = screen.getByRole("dialog");
      expect(dialog).toBeVisible();
      expect(dialog).not.toHaveAttribute("aria-hidden", "true");
    });

    it("przycisk zamykania powinien mieć focus outline behavior", async () => {
      // Arrange
      const user = userEvent.setup();
      render(
        <Dialog>
          <DialogTrigger>Open</DialogTrigger>
          <DialogContent>
            <p>Content</p>
          </DialogContent>
        </Dialog>
      );

      // Act
      await user.click(screen.getByText("Open"));

      // Assert
      const closeButton = document.querySelector('button[class*="absolute"]');
      expect(closeButton).toHaveClass("focus:outline-none");
      expect(closeButton).toHaveClass("cursor-pointer");
    });

    it("powinien trapować focus w dialogu po otwarciu", async () => {
      // Arrange
      const user = userEvent.setup();
      render(
        <Dialog>
          <DialogTrigger>Open</DialogTrigger>
          <DialogContent>
            <DialogTitle>Focus Trap Test</DialogTitle>
            <button>Button 1</button>
            <button>Button 2</button>
          </DialogContent>
        </Dialog>
      );

      // Act
      await user.click(screen.getByText("Open"));

      // Assert - focus powinien być w dialogu
      const dialog = screen.getByRole("dialog");
      expect(document.activeElement).toBeTruthy();
      expect(dialog).toContainElement(document.activeElement);
    });

    it("powinien przywrócić focus do triggera po zamknięciu", async () => {
      // Arrange
      const user = userEvent.setup();
      render(
        <Dialog>
          <DialogTrigger>Open</DialogTrigger>
          <DialogContent>
            <p>Content</p>
          </DialogContent>
        </Dialog>
      );

      const trigger = screen.getByText("Open");

      // Act - otwórz i zamknij
      await user.click(trigger);
      await user.keyboard("{Escape}");

      // Assert - focus wrócił do triggera
      expect(document.activeElement).toBe(trigger);
    });
  });

  describe("Przekazywanie dodatkowych props HTML", () => {
    it("DialogOverlay powinien akceptować dodatkowe HTML props", async () => {
      // Arrange
      const user = userEvent.setup();
      const CustomDialog = () => (
        <Dialog>
          <DialogTrigger>Open</DialogTrigger>
          <DialogPortal>
            <DialogOverlay data-testid="custom-overlay" aria-label="Modal overlay" />
            <div role="dialog">Content</div>
          </DialogPortal>
        </Dialog>
      );

      render(<CustomDialog />);

      // Act
      await user.click(screen.getByText("Open"));

      // Assert
      const overlay = screen.getByTestId("custom-overlay");
      expect(overlay).toHaveAttribute("aria-label", "Modal overlay");
    });

    it("DialogContent powinien akceptować dodatkowe HTML props", async () => {
      // Arrange
      const user = userEvent.setup();
      render(
        <Dialog>
          <DialogTrigger>Open</DialogTrigger>
          <DialogContent data-testid="custom-content" aria-describedby="description">
            <p id="description">Description text</p>
          </DialogContent>
        </Dialog>
      );

      // Act
      await user.click(screen.getByText("Open"));

      // Assert
      const content = screen.getByTestId("custom-content");
      expect(content).toHaveAttribute("aria-describedby", "description");
    });

    it("DialogTitle powinien akceptować dodatkowe HTML props", async () => {
      // Arrange
      const user = userEvent.setup();
      render(
        <Dialog>
          <DialogTrigger>Open</DialogTrigger>
          <DialogContent>
            <DialogTitle data-testid="custom-title" lang="pl">
              Polski Tytuł
            </DialogTitle>
          </DialogContent>
        </Dialog>
      );

      // Act
      await user.click(screen.getByText("Open"));

      // Assert
      const title = screen.getByTestId("custom-title");
      expect(title).toHaveAttribute("lang", "pl");
    });
  });

  describe("Edge cases", () => {
    it("powinien obsłużyć DialogContent bez DialogTitle", async () => {
      // Arrange
      const user = userEvent.setup();
      render(
        <Dialog>
          <DialogTrigger>Open</DialogTrigger>
          <DialogContent>
            <p>Content without title</p>
          </DialogContent>
        </Dialog>
      );

      // Act
      await user.click(screen.getByText("Open"));

      // Assert
      expect(screen.getByText("Content without title")).toBeInTheDocument();
      expect(screen.queryByRole("heading")).not.toBeInTheDocument();
    });

    it("powinien obsłużyć pusty content", async () => {
      // Arrange
      const user = userEvent.setup();
      render(
        <Dialog>
          <DialogTrigger>Open</DialogTrigger>
          <DialogContent></DialogContent>
        </Dialog>
      );

      // Act
      await user.click(screen.getByText("Open"));

      // Assert
      const dialog = screen.getByRole("dialog");
      expect(dialog).toBeInTheDocument();
      // Przycisk zamykania powinien być obecny
      const closeButton = document.querySelector('button[class*="absolute"]');
      expect(closeButton).toBeInTheDocument();
    });

    it("powinien obsłużyć bardzo długi content", async () => {
      // Arrange
      const user = userEvent.setup();
      const longText = "Lorem ipsum dolor sit amet. ".repeat(100);

      render(
        <Dialog>
          <DialogTrigger>Open</DialogTrigger>
          <DialogContent>
            <DialogTitle>Long Content Dialog</DialogTitle>
            <p>{longText}</p>
          </DialogContent>
        </Dialog>
      );

      // Act
      await user.click(screen.getByText("Open"));

      // Assert
      expect(screen.getByText("Long Content Dialog")).toBeInTheDocument();
      const dialog = screen.getByRole("dialog");
      expect(dialog).toHaveClass("max-w-lg"); // Szerokość jest ograniczona
    });

    it("powinien obsłużyć dialog z formularzem", async () => {
      // Arrange
      const user = userEvent.setup();
      const handleSubmit = vi.fn((e) => e.preventDefault());

      render(
        <Dialog>
          <DialogTrigger>Open</DialogTrigger>
          <DialogContent>
            <DialogTitle>Form Dialog</DialogTitle>
            <form onSubmit={handleSubmit}>
              <input type="text" placeholder="Name" />
              <button type="submit">Submit</button>
            </form>
          </DialogContent>
        </Dialog>
      );

      // Act
      await user.click(screen.getByText("Open"));
      await user.type(screen.getByPlaceholderText("Name"), "John Doe");
      await user.click(screen.getByText("Submit"));

      // Assert
      expect(handleSubmit).toHaveBeenCalledTimes(1);
    });

    it("powinien obsłużyć zagnieżdżone interaktywne elementy", async () => {
      // Arrange
      const user = userEvent.setup();
      const handleButtonClick = vi.fn();

      render(
        <Dialog>
          <DialogTrigger>Open</DialogTrigger>
          <DialogContent>
            <DialogTitle>Interactive Elements</DialogTitle>
            <button onClick={handleButtonClick}>Click me</button>
            <a href="#test">Link</a>
            <input type="checkbox" />
          </DialogContent>
        </Dialog>
      );

      // Act
      await user.click(screen.getByText("Open"));
      await user.click(screen.getByText("Click me"));

      // Assert
      expect(handleButtonClick).toHaveBeenCalledTimes(1);
      expect(screen.getByRole("link")).toBeInTheDocument();
      expect(screen.getByRole("checkbox")).toBeInTheDocument();
    });

    it("powinien obsłużyć szybkie otwieranie i zamykanie", async () => {
      // Arrange
      const user = userEvent.setup();
      render(
        <Dialog>
          <DialogTrigger>Open</DialogTrigger>
          <DialogContent>
            <p>Content</p>
          </DialogContent>
        </Dialog>
      );

      // Act & Assert - szybkie cykle otwarcia/zamknięcia
      await user.click(screen.getByText("Open"));
      expect(screen.getByText("Content")).toBeInTheDocument();

      await user.keyboard("{Escape}");
      expect(screen.queryByText("Content")).not.toBeInTheDocument();

      await user.click(screen.getByText("Open"));
      expect(screen.getByText("Content")).toBeInTheDocument();
    });

    it("powinien obsłużyć DialogTitle z emoji", async () => {
      // Arrange
      const user = userEvent.setup();
      render(
        <Dialog>
          <DialogTrigger>Open</DialogTrigger>
          <DialogContent>
            <DialogTitle>⚠️ Warning Dialog</DialogTitle>
            <p>Important message</p>
          </DialogContent>
        </Dialog>
      );

      // Act
      await user.click(screen.getByText("Open"));

      // Assert
      const title = screen.getByText("⚠️ Warning Dialog");
      expect(title).toBeInTheDocument();
      expect(title).toHaveTextContent("⚠️");
    });

    it("powinien obsłużyć undefined className", async () => {
      // Arrange
      const user = userEvent.setup();
      render(
        <Dialog>
          <DialogTrigger>Open</DialogTrigger>
          <DialogContent className={undefined}>
            <DialogTitle className={undefined}>Title</DialogTitle>
            <p>Content</p>
          </DialogContent>
        </Dialog>
      );

      // Act
      await user.click(screen.getByText("Open"));

      // Assert
      expect(screen.getByText("Title")).toBeInTheDocument();
      expect(screen.getByText("Content")).toBeInTheDocument();
    });

    it("powinien obsłużyć pusty string jako className", async () => {
      // Arrange
      const user = userEvent.setup();
      render(
        <Dialog>
          <DialogTrigger>Open</DialogTrigger>
          <DialogContent className="">
            <DialogTitle className="">Title</DialogTitle>
          </DialogContent>
        </Dialog>
      );

      // Act
      await user.click(screen.getByText("Open"));

      // Assert
      const title = screen.getByText("Title");
      expect(title).toHaveClass("text-lg");
      expect(title).toHaveClass("font-semibold");
    });
  });

  describe("Kombinacje props", () => {
    it("powinien obsłużyć DialogContent z wieloma klasami Tailwind", async () => {
      // Arrange
      const user = userEvent.setup();
      render(
        <Dialog>
          <DialogTrigger>Open</DialogTrigger>
          <DialogContent className="max-w-2xl border-2 border-red-500 shadow-2xl">
            <p>Custom styled dialog</p>
          </DialogContent>
        </Dialog>
      );

      // Act
      await user.click(screen.getByText("Open"));

      // Assert
      const dialog = screen.getByRole("dialog");
      expect(dialog).toHaveClass("max-w-2xl");
      expect(dialog).toHaveClass("border-2");
      expect(dialog).toHaveClass("border-red-500");
      expect(dialog).toHaveClass("shadow-2xl");
      // Klasy bazowe pozostają
      expect(dialog).toHaveClass("fixed");
      expect(dialog).toHaveClass("z-50");
    });

    it("powinien obsłużyć kompleksową strukturę z wszystkimi komponentami", async () => {
      // Arrange
      const user = userEvent.setup();
      render(
        <Dialog>
          <DialogTrigger data-testid="trigger">Open Complex Dialog</DialogTrigger>
          <DialogContent className="custom-content" data-testid="content">
            <DialogTitle className="custom-title" data-testid="title">
              Complex Dialog Title
            </DialogTitle>
            <p data-testid="description">This is a complex dialog with all components.</p>
            <div data-testid="actions">
              <button>Cancel</button>
              <button>Confirm</button>
            </div>
          </DialogContent>
        </Dialog>
      );

      // Act
      await user.click(screen.getByTestId("trigger"));

      // Assert
      expect(screen.getByTestId("content")).toBeInTheDocument();
      expect(screen.getByTestId("title")).toBeInTheDocument();
      expect(screen.getByTestId("description")).toBeInTheDocument();
      expect(screen.getByTestId("actions")).toBeInTheDocument();
      expect(screen.getByText("Cancel")).toBeInTheDocument();
      expect(screen.getByText("Confirm")).toBeInTheDocument();
    });

    it("powinien obsłużyć Dialog z kontrolowanym stanem open", async () => {
      // Arrange
      const user = userEvent.setup();
      const ControlledDialog = () => {
        const [open, setOpen] = React.useState(false);
        return (
          <>
            <button onClick={() => setOpen(true)}>Open Controlled</button>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogContent>
                <p>Controlled Content</p>
              </DialogContent>
            </Dialog>
          </>
        );
      };

      render(<ControlledDialog />);

      // Act
      await user.click(screen.getByText("Open Controlled"));

      // Assert
      expect(screen.getByText("Controlled Content")).toBeInTheDocument();
    });

    it("powinien obsłużyć callback onOpenChange", async () => {
      // Arrange
      const user = userEvent.setup();
      const handleOpenChange = vi.fn();

      render(
        <Dialog onOpenChange={handleOpenChange}>
          <DialogTrigger>Open</DialogTrigger>
          <DialogContent>
            <p>Content</p>
          </DialogContent>
        </Dialog>
      );

      // Act - otwórz
      await user.click(screen.getByText("Open"));

      // Assert
      expect(handleOpenChange).toHaveBeenCalledWith(true);

      // Act - zamknij
      await user.keyboard("{Escape}");

      // Assert
      expect(handleOpenChange).toHaveBeenCalledWith(false);
      expect(handleOpenChange).toHaveBeenCalledTimes(2);
    });
  });

  describe("Responsywność", () => {
    it("powinien mieć responsywną szerokość w-full max-w-lg", async () => {
      // Arrange
      const user = userEvent.setup();
      render(
        <Dialog>
          <DialogTrigger>Open</DialogTrigger>
          <DialogContent>
            <p>Responsive Content</p>
          </DialogContent>
        </Dialog>
      );

      // Act
      await user.click(screen.getByText("Open"));

      // Assert
      const dialog = screen.getByRole("dialog");
      expect(dialog).toHaveClass("w-full");
      expect(dialog).toHaveClass("max-w-lg");
    });

    it("powinien umożliwić nadpisanie szerokości przez className", async () => {
      // Arrange
      const user = userEvent.setup();
      render(
        <Dialog>
          <DialogTrigger>Open</DialogTrigger>
          <DialogContent className="max-w-4xl">
            <p>Wide Dialog</p>
          </DialogContent>
        </Dialog>
      );

      // Act
      await user.click(screen.getByText("Open"));

      // Assert
      const dialog = screen.getByRole("dialog");
      expect(dialog).toHaveClass("max-w-4xl");
      expect(dialog).toHaveClass("w-full");
    });
  });

  describe("Performance", () => {
    it("powinien szybko renderować dialog", async () => {
      // Arrange
      const user = userEvent.setup();
      const startTime = performance.now();

      render(
        <Dialog>
          <DialogTrigger>Open</DialogTrigger>
          <DialogContent>
            <DialogTitle>Performance Test</DialogTitle>
            <p>Content</p>
          </DialogContent>
        </Dialog>
      );

      await user.click(screen.getByText("Open"));

      // Assert
      const endTime = performance.now();
      const renderTime = endTime - startTime;

      expect(renderTime).toBeLessThan(100);
      expect(screen.getByText("Performance Test")).toBeInTheDocument();
    });

    it("powinien obsłużyć wielokrotne otwieranie bez degradacji wydajności", async () => {
      // Arrange
      const user = userEvent.setup();
      render(
        <Dialog>
          <DialogTrigger>Open</DialogTrigger>
          <DialogContent>
            <p>Content</p>
          </DialogContent>
        </Dialog>
      );

      // Act - wiele cykli otwarcia/zamknięcia
      const iterations = 10;
      const times: number[] = [];

      for (let i = 0; i < iterations; i++) {
        const start = performance.now();
        await user.click(screen.getByText("Open"));
        await user.keyboard("{Escape}");
        const end = performance.now();
        times.push(end - start);
      }

      // Assert - średni czas nie powinien rosnąć znacząco
      const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
      // Realistyczny threshold dla testów z userEvent
      expect(avgTime).toBeLessThan(200);
    });
  });
});
