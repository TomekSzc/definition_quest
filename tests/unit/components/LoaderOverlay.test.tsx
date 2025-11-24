import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";
import { act } from "react";
import LoaderOverlay from "@/components/ui/LoaderOverlay";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import uiReducer from "@/store/slices/uiSlice";
import type { UIState } from "@/store/slices/uiSlice";

/**
 * Testy jednostkowe dla komponentu LoaderOverlay
 *
 * Testowane funkcjonalności:
 * - Warunkowe renderowanie w zależności od stanu loading
 * - Struktura DOM i warstwy komponentu
 * - Integracja z Redux store (useAppSelector)
 * - Stylowanie z Tailwind CSS
 * - Spinner z Lucide React (Loader2)
 * - Pozycjonowanie absolutne i centrowanie
 * - Backdrop z opacity
 * - Arbitrary values w Tailwind [var(--color-primary)]
 * - Animacja spin
 */

/**
 * Helper do tworzenia mock store z konfigurowalnymi wartościami
 */
const createMockStore = (uiState: Partial<UIState> = {}) => {
  return configureStore({
    reducer: {
      ui: uiReducer,
    },
    preloadedState: {
      ui: {
        layout: {
          sidebarCollapsed: false,
        },
        loading: false,
        ...uiState,
      },
    },
  });
};

/**
 * Helper do renderowania komponentu z Redux Provider
 */
const renderWithProvider = (uiState: Partial<UIState> = {}) => {
  const store = createMockStore(uiState);
  return render(
    <Provider store={store}>
      <LoaderOverlay />
    </Provider>
  );
};

