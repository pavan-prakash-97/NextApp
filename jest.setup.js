import "@testing-library/jest-dom";

// Mock ResizeObserver
class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

global.ResizeObserver = ResizeObserver;

// Silence Radix warning
const originalWarn = console.warn;

console.warn = (...args) => {
  if (typeof args[0] === "string" && args[0].includes("Missing `Description`")) {
    return;
  }
  originalWarn(...args);
};
