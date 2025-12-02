import "@testing-library/jest-dom";

// Mock ResizeObserver
class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
global.ResizeObserver = ResizeObserver;

// Silence noisy Radix warnings
const originalWarn = console.warn;
console.warn = (...args) => {
  if (args[0]?.includes?.("Missing `Description`")) return;
  originalWarn(...args);
};

// Mock Next.js <Image />
jest.mock("next/image", () => ({
  __esModule: true,
  default: (props) => <img {...props} alt={props.alt || "image"} />,
}));

// Fix createObjectURL
global.URL.createObjectURL = jest.fn(() => "blob:mock-url)");
global.URL.revokeObjectURL = jest.fn();
