import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Sidebar } from "@/components/ui/Sidebar/Sidebar";

/**
 * Testy jednostkowe dla komponentu Sidebar
 *
 * Testowane funkcjonalności:
 * - Podstawowe renderowanie i struktura DOM
 * - Warunkowe stylowanie w zależności od stanu collapsed
 * - Responsywne klasy CSS (mobile vs desktop)
 * - Renderowanie NavItems z odpowiednimi danymi
 * - Przycisk logout i wywołanie mutacji
 * - Integracja z useClickOutside - zamykanie sidebara po kliknięciu poza nim
 * - Integracja z useSidebar hook
 * - Warunkowe renderowanie tekstu w przycisku logout
 * - Atrybuty accessibility
 * - Style transition i animacje
 */

// Mock dla useSidebar hook
vi.mock("@/hooks/useSidebar", () => ({
  useSidebar: vi.fn(),
}));

// Mock dla useClickOutside hook
vi.mock("@/hooks/useClickOutside", () => ({
  useClickOutside: vi.fn(),
}));

// Mock dla useLogoutMutation
vi.mock("@/store/api/apiSlice", () => ({
  useLogoutMutation: vi.fn(),
}));

// Mock dla NavItem
vi.mock("@/components/ui/Sidebar/NavItem", () => ({
  NavItem: ({ item }: { item: { label: string; route: string } }) => (
    <a href={item.route} data-testid="nav-item">
      {item.label}
    </a>
  ),
}));

// Mock dla SidebarToggleButton
vi.mock("@/components/ui/Sidebar/SidebarToggleButton", () => ({
  SidebarToggleButton: () => <button data-testid="sidebar-toggle">Toggle</button>,
}));

// Mock icon components
vi.mock("@/assets/icons", () => ({
  BoardsIcon: ({ className }: { className?: string }) => (
    <svg data-testid="boards-icon" className={className}>
      <path />
    </svg>
  ),
  PlayedIcon: ({ className }: { className?: string }) => (
    <svg data-testid="played-icon" className={className}>
      <path />
    </svg>
  ),
  PlusIcon: ({ className }: { className?: string }) => (
    <svg data-testid="plus-icon" className={className}>
      <path />
    </svg>
  ),
  MyBoardsIcon: ({ className }: { className?: string }) => (
    <svg data-testid="my-boards-icon" className={className}>
      <path />
    </svg>
  ),
  PowerIcon: ({ className }: { className?: string }) => (
    <svg data-testid="power-icon" className={className}>
      <path />
    </svg>
  ),
}));

import { useSidebar } from "@/hooks/useSidebar";
import { useClickOutside } from "@/hooks/useClickOutside";
import { useLogoutMutation } from "@/store/api/apiSlice";

