// tests/unit/components/AcceptPairsModal.test.tsx

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AcceptPairsModal from "@/components/forms/AcceptPairsModal";
import type { GeneratedPair } from "@/types";

const createProps = (overrides?: Partial<Parameters<typeof AcceptPairsModal>[0]>) => {
  const pairs: GeneratedPair[] = [
    { term: "HTML", definition: "HyperText Markup Language" },
    { term: "CSS", definition: "Cascading Style Sheets" },
  ];

  return {
    pairs,
    onAccept: vi.fn(),
    onCancel: vi.fn(),
    ...overrides,
  } as Parameters<typeof AcceptPairsModal>[0];
};

describe("<AcceptPairsModal />", () => {
  let props: ReturnType<typeof createProps>;

  beforeEach(() => {
    props = createProps();
  });

  it("renders all pairs with checkboxes checked by default", () => {
    render(<AcceptPairsModal {...props} />);

    props.pairs.forEach(({ term, definition }) => {
      expect(screen.getByText(term)).toBeInTheDocument();
      // Definition is split by <strong> and " – ", so use partial match
      expect(screen.getByText(definition, { exact: false })).toBeInTheDocument();
    });

    const checkboxes = screen.getAllByRole("checkbox") as HTMLInputElement[];
    expect(checkboxes).toHaveLength(props.pairs.length);
    checkboxes.forEach((cb) => expect(cb.checked).toBe(true));

    expect(screen.getByRole("button", { name: /akceptuj/i })).toBeEnabled();
  });

  it("disables accept button when no pair is selected", async () => {
    render(<AcceptPairsModal {...props} />);
    const user = userEvent.setup();

    for (const checkbox of screen.getAllByRole("checkbox")) {
      await user.click(checkbox);
    }

    expect(screen.getByRole("button", { name: /akceptuj/i })).toBeDisabled();
  });

  it("calls onAccept with only selected pairs", async () => {
    render(<AcceptPairsModal {...props} />);
    const user = userEvent.setup();

    const checkboxes = screen.getAllByRole("checkbox");
    await user.click(checkboxes[1]);

    const acceptBtn = screen.getByRole("button", { name: /akceptuj/i });
    await user.click(acceptBtn);

    expect(props.onAccept).toHaveBeenCalledTimes(1);
    expect(props.onAccept).toHaveBeenCalledWith([props.pairs[0]]);
  });

  it("triggers onCancel when cancel button is clicked", async () => {
    render(<AcceptPairsModal {...props} />);
    const user = userEvent.setup();

    await user.click(screen.getByRole("button", { name: /anuluj/i }));

    expect(props.onCancel).toHaveBeenCalledTimes(1);
  });
});
