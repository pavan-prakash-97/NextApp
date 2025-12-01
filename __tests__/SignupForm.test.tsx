/**
 * @jest-environment jsdom
 */

import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { signUp } from "@/app/lib/auth-client";
import { useRouter } from "next/navigation";
import SignupForm from "@/app/components/feature/auth/SignupForm";

// Mock next/navigation
jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
}));

// Mock signUp module
jest.mock("@/app/lib/auth-client", () => ({
  signUp: {
    email: jest.fn(),
  },
}));

// Mock fetch for SMS API
global.fetch = jest.fn();

describe("SignupForm Component", () => {
  const mockPush = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({ push: mockPush });
  });

  test("renders all input fields", () => {
    render(<SignupForm />);

    expect(screen.getByLabelText("Name")).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByLabelText("Mobile number")).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sign Up" })).toBeInTheDocument();
  });

  test("allows typing into inputs", () => {
    render(<SignupForm />);

    fireEvent.change(screen.getByLabelText("Name"), {
      target: { value: "John Doe" },
    });

    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "john@example.com" },
    });

    fireEvent.change(screen.getByLabelText("Mobile number"), {
      target: { value: "9876543210" },
    });

    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "mypassword123" },
    });

    expect(screen.getByLabelText("Name")).toHaveValue("John Doe");
    expect(screen.getByLabelText("Email")).toHaveValue("john@example.com");
    expect(screen.getByLabelText("Mobile number")).toHaveValue("9876543210");
    expect(screen.getByLabelText("Password")).toHaveValue("mypassword123");
  });

  test("password show/hide toggle works", () => {
    render(<SignupForm />);

    const passwordInput = screen.getByLabelText("Password") as HTMLInputElement;
    const toggleButton = screen.getByRole("button", {
      name: "Show password",
    });

    expect(passwordInput.type).toBe("password");

    fireEvent.click(toggleButton);
    expect(passwordInput.type).toBe("text");

    fireEvent.click(toggleButton);
    expect(passwordInput.type).toBe("password");
  });

  test("successful signup triggers SMS and navigates", async () => {
    (signUp.email as jest.Mock).mockResolvedValue({ error: null });

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => ({ success: true }),
    });

    render(<SignupForm />);

    fireEvent.change(screen.getByLabelText("Name"), {
      target: { value: "John" },
    });

    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "john@example.com" },
    });

    fireEvent.change(screen.getByLabelText("Mobile number"), {
      target: { value: "9876543210" },
    });

    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "mypassword123" },
    });

    fireEvent.click(screen.getByRole("button", { name: "Sign Up" }));

    await waitFor(() => {
      expect(signUp.email).toHaveBeenCalled();
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/send-sms",
        expect.any(Object)
      );
      expect(mockPush).toHaveBeenCalledWith("/user");
    });
  });

  test("shows alert when signup fails", async () => {
    const mockAlert = jest.spyOn(window, "alert").mockImplementation(() => {});

    (signUp.email as jest.Mock).mockResolvedValue({
      error: { message: "Signup failed" },
    });

    render(<SignupForm />);

    fireEvent.change(screen.getByLabelText("Name"), {
      target: { value: "John" },
    });

    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "john@example.com" },
    });

    fireEvent.change(screen.getByLabelText("Mobile number"), {
      target: { value: "9876543210" },
    });

    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "mypassword123" },
    });

    fireEvent.click(screen.getByRole("button", { name: "Sign Up" }));

    await waitFor(() => {
      expect(mockAlert).toHaveBeenCalledWith("Signup failed");
      expect(mockPush).not.toHaveBeenCalled();
    });
  });
});
