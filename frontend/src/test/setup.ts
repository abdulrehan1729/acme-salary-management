import "@testing-library/jest-dom/vitest";

// jsdom doesn't implement ResizeObserver; recharts' ResponsiveContainer needs it to
// measure its container. A minimal no-op mock is enough for tests — we're not testing
// actual resize behavior, just that the chart renders without crashing.
class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

global.ResizeObserver = ResizeObserverMock;