import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";

/**
 * Przykładowy test komponentu React z React Testing Library
 * Umieść tutaj testy dla komponentów UI
 */

// Przykładowy komponent do testowania
function Counter() {
  const [count, setCount] = React.useState(0);

  return (
    <div>
      <p data-testid="count">Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>Increment</button>
    </div>
  );
}

describe("Przykładowy test komponentu", () => {
  it("powinien renderować komponent", () => {
    render(<Counter />);

    expect(screen.getByTestId("count")).toBeInTheDocument();
    expect(screen.getByText("Count: 0")).toBeInTheDocument();
  });

  it("powinien obsługiwać interakcje użytkownika", async () => {
    const user = userEvent.setup();
    render(<Counter />);

    const button = screen.getByRole("button", { name: /increment/i });
    await user.click(button);

    expect(screen.getByText("Count: 1")).toBeInTheDocument();
  });

  it("powinien mieć dostępny przycisk", () => {
    render(<Counter />);

    const button = screen.getByRole("button", { name: /increment/i });
    expect(button).toBeEnabled();
  });
});
