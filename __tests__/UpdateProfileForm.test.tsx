/**
 * @jest-environment jsdom
 */

const originalWarn = console.warn;
beforeAll(() => {
  console.warn = (...args: unknown[]) => {
    if (
      typeof args[0] === "string" &&
      args[0].includes("Missing `Description` or `aria-describedby`")
    ) {
      return; // ignore this Radix warning
    }
    originalWarn(...args);
  };
});

afterAll(() => {
  console.warn = originalWarn;
});

import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { userApi } from "@/app/lib/api-client";
import UpdateProfileForm from "@/app/components/feature/auth/UpdateProfileForm";

jest.mock("@/app/lib/api-client", () => ({
  userApi: {
    getProfile: jest.fn(),
    updateProfile: jest.fn(),
  },
}));

// Mock URL.createObjectURL to avoid errors
global.URL.createObjectURL = jest.fn(() => "blob:test-url");

describe("UpdateProfileForm", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("loads profile and renders editable fields", async () => {
    (userApi.getProfile as jest.Mock).mockResolvedValue({
      user: {
        name: "John Doe",
        image: "",
        role: "user",
        mobileNumber: "9876543210",
        id: "123",
        email: "john@example.com",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    });

    render(<UpdateProfileForm />);

    expect(screen.getByText(/loading profile/i)).toBeInTheDocument();

    // Wait for profile to load
    await screen.findByLabelText("First name");

    expect(screen.getByLabelText("First name")).toHaveValue("John");
    expect(screen.getByLabelText("Last name")).toHaveValue("Doe");
    expect(screen.getByLabelText("Mobile number")).toHaveValue("9876543210");
  });

  test("allows updating profile", async () => {
    (userApi.getProfile as jest.Mock).mockResolvedValue({
      user: {
        name: "John Doe",
        image: "",
        role: "user",
        mobileNumber: "9876543210",
      },
    });

    (userApi.updateProfile as jest.Mock).mockResolvedValue({});

    render(<UpdateProfileForm />);

    await screen.findByLabelText("First name");

    fireEvent.change(screen.getByLabelText("First name"), {
      target: { value: "Pavan" },
    });

    fireEvent.click(screen.getByRole("button", { name: /save changes/i }));

    await waitFor(() => {
      expect(userApi.updateProfile).toHaveBeenCalledWith({
        name: "Pavan Doe",
        mobileNumber: "9876543210",
      });
    });
  });

  test("shows success message", async () => {
    (userApi.getProfile as jest.Mock).mockResolvedValue({ user: {} });
    (userApi.updateProfile as jest.Mock).mockResolvedValue({});

    render(<UpdateProfileForm />);

    fireEvent.click(
      await screen.findByRole("button", { name: /save changes/i })
    );

    expect(
      await screen.findByText(/profile updated successfully/i)
    ).toBeInTheDocument();
  });

  test("handles update error", async () => {
    (userApi.getProfile as jest.Mock).mockResolvedValue({ user: {} });
    (userApi.updateProfile as jest.Mock).mockRejectedValue(
      new Error("Bad request")
    );

    render(<UpdateProfileForm />);

    fireEvent.click(
      await screen.findByRole("button", { name: /save changes/i })
    );

    expect(await screen.findByText(/bad request/i)).toBeInTheDocument();
  });

  test("handles image upload", async () => {
    (userApi.getProfile as jest.Mock).mockResolvedValue({ user: {} });

    const file = new File(["test"], "avatar.png", { type: "image/png" });

    render(<UpdateProfileForm />);

    // Wait until form renders after async profile load
    await screen.findByLabelText("First name");

    // File input is now in DOM
    const fileInput = screen.getByTestId("file-input");
    expect(fileInput).toBeInTheDocument();

    // Simulate file upload
    fireEvent.change(fileInput, { target: { files: [file] } });

    expect(URL.createObjectURL).toHaveBeenCalled();
  });
});
