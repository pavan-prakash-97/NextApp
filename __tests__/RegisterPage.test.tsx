/**
 * @jest-environment jsdom
 */

import { render, screen } from "@testing-library/react";
import RegisterPage from "@/app/(auth)/register/page";

// Mock SignupForm to avoid deeper form logic
jest.mock("@/app/components/feature/auth/SignupForm", () => {
  return function MockSignupForm() {
    return <div data-testid="signup-form" />;
  };
});

describe("RegisterPage", () => {
  test("renders page heading", () => {
    render(<RegisterPage />);
    expect(
      screen.getByRole("heading", { name: /create your account/i })
    ).toBeInTheDocument();
  });

  test("renders SignupForm", () => {
    render(<RegisterPage />);
    expect(screen.getByTestId("signup-form")).toBeInTheDocument();
  });

  test("renders login link", () => {
    render(<RegisterPage />);

    const loginLink = screen.getByRole("link", { name: /login here/i });
    expect(loginLink).toBeInTheDocument();
    expect(loginLink).toHaveAttribute("href", "/login");
  });

  test("renders layout container", () => {
    render(<RegisterPage />);

    const header = screen.getByRole("heading", { name: /create your account/i });
    const container = header.closest("div"); // parent wrapper

    expect(container).toBeTruthy();
  });
});
