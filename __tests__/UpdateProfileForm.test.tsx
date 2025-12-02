import { render, screen, fireEvent } from "@testing-library/react";
import { useUser } from "@/app/context/userContext";
import UpdateProfileForm from "@/app/components/feature/auth/UpdateProfileForm";

// ⭐ MOCK user context
jest.mock("@/app/context/userContext", () => ({
  useUser: jest.fn(),
}));

describe("UpdateProfileForm", () => {
  beforeEach(() => {
    (useUser as jest.Mock).mockReturnValue({
      user: {
        id: "user123",
        name: "John Doe",
        email: "john@example.com",
        role: "user",
        mobileNumber: "+91 9876543210",
        profilePicLarge: "",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      refreshUser: jest.fn(),
    });
  });

  it("renders the profile form", () => {
    render(<UpdateProfileForm />);
    expect(screen.getByText("Edit Profile")).toBeInTheDocument();
  });

  it("renders input fields", () => {
    render(<UpdateProfileForm />);

    expect(screen.getByLabelText("First name")).toBeInTheDocument();
    expect(screen.getByLabelText("Last name")).toBeInTheDocument();
    expect(screen.getByLabelText("Mobile number")).toBeInTheDocument();
  });

  it("renders file input for image upload", () => {
    render(<UpdateProfileForm />);

    const fileInput = screen.getByTestId("file-input");
    expect(fileInput).toBeInTheDocument();
  });

  it("allows updating first name", () => {
    render(<UpdateProfileForm />);

    const firstNameInput = screen.getByLabelText("First name");
    fireEvent.change(firstNameInput, { target: { value: "Jane" } });

    expect(firstNameInput).toHaveValue("Jane");
  });

  it("renders save button", () => {
    render(<UpdateProfileForm />);
    const button = screen.getByRole("button", { name: /save changes/i });

    expect(button).toBeInTheDocument();
  });
});
