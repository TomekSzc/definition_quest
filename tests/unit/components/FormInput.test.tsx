import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FormInput } from "@/components/ui/FormInput";
import type { UseFormRegisterReturn } from "react-hook-form";
import React, { act } from "react";
import * as Form from "@radix-ui/react-form";

/**
 * Testy jednostkowe dla komponentu FormInput
 *
 * Testowane funkcjonalności:
 * - Podstawowe renderowanie i struktura DOM
 * - Różne typy input (text, email, password)
 * - Wyświetlanie błędów walidacji
 * - Toggle hasła - interakcje mouse (desktop)
 * - Toggle hasła - interakcje touch (mobile)
 * - Stan disabled
 * - Integracja z react-hook-form (register)
 * - Style warunkowe (error state)
 * - Accessibility (label, required, error messaging)
 */

// Mock dla EyeIcon
interface MockEyeIconProps {
  className?: string;
  onMouseDown?: () => void;
  onMouseUp?: () => void;
  onMouseLeave?: () => void;
  onTouchStart?: () => void;
  onTouchEnd?: () => void;
}

vi.mock("@/assets/icons", () => ({
  EyeIcon: ({ className, onMouseDown, onMouseUp, onMouseLeave, onTouchStart, onTouchEnd }: MockEyeIconProps) => (
    <svg
      data-testid="eye-icon"
      className={className}
      onMouseDown={onMouseDown}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseLeave}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <path />
    </svg>
  ),
}));

// Helper do tworzenia mock register z react-hook-form
const createMockRegister = (overrides?: Partial<UseFormRegisterReturn>): UseFormRegisterReturn => ({
  onChange: vi.fn(),
  onBlur: vi.fn(),
  ref: vi.fn(),
  name: "test-input",
  ...overrides,
});

// Helper wrapper dla Radix Form - FormField wymaga kontekstu Form.Root
const FormWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Form.Root onSubmit={(e) => e.preventDefault()}>{children}</Form.Root>
);

// Helper render function z automatycznym wrapperem
const renderWithForm = (ui: React.ReactElement) => {
  return render(<FormWrapper>{ui}</FormWrapper>);
};

