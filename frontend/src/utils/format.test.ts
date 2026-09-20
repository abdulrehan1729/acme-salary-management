import { describe, it, expect } from "vitest";
import { formatUsd, formatDate, titleCase } from "./format";

describe("formatUsd", () => {
  it("formats a whole-dollar amount with no decimals", () => {
    expect(formatUsd(95000)).toBe("$95,000");
  });

  it("rounds fractional amounts", () => {
    expect(formatUsd(95000.6)).toBe("$95,001");
  });

  it("formats zero", () => {
    expect(formatUsd(0)).toBe("$0");
  });
});

describe("formatDate", () => {
  it("formats an ISO date string", () => {
    expect(formatDate("2024-03-15")).toBe("Mar 15, 2024");
  });

  it("returns a dash for an empty string", () => {
    expect(formatDate("")).toBe("-");
  });

  it("returns the original string for an unparsable date", () => {
    expect(formatDate("not-a-date")).toBe("not-a-date");
  });
});

describe("titleCase", () => {
  it("converts SCREAMING_SNAKE_CASE to Title Case", () => {
    expect(titleCase("MERIT_INCREASE")).toBe("Merit Increase");
  });

  it("handles a single word", () => {
    expect(titleCase("ACTIVE")).toBe("Active");
  });
});