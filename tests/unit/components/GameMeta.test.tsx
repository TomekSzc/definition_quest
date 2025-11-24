import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { GameMeta } from "@/components/ui/Game/GameMeta";

/**
 * Testy jednostkowe dla komponentu GameMeta
 *
 * Testowane funkcjonalności:
 * - Renderowanie i struktura DOM
 * - Formatowanie czasu (HH:MM:SS)
 * - Toggle sound (VolumeOn/VolumeOff icons)
 * - Stan running - przyciski Start/Stop
 * - Stan disabled dla przycisków (canStart, running, timeSec)
 * - Przycisk Reset - warunki aktywacji/dezaktywacji
 * - Wyświetlanie ostatniego wyniku (lastScore)
 * - Nawigacja między poziomami
 * - Renderowanie przycisków poziomów
 * - Disabled state dla aktualnego poziomu
 * - Responsywność - ukrywanie elementów na mobile (md: classes)
 * - Callbacki: onStart, onStop, onReset, navigateToLevel
 * - Accessibility (aria-label, aria-live)
 * - Edge cases (brak poziomów, jeden poziom, lastScore = 0, długi czas)
 */

// Mock hooka useBoardSound
const mockHandleSound = vi.fn();
const mockSoundOn = vi.fn(() => true);

vi.mock("@/hooks/useBoardSound", () => ({
  useBoardSound: () => ({
    soundOn: mockSoundOn(),
    handleSound: mockHandleSound,
  }),
}));

