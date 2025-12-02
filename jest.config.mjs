// import nextJest from "next/jest.js";

// const createJestConfig = nextJest({
//   dir: "./",
// });

// /** @type {import('jest').Config} */
// const customJestConfig = {
//   testEnvironment: "jsdom",
//   setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],

//   // ⭐ Fix path alias '@/*'
//   moduleNameMapper: {
//     "^@/(.*)$": "<rootDir>/$1",
//   },
// };

// export default createJestConfig(customJestConfig);

import nextJest from "next/jest.js";

const createJestConfig = nextJest({
  dir: "./",
});

/** @type {import('jest').Config} */
const customJestConfig = {
  testEnvironment: "jsdom",

  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],

  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
  },

  // Required for ESM mocking (unstable_mockModule)
  transform: {},

  // ⬅️ FIXED — Only TS files included
  extensionsToTreatAsEsm: [".ts", ".tsx"],

  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json"],
};

export default createJestConfig(customJestConfig);
