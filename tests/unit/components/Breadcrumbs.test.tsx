import { describe, it, expect, afterEach, vi } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";

/**
 * Testy jednostkowe dla komponentu Breadcrumbs
 *
 * Testowane funkcjonalności:
 * - Renderowanie standardowego tytułu dla różnych ścieżek
 * - Renderowanie breadcrumbs dla board detail page
 * - Renderowanie breadcrumbs dla add level page
 * - Obsługa kliknięcia przycisku "back"
 * - Logika określania poprzedniego tytułu na podstawie referrera
 * - Matching ścieżek URL i rozpoznawanie kontekstu
 * - Style responsywne i klasy CSS
 * - Accessibility
 * - Edge cases (brak referrera, różne origins)
 */

describe("Breadcrumbs", () => {
  // Helper function do mockowania window.location.pathname
  const mockLocation = (pathname: string, origin = "http://localhost") => {
    Object.defineProperty(window, "location", {
      value: {
        pathname,
        origin,
      },
      writable: true,
      configurable: true,
    });
  };

  // Helper function do mockowania document.referrer
  const mockReferrer = (referrer: string) => {
    Object.defineProperty(document, "referrer", {
      value: referrer,
      writable: true,
      configurable: true,
    });
  };

  // Helper function do mockowania window.history.back
  const mockHistoryBack = () => {
    const mockBack = vi.fn();
    Object.defineProperty(window, "history", {
      value: { back: mockBack },
      writable: true,
      configurable: true,
    });
    return mockBack;
  };

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  describe("Renderowanie standardowego tytułu", () => {
    it("powinien wyrenderować h1 z tytułem 'Public Boards' dla ścieżki /boards", () => {
      // Arrange
      mockLocation("/boards");

      // Act
      render(<Breadcrumbs />);

      // Assert
      const heading = screen.getByRole("heading", { level: 1 });
      expect(heading).toBeInTheDocument();
      expect(heading).toHaveTextContent("Public Boards");
      expect(heading.tagName).toBe("H1");
    });

    it("powinien wyrenderować h1 z tytułem 'My Boards' dla ścieżki /my-boards", () => {
      // Arrange
      mockLocation("/my-boards");

      // Act
      render(<Breadcrumbs />);

      // Assert
      const heading = screen.getByRole("heading", { level: 1 });
      expect(heading).toHaveTextContent("My Boards");
    });

    it("powinien wyrenderować h1 z tytułem 'Played Boards' dla ścieżki /played", () => {
      // Arrange
      mockLocation("/played");

      // Act
      render(<Breadcrumbs />);

      // Assert
      const heading = screen.getByRole("heading", { level: 1 });
      expect(heading).toHaveTextContent("Played Boards");
    });

    it("powinien wyrenderować domyślny tytuł 'Public Boards' dla nieznanych ścieżek", () => {
      // Arrange
      mockLocation("/unknown-route");

      // Act
      render(<Breadcrumbs />);

      // Assert
      const heading = screen.getByRole("heading", { level: 1 });
      expect(heading).toHaveTextContent("Public Boards");
    });

    it("powinien mieć poprawne klasy stylowania dla h1", () => {
      // Arrange
      mockLocation("/boards");

      // Act
      render(<Breadcrumbs />);

      // Assert
      const heading = screen.getByRole("heading", { level: 1 });
      expect(heading).toHaveClass("text-2xl");
      expect(heading).toHaveClass("font-bold");
    });
  });

  describe("Renderowanie breadcrumbs dla board detail page", () => {
    it("powinien wyrenderować przycisk back dla ścieżki /boards/123", () => {
      // Arrange
      mockLocation("/boards/123");
      mockReferrer("http://localhost/boards");
      mockHistoryBack();

      // Act
      render(<Breadcrumbs />);

      // Assert
      const button = screen.getByRole("button");
      expect(button).toBeInTheDocument();
      expect(button.tagName).toBe("BUTTON");
    });

    it("powinien wyświetlić breadcrumbs z 'Public Boards / Play' dla board detail", () => {
      // Arrange
      mockLocation("/boards/abc-123");
      mockReferrer("http://localhost/boards");
      mockHistoryBack();

      // Act
      render(<Breadcrumbs />);

      // Assert
      expect(screen.getByText("Public Boards")).toBeInTheDocument();
      expect(screen.getByText("Play")).toBeInTheDocument();
      expect(screen.getAllByText("/")).toHaveLength(1);
    });

    it("powinien wyświetlić 'Edit' dla ścieżki /boards/123/edit", () => {
      // Arrange
      mockLocation("/boards/123/edit");
      mockReferrer("http://localhost/my-boards");
      mockHistoryBack();

      // Act
      render(<Breadcrumbs />);

      // Assert
      expect(screen.getByText("Edit")).toBeInTheDocument();
      expect(screen.queryByText("Play")).not.toBeInTheDocument();
    });

    it("powinien wyświetlić 'My Boards' jako prevTitle gdy referrer to /my-boards", () => {
      // Arrange
      mockLocation("/boards/456");
      mockReferrer("http://localhost/my-boards");
      mockHistoryBack();

      // Act
      render(<Breadcrumbs />);

      // Assert
      expect(screen.getByText("My Boards")).toBeInTheDocument();
    });

    it("powinien wyświetlić 'Played Boards' jako prevTitle gdy referrer to /played", () => {
      // Arrange
      mockLocation("/boards/789");
      mockReferrer("http://localhost/played");
      mockHistoryBack();

      // Act
      render(<Breadcrumbs />);

      // Assert
      expect(screen.getByText("Played Boards")).toBeInTheDocument();
    });
  });

  describe("Renderowanie breadcrumbs dla add level page", () => {
    it("powinien wyrenderować breadcrumbs dla ścieżki /my-boards/123/add-level", () => {
      // Arrange
      mockLocation("/my-boards/123/add-level");

      // Act
      render(<Breadcrumbs />);

      // Assert
      const heading = screen.getByRole("heading", { level: 1 });
      expect(heading).toBeInTheDocument();
      expect(screen.getByText("My Boards")).toBeInTheDocument();
      expect(screen.getByText("Add level")).toBeInTheDocument();
    });

    it("powinien zawierać link do /my-boards dla add level w my-boards", () => {
      // Arrange
      mockLocation("/my-boards/abc/add-level");

      // Act
      render(<Breadcrumbs />);

      // Assert
      const link = screen.getByRole("link", { name: "My Boards" });
      expect(link).toHaveAttribute("href", "/my-boards");
      expect(link).toHaveClass("hover:underline");
    });

    it("powinien wyrenderować breadcrumbs dla ścieżki /boards/123/add-level", () => {
      // Arrange
      mockLocation("/boards/456/add-level");

      // Act
      render(<Breadcrumbs />);

      // Assert
      expect(screen.getByText("Public Boards")).toBeInTheDocument();
      expect(screen.getByText("Add level")).toBeInTheDocument();
    });

    it("powinien zawierać link do /boards dla add level w boards", () => {
      // Arrange
      mockLocation("/boards/xyz/add-level");

      // Act
      render(<Breadcrumbs />);

      // Assert
      const link = screen.getByRole("link", { name: "Public Boards" });
      expect(link).toHaveAttribute("href", "/boards");
    });

    it("powinien wyświetlić separator '/' między elementami", () => {
      // Arrange
      mockLocation("/my-boards/123/add-level");

      // Act
      render(<Breadcrumbs />);

      // Assert
      const separators = screen.getAllByText("/");
      expect(separators).toHaveLength(1);
    });
  });

  describe("Obsługa przycisku back", () => {
    it("powinien wywołać window.history.back() po kliknięciu", () => {
      // Arrange
      mockLocation("/boards/123");
      mockReferrer("http://localhost/boards");
      const mockBack = mockHistoryBack();

      // Act
      render(<Breadcrumbs />);
      const button = screen.getByRole("button");
      fireEvent.click(button);

      // Assert
      expect(mockBack).toHaveBeenCalledTimes(1);
    });

    it("powinien mieć type='button' aby zapobiec submit w formularzach", () => {
      // Arrange
      mockLocation("/boards/123");
      mockReferrer("http://localhost/boards");
      mockHistoryBack();

      // Act
      render(<Breadcrumbs />);

      // Assert
      const button = screen.getByRole("button");
      expect(button).toHaveAttribute("type", "button");
    });
  });

  describe("Logika określania prevTitle z referrera", () => {
    it("powinien użyć 'Public Boards' gdy document.referrer jest pusty", () => {
      // Arrange
      mockLocation("/boards/123");
      mockReferrer("");
      mockHistoryBack();

      // Act
      render(<Breadcrumbs />);

      // Assert
      expect(screen.getByText("Public Boards")).toBeInTheDocument();
    });

    it("powinien użyć 'Public Boards' gdy referrer pochodzi z innego origin", () => {
      // Arrange
      mockLocation("/boards/123");
      mockReferrer("http://other-domain.com/boards");
      mockHistoryBack();

      // Act
      render(<Breadcrumbs />);

      // Assert
      expect(screen.getByText("Public Boards")).toBeInTheDocument();
    });

    it("powinien użyć 'Public Boards' gdy referrer jest niepoprawnym URL", () => {
      // Arrange
      mockLocation("/boards/123");
      mockReferrer("invalid-url");
      mockHistoryBack();

      // Act
      render(<Breadcrumbs />);

      // Assert
      expect(screen.getByText("Public Boards")).toBeInTheDocument();
    });

    it("powinien użyć poprawnego tytułu dla znanej ścieżki w referrer", () => {
      // Arrange
      mockLocation("/boards/123");
      mockReferrer("http://localhost/played");
      mockHistoryBack();

      // Act
      render(<Breadcrumbs />);

      // Assert
      expect(screen.getByText("Played Boards")).toBeInTheDocument();
    });

    it("powinien użyć 'Public Boards' dla nieznanej ścieżki w referrer", () => {
      // Arrange
      mockLocation("/boards/123");
      mockReferrer("http://localhost/unknown-path");
      mockHistoryBack();

      // Act
      render(<Breadcrumbs />);

      // Assert
      expect(screen.getByText("Public Boards")).toBeInTheDocument();
    });
  });

  describe("Matching ścieżek URL", () => {
    it("powinien rozpoznać board detail: /boards/123", () => {
      // Arrange
      mockLocation("/boards/123");
      mockReferrer("");
      mockHistoryBack();

      // Act
      render(<Breadcrumbs />);

      // Assert - powinien być button (nie h1)
      expect(screen.getByRole("button")).toBeInTheDocument();
      expect(screen.queryByRole("heading")).not.toBeInTheDocument();
    });

    it("powinien rozpoznać board edit: /boards/abc-def/edit", () => {
      // Arrange
      mockLocation("/boards/abc-def/edit");
      mockReferrer("");
      mockHistoryBack();

      // Act
      render(<Breadcrumbs />);

      // Assert
      expect(screen.getByText("Edit")).toBeInTheDocument();
    });

    it("powinien rozpoznać add level z ID zawierającym znaki specjalne", () => {
      // Arrange
      mockLocation("/boards/abc-123-xyz/add-level");

      // Act
      render(<Breadcrumbs />);

      // Assert
      expect(screen.getByText("Add level")).toBeInTheDocument();
    });

    it("nie powinien rozpoznać jako board detail gdy ścieżka ma dodatkowe segmenty (poza /edit)", () => {
      // Arrange
      mockLocation("/boards/123/something-else");

      // Act
      render(<Breadcrumbs />);

      // Assert - powinien wyrenderować standardowy h1
      expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
    });
  });

  describe("Style responsywne i klasy CSS", () => {
    it("powinien mieć responsywne rozmiary tekstu dla przycisku back", () => {
      // Arrange
      mockLocation("/boards/123");
      mockReferrer("");
      mockHistoryBack();

      // Act
      render(<Breadcrumbs />);

      // Assert
      const button = screen.getByRole("button");
      expect(button).toHaveClass("text-[18px]");
      expect(button).toHaveClass("md:text-[22px]");
      expect(button).toHaveClass("md:text-2xl");
    });

    it("powinien mieć flexbox alignment dla przycisku back", () => {
      // Arrange
      mockLocation("/boards/123");
      mockReferrer("");
      mockHistoryBack();

      // Act
      render(<Breadcrumbs />);

      // Assert
      const button = screen.getByRole("button");
      expect(button).toHaveClass("flex");
      expect(button).toHaveClass("items-center");
    });

    it("powinien mieć font-bold dla przycisku back", () => {
      // Arrange
      mockLocation("/boards/123");
      mockReferrer("");
      mockHistoryBack();

      // Act
      render(<Breadcrumbs />);

      // Assert
      const button = screen.getByRole("button");
      expect(button).toHaveClass("font-bold");
    });

    it("powinien mieć cursor-pointer dla przycisku back", () => {
      // Arrange
      mockLocation("/boards/123");
      mockReferrer("");
      mockHistoryBack();

      // Act
      render(<Breadcrumbs />);

      // Assert
      const button = screen.getByRole("button");
      expect(button).toHaveClass("cursor-pointer");
    });

    it("powinien mieć select-none dla przycisku back", () => {
      // Arrange
      mockLocation("/boards/123");
      mockReferrer("");
      mockHistoryBack();

      // Act
      render(<Breadcrumbs />);

      // Assert
      const button = screen.getByRole("button");
      expect(button).toHaveClass("select-none");
    });

    it("powinien mieć zresetowane style domyślne przycisku", () => {
      // Arrange
      mockLocation("/boards/123");
      mockReferrer("");
      mockHistoryBack();

      // Act
      render(<Breadcrumbs />);

      // Assert
      const button = screen.getByRole("button");
      expect(button).toHaveClass("bg-transparent");
      expect(button).toHaveClass("border-none");
      expect(button).toHaveClass("p-0");
    });

    it("powinien mieć prawidłowe klasy dla ikony ChevronLeft", () => {
      // Arrange
      mockLocation("/boards/123");
      mockReferrer("");
      mockHistoryBack();

      // Act
      const { container } = render(<Breadcrumbs />);

      // Assert
      const svg = container.querySelector("svg");
      expect(svg).toHaveClass("h-6");
      expect(svg).toHaveClass("w-6");
      expect(svg).toHaveClass("mr-2");
    });

    it("powinien mieć hover:underline dla linku w add level", () => {
      // Arrange
      mockLocation("/my-boards/123/add-level");

      // Act
      render(<Breadcrumbs />);

      // Assert
      const link = screen.getByRole("link");
      expect(link).toHaveClass("hover:underline");
    });

    it("powinien mieć prawidłowy margin dla separatora", () => {
      // Arrange
      mockLocation("/boards/123");
      mockReferrer("");
      mockHistoryBack();

      // Act
      const { container } = render(<Breadcrumbs />);

      // Assert
      const separators = container.querySelectorAll(".mx-2");
      expect(separators.length).toBeGreaterThan(0);
    });
  });

  describe("Accessibility", () => {
    it("powinien używać semantycznego h1 dla standardowych tytułów", () => {
      // Arrange
      mockLocation("/boards");

      // Act
      render(<Breadcrumbs />);

      // Assert
      const heading = screen.getByRole("heading", { level: 1 });
      expect(heading).toBeInTheDocument();
    });

    it("powinien używać semantycznego przycisku dla interaktywnego elementu", () => {
      // Arrange
      mockLocation("/boards/123");
      mockReferrer("");
      mockHistoryBack();

      // Act
      render(<Breadcrumbs />);

      // Assert
      const button = screen.getByRole("button");
      expect(button).toBeInTheDocument();
      expect(button.tagName).toBe("BUTTON");
    });

    it("powinien używać semantycznego linka dla nawigacji w add level", () => {
      // Arrange
      mockLocation("/boards/123/add-level");

      // Act
      render(<Breadcrumbs />);

      // Assert
      const link = screen.getByRole("link");
      expect(link).toBeInTheDocument();
      expect(link.tagName).toBe("A");
    });

    it("powinien mieć dostępny tekst w przycisku back", () => {
      // Arrange
      mockLocation("/boards/123");
      mockReferrer("http://localhost/my-boards");
      mockHistoryBack();

      // Act
      render(<Breadcrumbs />);

      // Assert
      const button = screen.getByRole("button");
      expect(button).toHaveTextContent("My Boards");
      expect(button).toHaveTextContent("/");
      expect(button).toHaveTextContent("Play");
    });

    it("powinien zapewniać navigation landmark przez h1", () => {
      // Arrange
      mockLocation("/boards");

      // Act
      render(<Breadcrumbs />);

      // Assert
      const heading = screen.getByRole("heading", { level: 1 });
      expect(heading).toBeInTheDocument();
    });
  });

  describe("Edge cases", () => {
    it("powinien obsłużyć board ID z UUID", () => {
      // Arrange
      mockLocation("/boards/550e8400-e29b-41d4-a716-446655440000");
      mockReferrer("");
      mockHistoryBack();

      // Act
      render(<Breadcrumbs />);

      // Assert
      expect(screen.getByRole("button")).toBeInTheDocument();
    });

    it("powinien obsłużyć wielokrotne re-renderowanie bez błędów", () => {
      // Arrange
      mockLocation("/boards");

      // Act
      const { rerender } = render(<Breadcrumbs />);

      // Assert pierwszego renderowania
      expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Public Boards");

      // Zmiana pathname
      mockLocation("/my-boards");
      rerender(<Breadcrumbs />);

      // Assert drugiego renderowania
      expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("My Boards");
    });

    it("powinien obsłużyć referrer z query parametrami", () => {
      // Arrange
      mockLocation("/boards/123");
      mockReferrer("http://localhost/my-boards?page=2&sort=name");
      mockHistoryBack();

      // Act
      render(<Breadcrumbs />);

      // Assert
      expect(screen.getByText("My Boards")).toBeInTheDocument();
    });

    it("powinien obsłużyć referrer z hash", () => {
      // Arrange
      mockLocation("/boards/123");
      mockReferrer("http://localhost/boards#section");
      mockHistoryBack();

      // Act
      render(<Breadcrumbs />);

      // Assert
      expect(screen.getByText("Public Boards")).toBeInTheDocument();
    });

    it("powinien obsłużyć brak window.history podczas kliknięcia", () => {
      // Arrange
      mockLocation("/boards/123");
      mockReferrer("");

      // Act
      render(<Breadcrumbs />);
      const button = screen.getByRole("button");

      // Assert - nie powinno rzucić błędu
      expect(() => fireEvent.click(button)).not.toThrow();
    });
  });

  describe("Integracja routeTitles", () => {
    it("powinien poprawnie mapować znane ścieżki do tytułów", () => {
      const paths = [
        { path: "/boards", title: "Public Boards" },
        { path: "/my-boards", title: "My Boards" },
        { path: "/played-boards", title: "Played Boards" },
        { path: "/played", title: "Played Boards" },
      ];

      paths.forEach(({ path, title }) => {
        // Arrange
        mockLocation(path);

        // Act
        const { unmount } = render(<Breadcrumbs />);

        // Assert
        const heading = screen.getByRole("heading", { level: 1 });
        expect(heading).toHaveTextContent(title);

        // Cleanup
        unmount();
      });
    });

    it("powinien obsłużyć ścieżkę /boards/create (która jest matchowana jako board detail)", () => {
      // Arrange
      // Uwaga: /boards/create pasuje do regex /boards/:id, więc renderuje przycisk, nie h1
      mockLocation("/boards/create");
      mockReferrer("");
      mockHistoryBack();

      // Act
      render(<Breadcrumbs />);

      // Assert - powinien wyrenderować przycisk (board detail)
      expect(screen.getByRole("button")).toBeInTheDocument();
    });
  });

  describe("Kombinacje różnych wariantów", () => {
    it("powinien poprawnie przełączać się między różnymi stanami", () => {
      // Arrange & Act - standardowy tytuł
      mockLocation("/boards");
      const { unmount: unmount1 } = render(<Breadcrumbs />);
      expect(screen.getByRole("heading")).toHaveTextContent("Public Boards");
      unmount1();

      // Act - board detail
      mockLocation("/boards/123");
      mockReferrer("http://localhost/boards");
      mockHistoryBack();
      const { unmount: unmount2 } = render(<Breadcrumbs />);
      expect(screen.getByRole("button")).toBeInTheDocument();
      unmount2();

      // Act - add level
      mockLocation("/my-boards/123/add-level");
      const { unmount: unmount3 } = render(<Breadcrumbs />);
      expect(screen.getByRole("link")).toHaveAttribute("href", "/my-boards");
      unmount3();
    });

    it("powinien obsłużyć wszystkie typy referrerów dla board detail", () => {
      const referrers = [
        { ref: "http://localhost/boards", expected: "Public Boards" },
        { ref: "http://localhost/my-boards", expected: "My Boards" },
        { ref: "http://localhost/played", expected: "Played Boards" },
        { ref: "", expected: "Public Boards" },
        { ref: "http://other-domain.com/boards", expected: "Public Boards" },
      ];

      referrers.forEach(({ ref, expected }) => {
        // Arrange
        mockLocation("/boards/123");
        mockReferrer(ref);
        mockHistoryBack();

        // Act
        const { unmount } = render(<Breadcrumbs />);

        // Assert
        expect(screen.getByText(expected)).toBeInTheDocument();

        // Cleanup
        unmount();
      });
    });
  });
});