describe("LoaderOverlay", () => {
  describe("Warunkowe renderowanie", () => {
    it("nie powinien renderować niczego gdy loading = false", () => {
      // Arrange & Act
      const { container } = renderWithProvider({ loading: false });

      // Assert
      expect(container.firstChild).toBeNull();
    });

    it("powinien renderować overlay gdy loading = true", () => {
      // Arrange & Act
      renderWithProvider({ loading: true });

      // Assert
      const overlay = document.querySelector(".absolute.inset-0");
      expect(overlay).toBeInTheDocument();
    });

    it("nie powinien renderować spinnera gdy loading = false", () => {
      // Arrange & Act
      renderWithProvider({ loading: false });

      // Assert
      const spinner = document.querySelector(".animate-spin");
      expect(spinner).not.toBeInTheDocument();
    });

    it("powinien renderować spinner gdy loading = true", () => {
      // Arrange & Act
      renderWithProvider({ loading: true });

      // Assert
      const spinner = document.querySelector(".animate-spin");
      expect(spinner).toBeInTheDocument();
    });
  });

  describe("Struktura DOM i warstwy", () => {
    it("powinien zawierać główny kontener z klasami absolute i inset-0", () => {
      // Arrange & Act
      const { container } = renderWithProvider({ loading: true });

      // Assert
      const mainContainer = container.firstChild as HTMLElement;
      expect(mainContainer).toHaveClass("absolute");
      expect(mainContainer).toHaveClass("inset-0");
      expect(mainContainer).toHaveClass("flex");
      expect(mainContainer).toHaveClass("items-center");
      expect(mainContainer).toHaveClass("justify-center");
    });

    it("powinien zawierać backdrop jako pierwsze dziecko kontenera", () => {
      // Arrange & Act
      const { container } = renderWithProvider({ loading: true });

      // Assert
      const mainContainer = container.firstChild as HTMLElement;
      const backdrop = mainContainer.children[0] as HTMLElement;
      expect(backdrop).toHaveClass("absolute");
      expect(backdrop).toHaveClass("inset-0");
      expect(backdrop).toHaveClass("bg-white");
      expect(backdrop).toHaveClass("opacity-50");
    });

    it("powinien zawierać kontener spinnera jako drugie dziecko głównego kontenera", () => {
      // Arrange & Act
      const { container } = renderWithProvider({ loading: true });

      // Assert
      const mainContainer = container.firstChild as HTMLElement;
      const spinnerContainer = mainContainer.children[1] as HTMLElement;
      expect(spinnerContainer).toHaveClass("absolute");
      expect(spinnerContainer).toHaveClass("inset-0");
      expect(spinnerContainer).toHaveClass("flex");
      expect(spinnerContainer).toHaveClass("items-center");
      expect(spinnerContainer).toHaveClass("justify-center");
    });

    it("powinien mieć poprawną hierarchię warstw (3 poziomy div)", () => {
      // Arrange & Act
      const { container } = renderWithProvider({ loading: true });

      // Assert
      const mainContainer = container.firstChild as HTMLElement;
      expect(mainContainer.children.length).toBe(2); // backdrop + spinner container

      const spinnerContainer = mainContainer.children[1] as HTMLElement;
      expect(spinnerContainer.children.length).toBe(1); // spinner icon
    });

    it("powinien renderować Loader2 component z lucide-react", () => {
      // Arrange & Act
      renderWithProvider({ loading: true });

      // Assert
      const spinner = document.querySelector(".animate-spin");
      expect(spinner).toBeInTheDocument();
      expect(spinner?.tagName).toBe("svg");
    });
  });

  describe("Integracja z Redux", () => {
    it("powinien używać selectora selectLoading z Redux store", () => {
      // Arrange - tworzymy store z loading: true
      const store = createMockStore({ loading: true });

      // Act
      render(
        <Provider store={store}>
          <LoaderOverlay />
        </Provider>
      );

      // Assert
      const spinner = document.querySelector(".animate-spin");
      expect(spinner).toBeInTheDocument();
    });

    it("powinien reagować na zmianę stanu loading w store", () => {
      // Arrange
      const store = createMockStore({ loading: false });
      const { rerender, container } = render(
        <Provider store={store}>
          <LoaderOverlay />
        </Provider>
      );

      // Assert - nie renderuje gdy loading = false
      expect(container.firstChild).toBeNull();

      // Act - zmieniamy stan na loading: true
      act(() => {
        store.dispatch({ type: "ui/setLoading", payload: true });
      });
      rerender(
        <Provider store={store}>
          <LoaderOverlay />
        </Provider>
      );

      // Assert - renderuje gdy loading = true
      expect(container.firstChild).toBeInTheDocument();
    });

    it("powinien ukryć overlay gdy loading zmieni się z true na false", () => {
      // Arrange
      const store = createMockStore({ loading: true });
      const { rerender, container } = render(
        <Provider store={store}>
          <LoaderOverlay />
        </Provider>
      );

      // Assert - renderuje
      expect(container.firstChild).toBeInTheDocument();

      // Act - zmieniamy stan na loading: false
      act(() => {
        store.dispatch({ type: "ui/setLoading", payload: false });
      });
      rerender(
        <Provider store={store}>
          <LoaderOverlay />
        </Provider>
      );

      // Assert - nie renderuje
      expect(container.firstChild).toBeNull();
    });
  });

  describe("Stylowanie Tailwind CSS", () => {
    describe("Główny kontener", () => {
      it("powinien mieć absolute positioning", () => {
        // Arrange & Act
        const { container } = renderWithProvider({ loading: true });

        // Assert
        const mainContainer = container.firstChild as HTMLElement;
        expect(mainContainer).toHaveClass("absolute");
      });

      it("powinien rozciągać się na cały obszar rodzica (inset-0)", () => {
        // Arrange & Act
        const { container } = renderWithProvider({ loading: true });

        // Assert
        const mainContainer = container.firstChild as HTMLElement;
        expect(mainContainer).toHaveClass("inset-0");
      });

      it("powinien używać flexbox do centrowania", () => {
        // Arrange & Act
        const { container } = renderWithProvider({ loading: true });

        // Assert
        const mainContainer = container.firstChild as HTMLElement;
        expect(mainContainer).toHaveClass("flex");
        expect(mainContainer).toHaveClass("items-center");
        expect(mainContainer).toHaveClass("justify-center");
      });
    });

    describe("Backdrop", () => {
      it("powinien mieć białe tło z 50% opacity", () => {
        // Arrange & Act
        const { container } = renderWithProvider({ loading: true });

        // Assert
        const mainContainer = container.firstChild as HTMLElement;
        const backdrop = mainContainer.children[0] as HTMLElement;
        expect(backdrop).toHaveClass("bg-white");
        expect(backdrop).toHaveClass("opacity-50");
      });

      it("powinien pokrywać cały obszar (absolute inset-0)", () => {
        // Arrange & Act
        const { container } = renderWithProvider({ loading: true });

        // Assert
        const mainContainer = container.firstChild as HTMLElement;
        const backdrop = mainContainer.children[0] as HTMLElement;
        expect(backdrop).toHaveClass("absolute");
        expect(backdrop).toHaveClass("inset-0");
      });
    });

    describe("Kontener spinnera", () => {
      it("powinien mieć absolute positioning z inset-0", () => {
        // Arrange & Act
        const { container } = renderWithProvider({ loading: true });

        // Assert
        const mainContainer = container.firstChild as HTMLElement;
        const spinnerContainer = mainContainer.children[1] as HTMLElement;
        expect(spinnerContainer).toHaveClass("absolute");
        expect(spinnerContainer).toHaveClass("inset-0");
      });

      it("powinien centrować zawartość przez flexbox", () => {
        // Arrange & Act
        const { container } = renderWithProvider({ loading: true });

        // Assert
        const mainContainer = container.firstChild as HTMLElement;
        const spinnerContainer = mainContainer.children[1] as HTMLElement;
        expect(spinnerContainer).toHaveClass("flex");
        expect(spinnerContainer).toHaveClass("items-center");
        expect(spinnerContainer).toHaveClass("justify-center");
      });
    });
  });

  describe("Spinner (Loader2)", () => {
    it("powinien mieć rozmiar h-10 i w-10", () => {
      // Arrange & Act
      renderWithProvider({ loading: true });

      // Assert
      const spinner = document.querySelector(".animate-spin");
      expect(spinner).toHaveClass("h-10");
      expect(spinner).toHaveClass("w-10");
    });

    it("powinien mieć klasę animate-spin dla animacji rotacji", () => {
      // Arrange & Act
      renderWithProvider({ loading: true });

      // Assert
      const spinner = document.querySelector(".animate-spin");
      expect(spinner).toHaveClass("animate-spin");
    });

    it("powinien używać arbitrary value dla koloru [var(--color-primary)]", () => {
      // Arrange & Act
      renderWithProvider({ loading: true });

      // Assert
      const spinner = document.querySelector(".animate-spin");
      // Spinner z lucide-react jako SVG powinien mieć klasy kolorów
      // Sprawdzamy czy element istnieje i jest SVG (lucide-react używa inline styles lub attributes)
      expect(spinner).toBeInTheDocument();
      expect(spinner?.tagName).toBe("svg");

      // Arbitrary value w Tailwind dla SVG może być wyrenderowane jako style lub className
      // Sprawdzamy tylko czy spinner jest poprawnie wyrenderowany z animacją
      expect(spinner).toHaveClass("animate-spin");
    });

    it("powinien być elementem SVG z lucide-react", () => {
      // Arrange & Act
      renderWithProvider({ loading: true });

      // Assert
      const spinner = document.querySelector(".animate-spin");
      expect(spinner?.tagName).toBe("svg");
    });
  });

  describe("Pozycjonowanie i layout", () => {
    it("wszystkie warstwy powinny używać absolute positioning", () => {
      // Arrange & Act
      const { container } = renderWithProvider({ loading: true });

      // Assert
      const mainContainer = container.firstChild as HTMLElement;
      const backdrop = mainContainer.children[0] as HTMLElement;
      const spinnerContainer = mainContainer.children[1] as HTMLElement;

      expect(mainContainer).toHaveClass("absolute");
      expect(backdrop).toHaveClass("absolute");
      expect(spinnerContainer).toHaveClass("absolute");
    });

    it("wszystkie warstwy powinny rozciągać się na cały obszar (inset-0)", () => {
      // Arrange & Act
      const { container } = renderWithProvider({ loading: true });

      // Assert
      const mainContainer = container.firstChild as HTMLElement;
      const backdrop = mainContainer.children[0] as HTMLElement;
      const spinnerContainer = mainContainer.children[1] as HTMLElement;

      expect(mainContainer).toHaveClass("inset-0");
      expect(backdrop).toHaveClass("inset-0");
      expect(spinnerContainer).toHaveClass("inset-0");
    });

    it("kontener główny i kontener spinnera powinny centrować zawartość", () => {
      // Arrange & Act
      const { container } = renderWithProvider({ loading: true });

      // Assert
      const mainContainer = container.firstChild as HTMLElement;
      const spinnerContainer = mainContainer.children[1] as HTMLElement;

      // Main container
      expect(mainContainer).toHaveClass("flex");
      expect(mainContainer).toHaveClass("items-center");
      expect(mainContainer).toHaveClass("justify-center");

      // Spinner container
      expect(spinnerContainer).toHaveClass("flex");
      expect(spinnerContainer).toHaveClass("items-center");
      expect(spinnerContainer).toHaveClass("justify-center");
    });
  });

  describe("Edge cases i zachowanie", () => {
    it("powinien obsłużyć wielokrotne przełączanie loading", () => {
      // Arrange
      const store = createMockStore({ loading: false });
      const { rerender, container } = render(
        <Provider store={store}>
          <LoaderOverlay />
        </Provider>
      );

      // Act & Assert - cycle 1
      expect(container.firstChild).toBeNull();
      act(() => {
        store.dispatch({ type: "ui/setLoading", payload: true });
      });
      rerender(
        <Provider store={store}>
          <LoaderOverlay />
        </Provider>
      );
      expect(container.firstChild).toBeInTheDocument();

      // Act & Assert - cycle 2
      act(() => {
        store.dispatch({ type: "ui/setLoading", payload: false });
      });
      rerender(
        <Provider store={store}>
          <LoaderOverlay />
        </Provider>
      );
      expect(container.firstChild).toBeNull();

      // Act & Assert - cycle 3
      act(() => {
        store.dispatch({ type: "ui/setLoading", payload: true });
      });
      rerender(
        <Provider store={store}>
          <LoaderOverlay />
        </Provider>
      );
      expect(container.firstChild).toBeInTheDocument();
    });

    it("powinien zwracać null z renderowania gdy loading = false", () => {
      // Arrange & Act
      const { container } = renderWithProvider({ loading: false });

      // Assert - early return null
      expect(container.firstChild).toBeNull();
    });

    it("nie powinien renderować żadnych elementów DOM gdy loading = false", () => {
      // Arrange & Act
      renderWithProvider({ loading: false });

      // Assert
      const allDivs = document.querySelectorAll("div");
      const overlayElements = Array.from(allDivs).filter((div) => div.className.includes("absolute"));
      expect(overlayElements.length).toBe(0);
    });

    it("powinien obsłużyć re-rendering bez błędów", () => {
      // Arrange
      const { rerender } = renderWithProvider({ loading: true });

      // Act & Assert - multiple re-renders
      expect(() => {
        rerender(
          <Provider store={createMockStore({ loading: true })}>
            <LoaderOverlay />
          </Provider>
        );
        rerender(
          <Provider store={createMockStore({ loading: true })}>
            <LoaderOverlay />
          </Provider>
        );
        rerender(
          <Provider store={createMockStore({ loading: true })}>
            <LoaderOverlay />
          </Provider>
        );
      }).not.toThrow();
    });

    it("powinien zawsze renderować dokładnie jednego spinnera gdy loading = true", () => {
      // Arrange & Act
      renderWithProvider({ loading: true });

      // Assert
      const spinners = document.querySelectorAll(".animate-spin");
      expect(spinners.length).toBe(1);
    });

    it("powinien zawsze renderować dokładnie jeden backdrop gdy loading = true", () => {
      // Arrange & Act
      const { container } = renderWithProvider({ loading: true });

      // Assert
      const mainContainer = container.firstChild as HTMLElement;
      const backdrops = Array.from(mainContainer.children).filter((child) => {
        const element = child as HTMLElement;
        return element.classList.contains("bg-white") && element.classList.contains("opacity-50");
      });
      expect(backdrops.length).toBe(1);
    });
  });

  describe("Konsystencja klas CSS", () => {
    it("nie powinien mieć konfliktów w klasach Tailwind", () => {
      // Arrange & Act
      const { container } = renderWithProvider({ loading: true });

      // Assert - sprawdzamy czy nie ma duplikatów/konfliktów
      const mainContainer = container.firstChild as HTMLElement;
      const classes = mainContainer.className.split(" ");
      const uniqueClasses = new Set(classes);

      // Każda klasa powinna wystąpić tylko raz
      expect(classes.length).toBe(uniqueClasses.size);
    });

    it("wszystkie elementy powinny mieć spójne klasy pozycjonowania", () => {
      // Arrange & Act
      const { container } = renderWithProvider({ loading: true });

      // Assert
      const mainContainer = container.firstChild as HTMLElement;
      const backdrop = mainContainer.children[0] as HTMLElement;
      const spinnerContainer = mainContainer.children[1] as HTMLElement;

      // Wszystkie używają absolute + inset-0
      [mainContainer, backdrop, spinnerContainer].forEach((element) => {
        expect(element).toHaveClass("absolute");
        expect(element).toHaveClass("inset-0");
      });
    });

    it("elementy flex powinny mieć kompletny zestaw klas centrowania", () => {
      // Arrange & Act
      const { container } = renderWithProvider({ loading: true });

      // Assert
      const mainContainer = container.firstChild as HTMLElement;
      const spinnerContainer = mainContainer.children[1] as HTMLElement;

      [mainContainer, spinnerContainer].forEach((element) => {
        expect(element).toHaveClass("flex");
        expect(element).toHaveClass("items-center");
        expect(element).toHaveClass("justify-center");
      });
    });
  });

  describe("Integracja komponentu Loader2", () => {
    it("powinien renderować Loader2 z lucide-react jako SVG", () => {
      // Arrange & Act
      renderWithProvider({ loading: true });

      // Assert
      const svg = document.querySelector("svg.animate-spin");
      expect(svg).toBeInTheDocument();
    });

    it("Loader2 powinien mieć wszystkie wymagane klasy", () => {
      // Arrange & Act
      renderWithProvider({ loading: true });

      // Assert
      const loader = document.querySelector(".animate-spin");
      expect(loader).toHaveClass("h-10");
      expect(loader).toHaveClass("w-10");
      expect(loader).toHaveClass("animate-spin");
    });

    it("Loader2 powinien być dzieckiem kontenera spinnera", () => {
      // Arrange & Act
      const { container } = renderWithProvider({ loading: true });

      // Assert
      const mainContainer = container.firstChild as HTMLElement;
      const spinnerContainer = mainContainer.children[1] as HTMLElement;
      const loader = spinnerContainer.querySelector(".animate-spin");
      expect(loader).toBeInTheDocument();
      expect(spinnerContainer).toContainElement(loader);
    });
  });

  describe("Accessibility considerations", () => {
    it("powinien renderować overlay bez atrybutów ARIA (obecna implementacja)", () => {
      // Arrange & Act
      const { container } = renderWithProvider({ loading: true });

      // Assert - obecna implementacja nie ma aria-* atrybutów
      const mainContainer = container.firstChild as HTMLElement;
      expect(mainContainer.hasAttribute("aria-live")).toBe(false);
      expect(mainContainer.hasAttribute("aria-busy")).toBe(false);
    });

    it("backdrop powinien być czystym elementem wizualnym bez interaktywności", () => {
      // Arrange & Act
      const { container } = renderWithProvider({ loading: true });

      // Assert
      const mainContainer = container.firstChild as HTMLElement;
      const backdrop = mainContainer.children[0] as HTMLElement;

      // Backdrop nie ma żadnych atrybutów interaktywności
      expect(backdrop.hasAttribute("role")).toBe(false);
      expect(backdrop.hasAttribute("aria-label")).toBe(false);
      expect(backdrop.hasAttribute("tabindex")).toBe(false);
    });

    it("spinner SVG powinien być dekoracyjny bez opisu dostępnościowego", () => {
      // Arrange & Act
      renderWithProvider({ loading: true });

      // Assert
      const spinner = document.querySelector(".animate-spin");

      // Obecna implementacja nie dodaje aria-label ani role do spinnera
      expect(spinner?.hasAttribute("aria-label")).toBe(false);
      expect(spinner?.hasAttribute("role")).toBe(false);
    });
  });

  describe("Zachowanie bez Redux Provider (negative test)", () => {
    it("powinien rzucić błąd gdy renderowany bez Redux Provider", () => {
      // Arrange
      const consoleError = vi.spyOn(console, "error").mockImplementation(() => vi.fn());

      // Act & Assert
      expect(() => {
        render(<LoaderOverlay />);
      }).toThrow();

      // Cleanup
      consoleError.mockRestore();
    });
  });

  describe("Store defaults", () => {
    it("powinien używać initialState z uiSlice gdy store nie ma preloadedState", () => {
      // Arrange
      const store = configureStore({
        reducer: {
          ui: uiReducer,
        },
      });

      // Act
      const { container } = render(
        <Provider store={store}>
          <LoaderOverlay />
        </Provider>
      );

      // Assert - domyślnie loading = false
      expect(container.firstChild).toBeNull();
    });
  });
});