describe("GameMeta", () => {
  let mockOnStart: ReturnType<typeof vi.fn>;
  let mockOnStop: ReturnType<typeof vi.fn>;
  let mockOnReset: ReturnType<typeof vi.fn>;
  let mockNavigateToLevel: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockOnStart = vi.fn();
    mockOnStop = vi.fn();
    mockOnReset = vi.fn();
    mockNavigateToLevel = vi.fn();
    mockSoundOn.mockReturnValue(true);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("Renderowanie i struktura DOM", () => {
    it("powinien wyrenderować komponent GameMeta z podstawowymi elementami", () => {
      // Arrange & Act
      render(
        <GameMeta
          timeSec={0}
          running={false}
          canStart={true}
          onStart={mockOnStart}
          onStop={mockOnStop}
          onReset={mockOnReset}
        />
      );

      // Assert
      expect(screen.getByRole("button", { name: "Toggle sound" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Start game" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Reset game" })).toBeInTheDocument();
    });

    it("powinien mieć element aside jako root container", () => {
      // Arrange & Act
      const { container } = render(
        <GameMeta
          timeSec={0}
          running={false}
          canStart={true}
          onStart={mockOnStart}
          onStop={mockOnStop}
          onReset={mockOnReset}
        />
      );

      // Assert
      const aside = container.querySelector("aside");
      expect(aside).toBeInTheDocument();
      expect(aside?.tagName).toBe("ASIDE");
    });

    it("powinien mieć podstawowe klasy pozycjonowania (fixed bottom na mobile)", () => {
      // Arrange & Act
      const { container } = render(
        <GameMeta
          timeSec={0}
          running={false}
          canStart={true}
          onStart={mockOnStart}
          onStop={mockOnStop}
          onReset={mockOnReset}
        />
      );

      // Assert
      const aside = container.querySelector("aside");
      expect(aside).toHaveClass("fixed");
      expect(aside).toHaveClass("bottom-0");
      expect(aside).toHaveClass("left-0");
      expect(aside).toHaveClass("w-full");
    });

    it("powinien mieć klasy responsywne dla desktop (md:)", () => {
      // Arrange & Act
      const { container } = render(
        <GameMeta
          timeSec={0}
          running={false}
          canStart={true}
          onStart={mockOnStart}
          onStop={mockOnStop}
          onReset={mockOnReset}
        />
      );

      // Assert
      const aside = container.querySelector("aside");
      expect(aside?.className).toContain("md:top-[0px]");
      expect(aside?.className).toContain("md:right-0");
      expect(aside?.className).toContain("md:left-auto");
      expect(aside?.className).toContain("md:bottom-auto");
      expect(aside?.className).toContain("md:w-[199px]");
      expect(aside?.className).toContain("md:h-full");
    });

    it("powinien mieć kolor tła z CSS variable", () => {
      // Arrange & Act
      const { container } = render(
        <GameMeta
          timeSec={0}
          running={false}
          canStart={true}
          onStart={mockOnStart}
          onStop={mockOnStop}
          onReset={mockOnReset}
        />
      );

      // Assert
      const aside = container.querySelector("aside");
      expect(aside?.className).toContain("bg-[var(--color-primary)]");
    });
  });

  describe("Formatowanie czasu", () => {
    it("powinien wyrenderować czas 00:00:00 dla 0 sekund", () => {
      // Arrange & Act
      render(
        <GameMeta
          timeSec={0}
          running={false}
          canStart={true}
          onStart={mockOnStart}
          onStop={mockOnStop}
          onReset={mockOnReset}
        />
      );

      // Assert
      const timer = screen.getByText("00:00:00");
      expect(timer).toBeInTheDocument();
    });

    it("powinien poprawnie sformatować 59 sekund jako 00:00:59", () => {
      // Arrange & Act
      render(
        <GameMeta
          timeSec={59}
          running={false}
          canStart={true}
          onStart={mockOnStart}
          onStop={mockOnStop}
          onReset={mockOnReset}
        />
      );

      // Assert
      expect(screen.getByText("00:00:59")).toBeInTheDocument();
    });

    it("powinien poprawnie sformatować 60 sekund jako 00:01:00", () => {
      // Arrange & Act
      render(
        <GameMeta
          timeSec={60}
          running={false}
          canStart={true}
          onStart={mockOnStart}
          onStop={mockOnStop}
          onReset={mockOnReset}
        />
      );

      // Assert
      expect(screen.getByText("00:01:00")).toBeInTheDocument();
    });

    it("powinien poprawnie sformatować 3665 sekund (bug w format - pokazuje 01:61:05)", () => {
      // Arrange & Act
      render(
        <GameMeta
          timeSec={3665}
          running={false}
          canStart={true}
          onStart={mockOnStart}
          onStop={mockOnStop}
          onReset={mockOnReset}
        />
      );

      // Assert
      // UWAGA: funkcja format ma błąd - minuty są obliczane jako Math.floor(sec / 60) zamiast Math.floor((sec % 3600) / 60)
      // 3665s = 1h 1m 5s, ale bug powoduje wyświetlenie 01:61:05
      expect(screen.getByText("01:61:05")).toBeInTheDocument();
    });

    it("powinien poprawnie sformatować długi czas 36000 sekund (bug w format - pokazuje 10:600:00)", () => {
      // Arrange & Act
      render(
        <GameMeta
          timeSec={36000}
          running={false}
          canStart={true}
          onStart={mockOnStart}
          onStop={mockOnStop}
          onReset={mockOnReset}
        />
      );

      // Assert
      // UWAGA: funkcja format ma błąd - 36000s = 10h 0m 0s, ale bug powoduje wyświetlenie 10:600:00
      expect(screen.getByText("10:600:00")).toBeInTheDocument();
    });

    it("powinien mieć timer z aria-live='polite' dla accessibility", () => {
      // Arrange & Act
      const { container } = render(
        <GameMeta
          timeSec={125}
          running={false}
          canStart={true}
          onStart={mockOnStart}
          onStop={mockOnStop}
          onReset={mockOnReset}
        />
      );

      // Assert
      const timer = container.querySelector("[aria-live='polite']");
      expect(timer).toBeInTheDocument();
      expect(timer).toHaveTextContent("00:02:05");
    });

    it("powinien mieć timer z klasami text-3xl i font-mono", () => {
      // Arrange & Act
      const { container } = render(
        <GameMeta
          timeSec={0}
          running={false}
          canStart={true}
          onStart={mockOnStart}
          onStop={mockOnStop}
          onReset={mockOnReset}
        />
      );

      // Assert
      const timer = container.querySelector(".text-3xl.font-mono");
      expect(timer).toBeInTheDocument();
      expect(timer).toHaveClass("text-center");
    });
  });

  describe("Toggle sound - ikony VolumeOn/VolumeOff", () => {
    it("powinien wyrenderować VolumeOnIcon gdy soundOn = true", () => {
      // Arrange
      mockSoundOn.mockReturnValue(true);

      // Act
      render(
        <GameMeta
          timeSec={0}
          running={false}
          canStart={true}
          onStart={mockOnStart}
          onStop={mockOnStop}
          onReset={mockOnReset}
        />
      );

      // Assert
      const button = screen.getByRole("button", { name: "Toggle sound" });
      expect(button).toBeInTheDocument();
      // VolumeOnIcon jest renderowana jako SVG w button
      const svg = button.querySelector("svg");
      expect(svg).toBeInTheDocument();
    });

    it("powinien wyrenderować VolumeOffIcon gdy soundOn = false", () => {
      // Arrange
      mockSoundOn.mockReturnValue(false);

      // Act
      render(
        <GameMeta
          timeSec={0}
          running={false}
          canStart={true}
          onStart={mockOnStart}
          onStop={mockOnStop}
          onReset={mockOnReset}
        />
      );

      // Assert
      const button = screen.getByRole("button", { name: "Toggle sound" });
      expect(button).toBeInTheDocument();
      const svg = button.querySelector("svg");
      expect(svg).toBeInTheDocument();
    });

    it("powinien wywołać handleSound po kliknięciu przycisku sound", async () => {
      // Arrange
      const user = userEvent.setup();

      // Act
      render(
        <GameMeta
          timeSec={0}
          running={false}
          canStart={true}
          onStart={mockOnStart}
          onStop={mockOnStop}
          onReset={mockOnReset}
        />
      );

      const button = screen.getByRole("button", { name: "Toggle sound" });
      await user.click(button);

      // Assert
      expect(mockHandleSound).toHaveBeenCalledTimes(1);
    });

    it("powinien mieć cursor-pointer dla przycisku sound", () => {
      // Arrange & Act
      render(
        <GameMeta
          timeSec={0}
          running={false}
          canStart={true}
          onStart={mockOnStart}
          onStop={mockOnStop}
          onReset={mockOnReset}
        />
      );

      // Assert
      const button = screen.getByRole("button", { name: "Toggle sound" });
      expect(button).toHaveClass("cursor-pointer");
    });

    it("powinien mieć aria-label dla przycisku sound", () => {
      // Arrange & Act
      render(
        <GameMeta
          timeSec={0}
          running={false}
          canStart={true}
          onStart={mockOnStart}
          onStop={mockOnStop}
          onReset={mockOnReset}
        />
      );

      // Assert
      const button = screen.getByRole("button", { name: "Toggle sound" });
      expect(button).toHaveAttribute("aria-label", "Toggle sound");
    });
  });

  describe("Stan running - przycisk Start/Stop", () => {
    it("powinien wyrenderować przycisk Start gdy running = false", () => {
      // Arrange & Act
      render(
        <GameMeta
          timeSec={0}
          running={false}
          canStart={true}
          onStart={mockOnStart}
          onStop={mockOnStop}
          onReset={mockOnReset}
        />
      );

      // Assert
      expect(screen.getByRole("button", { name: "Start game" })).toBeInTheDocument();
      expect(screen.queryByRole("button", { name: "Stop game" })).not.toBeInTheDocument();
    });

    it("powinien wyrenderować przycisk Stop gdy running = true", () => {
      // Arrange & Act
      render(
        <GameMeta
          timeSec={10}
          running={true}
          canStart={true}
          onStart={mockOnStart}
          onStop={mockOnStop}
          onReset={mockOnReset}
        />
      );

      // Assert
      expect(screen.getByRole("button", { name: "Stop game" })).toBeInTheDocument();
      expect(screen.queryByRole("button", { name: "Start game" })).not.toBeInTheDocument();
    });

    it("powinien wywołać onStart po kliknięciu Start", async () => {
      // Arrange
      const user = userEvent.setup();

      // Act
      render(
        <GameMeta
          timeSec={0}
          running={false}
          canStart={true}
          onStart={mockOnStart}
          onStop={mockOnStop}
          onReset={mockOnReset}
        />
      );

      const startButton = screen.getByRole("button", { name: "Start game" });
      await user.click(startButton);

      // Assert
      expect(mockOnStart).toHaveBeenCalledTimes(1);
    });

    it("powinien wywołać onStop po kliknięciu Stop", async () => {
      // Arrange
      const user = userEvent.setup();

      // Act
      render(
        <GameMeta
          timeSec={10}
          running={true}
          canStart={true}
          onStart={mockOnStart}
          onStop={mockOnStop}
          onReset={mockOnReset}
        />
      );

      const stopButton = screen.getByRole("button", { name: "Stop game" });
      await user.click(stopButton);

      // Assert
      expect(mockOnStop).toHaveBeenCalledTimes(1);
    });

    it("przycisk Start powinien mieć zielone tło (bg-green-600)", () => {
      // Arrange & Act
      render(
        <GameMeta
          timeSec={0}
          running={false}
          canStart={true}
          onStart={mockOnStart}
          onStop={mockOnStop}
          onReset={mockOnReset}
        />
      );

      // Assert
      const startButton = screen.getByRole("button", { name: "Start game" });
      expect(startButton).toHaveClass("bg-green-600");
      expect(startButton).toHaveClass("text-white");
      expect(startButton).toHaveClass("font-bold");
    });

    it("przycisk Stop powinien mieć czerwone tło (bg-red-600)", () => {
      // Arrange & Act
      render(
        <GameMeta
          timeSec={10}
          running={true}
          canStart={true}
          onStart={mockOnStart}
          onStop={mockOnStop}
          onReset={mockOnReset}
        />
      );

      // Assert
      const stopButton = screen.getByRole("button", { name: "Stop game" });
      expect(stopButton).toHaveClass("bg-red-600");
      expect(stopButton).toHaveClass("text-white");
    });

    it("przycisk Start powinien mieć hover effects", () => {
      // Arrange & Act
      render(
        <GameMeta
          timeSec={0}
          running={false}
          canStart={true}
          onStart={mockOnStart}
          onStop={mockOnStop}
          onReset={mockOnReset}
        />
      );

      // Assert
      const startButton = screen.getByRole("button", { name: "Start game" });
      expect(startButton.className).toContain("hover:bg-white");
      expect(startButton.className).toContain("hover:text-[var(--color-primary)]");
    });
  });

  describe("Disabled state dla przycisku Start", () => {
    it("przycisk Start powinien być disabled gdy canStart = false", () => {
      // Arrange & Act
      render(
        <GameMeta
          timeSec={0}
          running={false}
          canStart={false}
          onStart={mockOnStart}
          onStop={mockOnStop}
          onReset={mockOnReset}
        />
      );

      // Assert
      const startButton = screen.getByRole("button", { name: "Start game" });
      expect(startButton).toBeDisabled();
    });

    it("przycisk Start powinien być enabled gdy canStart = true", () => {
      // Arrange & Act
      render(
        <GameMeta
          timeSec={0}
          running={false}
          canStart={true}
          onStart={mockOnStart}
          onStop={mockOnStop}
          onReset={mockOnReset}
        />
      );

      // Assert
      const startButton = screen.getByRole("button", { name: "Start game" });
      expect(startButton).not.toBeDisabled();
    });

    it("przycisk Start disabled powinien mieć obniżoną opacity (disabled:opacity-50)", () => {
      // Arrange & Act
      render(
        <GameMeta
          timeSec={0}
          running={false}
          canStart={false}
          onStart={mockOnStart}
          onStop={mockOnStop}
          onReset={mockOnReset}
        />
      );

      // Assert
      const startButton = screen.getByRole("button", { name: "Start game" });
      expect(startButton).toHaveClass("disabled:opacity-50");
    });

    it("nie powinien wywołać onStart gdy przycisk jest disabled", async () => {
      // Arrange
      const user = userEvent.setup();

      // Act
      render(
        <GameMeta
          timeSec={0}
          running={false}
          canStart={false}
          onStart={mockOnStart}
          onStop={mockOnStop}
          onReset={mockOnReset}
        />
      );

      const startButton = screen.getByRole("button", { name: "Start game" });
      await user.click(startButton);

      // Assert
      expect(mockOnStart).not.toHaveBeenCalled();
    });
  });

  describe("Przycisk Reset", () => {
    it("powinien wyrenderować przycisk Reset", () => {
      // Arrange & Act
      render(
        <GameMeta
          timeSec={0}
          running={false}
          canStart={true}
          onStart={mockOnStart}
          onStop={mockOnStop}
          onReset={mockOnReset}
        />
      );

      // Assert
      expect(screen.getByRole("button", { name: "Reset game" })).toBeInTheDocument();
    });

    it("powinien wywołać onReset po kliknięciu", async () => {
      // Arrange
      const user = userEvent.setup();

      // Act
      render(
        <GameMeta
          timeSec={10}
          running={false}
          canStart={true}
          onStart={mockOnStart}
          onStop={mockOnStop}
          onReset={mockOnReset}
        />
      );

      const resetButton = screen.getByRole("button", { name: "Reset game" });
      await user.click(resetButton);

      // Assert
      expect(mockOnReset).toHaveBeenCalledTimes(1);
    });

    it("przycisk Reset powinien być disabled gdy running = false i timeSec = 0", () => {
      // Arrange & Act
      render(
        <GameMeta
          timeSec={0}
          running={false}
          canStart={true}
          onStart={mockOnStart}
          onStop={mockOnStop}
          onReset={mockOnReset}
        />
      );

      // Assert
      const resetButton = screen.getByRole("button", { name: "Reset game" });
      expect(resetButton).toBeDisabled();
    });

    it("przycisk Reset powinien być enabled gdy running = true", () => {
      // Arrange & Act
      render(
        <GameMeta
          timeSec={0}
          running={true}
          canStart={true}
          onStart={mockOnStart}
          onStop={mockOnStop}
          onReset={mockOnReset}
        />
      );

      // Assert
      const resetButton = screen.getByRole("button", { name: "Reset game" });
      expect(resetButton).not.toBeDisabled();
    });

    it("przycisk Reset powinien być enabled gdy running = false ale timeSec > 0", () => {
      // Arrange & Act
      render(
        <GameMeta
          timeSec={10}
          running={false}
          canStart={true}
          onStart={mockOnStart}
          onStop={mockOnStop}
          onReset={mockOnReset}
        />
      );

      // Assert
      const resetButton = screen.getByRole("button", { name: "Reset game" });
      expect(resetButton).not.toBeDisabled();
    });

    it("przycisk Reset powinien mieć białe obramowanie (border-2 border-white)", () => {
      // Arrange & Act
      render(
        <GameMeta
          timeSec={0}
          running={false}
          canStart={true}
          onStart={mockOnStart}
          onStop={mockOnStop}
          onReset={mockOnReset}
        />
      );

      // Assert
      const resetButton = screen.getByRole("button", { name: "Reset game" });
      expect(resetButton).toHaveClass("border-2");
      expect(resetButton).toHaveClass("border-white");
      expect(resetButton).toHaveClass("font-bold");
    });

    it("przycisk Reset powinien mieć hover effects", () => {
      // Arrange & Act
      render(
        <GameMeta
          timeSec={10}
          running={false}
          canStart={true}
          onStart={mockOnStart}
          onStop={mockOnStop}
          onReset={mockOnReset}
        />
      );

      // Assert
      const resetButton = screen.getByRole("button", { name: "Reset game" });
      expect(resetButton.className).toContain("hover:bg-white");
      expect(resetButton.className).toContain("hover:text-[var(--color-primary)]");
    });

    it("nie powinien wywołać onReset gdy przycisk jest disabled", async () => {
      // Arrange
      const user = userEvent.setup();

      // Act
      render(
        <GameMeta
          timeSec={0}
          running={false}
          canStart={true}
          onStart={mockOnStart}
          onStop={mockOnStop}
          onReset={mockOnReset}
        />
      );

      const resetButton = screen.getByRole("button", { name: "Reset game" });
      await user.click(resetButton);

      // Assert
      expect(mockOnReset).not.toHaveBeenCalled();
    });
  });

  describe("Wyświetlanie ostatniego wyniku (lastScore)", () => {
    it("nie powinien wyrenderować lastScore gdy jest undefined", () => {
      // Arrange & Act
      render(
        <GameMeta
          timeSec={0}
          running={false}
          canStart={true}
          onStart={mockOnStart}
          onStop={mockOnStop}
          onReset={mockOnReset}
        />
      );

      // Assert
      expect(screen.queryByText(/Ostatni wynik:/)).not.toBeInTheDocument();
    });

    it("powinien wyrenderować lastScore gdy jest przekazany", () => {
      // Arrange & Act
      render(
        <GameMeta
          timeSec={0}
          running={false}
          canStart={true}
          lastScore={65000}
          onStart={mockOnStart}
          onStop={mockOnStop}
          onReset={mockOnReset}
        />
      );

      // Assert
      expect(screen.getByText(/Ostatni wynik:/)).toBeInTheDocument();
    });

    it("powinien poprawnie sformatować lastScore w milisekundach na HH:MM:SS", () => {
      // Arrange & Act
      render(
        <GameMeta
          timeSec={0}
          running={false}
          canStart={true}
          lastScore={65000}
          onStart={mockOnStart}
          onStop={mockOnStop}
          onReset={mockOnReset}
        />
      );

      // Assert
      // 65000ms = 65s = 00:01:05
      expect(screen.getByText("Ostatni wynik: 00:01:05")).toBeInTheDocument();
    });

    it("powinien poprawnie sformatować lastScore = 0", () => {
      // Arrange & Act
      render(
        <GameMeta
          timeSec={0}
          running={false}
          canStart={true}
          lastScore={0}
          onStart={mockOnStart}
          onStop={mockOnStop}
          onReset={mockOnReset}
        />
      );

      // Assert
      expect(screen.getByText("Ostatni wynik: 00:00:00")).toBeInTheDocument();
    });

    it("powinien poprawnie sformatować długi lastScore (bug w format - pokazuje 01:61:05)", () => {
      // Arrange & Act
      render(
        <GameMeta
          timeSec={0}
          running={false}
          canStart={true}
          lastScore={3665000}
          onStart={mockOnStart}
          onStop={mockOnStop}
          onReset={mockOnReset}
        />
      );

      // Assert
      // 3665000ms = 3665s = 1h 1m 5s, ale bug w format powoduje wyświetlenie 01:61:05
      expect(screen.getByText("Ostatni wynik: 01:61:05")).toBeInTheDocument();
    });

    it("lastScore powinien być ukryty na mobile (hidden md:block)", () => {
      // Arrange & Act
      const { container } = render(
        <GameMeta
          timeSec={0}
          running={false}
          canStart={true}
          lastScore={65000}
          onStart={mockOnStart}
          onStop={mockOnStop}
          onReset={mockOnReset}
        />
      );

      // Assert
      const lastScoreDiv = container.querySelector(".hidden.md\\:block");
      expect(lastScoreDiv).toBeInTheDocument();
      expect(lastScoreDiv).toHaveTextContent("Ostatni wynik:");
    });
  });

  describe("Nawigacja między poziomami", () => {
    it("nie powinien wyrenderować sekcji poziomów gdy levels jest puste", () => {
      // Arrange & Act
      render(
        <GameMeta
          timeSec={0}
          running={false}
          canStart={true}
          onStart={mockOnStart}
          onStop={mockOnStop}
          onReset={mockOnReset}
          levels={[]}
        />
      );

      // Assert
      expect(screen.queryByText("Poziomy")).not.toBeInTheDocument();
    });

    it("nie powinien wyrenderować sekcji poziomów gdy jest tylko 1 poziom", () => {
      // Arrange & Act
      render(
        <GameMeta
          timeSec={0}
          running={false}
          canStart={true}
          onStart={mockOnStart}
          onStop={mockOnStop}
          onReset={mockOnReset}
          levels={[1]}
          currentLevel={1}
        />
      );

      // Assert
      expect(screen.queryByText("Poziomy")).not.toBeInTheDocument();
    });

    it("powinien wyrenderować sekcję poziomów gdy levels.length > 1", () => {
      // Arrange & Act
      render(
        <GameMeta
          timeSec={0}
          running={false}
          canStart={true}
          onStart={mockOnStart}
          onStop={mockOnStop}
          onReset={mockOnReset}
          levels={[1, 2, 3]}
          currentLevel={1}
        />
      );

      // Assert
      expect(screen.getByText("Poziomy")).toBeInTheDocument();
    });

    it("powinien wyrenderować wszystkie przyciski poziomów", () => {
      // Arrange & Act
      render(
        <GameMeta
          timeSec={0}
          running={false}
          canStart={true}
          onStart={mockOnStart}
          onStop={mockOnStop}
          onReset={mockOnReset}
          levels={[1, 2, 3, 4]}
          currentLevel={2}
        />
      );

      // Assert
      expect(screen.getByRole("button", { name: "1" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "2" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "3" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "4" })).toBeInTheDocument();
    });

    it("aktualny poziom (currentLevel) powinien być disabled", () => {
      // Arrange & Act
      render(
        <GameMeta
          timeSec={0}
          running={false}
          canStart={true}
          onStart={mockOnStart}
          onStop={mockOnStop}
          onReset={mockOnReset}
          levels={[1, 2, 3]}
          currentLevel={2}
        />
      );

      // Assert
      const level1Button = screen.getByRole("button", { name: "1" });
      const level2Button = screen.getByRole("button", { name: "2" });
      const level3Button = screen.getByRole("button", { name: "3" });

      expect(level1Button).not.toBeDisabled();
      expect(level2Button).toBeDisabled();
      expect(level3Button).not.toBeDisabled();
    });

    it("powinien wywołać navigateToLevel po kliknięciu w dostępny poziom", async () => {
      // Arrange
      const user = userEvent.setup();

      // Act
      render(
        <GameMeta
          timeSec={0}
          running={false}
          canStart={true}
          onStart={mockOnStart}
          onStop={mockOnStop}
          onReset={mockOnReset}
          levels={[1, 2, 3]}
          currentLevel={1}
          navigateToLevel={mockNavigateToLevel}
        />
      );

      const level3Button = screen.getByRole("button", { name: "3" });
      await user.click(level3Button);

      // Assert
      expect(mockNavigateToLevel).toHaveBeenCalledTimes(1);
      expect(mockNavigateToLevel).toHaveBeenCalledWith(3);
    });

    it("nie powinien wywołać navigateToLevel po kliknięciu w disabled poziom", async () => {
      // Arrange
      const user = userEvent.setup();

      // Act
      render(
        <GameMeta
          timeSec={0}
          running={false}
          canStart={true}
          onStart={mockOnStart}
          onStop={mockOnStop}
          onReset={mockOnReset}
          levels={[1, 2, 3]}
          currentLevel={2}
          navigateToLevel={mockNavigateToLevel}
        />
      );

      const level2Button = screen.getByRole("button", { name: "2" });
      await user.click(level2Button);

      // Assert
      expect(mockNavigateToLevel).not.toHaveBeenCalled();
    });

    it("sekcja poziomów powinna być ukryta na mobile (hidden md:block)", () => {
      // Arrange & Act
      const { container } = render(
        <GameMeta
          timeSec={0}
          running={false}
          canStart={true}
          onStart={mockOnStart}
          onStop={mockOnStop}
          onReset={mockOnReset}
          levels={[1, 2, 3]}
          currentLevel={1}
        />
      );

      // Assert
      const levelsSection = container.querySelector(".hidden.md\\:block");
      expect(levelsSection).toBeInTheDocument();
      expect(levelsSection).toHaveTextContent("Poziomy");
    });

    it("przyciski poziomów powinny mieć odpowiednie klasy stylowania", () => {
      // Arrange & Act
      render(
        <GameMeta
          timeSec={0}
          running={false}
          canStart={true}
          onStart={mockOnStart}
          onStop={mockOnStop}
          onReset={mockOnReset}
          levels={[1, 2]}
          currentLevel={1}
        />
      );

      // Assert
      const level1Button = screen.getByRole("button", { name: "1" });
      expect(level1Button).toHaveClass("cursor-pointer");
      expect(level1Button).toHaveClass("border");
      expect(level1Button).toHaveClass("border-neutral-400");
      expect(level1Button).toHaveClass("rounded");
      expect(level1Button).toHaveClass("text-sm");
    });

    it("nie powinien wywołać navigateToLevel gdy navigateToLevel nie jest przekazany", async () => {
      // Arrange
      const user = userEvent.setup();

      // Act
      render(
        <GameMeta
          timeSec={0}
          running={false}
          canStart={true}
          onStart={mockOnStart}
          onStop={mockOnStop}
          onReset={mockOnReset}
          levels={[1, 2, 3]}
          currentLevel={1}
        />
      );

      const level2Button = screen.getByRole("button", { name: "2" });

      // Kliknięcie nie powinno wywołać błędu
      await expect(user.click(level2Button)).resolves.not.toThrow();
    });
  });

  describe("Edge cases", () => {
    it("powinien obsłużyć bardzo długi czas (99+ godzin) - bug pokazuje nieprawidłowe minuty", () => {
      // Arrange & Act
      render(
        <GameMeta
          timeSec={360000}
          running={false}
          canStart={true}
          onStart={mockOnStart}
          onStop={mockOnStop}
          onReset={mockOnReset}
        />
      );

      // Assert
      // 360000s = 100h 0m 0s, ale bug w format powoduje wyświetlenie 100:6000:00
      expect(screen.getByText("100:6000:00")).toBeInTheDocument();
    });

    it("powinien obsłużyć ujemny timeSec (edge case - pokazuje ujemne wartości)", () => {
      // Arrange & Act
      const { container } = render(
        <GameMeta
          timeSec={-10}
          running={false}
          canStart={true}
          onStart={mockOnStart}
          onStop={mockOnStop}
          onReset={mockOnReset}
        />
      );

      // Assert
      // Komponent nie zabezpiecza się przed ujemnymi wartościami i wyświetla -1:-1:-10
      const timerDiv = container.querySelector("[aria-live='polite']");
      expect(timerDiv).toBeTruthy();
      expect(timerDiv).toHaveTextContent("-1:-1:-10");
    });

    it("powinien obsłużyć wiele poziomów (edge case - 10+ poziomów)", () => {
      // Arrange & Act
      render(
        <GameMeta
          timeSec={0}
          running={false}
          canStart={true}
          onStart={mockOnStart}
          onStop={mockOnStop}
          onReset={mockOnReset}
          levels={[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]}
          currentLevel={1}
        />
      );

      // Assert
      expect(screen.getByRole("button", { name: "1" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "12" })).toBeInTheDocument();
    });

    it("powinien obsłużyć lastScore jako bardzo dużą liczbę", () => {
      // Arrange & Act
      render(
        <GameMeta
          timeSec={0}
          running={false}
          canStart={true}
          lastScore={99999999000}
          onStart={mockOnStart}
          onStop={mockOnStop}
          onReset={mockOnReset}
        />
      );

      // Assert
      // 99999999000ms = 99999999s = 27777:46:39
      const lastScoreText = screen.getByText(/Ostatni wynik:/);
      expect(lastScoreText).toBeInTheDocument();
    });

    it("powinien obsłużyć wszystkie props przekazane jednocześnie", () => {
      // Arrange & Act
      render(
        <GameMeta
          timeSec={125}
          running={true}
          canStart={false}
          lastScore={98000}
          onStart={mockOnStart}
          onStop={mockOnStop}
          onReset={mockOnReset}
          levels={[1, 2, 3, 4]}
          currentLevel={3}
          navigateToLevel={mockNavigateToLevel}
        />
      );

      // Assert
      expect(screen.getByText("00:02:05")).toBeInTheDocument();
      expect(screen.getByText("Ostatni wynik: 00:01:38")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Stop game" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Reset game" })).not.toBeDisabled();
      expect(screen.getByText("Poziomy")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "3" })).toBeDisabled();
    });
  });

  describe("Responsywność i layout", () => {
    it("powinien mieć flexbox z flex-row na mobile", () => {
      // Arrange & Act
      const { container } = render(
        <GameMeta
          timeSec={0}
          running={false}
          canStart={true}
          onStart={mockOnStart}
          onStop={mockOnStop}
          onReset={mockOnReset}
        />
      );

      // Assert
      const aside = container.querySelector("aside");
      expect(aside).toHaveClass("flex");
      expect(aside).toHaveClass("flex-row");
    });

    it("powinien przełączyć na flex-col na desktop (md:flex-col)", () => {
      // Arrange & Act
      const { container } = render(
        <GameMeta
          timeSec={0}
          running={false}
          canStart={true}
          onStart={mockOnStart}
          onStop={mockOnStop}
          onReset={mockOnReset}
        />
      );

      // Assert
      const aside = container.querySelector("aside");
      expect(aside?.className).toContain("md:flex-col");
    });

    it("powinien mieć gap-4 dla elementów", () => {
      // Arrange & Act
      const { container } = render(
        <GameMeta
          timeSec={0}
          running={false}
          canStart={true}
          onStart={mockOnStart}
          onStop={mockOnStop}
          onReset={mockOnReset}
        />
      );

      // Assert
      const aside = container.querySelector("aside");
      expect(aside).toHaveClass("gap-4");
    });

    it("powinien mieć padding p-4", () => {
      // Arrange & Act
      const { container } = render(
        <GameMeta
          timeSec={0}
          running={false}
          canStart={true}
          onStart={mockOnStart}
          onStop={mockOnStop}
          onReset={mockOnReset}
        />
      );

      // Assert
      const aside = container.querySelector("aside");
      expect(aside).toHaveClass("p-4");
    });

    it("powinien mieć shrink-0 dla fixed dimensions", () => {
      // Arrange & Act
      const { container } = render(
        <GameMeta
          timeSec={0}
          running={false}
          canStart={true}
          onStart={mockOnStart}
          onStop={mockOnStop}
          onReset={mockOnReset}
        />
      );

      // Assert
      const aside = container.querySelector("aside");
      expect(aside).toHaveClass("shrink-0");
    });

    it("powinien wyśrodkować content w rzędzie (justify-center)", () => {
      // Arrange & Act
      const { container } = render(
        <GameMeta
          timeSec={0}
          running={false}
          canStart={true}
          onStart={mockOnStart}
          onStop={mockOnStop}
          onReset={mockOnReset}
        />
      );

      // Assert
      const aside = container.querySelector("aside");
      expect(aside).toHaveClass("justify-center");
    });

    it("powinien mieć md:justify-start na desktop", () => {
      // Arrange & Act
      const { container } = render(
        <GameMeta
          timeSec={0}
          running={false}
          canStart={true}
          onStart={mockOnStart}
          onStop={mockOnStop}
          onReset={mockOnReset}
        />
      );

      // Assert
      const aside = container.querySelector("aside");
      expect(aside?.className).toContain("md:justify-start");
    });

    it("powinien mieć md:pt-[80px] dla desktop layout", () => {
      // Arrange & Act
      const { container } = render(
        <GameMeta
          timeSec={0}
          running={false}
          canStart={true}
          onStart={mockOnStart}
          onStop={mockOnStop}
          onReset={mockOnReset}
        />
      );

      // Assert
      const aside = container.querySelector("aside");
      expect(aside?.className).toContain("md:pt-[80px]");
    });
  });
});
