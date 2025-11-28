import { describe, it, expect } from "vitest";
import { renderHook } from "@testing-library/react";
import { useTime } from "@/hooks/useTime";

/**
 * Testy jednostkowe dla hooka useTime
 *
 * Testowane funkcjonalności:
 * - Konwersja milisekund na format mm:ss (msToMin)
 * - Poprawne formatowanie dla różnych wartości
 * - Padding zerami dla wartości < 10
 * - Edge cases (0ms, bardzo duże wartości)
 */

describe("useTime", () => {
  describe("msToMin - konwersja milisekund na format mm:ss", () => {
    it("powinien zwrócić '00:00' dla 0 milisekund", () => {
      // Arrange
      const { result } = renderHook(() => useTime());

      // Act
      const formatted = result.current.msToMin(0);

      // Assert
      expect(formatted).toBe("00:00");
    });

    it("powinien zwrócić '00:01' dla 1000 milisekund (1 sekunda)", () => {
      // Arrange
      const { result } = renderHook(() => useTime());

      // Act
      const formatted = result.current.msToMin(1000);

      // Assert
      expect(formatted).toBe("00:01");
    });

    it("powinien zwrócić '00:05' dla 5000 milisekund (5 sekund)", () => {
      // Arrange
      const { result } = renderHook(() => useTime());

      // Act
      const formatted = result.current.msToMin(5000);

      // Assert
      expect(formatted).toBe("00:05");
    });

    it("powinien zwrócić '00:59' dla 59000 milisekund (59 sekund)", () => {
      // Arrange
      const { result } = renderHook(() => useTime());

      // Act
      const formatted = result.current.msToMin(59000);

      // Assert
      expect(formatted).toBe("00:59");
    });

    it("powinien zwrócić '01:00' dla 60000 milisekund (1 minuta)", () => {
      // Arrange
      const { result } = renderHook(() => useTime());

      // Act
      const formatted = result.current.msToMin(60000);

      // Assert
      expect(formatted).toBe("01:00");
    });

    it("powinien zwrócić '01:30' dla 90000 milisekund (1 minuta 30 sekund)", () => {
      // Arrange
      const { result } = renderHook(() => useTime());

      // Act
      const formatted = result.current.msToMin(90000);

      // Assert
      expect(formatted).toBe("01:30");
    });

    it("powinien zwrócić '02:05' dla 125000 milisekund (2 minuty 5 sekund)", () => {
      // Arrange
      const { result } = renderHook(() => useTime());

      // Act
      const formatted = result.current.msToMin(125000);

      // Assert
      expect(formatted).toBe("02:05");
    });

    it("powinien zwrócić '10:00' dla 600000 milisekund (10 minut)", () => {
      // Arrange
      const { result } = renderHook(() => useTime());

      // Act
      const formatted = result.current.msToMin(600000);

      // Assert
      expect(formatted).toBe("10:00");
    });

    it("powinien zwrócić '59:59' dla 3599000 milisekund (59 minut 59 sekund)", () => {
      // Arrange
      const { result } = renderHook(() => useTime());

      // Act
      const formatted = result.current.msToMin(3599000);

      // Assert
      expect(formatted).toBe("59:59");
    });

    it("powinien zwrócić '60:00' dla 3600000 milisekund (1 godzina)", () => {
      // Arrange
      const { result } = renderHook(() => useTime());

      // Act
      const formatted = result.current.msToMin(3600000);

      // Assert
      expect(formatted).toBe("60:00");
    });

    it("powinien zwrócić '166:39' dla 9999999 milisekund", () => {
      // Arrange
      const { result } = renderHook(() => useTime());

      // Act
      const formatted = result.current.msToMin(9999999);

      // Assert
      expect(formatted).toBe("166:39");
    });
  });

  describe("Padding zerami", () => {
    it("powinien dodać padding zerami dla minut < 10", () => {
      // Arrange
      const { result } = renderHook(() => useTime());

      // Act & Assert
      expect(result.current.msToMin(0)).toBe("00:00");
      expect(result.current.msToMin(60000)).toBe("01:00");
      expect(result.current.msToMin(540000)).toBe("09:00");
    });

    it("powinien dodać padding zerami dla sekund < 10", () => {
      // Arrange
      const { result } = renderHook(() => useTime());

      // Act & Assert
      expect(result.current.msToMin(1000)).toBe("00:01");
      expect(result.current.msToMin(9000)).toBe("00:09");
      expect(result.current.msToMin(61000)).toBe("01:01");
    });

    it("nie powinien dodawać paddingu dla minut >= 10", () => {
      // Arrange
      const { result } = renderHook(() => useTime());

      // Act & Assert
      expect(result.current.msToMin(600000)).toBe("10:00");
      expect(result.current.msToMin(6000000)).toBe("100:00");
    });

    it("nie powinien dodawać paddingu dla sekund >= 10", () => {
      // Arrange
      const { result } = renderHook(() => useTime());

      // Act & Assert
      expect(result.current.msToMin(10000)).toBe("00:10");
      expect(result.current.msToMin(59000)).toBe("00:59");
    });
  });

  describe("Edge cases", () => {
    it("powinien obsłużyć wartości poniżej 1 sekundy", () => {
      // Arrange
      const { result } = renderHook(() => useTime());

      // Act & Assert
      expect(result.current.msToMin(500)).toBe("00:00");
      expect(result.current.msToMin(999)).toBe("00:00");
    });

    it("powinien obsłużyć bardzo duże wartości", () => {
      // Arrange
      const { result } = renderHook(() => useTime());

      // Act
      const formatted = result.current.msToMin(99999999); // ~27 godzin

      // Assert
      expect(formatted).toBe("1666:39");
    });

    it("powinien obsłużyć wartości dziesiętne (zaokrąglenie w dół)", () => {
      // Arrange
      const { result } = renderHook(() => useTime());

      // Act & Assert
      expect(result.current.msToMin(1500)).toBe("00:01"); // 1.5s -> 1s
      expect(result.current.msToMin(1999)).toBe("00:01"); // 1.999s -> 1s
    });

    it("powinien być stabilny przy wielokrotnym wywołaniu", () => {
      // Arrange
      const { result } = renderHook(() => useTime());
      const milliseconds = 125000;

      // Act
      const first = result.current.msToMin(milliseconds);
      const second = result.current.msToMin(milliseconds);
      const third = result.current.msToMin(milliseconds);

      // Assert
      expect(first).toBe("02:05");
      expect(second).toBe("02:05");
      expect(third).toBe("02:05");
      expect(first).toBe(second);
      expect(second).toBe(third);
    });
  });

  describe("Typowe wartości dla gier/quizów", () => {
    it("powinien poprawnie formatować typowy czas gry (30 sekund - 5 minut)", () => {
      // Arrange
      const { result } = renderHook(() => useTime());

      // Act & Assert
      expect(result.current.msToMin(30000)).toBe("00:30"); // 30s
      expect(result.current.msToMin(45000)).toBe("00:45"); // 45s
      expect(result.current.msToMin(60000)).toBe("01:00"); // 1min
      expect(result.current.msToMin(120000)).toBe("02:00"); // 2min
      expect(result.current.msToMin(180000)).toBe("03:00"); // 3min
      expect(result.current.msToMin(300000)).toBe("05:00"); // 5min
    });

    it("powinien poprawnie formatować szybkie wyniki (< 30s)", () => {
      // Arrange
      const { result } = renderHook(() => useTime());

      // Act & Assert
      expect(result.current.msToMin(5000)).toBe("00:05");
      expect(result.current.msToMin(10000)).toBe("00:10");
      expect(result.current.msToMin(15000)).toBe("00:15");
      expect(result.current.msToMin(20000)).toBe("00:20");
    });

    it("powinien poprawnie formatować długie sesje (> 10 minut)", () => {
      // Arrange
      const { result } = renderHook(() => useTime());

      // Act & Assert
      expect(result.current.msToMin(600000)).toBe("10:00"); // 10min
      expect(result.current.msToMin(900000)).toBe("15:00"); // 15min
      expect(result.current.msToMin(1200000)).toBe("20:00"); // 20min
      expect(result.current.msToMin(1800000)).toBe("30:00"); // 30min
    });
  });

  describe("Format wyjściowy", () => {
    it("powinien zawsze zwracać string", () => {
      // Arrange
      const { result } = renderHook(() => useTime());

      // Act
      const formatted = result.current.msToMin(5000);

      // Assert
      expect(typeof formatted).toBe("string");
    });

    it("powinien zawsze zwracać format 'XX:XX'", () => {
      // Arrange
      const { result } = renderHook(() => useTime());

      // Act & Assert
      const regex = /^\d{2,}:\d{2}$/;
      expect(result.current.msToMin(0)).toMatch(regex);
      expect(result.current.msToMin(1000)).toMatch(regex);
      expect(result.current.msToMin(60000)).toMatch(regex);
      expect(result.current.msToMin(3600000)).toMatch(regex);
    });

    it("minuty powinny mieć minimum 2 cyfry", () => {
      // Arrange
      const { result } = renderHook(() => useTime());

      // Act & Assert
      const result0 = result.current.msToMin(0);
      const result1 = result.current.msToMin(60000);
      const result9 = result.current.msToMin(540000);

      expect(result0.split(":")[0]).toHaveLength(2);
      expect(result1.split(":")[0]).toHaveLength(2);
      expect(result9.split(":")[0]).toHaveLength(2);
    });

    it("sekundy powinny mieć dokładnie 2 cyfry", () => {
      // Arrange
      const { result } = renderHook(() => useTime());

      // Act & Assert
      const result0 = result.current.msToMin(0);
      const result30 = result.current.msToMin(30000);
      const result59 = result.current.msToMin(59000);

      expect(result0.split(":")[1]).toHaveLength(2);
      expect(result30.split(":")[1]).toHaveLength(2);
      expect(result59.split(":")[1]).toHaveLength(2);
    });
  });

  describe("Stabilność hooka", () => {
    it("powinien zwrócić ten sam obiekt przy re-renderze", () => {
      // Arrange
      const { result, rerender } = renderHook(() => useTime());
      const firstRender = result.current;

      // Act
      rerender();

      // Assert
      expect(result.current).toBe(firstRender);
    });

    it("funkcja msToMin powinna być stabilna między renderami", () => {
      // Arrange
      const { result, rerender } = renderHook(() => useTime());
      const firstMsToMin = result.current.msToMin;

      // Act
      rerender();
      const secondMsToMin = result.current.msToMin;

      // Assert
      expect(firstMsToMin).toBe(secondMsToMin);
    });
  });
});
