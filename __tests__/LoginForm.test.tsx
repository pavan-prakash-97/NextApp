/**
 * @jest-environment jsdom
 */

import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import LoginForm from "@/app/components/feature/auth/LoginForm";
import { useRouter } from "next/navigation";
import { signIn } from "@/app/lib/auth-client";
import { userApi } from "@/app/lib/api-client";

// --- MOCKS ---
jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
}));

jest.mock("@/app/lib/auth-client", () => ({
  signIn: {
    email: jest.fn(),
  },
}));

jest.mock("@/app/lib/api-client", () => ({
  userApi: {
    getRole: jest.fn(),
  },
}));

describe("LoginForm Component", () => {
  const mockPush = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({ push: mockPush });
  });

  test("renders email & password fields", () => {
    render(<LoginForm />);

    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toBeInTheDocument();
  });

  test("allows typing in email & password", () => {
    render(<LoginForm />);

    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "test@example.com" },
    });

    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "password123" },
    });

    expect(screen.getByLabelText("Email")).toHaveValue("test@example.com");
    expect(screen.getByLabelText("Password")).toHaveValue("password123");
  });

  test("password show/hide toggle works", () => {
    render(<LoginForm />);

    const passwordInput = screen.getByLabelText("Password") as HTMLInputElement;
    const toggleButton = screen.getByRole("button", {
      name: /show password/i,
    });

    expect(passwordInput.type).toBe("password");

    fireEvent.click(toggleButton);
    expect(passwordInput.type).toBe("text");

    fireEvent.click(toggleButton);
    expect(passwordInput.type).toBe("password");
  });

  test("successful login → admin navigates to /admin", async () => {
    (signIn.email as jest.Mock).mockResolvedValue({ error: null });
    (userApi.getRole as jest.Mock).mockResolvedValue({ role: { name: "admin" } });

    render(<LoginForm />);

    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "admin@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "password123" },
    });

    fireEvent.click(screen.getByRole("button", { name: /login/i }));

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/admin");
    });
  });

  test("successful login → normal user navigates to /user", async () => {
    (signIn.email as jest.Mock).mockResolvedValue({ error: null });
    (userApi.getRole as jest.Mock).mockResolvedValue({ role: { name: "user" } });

    render(<LoginForm />);

    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "user@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "password123" },
    });

    fireEvent.click(screen.getByRole("button", { name: /login/i }));

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/user");
    });
  });

  test("signIn error shows alert", async () => {
    const mockAlert = jest.spyOn(window, "alert").mockImplementation(() => {});

    (signIn.email as jest.Mock).mockResolvedValue({
      error: { message: "Invalid email or password" },
    });

    render(<LoginForm />);

    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "wrong@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "wrong" },
    });

    fireEvent.click(screen.getByRole("button", { name: /login/i }));

    await waitFor(() => {
      expect(mockAlert).toHaveBeenCalledWith("Invalid email or password");
      expect(mockPush).not.toHaveBeenCalled();
    });
  });
});
