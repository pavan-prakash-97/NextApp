/**
 * @jest-environment jsdom
 */

import { render, screen } from "@testing-library/react";
import { auth } from "@/app/lib/auth";
import { getRedisClient } from "@/app/lib/redis";
import UserList from "@/app/components/feature/admin/UserList";
import { prisma } from "@/app/lib/prisma";

// -----------------------
// TYPE SAFE MOCKS
// -----------------------

interface CachedUser {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  role?: string | null;
  mobileNumber?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface MockRedisClient {
  get: jest.Mock<Promise<string | null>, [string]>;
  set: jest.Mock<Promise<void>, [string, string, Record<string, unknown>?]>;
}

interface MockAuth {
  api: {
    getSession: jest.Mock<
      Promise<{ user: { id: string } } | null>,
      [Record<string, string>]
    >;
  };
}

interface MockPrisma {
  user: {
    findUnique: jest.Mock<
      Promise<{ id: string; role?: string | null } | null>,
      [{ id: string }]
    >;
    findMany: jest.Mock<Promise<CachedUser[]>, [unknown?]>;
  };
}

// -----------------------
// MOCK NEXT HEADERS
// -----------------------

jest.mock("next/headers", () => ({
  headers: jest.fn().mockResolvedValue(new Map()),
}));

// -----------------------
// MOCK REDIRECT
// -----------------------

const redirectMock = jest.fn();
jest.mock("next/navigation", () => ({
  redirect: (path: string) => redirectMock(path),
}));

redirectMock.mockImplementation(() => {
  throw new Error("redirect");
});

// -----------------------
// MOCK AUTH
// -----------------------

jest.mock("@/app/lib/auth", () => ({
  auth: {
    api: {
      getSession: jest.fn(),
    },
  },
}));

// -----------------------
// MOCK PRISMA
// -----------------------

jest.mock("@/app/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
  },
}));

// -----------------------
// MOCK REDIS
// -----------------------

jest.mock("@/app/lib/redis", () => {
  return {
    // tell TS: this mock returns MockRedisClient (overrides real return type)
    getRedisClient: jest.fn(
      (): MockRedisClient => ({
        get: jest.fn(),
        set: jest.fn(),
      })
    ),
  };
});

// -----------------------
// APPLY STRICT TYPING TO MOCKED OBJECTS
// -----------------------

const typedAuth = auth as unknown as MockAuth;
const typedPrisma = prisma as unknown as MockPrisma;
// const typedRedis = getRedisClient as jest.Mock<MockRedisClient>;

// -----------------------
// TEST SUITE
// -----------------------

// const redisClient: MockRedisClient = {
//   get: jest.fn().mockResolvedValue(null),
//   set: jest.fn().mockResolvedValue(undefined),
// };

// -------------- MOCK REDIS CORRECTLY --------------
jest.mock("@/app/lib/redis", () => {
  return {
    getRedisClient: jest.fn(
      (): MockRedisClient => ({
        get: jest.fn(),
        set: jest.fn(),
      })
    ),
  };
});

// typed mock function
const mockGetRedisClient = getRedisClient as unknown as jest.MockedFunction<
  () => MockRedisClient
>;

describe("UserList", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.REDIS_URL = "redis://localhost";
  });

  test("redirects if session is null", async () => {
    typedAuth.api.getSession.mockResolvedValue(null);

    await expect(UserList()).rejects.toThrow("redirect");
  });

  test("redirects if user is not admin", async () => {
    typedAuth.api.getSession.mockResolvedValue({ user: { id: "u1" } });

    mockGetRedisClient.mockReturnValue({
      get: jest.fn().mockResolvedValue(null),
      set: jest.fn(),
    });

    typedPrisma.user.findUnique.mockResolvedValue({ id: "u1", role: "user" });

    await expect(UserList()).rejects.toThrow("redirect");
  });

  test("renders DB data when cache empty", async () => {
    typedAuth.api.getSession.mockResolvedValue({ user: { id: "admin1" } });

    typedPrisma.user.findUnique.mockResolvedValue({
      id: "admin1",
      role: "admin",
    });

 
    typedPrisma.user.findMany.mockResolvedValue([
      {
        id: "u2",
        name: "John Doe",
        email: "john@test.com",
        image: null,
        mobileNumber: "999",
        role: "user",
        createdAt: new Date("2024-01-01"),
        updatedAt: new Date("2024-01-02"),
      },
    ]);

    const ui = await UserList();
    render(ui);

    expect(screen.getByText("John Doe")).toBeInTheDocument();
    expect(screen.getByText("john@test.com")).toBeInTheDocument();
  });

test("renders cached data", async () => {
  typedAuth.api.getSession.mockResolvedValue({ user: { id: "admin1" } });

  typedPrisma.user.findUnique.mockResolvedValue({
    id: "admin1",
    role: "admin",
  });

  mockGetRedisClient.mockReturnValue({
    get: jest.fn().mockResolvedValue(
      JSON.stringify([
        {
          id: "u5",
          name: "Cached User",
          email: "cache@test.com",
          mobileNumber: "123",
          role: "user",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ])
    ),
    set: jest.fn(),
  });

  const ui = await UserList();
  render(ui);

  expect(screen.getByText("Cached User")).toBeInTheDocument();
});

});