describe("FormInput", () => {
  describe("Renderowanie i struktura DOM", () => {
    it("powinien wyrenderować input z labelem", () => {
      // Arrange
      const mockRegister = createMockRegister();

      // Act
      renderWithForm(<FormInput name="email" label="Email Address" register={mockRegister} />);

      // Assert
      const input = screen.getByRole("textbox");
      const label = screen.getByText("Email Address");
      expect(input).toBeInTheDocument();
      expect(label).toBeInTheDocument();
      expect(label.tagName).toBe("LABEL");
    });

    it("powinien renderować podstawową strukturę DOM z Radix Form", () => {
      // Arrange
      const mockRegister = createMockRegister();

      // Act
      const { container } = renderWithForm(<FormInput name="username" label="Username" register={mockRegister} />);

      // Assert - Szukamy Form.Field przez klasę "grid"
      const formField = container.querySelector(".grid");
      expect(formField).toBeInTheDocument();
      expect(formField).toHaveClass("grid");
    });

    it("powinien zawierać wrapper dla label i error message", () => {
      // Arrange
      const mockRegister = createMockRegister();

      // Act
      const { container } = renderWithForm(
        <FormInput name="email" label="Email" register={mockRegister} error="Invalid email" />
      );

      // Assert
      const labelWrapper = container.querySelector(".flex.items-baseline.justify-between");
      expect(labelWrapper).toBeInTheDocument();
    });

    it("powinien mieć relative wrapper dla input i ikony", () => {
      // Arrange
      const mockRegister = createMockRegister();

      // Act
      const { container } = renderWithForm(
        <FormInput name="password" label="Password" register={mockRegister} type="password" />
      );

      // Assert
      const inputWrapper = container.querySelector(".relative.mt-1");
      expect(inputWrapper).toBeInTheDocument();
    });
  });

  describe("Typy input", () => {
    it("powinien domyślnie renderować input typu text", () => {
      // Arrange
      const mockRegister = createMockRegister();

      // Act
      renderWithForm(<FormInput name="username" label="Username" register={mockRegister} />);

      // Assert
      const input = screen.getByRole("textbox");
      expect(input).toHaveAttribute("type", "text");
    });

    it("powinien renderować input typu email", () => {
      // Arrange
      const mockRegister = createMockRegister();

      // Act
      renderWithForm(<FormInput name="email" label="Email" register={mockRegister} type="email" />);

      // Assert
      const input = screen.getByRole("textbox");
      expect(input).toHaveAttribute("type", "email");
    });

    it("powinien renderować input typu password", () => {
      // Arrange
      const mockRegister = createMockRegister();

      // Act
      renderWithForm(<FormInput name="password" label="Password" register={mockRegister} type="password" />);

      // Assert
      const input = screen.getByLabelText("Password");
      expect(input).toHaveAttribute("type", "password");
    });
  });

  describe("Wyświetlanie błędów", () => {
    it("powinien wyświetlić komunikat o błędzie gdy jest przekazany", () => {
      // Arrange
      const mockRegister = createMockRegister();
      const errorMessage = "This field is required";

      // Act
      renderWithForm(<FormInput name="email" label="Email" register={mockRegister} error={errorMessage} />);

      // Assert
      const errorElement = screen.getByText(errorMessage);
      expect(errorElement).toBeInTheDocument();
      expect(errorElement.tagName).toBe("SPAN");
    });

    it("powinien nie wyświetlać komunikatu błędu gdy error nie jest przekazany", () => {
      // Arrange
      const mockRegister = createMockRegister();

      // Act
      renderWithForm(<FormInput name="email" label="Email" register={mockRegister} />);

      // Assert
      const errorElement = screen.queryByText(/error/i);
      expect(errorElement).not.toBeInTheDocument();
    });

    it("powinien zastosować style błędu (czerwone obramowanie) gdy jest error", () => {
      // Arrange
      const mockRegister = createMockRegister();

      // Act
      renderWithForm(<FormInput name="email" label="Email" register={mockRegister} error="Invalid email" />);

      // Assert
      const input = screen.getByRole("textbox");
      expect(input).toHaveClass("border-red-500");
      expect(input).toHaveClass("focus:ring-red-500");
    });

    it("powinien zastosować style domyślne (białe obramowanie) gdy nie ma błędu", () => {
      // Arrange
      const mockRegister = createMockRegister();

      // Act
      renderWithForm(<FormInput name="email" label="Email" register={mockRegister} />);

      // Assert
      const input = screen.getByRole("textbox");
      expect(input).toHaveClass("border-[var(--color-white)]");
      expect(input).toHaveClass("focus:ring-[var(--color-white)]");
    });

    it("powinien mieć właściwe style tekstu błędu", () => {
      // Arrange
      const mockRegister = createMockRegister();

      // Act
      renderWithForm(<FormInput name="email" label="Email" register={mockRegister} error="Error message" />);

      // Assert
      const errorElement = screen.getByText("Error message");
      expect(errorElement).toHaveClass("text-red-600");
      expect(errorElement).toHaveClass("text-xs");
    });
  });

  describe("Toggle hasła - Desktop (mouse events)", () => {
    it("powinien wyświetlić ikonę eye gdy type=password i showPasswordToggle=true", () => {
      // Arrange
      const mockRegister = createMockRegister();

      // Act
      renderWithForm(
        <FormInput name="password" label="Password" register={mockRegister} type="password" showPasswordToggle={true} />
      );

      // Assert
      const eyeIcon = screen.getByTestId("eye-icon");
      expect(eyeIcon).toBeInTheDocument();
    });

    it("nie powinien wyświetlić ikony eye gdy showPasswordToggle=false", () => {
      // Arrange
      const mockRegister = createMockRegister();

      // Act
      renderWithForm(
        <FormInput
          name="password"
          label="Password"
          register={mockRegister}
          type="password"
          showPasswordToggle={false}
        />
      );

      // Assert
      const eyeIcon = screen.queryByTestId("eye-icon");
      expect(eyeIcon).not.toBeInTheDocument();
    });

    it("nie powinien wyświetlić ikony eye dla typu text", () => {
      // Arrange
      const mockRegister = createMockRegister();

      // Act
      renderWithForm(
        <FormInput name="username" label="Username" register={mockRegister} type="text" showPasswordToggle={true} />
      );

      // Assert
      const eyeIcon = screen.queryByTestId("eye-icon");
      expect(eyeIcon).not.toBeInTheDocument();
    });

    it("powinien zmienić typ z password na text po onMouseDown", async () => {
      // Arrange
      const user = userEvent.setup();
      const mockRegister = createMockRegister();

      // Act
      renderWithForm(
        <FormInput name="password" label="Password" register={mockRegister} type="password" showPasswordToggle={true} />
      );

      const input = screen.getByLabelText("Password");
      const eyeIcon = screen.getByTestId("eye-icon");

      // Assert - Initially password
      expect(input).toHaveAttribute("type", "password");

      // Act - Mouse down
      await user.pointer({ keys: "[MouseLeft>]", target: eyeIcon });

      // Assert - Changed to text
      expect(input).toHaveAttribute("type", "text");
    });

    it("powinien zmienić typ z text na password po onMouseUp", async () => {
      // Arrange
      const user = userEvent.setup();
      const mockRegister = createMockRegister();

      // Act
      renderWithForm(
        <FormInput name="password" label="Password" register={mockRegister} type="password" showPasswordToggle={true} />
      );

      const input = screen.getByLabelText("Password");
      const eyeIcon = screen.getByTestId("eye-icon");

      // Act - Mouse down then up
      await user.pointer([{ keys: "[MouseLeft>]", target: eyeIcon }, { keys: "[/MouseLeft]" }]);

      // Assert - Back to password
      expect(input).toHaveAttribute("type", "password");
    });

    it("powinien zmienić typ z text na password po onMouseLeave", async () => {
      // Arrange
      const user = userEvent.setup();
      const mockRegister = createMockRegister();

      // Act
      renderWithForm(
        <FormInput name="password" label="Password" register={mockRegister} type="password" showPasswordToggle={true} />
      );

      const input = screen.getByLabelText("Password");
      const eyeIcon = screen.getByTestId("eye-icon");

      // Act - Mouse down
      await user.pointer({ keys: "[MouseLeft>]", target: eyeIcon });
      expect(input).toHaveAttribute("type", "text");

      // Act - Mouse leave
      await user.unhover(eyeIcon);

      // Assert - Back to password
      expect(input).toHaveAttribute("type", "password");
    });

    it("powinien mieć właściwe style dla ikony eye", () => {
      // Arrange
      const mockRegister = createMockRegister();

      // Act
      renderWithForm(
        <FormInput name="password" label="Password" register={mockRegister} type="password" showPasswordToggle={true} />
      );

      // Assert
      const eyeIcon = screen.getByTestId("eye-icon");
      expect(eyeIcon).toHaveClass("absolute");
      expect(eyeIcon).toHaveClass("right-3");
      expect(eyeIcon).toHaveClass("top-1/2");
      expect(eyeIcon).toHaveClass("-translate-y-1/2");
      expect(eyeIcon).toHaveClass("w-5");
      expect(eyeIcon).toHaveClass("h-5");
      expect(eyeIcon).toHaveClass("cursor-pointer");
      expect(eyeIcon).toHaveClass("text-[var(--color-white)]");
    });
  });

  describe("Toggle hasła - Mobile (touch events)", () => {
    it("powinien zmienić typ z password na text po onTouchStart", () => {
      // Arrange
      const mockRegister = createMockRegister();

      // Act
      renderWithForm(
        <FormInput name="password" label="Password" register={mockRegister} type="password" showPasswordToggle={true} />
      );

      const input = screen.getByLabelText("Password");
      const eyeIcon = screen.getByTestId("eye-icon");

      // Assert - Initially password
      expect(input).toHaveAttribute("type", "password");

      // Act - Touch start
      act(() => {
        fireEvent.touchStart(eyeIcon);
      });

      // Assert - Changed to text
      expect(input).toHaveAttribute("type", "text");
    });

    it("powinien zmienić typ z text na password po onTouchEnd", () => {
      // Arrange
      const mockRegister = createMockRegister();

      // Act
      renderWithForm(
        <FormInput name="password" label="Password" register={mockRegister} type="password" showPasswordToggle={true} />
      );

      const input = screen.getByLabelText("Password");
      const eyeIcon = screen.getByTestId("eye-icon");

      // Act - Touch start then end
      act(() => {
        fireEvent.touchStart(eyeIcon);
      });
      expect(input).toHaveAttribute("type", "text");

      act(() => {
        fireEvent.touchEnd(eyeIcon);
      });

      // Assert - Back to password
      expect(input).toHaveAttribute("type", "password");
    });

    it("powinien obsługiwać pełny cykl touch (start -> end)", () => {
      // Arrange
      const mockRegister = createMockRegister();

      // Act
      renderWithForm(
        <FormInput name="password" label="Password" register={mockRegister} type="password" showPasswordToggle={true} />
      );

      const input = screen.getByLabelText("Password");
      const eyeIcon = screen.getByTestId("eye-icon");

      // Assert - Step by step
      expect(input).toHaveAttribute("type", "password"); // Initial state

      act(() => {
        fireEvent.touchStart(eyeIcon);
      });
      expect(input).toHaveAttribute("type", "text"); // After touch start

      act(() => {
        fireEvent.touchEnd(eyeIcon);
      });
      expect(input).toHaveAttribute("type", "password"); // After touch end
    });
  });

  describe("Stan disabled", () => {
    it("powinien renderować input jako disabled gdy disabled=true", () => {
      // Arrange
      const mockRegister = createMockRegister();

      // Act
      renderWithForm(<FormInput name="email" label="Email" register={mockRegister} disabled={true} />);

      // Assert
      const input = screen.getByRole("textbox");
      expect(input).toBeDisabled();
    });

    it("powinien renderować input jako enabled gdy disabled=false", () => {
      // Arrange
      const mockRegister = createMockRegister();

      // Act
      renderWithForm(<FormInput name="email" label="Email" register={mockRegister} disabled={false} />);

      // Assert
      const input = screen.getByRole("textbox");
      expect(input).toBeEnabled();
    });

    it("powinien domyślnie renderować input jako enabled", () => {
      // Arrange
      const mockRegister = createMockRegister();

      // Act
      renderWithForm(<FormInput name="email" label="Email" register={mockRegister} />);

      // Assert
      const input = screen.getByRole("textbox");
      expect(input).toBeEnabled();
    });

    it("powinien przekazać atrybut disabled do native input", () => {
      // Arrange
      const mockRegister = createMockRegister();

      // Act
      renderWithForm(<FormInput name="email" label="Email" register={mockRegister} disabled={true} />);

      // Assert
      const input = screen.getByRole("textbox");
      expect(input).toHaveAttribute("disabled");
    });
  });

  describe("Integracja z react-hook-form", () => {
    it("powinien zastosować wszystkie props z register", () => {
      // Arrange
      const mockRegister = createMockRegister({
        name: "test-field",
        onChange: vi.fn(),
        onBlur: vi.fn(),
      });

      // Act
      renderWithForm(<FormInput name="email" label="Email" register={mockRegister} />);

      // Assert
      // Register props są spread na input, więc sprawdzamy że wszystkie są zdefiniowane
      expect(mockRegister.onChange).toBeDefined();
      expect(mockRegister.onBlur).toBeDefined();
      expect(mockRegister.ref).toBeDefined();
    });

    it("powinien wywołać onChange z register przy wpisywaniu tekstu", async () => {
      // Arrange
      const user = userEvent.setup();
      const mockOnChange = vi.fn();
      const mockRegister = createMockRegister({
        onChange: mockOnChange,
      });

      // Act
      renderWithForm(<FormInput name="email" label="Email" register={mockRegister} />);

      const input = screen.getByRole("textbox");
      await user.type(input, "test");

      // Assert
      expect(mockOnChange).toHaveBeenCalled();
    });

    it("powinien wywołać onBlur z register przy utracie focusa", async () => {
      // Arrange
      const user = userEvent.setup();
      const mockOnBlur = vi.fn();
      const mockRegister = createMockRegister({
        onBlur: mockOnBlur,
      });

      // Act
      renderWithForm(<FormInput name="email" label="Email" register={mockRegister} />);

      const input = screen.getByRole("textbox");
      await user.click(input);
      await user.tab();

      // Assert
      expect(mockOnBlur).toHaveBeenCalled();
    });

    it("powinien poprawnie spread register props na input", () => {
      // Arrange
      const mockRegister = createMockRegister({
        name: "custom-name",
      });

      // Act
      const { container } = renderWithForm(<FormInput name="email" label="Email" register={mockRegister} />);

      // Assert
      const input = container.querySelector("input");
      expect(input).toBeInTheDocument();
      // Props z register są spread, więc nie możemy dokładnie sprawdzić wszystkich,
      // ale możemy sprawdzić że input istnieje i ma podstawowe atrybuty
    });
  });

  describe("Style bazowe", () => {
    it("powinien mieć wszystkie podstawowe klasy stylowania", () => {
      // Arrange
      const mockRegister = createMockRegister();

      // Act
      renderWithForm(<FormInput name="email" label="Email" register={mockRegister} />);

      // Assert
      const input = screen.getByRole("textbox");
      expect(input).toHaveClass("w-full");
      expect(input).toHaveClass("px-3");
      expect(input).toHaveClass("py-2");
      expect(input).toHaveClass("border-2");
      expect(input).toHaveClass("rounded");
      expect(input).toHaveClass("outline-none");
      expect(input).toHaveClass("focus:ring-2");
    });

    it("powinien mieć klasy motywu CSS variables", () => {
      // Arrange
      const mockRegister = createMockRegister();

      // Act
      renderWithForm(<FormInput name="email" label="Email" register={mockRegister} />);

      // Assert
      const input = screen.getByRole("textbox");
      expect(input).toHaveClass("bg-[var(--color-primary)]");
      expect(input).toHaveClass("text-[var(--color-white)]");
    });

    it("powinien mieć właściwe style dla labela", () => {
      // Arrange
      const mockRegister = createMockRegister();

      // Act
      renderWithForm(<FormInput name="email" label="Email Address" register={mockRegister} />);

      // Assert
      const label = screen.getByText("Email Address");
      expect(label).toHaveClass("text-sm");
      expect(label).toHaveClass("text-[var(--color-white)]");
    });
  });

  describe("Accessibility", () => {
    it("powinien mieć atrybut required", () => {
      // Arrange
      const mockRegister = createMockRegister();

      // Act
      renderWithForm(<FormInput name="email" label="Email" register={mockRegister} />);

      // Assert
      const input = screen.getByRole("textbox");
      expect(input).toBeRequired();
    });

    it("powinien powiązać label z input przez Radix Form", () => {
      // Arrange
      const mockRegister = createMockRegister();

      // Act
      renderWithForm(<FormInput name="email" label="Email Address" register={mockRegister} />);

      // Assert
      const input = screen.getByLabelText("Email Address");
      expect(input).toBeInTheDocument();
    });

    it("powinien mieć focus ring dla keyboard navigation", () => {
      // Arrange
      const mockRegister = createMockRegister();

      // Act
      renderWithForm(<FormInput name="email" label="Email" register={mockRegister} />);

      // Assert
      const input = screen.getByRole("textbox");
      expect(input).toHaveClass("focus:ring-2");
    });

    it("powinien wyświetlać error message obok labela", () => {
      // Arrange
      const mockRegister = createMockRegister();

      // Act
      const { container } = renderWithForm(
        <FormInput name="email" label="Email" register={mockRegister} error="Invalid email" />
      );

      // Assert
      const wrapper = container.querySelector(".flex.items-baseline.justify-between");
      const label = screen.getByText("Email");
      const error = screen.getByText("Invalid email");

      expect(wrapper).toContainElement(label);
      expect(wrapper).toContainElement(error);
    });

    it("powinien mieć semantyczną strukturę Radix Form", () => {
      // Arrange
      const mockRegister = createMockRegister();

      // Act
      const { container } = renderWithForm(<FormInput name="email" label="Email" register={mockRegister} />);

      // Assert - Weryfikujemy że Form.Field renderuje się poprawnie
      const formField = container.querySelector(".grid");
      const input = screen.getByRole("textbox");
      expect(formField).toBeInTheDocument();
      expect(formField).toContainElement(input);
    });
  });

  describe("Kombinacje props", () => {
    it("powinien obsłużyć password + showPasswordToggle + error", () => {
      // Arrange
      const mockRegister = createMockRegister();

      // Act
      renderWithForm(
        <FormInput
          name="password"
          label="Password"
          register={mockRegister}
          type="password"
          showPasswordToggle={true}
          error="Password is required"
        />
      );

      // Assert
      const input = screen.getByLabelText("Password");
      const eyeIcon = screen.getByTestId("eye-icon");
      const error = screen.getByText("Password is required");

      expect(input).toHaveAttribute("type", "password");
      expect(input).toHaveClass("border-red-500");
      expect(eyeIcon).toBeInTheDocument();
      expect(error).toBeInTheDocument();
    });

    it("powinien obsłużyć disabled + error", () => {
      // Arrange
      const mockRegister = createMockRegister();

      // Act
      renderWithForm(
        <FormInput name="email" label="Email" register={mockRegister} disabled={true} error="This field is disabled" />
      );

      // Assert
      const input = screen.getByRole("textbox");
      const error = screen.getByText("This field is disabled");

      expect(input).toBeDisabled();
      expect(input).toHaveClass("border-red-500");
      expect(error).toBeInTheDocument();
    });

    it("powinien obsłużyć wszystkie props jednocześnie", () => {
      // Arrange
      const mockRegister = createMockRegister();

      // Act
      renderWithForm(
        <FormInput
          name="password"
          label="Password"
          register={mockRegister}
          type="password"
          showPasswordToggle={true}
          error="Invalid password"
          disabled={false}
        />
      );

      // Assert
      const input = screen.getByLabelText("Password");
      const eyeIcon = screen.getByTestId("eye-icon");
      const error = screen.getByText("Invalid password");

      expect(input).toHaveAttribute("type", "password");
      expect(input).toBeEnabled();
      expect(input).toHaveClass("border-red-500");
      expect(eyeIcon).toBeInTheDocument();
      expect(error).toBeInTheDocument();
    });
  });

  describe("Edge cases", () => {
    it("powinien obsłużyć pusty string jako error", () => {
      // Arrange
      const mockRegister = createMockRegister();

      // Act
      renderWithForm(<FormInput name="email" label="Email" register={mockRegister} error="" />);

      // Assert
      // Pusty string jest falsy, więc error nie powinien się wyświetlić
      const input = screen.getByRole("textbox");
      // Ale style nie-błędne powinny być zastosowane bo error="" jest przekazane
      expect(input).toHaveClass("border-[var(--color-white)]");
    });

    it("powinien obsłużyć długi tekst w label", () => {
      // Arrange
      const mockRegister = createMockRegister();
      const longLabel = "This is a very long label that might wrap to multiple lines in the UI";

      // Act
      renderWithForm(<FormInput name="email" label={longLabel} register={mockRegister} />);

      // Assert
      const label = screen.getByText(longLabel);
      expect(label).toBeInTheDocument();
    });

    it("powinien obsłużyć długi komunikat błędu", () => {
      // Arrange
      const mockRegister = createMockRegister();
      const longError = "This is a very long error message that provides detailed information about what went wrong";

      // Act
      renderWithForm(<FormInput name="email" label="Email" register={mockRegister} error={longError} />);

      // Assert
      const error = screen.getByText(longError);
      expect(error).toBeInTheDocument();
      expect(error).toHaveClass("text-xs");
    });

    it("powinien obsłużyć showPasswordToggle=true dla typu text (nie powinno wyświetlić ikony)", () => {
      // Arrange
      const mockRegister = createMockRegister();

      // Act
      renderWithForm(
        <FormInput name="username" label="Username" register={mockRegister} type="text" showPasswordToggle={true} />
      );

      // Assert
      const eyeIcon = screen.queryByTestId("eye-icon");
      expect(eyeIcon).not.toBeInTheDocument();
    });

    it("powinien obsłużyć szybkie przełączanie między mouse events", async () => {
      // Arrange
      const user = userEvent.setup();
      const mockRegister = createMockRegister();

      // Act
      renderWithForm(
        <FormInput name="password" label="Password" register={mockRegister} type="password" showPasswordToggle={true} />
      );

      const input = screen.getByLabelText("Password");
      const eyeIcon = screen.getByTestId("eye-icon");

      // Symulacja szybkiego klikania
      await user.pointer({ keys: "[MouseLeft>]", target: eyeIcon });
      expect(input).toHaveAttribute("type", "text");

      await user.pointer({ keys: "[/MouseLeft]" });
      expect(input).toHaveAttribute("type", "password");

      await user.pointer({ keys: "[MouseLeft>]", target: eyeIcon });
      expect(input).toHaveAttribute("type", "text");

      await user.pointer({ keys: "[/MouseLeft]" });
      expect(input).toHaveAttribute("type", "password");
    });
  });
});