describe("Sidebar", () => {
  const mockLogout = vi.fn();
  const mockToggle = vi.fn();
  const mockSet = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    // Domyślny mock dla useLogoutMutation
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(useLogoutMutation).mockReturnValue([mockLogout, {} as any]);

    // Domyślny mock dla useClickOutside
    vi.mocked(useClickOutside).mockReturnValue(false);
  });

  describe("Podstawowe renderowanie i struktura DOM", () => {
    it("powinien wyrenderować element <aside> z odpowiednimi podstawowymi klasami", () => {
      // Arrange
      vi.mocked(useSidebar).mockReturnValue({
        collapsed: false,
        toggle: mockToggle,
        set: mockSet,
      });

      // Act
      render(<Sidebar />);

      // Assert
      const aside = screen.getByRole("complementary");
      expect(aside).toBeInTheDocument();
      expect(aside.tagName).toBe("ASIDE");
      expect(aside).toHaveClass("fixed");
      expect(aside).toHaveClass("top-0");
      expect(aside).toHaveClass("z-40");
      expect(aside).toHaveClass("h-full");
      expect(aside).toHaveClass("bg-[var(--color-primary)]");
      expect(aside).toHaveClass("text-white");
      expect(aside).toHaveClass("transition-all");
      expect(aside).toHaveClass("duration-200");
    });

    it("powinien wyrenderować element <nav>", () => {
      // Arrange
      vi.mocked(useSidebar).mockReturnValue({
        collapsed: false,
        toggle: mockToggle,
        set: mockSet,
      });

      // Act
      render(<Sidebar />);

      // Assert
      const nav = screen.getByRole("navigation");
      expect(nav).toBeInTheDocument();
      expect(nav).toHaveClass("flex-1");
      expect(nav).toHaveClass("space-y-1");
    });

    it("powinien wyrenderować SidebarToggleButton", () => {
      // Arrange
      vi.mocked(useSidebar).mockReturnValue({
        collapsed: false,
        toggle: mockToggle,
        set: mockSet,
      });

      // Act
      render(<Sidebar />);

      // Assert
      const toggleButton = screen.getByTestId("sidebar-toggle");
      expect(toggleButton).toBeInTheDocument();
    });

    it("powinien wyrenderować przycisk logout z ikoną PowerIcon", () => {
      // Arrange
      vi.mocked(useSidebar).mockReturnValue({
        collapsed: false,
        toggle: mockToggle,
        set: mockSet,
      });

      // Act
      render(<Sidebar />);

      // Assert
      const logoutButton = screen.getByText("Wyloguj").closest("button");
      expect(logoutButton).toBeInTheDocument();
      expect(screen.getByTestId("power-icon")).toBeInTheDocument();
    });

    it("powinien mieć wrapper div z flex flex-col h-full", () => {
      // Arrange
      vi.mocked(useSidebar).mockReturnValue({
        collapsed: false,
        toggle: mockToggle,
        set: mockSet,
      });

      // Act
      const { container } = render(<Sidebar />);

      // Assert
      const wrapperDiv = container.querySelector(".flex.flex-col.h-full");
      expect(wrapperDiv).toBeInTheDocument();
      expect(wrapperDiv).toHaveClass("py-4");
      expect(wrapperDiv).toHaveClass("space-y-1");
    });
  });

  describe("Renderowanie NavItems", () => {
    it("powinien wyrenderować wszystkie 4 elementy nawigacji", () => {
      // Arrange
      vi.mocked(useSidebar).mockReturnValue({
        collapsed: false,
        toggle: mockToggle,
        set: mockSet,
      });

      // Act
      render(<Sidebar />);

      // Assert
      const navItems = screen.getAllByTestId("nav-item");
      expect(navItems).toHaveLength(4);
    });

    it("powinien wyrenderować NavItem z labelką 'Publiczne tablice'", () => {
      // Arrange
      vi.mocked(useSidebar).mockReturnValue({
        collapsed: false,
        toggle: mockToggle,
        set: mockSet,
      });

      // Act
      render(<Sidebar />);

      // Assert
      expect(screen.getByText("Publiczne tablice")).toBeInTheDocument();
    });

    it("powinien wyrenderować NavItem z labelką 'Moje tablice'", () => {
      // Arrange
      vi.mocked(useSidebar).mockReturnValue({
        collapsed: false,
        toggle: mockToggle,
        set: mockSet,
      });

      // Act
      render(<Sidebar />);

      // Assert
      expect(screen.getByText("Moje tablice")).toBeInTheDocument();
    });

    it("powinien wyrenderować NavItem z labelką 'Rozegrane Tablice'", () => {
      // Arrange
      vi.mocked(useSidebar).mockReturnValue({
        collapsed: false,
        toggle: mockToggle,
        set: mockSet,
      });

      // Act
      render(<Sidebar />);

      // Assert
      expect(screen.getByText("Rozegrane Tablice")).toBeInTheDocument();
    });

    it("powinien wyrenderować NavItem z labelką 'Utwórz tablicę'", () => {
      // Arrange
      vi.mocked(useSidebar).mockReturnValue({
        collapsed: false,
        toggle: mockToggle,
        set: mockSet,
      });

      // Act
      render(<Sidebar />);

      // Assert
      expect(screen.getByText("Utwórz tablicę")).toBeInTheDocument();
    });

    it("powinien przekazać poprawne routes do NavItems", () => {
      // Arrange
      vi.mocked(useSidebar).mockReturnValue({
        collapsed: false,
        toggle: mockToggle,
        set: mockSet,
      });

      // Act
      render(<Sidebar />);

      // Assert
      expect(screen.getByText("Publiczne tablice").closest("a")).toHaveAttribute("href", "/boards");
      expect(screen.getByText("Moje tablice").closest("a")).toHaveAttribute("href", "/my-boards");
      expect(screen.getByText("Rozegrane Tablice").closest("a")).toHaveAttribute("href", "/played");
      expect(screen.getByText("Utwórz tablicę").closest("a")).toHaveAttribute("href", "/boards/create");
    });
  });

  describe("Stylowanie warunkowe - stan collapsed = false (expanded)", () => {
    it("powinien mieć left-0 i w-64 gdy sidebar jest rozwinięty", () => {
      // Arrange
      vi.mocked(useSidebar).mockReturnValue({
        collapsed: false,
        toggle: mockToggle,
        set: mockSet,
      });

      // Act
      render(<Sidebar />);

      // Assert
      const aside = screen.getByRole("complementary");
      expect(aside).toHaveClass("left-0");
      expect(aside).toHaveClass("w-64");
    });

    it("powinien NIE mieć left-[-50px] i md:left-0 gdy sidebar jest rozwinięty", () => {
      // Arrange
      vi.mocked(useSidebar).mockReturnValue({
        collapsed: false,
        toggle: mockToggle,
        set: mockSet,
      });

      // Act
      render(<Sidebar />);

      // Assert
      const aside = screen.getByRole("complementary");
      expect(aside).not.toHaveClass("left-[-50px]");
      expect(aside).not.toHaveClass("md:left-0");
    });

    it("powinien renderować tekst 'Wyloguj' w przycisku logout gdy sidebar jest rozwinięty", () => {
      // Arrange
      vi.mocked(useSidebar).mockReturnValue({
        collapsed: false,
        toggle: mockToggle,
        set: mockSet,
      });

      // Act
      render(<Sidebar />);

      // Assert
      expect(screen.getByText("Wyloguj")).toBeInTheDocument();
    });

    it("powinien NIE mieć justify-center na przycisku logout gdy sidebar jest rozwinięty", () => {
      // Arrange
      vi.mocked(useSidebar).mockReturnValue({
        collapsed: false,
        toggle: mockToggle,
        set: mockSet,
      });

      // Act
      render(<Sidebar />);

      // Assert
      const logoutButton = screen.getByText("Wyloguj").closest("button");
      expect(logoutButton).not.toHaveClass("justify-center");
    });
  });

  describe("Stylowanie warunkowe - stan collapsed = true", () => {
    it("powinien mieć left-[-50px] i md:left-0 gdy sidebar jest zwinięty", () => {
      // Arrange
      vi.mocked(useSidebar).mockReturnValue({
        collapsed: true,
        toggle: mockToggle,
        set: mockSet,
      });

      // Act
      render(<Sidebar />);

      // Assert
      const aside = screen.getByRole("complementary");
      expect(aside).toHaveClass("left-[-50px]");
      expect(aside).toHaveClass("md:left-0");
    });

    it("powinien NIE mieć w-64 gdy sidebar jest zwinięty", () => {
      // Arrange
      vi.mocked(useSidebar).mockReturnValue({
        collapsed: true,
        toggle: mockToggle,
        set: mockSet,
      });

      // Act
      render(<Sidebar />);

      // Assert
      const aside = screen.getByRole("complementary");
      expect(aside).not.toHaveClass("w-64");
    });

    it("powinien ukryć tekst 'Wyloguj' w przycisku logout gdy sidebar jest zwinięty", () => {
      // Arrange
      vi.mocked(useSidebar).mockReturnValue({
        collapsed: true,
        toggle: mockToggle,
        set: mockSet,
      });

      // Act
      render(<Sidebar />);

      // Assert
      expect(screen.queryByText("Wyloguj")).not.toBeInTheDocument();
    });

    it("powinien mieć justify-center na przycisku logout gdy sidebar jest zwinięty", () => {
      // Arrange
      vi.mocked(useSidebar).mockReturnValue({
        collapsed: true,
        toggle: mockToggle,
        set: mockSet,
      });

      // Act
      render(<Sidebar />);

      // Assert
      // Znajdź przycisk przez ikonę PowerIcon
      const powerIcon = screen.getByTestId("power-icon");
      const logoutButton = powerIcon.closest("button");
      expect(logoutButton).toHaveClass("justify-center");
    });

    it("powinien nadal renderować ikonę PowerIcon gdy sidebar jest zwinięty", () => {
      // Arrange
      vi.mocked(useSidebar).mockReturnValue({
        collapsed: true,
        toggle: mockToggle,
        set: mockSet,
      });

      // Act
      render(<Sidebar />);

      // Assert
      expect(screen.getByTestId("power-icon")).toBeInTheDocument();
    });
  });

  describe("Funkcjonalność przycisku logout", () => {
    it("powinien wywołać logout(undefined) po kliknięciu w przycisk", () => {
      // Arrange
      vi.mocked(useSidebar).mockReturnValue({
        collapsed: false,
        toggle: mockToggle,
        set: mockSet,
      });

      // Act
      render(<Sidebar />);
      const logoutButton = screen.getByText("Wyloguj").closest("button");
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      fireEvent.click(logoutButton!);

      // Assert
      expect(mockLogout).toHaveBeenCalledTimes(1);
      expect(mockLogout).toHaveBeenCalledWith(undefined);
    });

    it("powinien wywołać logout po kliknięciu w ikonę gdy sidebar jest zwinięty", () => {
      // Arrange
      vi.mocked(useSidebar).mockReturnValue({
        collapsed: true,
        toggle: mockToggle,
        set: mockSet,
      });

      // Act
      render(<Sidebar />);
      const powerIcon = screen.getByTestId("power-icon");
      const logoutButton = powerIcon.closest("button");
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      fireEvent.click(logoutButton!);

      // Assert
      expect(mockLogout).toHaveBeenCalledTimes(1);
      expect(mockLogout).toHaveBeenCalledWith(undefined);
    });

    it("powinien mieć poprawne klasy stylowania na przycisku logout", () => {
      // Arrange
      vi.mocked(useSidebar).mockReturnValue({
        collapsed: false,
        toggle: mockToggle,
        set: mockSet,
      });

      // Act
      render(<Sidebar />);

      // Assert
      const logoutButton = screen.getByText("Wyloguj").closest("button");
      expect(logoutButton).toHaveClass("mt-5");
      expect(logoutButton).toHaveClass("flex");
      expect(logoutButton).toHaveClass("items-center");
      expect(logoutButton).toHaveClass("gap-3");
      expect(logoutButton).toHaveClass("w-full");
      expect(logoutButton).toHaveClass("text-sm");
      expect(logoutButton).toHaveClass("font-bold");
      expect(logoutButton).toHaveClass("px-3");
      expect(logoutButton).toHaveClass("py-2");
      expect(logoutButton).toHaveClass("text-red-500");
      expect(logoutButton).toHaveClass("hover:bg-red-500");
      expect(logoutButton).toHaveClass("hover:text-white");
      expect(logoutButton).toHaveClass("transition-colors");
    });

    it("powinien mieć ikonę PowerIcon z odpowiednimi klasami", () => {
      // Arrange
      vi.mocked(useSidebar).mockReturnValue({
        collapsed: false,
        toggle: mockToggle,
        set: mockSet,
      });

      // Act
      render(<Sidebar />);

      // Assert
      const powerIcon = screen.getByTestId("power-icon");
      expect(powerIcon).toHaveClass("h-5");
      expect(powerIcon).toHaveClass("w-5");
      expect(powerIcon).toHaveClass("cursor-pointer");
    });

    it("powinien mieć cursor-pointer na tekście 'Wyloguj'", () => {
      // Arrange
      vi.mocked(useSidebar).mockReturnValue({
        collapsed: false,
        toggle: mockToggle,
        set: mockSet,
      });

      // Act
      render(<Sidebar />);

      // Assert
      const logoutText = screen.getByText("Wyloguj");
      expect(logoutText).toHaveClass("cursor-pointer");
    });
  });

  describe("Integracja z useClickOutside", () => {
    it("powinien wywołać set(true) gdy kliknięto poza sidebarem i sidebar NIE jest collapsed", () => {
      // Arrange
      vi.mocked(useSidebar).mockReturnValue({
        collapsed: false,
        toggle: mockToggle,
        set: mockSet,
      });

      // Symulujemy, że useClickOutside zwraca true (kliknięto na zewnątrz)
      vi.mocked(useClickOutside).mockReturnValue(true);

      // Act
      render(<Sidebar />);

      // Assert
      // useEffect powinien wywołać set(true)
      expect(mockSet).toHaveBeenCalledWith(true);
    });

    it("powinien NIE wywołać set(true) gdy kliknięto poza sidebarem ale sidebar JEST collapsed", () => {
      // Arrange
      vi.mocked(useSidebar).mockReturnValue({
        collapsed: true,
        toggle: mockToggle,
        set: mockSet,
      });

      // Symulujemy, że useClickOutside zwraca true
      vi.mocked(useClickOutside).mockReturnValue(true);

      // Act
      render(<Sidebar />);

      // Assert
      expect(mockSet).not.toHaveBeenCalled();
    });

    it("powinien NIE wywołać set(true) gdy NIE kliknięto poza sidebarem", () => {
      // Arrange
      vi.mocked(useSidebar).mockReturnValue({
        collapsed: false,
        toggle: mockToggle,
        set: mockSet,
      });

      // Symulujemy, że useClickOutside zwraca false
      vi.mocked(useClickOutside).mockReturnValue(false);

      // Act
      render(<Sidebar />);

      // Assert
      expect(mockSet).not.toHaveBeenCalled();
    });

    it("powinien przekazać ref do useClickOutside", () => {
      // Arrange
      vi.mocked(useSidebar).mockReturnValue({
        collapsed: false,
        toggle: mockToggle,
        set: mockSet,
      });

      // Act
      render(<Sidebar />);

      // Assert
      expect(useClickOutside).toHaveBeenCalled();
      const callArg = vi.mocked(useClickOutside).mock.calls[0][0];
      expect(callArg).toHaveProperty("current");
    });
  });

  describe("Integracja z useSidebar hook", () => {
    it("powinien używać wartości collapsed z hooka useSidebar", () => {
      // Arrange
      vi.mocked(useSidebar).mockReturnValue({
        collapsed: true,
        toggle: mockToggle,
        set: mockSet,
      });

      // Act
      render(<Sidebar />);

      // Assert
      expect(useSidebar).toHaveBeenCalled();
      const aside = screen.getByRole("complementary");
      expect(aside).toHaveClass("left-[-50px]");
    });

    it("powinien reagować na zmianę collapsed state", () => {
      // Arrange - zaczynamy z collapsed=false
      vi.mocked(useSidebar).mockReturnValue({
        collapsed: false,
        toggle: mockToggle,
        set: mockSet,
      });

      // Act - renderujemy z collapsed=false
      const { rerender } = render(<Sidebar />);

      // Assert - sidebar rozwinięty
      let aside = screen.getByRole("complementary");
      expect(aside).toHaveClass("left-0");
      expect(aside).toHaveClass("w-64");
      expect(screen.getByText("Wyloguj")).toBeInTheDocument();

      // Arrange - zmieniamy na collapsed=true
      vi.mocked(useSidebar).mockReturnValue({
        collapsed: true,
        toggle: mockToggle,
        set: mockSet,
      });

      // Act - rerenderujemy
      rerender(<Sidebar />);

      // Assert - sidebar zwinięty
      aside = screen.getByRole("complementary");
      expect(aside).toHaveClass("left-[-50px]");
      expect(aside).not.toHaveClass("w-64");
      expect(screen.queryByText("Wyloguj")).not.toBeInTheDocument();
    });
  });

  describe("Integracja z useLogoutMutation", () => {
    it("powinien pobrać funkcję logout z useLogoutMutation", () => {
      // Arrange
      vi.mocked(useSidebar).mockReturnValue({
        collapsed: false,
        toggle: mockToggle,
        set: mockSet,
      });

      // Act
      render(<Sidebar />);

      // Assert
      expect(useLogoutMutation).toHaveBeenCalled();
    });

    it("powinien wywołać logout zwrócony przez useLogoutMutation", () => {
      // Arrange
      const customLogout = vi.fn();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      vi.mocked(useLogoutMutation).mockReturnValue([customLogout, {} as any]);
      vi.mocked(useSidebar).mockReturnValue({
        collapsed: false,
        toggle: mockToggle,
        set: mockSet,
      });

      // Act
      render(<Sidebar />);
      const logoutButton = screen.getByText("Wyloguj").closest("button");
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      fireEvent.click(logoutButton!);

      // Assert
      expect(customLogout).toHaveBeenCalledWith(undefined);
    });
  });

  describe("Responsywność i breakpointy", () => {
    it("powinien mieć md:left-0 dla collapsed sidebara (widoczny na desktop)", () => {
      // Arrange
      vi.mocked(useSidebar).mockReturnValue({
        collapsed: true,
        toggle: mockToggle,
        set: mockSet,
      });

      // Act
      render(<Sidebar />);

      // Assert
      const aside = screen.getByRole("complementary");
      expect(aside).toHaveClass("md:left-0");
    });

    it("powinien mieć left-[-50px] dla collapsed sidebara (ukryty na mobile)", () => {
      // Arrange
      vi.mocked(useSidebar).mockReturnValue({
        collapsed: true,
        toggle: mockToggle,
        set: mockSet,
      });

      // Act
      render(<Sidebar />);

      // Assert
      const aside = screen.getByRole("complementary");
      expect(aside).toHaveClass("left-[-50px]");
    });
  });

  describe("Style wizualne i animacje", () => {
    it("powinien mieć transition-all duration-200 dla płynnych animacji", () => {
      // Arrange
      vi.mocked(useSidebar).mockReturnValue({
        collapsed: false,
        toggle: mockToggle,
        set: mockSet,
      });

      // Act
      render(<Sidebar />);

      // Assert
      const aside = screen.getByRole("complementary");
      expect(aside).toHaveClass("transition-all");
      expect(aside).toHaveClass("duration-200");
    });

    it("powinien mieć bg-[var(--color-primary)] dla dynamicznego koloru", () => {
      // Arrange
      vi.mocked(useSidebar).mockReturnValue({
        collapsed: false,
        toggle: mockToggle,
        set: mockSet,
      });

      // Act
      render(<Sidebar />);

      // Assert
      const aside = screen.getByRole("complementary");
      expect(aside).toHaveClass("bg-[var(--color-primary)]");
    });

    it("powinien mieć fixed positioning z wysokim z-index", () => {
      // Arrange
      vi.mocked(useSidebar).mockReturnValue({
        collapsed: false,
        toggle: mockToggle,
        set: mockSet,
      });

      // Act
      render(<Sidebar />);

      // Assert
      const aside = screen.getByRole("complementary");
      expect(aside).toHaveClass("fixed");
      expect(aside).toHaveClass("z-40");
      expect(aside).toHaveClass("top-0");
      expect(aside).toHaveClass("h-full");
    });

    it("powinien mieć text-white dla białego tekstu", () => {
      // Arrange
      vi.mocked(useSidebar).mockReturnValue({
        collapsed: false,
        toggle: mockToggle,
        set: mockSet,
      });

      // Act
      render(<Sidebar />);

      // Assert
      const aside = screen.getByRole("complementary");
      expect(aside).toHaveClass("text-white");
    });
  });

  describe("Accessibility", () => {
    it("powinien mieć role='complementary' na elemencie aside", () => {
      // Arrange
      vi.mocked(useSidebar).mockReturnValue({
        collapsed: false,
        toggle: mockToggle,
        set: mockSet,
      });

      // Act
      render(<Sidebar />);

      // Assert
      const aside = screen.getByRole("complementary");
      expect(aside).toBeInTheDocument();
    });

    it("powinien mieć role='navigation' na elemencie nav", () => {
      // Arrange
      vi.mocked(useSidebar).mockReturnValue({
        collapsed: false,
        toggle: mockToggle,
        set: mockSet,
      });

      // Act
      render(<Sidebar />);

      // Assert
      const nav = screen.getByRole("navigation");
      expect(nav).toBeInTheDocument();
    });

    it("powinien mieć dostępny przycisk logout dla screen readers", () => {
      // Arrange
      vi.mocked(useSidebar).mockReturnValue({
        collapsed: false,
        toggle: mockToggle,
        set: mockSet,
      });

      // Act
      render(<Sidebar />);

      // Assert
      const logoutButton = screen.getByRole("button", { name: /wyloguj/i });
      expect(logoutButton).toBeInTheDocument();
    });
  });

  describe("Edge cases i kombinacje stanów", () => {
    it("powinien poprawnie renderować sidebar po wielokrotnej zmianie stanu", () => {
      // Arrange
      vi.mocked(useSidebar).mockReturnValue({
        collapsed: false,
        toggle: mockToggle,
        set: mockSet,
      });

      // Act - renderujemy
      const { rerender } = render(<Sidebar />);

      // Assert - expanded
      expect(screen.getByRole("complementary")).toHaveClass("w-64");

      // Act - zwijamy
      vi.mocked(useSidebar).mockReturnValue({
        collapsed: true,
        toggle: mockToggle,
        set: mockSet,
      });
      rerender(<Sidebar />);

      // Assert - collapsed
      expect(screen.getByRole("complementary")).not.toHaveClass("w-64");

      // Act - rozwijamy ponownie
      vi.mocked(useSidebar).mockReturnValue({
        collapsed: false,
        toggle: mockToggle,
        set: mockSet,
      });
      rerender(<Sidebar />);

      // Assert - expanded ponownie
      expect(screen.getByRole("complementary")).toHaveClass("w-64");
    });

    it("powinien zachować wszystkie NavItems niezależnie od stanu collapsed", () => {
      // Arrange & Act - expanded
      vi.mocked(useSidebar).mockReturnValue({
        collapsed: false,
        toggle: mockToggle,
        set: mockSet,
      });
      const { rerender } = render(<Sidebar />);
      expect(screen.getAllByTestId("nav-item")).toHaveLength(4);

      // Act - collapsed
      vi.mocked(useSidebar).mockReturnValue({
        collapsed: true,
        toggle: mockToggle,
        set: mockSet,
      });
      rerender(<Sidebar />);

      // Assert - nadal 4 elementy
      expect(screen.getAllByTestId("nav-item")).toHaveLength(4);
    });

    it("powinien poprawnie obsłużyć sytuację gdy useClickOutside zmienia się dynamicznie", () => {
      // Arrange - clickedOutside = false, collapsed = false
      vi.mocked(useSidebar).mockReturnValue({
        collapsed: false,
        toggle: mockToggle,
        set: mockSet,
      });
      vi.mocked(useClickOutside).mockReturnValue(false);

      // Act
      const { rerender } = render(<Sidebar />);

      // Assert
      expect(mockSet).not.toHaveBeenCalled();

      // Arrange - symulujemy kliknięcie poza sidebarem
      vi.mocked(useClickOutside).mockReturnValue(true);

      // Act
      rerender(<Sidebar />);

      // Assert
      expect(mockSet).toHaveBeenCalledWith(true);
    });
  });

  describe("Layout i flexbox", () => {
    it("powinien mieć wrapper z flexbox column layout", () => {
      // Arrange
      vi.mocked(useSidebar).mockReturnValue({
        collapsed: false,
        toggle: mockToggle,
        set: mockSet,
      });

      // Act
      const { container } = render(<Sidebar />);

      // Assert
      const wrapper = container.querySelector(".flex.flex-col");
      expect(wrapper).toHaveClass("h-full");
      expect(wrapper).toHaveClass("py-4");
      expect(wrapper).toHaveClass("space-y-1");
    });

    it("powinien mieć nav z flex-1 dla zajęcia dostępnej przestrzeni", () => {
      // Arrange
      vi.mocked(useSidebar).mockReturnValue({
        collapsed: false,
        toggle: mockToggle,
        set: mockSet,
      });

      // Act
      render(<Sidebar />);

      // Assert
      const nav = screen.getByRole("navigation");
      expect(nav).toHaveClass("flex-1");
    });

    it("powinien mieć space-y-1 na nav dla odstępów między NavItems", () => {
      // Arrange
      vi.mocked(useSidebar).mockReturnValue({
        collapsed: false,
        toggle: mockToggle,
        set: mockSet,
      });

      // Act
      render(<Sidebar />);

      // Assert
      const nav = screen.getByRole("navigation");
      expect(nav).toHaveClass("space-y-1");
    });
  });
});
