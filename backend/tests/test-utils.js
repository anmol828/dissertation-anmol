import jwt from "jsonwebtoken";
import { jest } from "@jest/globals";

const fn = () => jest.fn();

export const mockPrisma = {
  user: {
    findUnique: fn(),
    count: fn(),
    create: fn()
  },
  venue: {
    findMany: fn(),
    findUnique: fn(),
    findFirst: fn(),
    update: fn()
  },
  venueImage: {
    deleteMany: fn(),
    createMany: fn()
  },
  venuePricingRule: {
    deleteMany: fn(),
    createMany: fn()
  },
  court: {
    findUnique: fn(),
    update: fn(),
    create: fn()
  },
  booking: {
    findMany: fn(),
    findFirst: fn(),
    findUnique: fn(),
    create: fn(),
    update: fn(),
    count: fn(),
    aggregate: fn()
  },
  team: {
    findMany: fn(),
    findUnique: fn(),
    create: fn(),
    update: fn(),
    delete: fn()
  },
  teamMember: {
    findMany: fn(),
    findFirst: fn(),
    create: fn(),
    createMany: fn(),
    delete: fn(),
    deleteMany: fn()
  },
  recruitmentPost: {
    findMany: fn(),
    findUnique: fn(),
    create: fn(),
    update: fn()
  },
  recruitmentRequest: {
    findMany: fn(),
    findFirst: fn(),
    findUnique: fn(),
    create: fn(),
    update: fn()
  },
  playerProfile: {
    findUnique: fn()
  },
  $transaction: jest.fn(async (callback) => callback(mockPrisma))
};

jest.unstable_mockModule("../src/config/db.js", () => ({
  prisma: mockPrisma
}));

jest.unstable_mockModule("morgan", () => ({
  default: () => (req, res, next) => next()
}));

export const getApp = async () => {
  const module = await import("../src/app.js");
  return module.default;
};

export const resetPrismaMocks = () => {
  const resetObject = (value) => {
    Object.values(value).forEach((entry) => {
      if (jest.isMockFunction(entry)) {
        entry.mockReset();
      } else if (entry && typeof entry === "object") {
        resetObject(entry);
      }
    });
  };

  resetObject(mockPrisma);
  mockPrisma.$transaction.mockImplementation(async (callback) => callback(mockPrisma));
};

export const authHeader = (userId = 1, role = "USER") => ({
  Authorization: `Bearer ${jwt.sign(
    { userId, role },
    process.env.JWT_ACCESS_TOKEN_SECRET || "access-secret"
  )}`
});

export const activeUser = (overrides = {}) => ({
  id: 1,
  name: "Test User",
  email: "test@example.com",
  role: "USER",
  isActive: true,
  ...overrides
});
