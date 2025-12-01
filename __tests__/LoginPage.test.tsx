/**
 * @jest-environment jsdom
 */

import { render, screen } from "@testing-library/react";
import LoginPage from "@/app/(auth)/login/page";

// Mock LoginForm to avoid deep form behavior in this test
jest.mock("@/app/components/feature/auth/LoginForm", () => {
  return function MockLoginForm() {
    return <div data-testid="login-form" />;
  };
});

describe("LoginPage", () => {
  test("renders main heading (Next App)", () => {
    render(<LoginPage />);

    expect(
      screen.getByRole("heading", { name: /next app/i })
    ).toBeInTheDocument();
  });

  test("renders sub-heading (Login to your account)", () => {
    render(<LoginPage />);

    expect(
      screen.getByRole("heading", { name: /login to your account/i })
    ).toBeInTheDocument();
  });

  test("renders LoginForm", () => {
    render(<LoginPage />);

    expect(screen.getByTestId("login-form")).toBeInTheDocument();
  });

  test("renders register link", () => {
    render(<LoginPage />);

    const registerLink = screen.getByRole("link", { name: /register here/i });

    expect(registerLink).toBeInTheDocument();
    expect(registerLink).toHaveAttribute("href", "/register");
  });

  test("renders layout container", () => {
    render(<LoginPage />);

    const header = screen.getByRole("heading", { name: /next app/i });

    const container = header.closest("div"); // card container

    expect(container).toBeTruthy();
  });
});
