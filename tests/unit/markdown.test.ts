import { describe, it, expect } from "vitest";
import { isValidUrl, validateMessage, MAX_MESSAGE_LENGTH } from "@/lib/markdown";

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
