import { describe, it, expect } from "vitest";
import { isValidUrl, validateMessage, MAX_MESSAGE_LENGTH, convertAsciiTablesToMarkdown } from "@/lib/markdown";

describe("isValidUrl", () => {
  it("should accept valid http URLs", () => {
    expect(isValidUrl("http://example.com")).toBe(true);
    expect(isValidUrl("http://example.com/path?query=1")).toBe(true);
  });

  it("should accept valid https URLs", () => {
    expect(isValidUrl("https://example.com")).toBe(true);
    expect(isValidUrl("https://example.com/path")).toBe(true);
  });

  it("should accept mailto URLs", () => {
    expect(isValidUrl("mailto:test@example.com")).toBe(true);
  });

  it("should accept relative URLs", () => {
    expect(isValidUrl("/path/to/page")).toBe(true);
    expect(isValidUrl("#section")).toBe(true);
  });

  it("should reject javascript URLs", () => {
    expect(isValidUrl("javascript:alert(1)")).toBe(false);
  });

  it("should reject data URLs in isValidUrl", () => {
    expect(isValidUrl("data:text/html,<script>alert(1)</script>")).toBe(false);
  });

  it("should reject invalid URLs", () => {
    expect(isValidUrl("not-a-url")).toBe(false);
  });
});

describe("validateMessage", () => {
  it("should accept valid messages", () => {
    const result = validateMessage("Hello, world!");
    expect(result.valid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it("should reject empty messages", () => {
    const result = validateMessage("");
    expect(result.valid).toBe(false);
    expect(result.error).toBe("Message cannot be empty");
  });

  it("should reject whitespace-only messages", () => {
    const result = validateMessage("   ");
    expect(result.valid).toBe(false);
    expect(result.error).toBe("Message cannot be empty");
  });

  it("should reject messages exceeding max length", () => {
    const longMessage = "a".repeat(MAX_MESSAGE_LENGTH + 1);
    const result = validateMessage(longMessage);
    expect(result.valid).toBe(false);
    expect(result.error).toContain("exceeds maximum length");
  });

  it("should accept messages at exactly max length", () => {
    const maxMessage = "a".repeat(MAX_MESSAGE_LENGTH);
    const result = validateMessage(maxMessage);
    expect(result.valid).toBe(true);
  });
});

describe("convertAsciiTablesToMarkdown", () => {
  it("should convert simple ASCII table to markdown", () => {
    const input = `+-------+-------+
| Field | Value |
+-------+-------+
| From  | BTC   |
| To    | ETH   |
+-------+-------+`;

    const expected = `| Field | Value |
|---|---|
| From | BTC |
| To | ETH |`;

    expect(convertAsciiTablesToMarkdown(input)).toBe(expected);
  });

  it("should handle multiple tables", () => {
    const input = `Table 1:
+------+------+
| A    | B    |
+------+------+
| 1    | 2    |
+------+------+

Table 2:
+------+------+
| X    | Y    |
+------+------+
| 3    | 4    |
+------+------+`;

    const result = convertAsciiTablesToMarkdown(input);
    expect(result).toContain("| A | B |");
    expect(result).toContain("| 1 | 2 |");
    expect(result).toContain("| X | Y |");
    expect(result).toContain("| 3 | 4 |");
    expect(result).toContain("|---|---|");
    expect(result).toContain("Table 1:");
    expect(result).toContain("Table 2:");
  });

  it("should handle tables with more columns", () => {
    const input = `+------+------+------+
| Fee  | Base | ETH  |
+------+------+------+
| Liq  | 1000 | 0.01 |
+------+------+------+`;

    const expected = `| Fee | Base | ETH |
|---|---|---|
| Liq | 1000 | 0.01 |`;

    expect(convertAsciiTablesToMarkdown(input)).toBe(expected);
  });

  it("should preserve non-table content", () => {
    const input = `Here is some text.

And more text after.`;

    expect(convertAsciiTablesToMarkdown(input)).toBe(input);
  });

  it("should handle content before and after tables", () => {
    const input = `Summary:
+------+------+
| A    | B    |
+------+------+
| 1    | 2    |
+------+------+
End of table.`;

    const result = convertAsciiTablesToMarkdown(input);
    expect(result).toContain("Summary:");
    expect(result).toContain("| A | B |");
    expect(result).toContain("End of table.");
  });

  it("should handle empty input", () => {
    expect(convertAsciiTablesToMarkdown("")).toBe("");
  });
});
