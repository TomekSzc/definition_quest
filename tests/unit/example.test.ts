import { describe, it, expect, vi } from "vitest";

/**
 * Przykładowy test jednostkowy dla Vitest
 * Umieść tutaj testy dla funkcji pomocniczych, hooków, i logiki biznesowej
 */

describe("Przykładowy test jednostkowy", () => {
  it("powinien przejść podstawowy test", () => {
    expect(1 + 1).toBe(2);
  });

  it("powinien używać mocka funkcji", () => {
    const mockFn = vi.fn((x: number) => x * 2);

    const result = mockFn(5);

    expect(result).toBe(10);
    expect(mockFn).toHaveBeenCalledTimes(1);
    expect(mockFn).toHaveBeenCalledWith(5);
  });
});

describe("Testowanie asynchroniczne", () => {
  it("powinien obsłużyć Promise", async () => {
    const asyncFunction = async () => {
      return new Promise((resolve) => {
        setTimeout(() => resolve("done"), 100);
      });
    };

    const result = await asyncFunction();
    expect(result).toBe("done");
  });
});
