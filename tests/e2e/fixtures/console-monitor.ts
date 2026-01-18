import { Page, ConsoleMessage } from "@playwright/test";

export interface ConsoleError {
  text: string;
  type: string;
  location: string;
  timestamp: Date;
}

/**
 * Monitors browser console for errors during E2E tests.
 * Collects console.error messages and provides assertion helpers.
 */
export class ConsoleMonitor {
  private errors: ConsoleError[] = [];
  private warnings: ConsoleError[] = [];
  private page: Page;

  // Patterns to ignore (e.g., known third-party issues)
  private ignorePatterns: RegExp[] = [
    // React hydration warnings in dev mode
    /Warning: Text content did not match/,
    // Next.js fast refresh messages
    /\[Fast Refresh\]/,
    // Sentry initialization messages
    /Sentry Logger/,
    // Expected 401 errors when not logged in
    /Failed to load resource.*401/,
    /the server responded with a status of 401/,
  ];

  constructor(page: Page) {
    this.page = page;
    this.setupListeners();
  }

  private setupListeners(): void {
    this.page.on("console", (msg: ConsoleMessage) => {
      const type = msg.type();
      const text = msg.text();

      // Check if this message should be ignored
      if (this.shouldIgnore(text)) {
        return;
      }

      const entry: ConsoleError = {
        text,
        type,
        location: msg.location().url || "unknown",
        timestamp: new Date(),
      };

      if (type === "error") {
        this.errors.push(entry);
      } else if (type === "warning") {
        this.warnings.push(entry);
      }
    });

    // Also capture page errors (uncaught exceptions)
    this.page.on("pageerror", (error: Error) => {
      if (this.shouldIgnore(error.message)) {
        return;
      }

      this.errors.push({
        text: `Uncaught: ${error.message}`,
        type: "pageerror",
        location: error.stack || "unknown",
        timestamp: new Date(),
      });
    });
  }

  private shouldIgnore(text: string): boolean {
    return this.ignorePatterns.some((pattern) => pattern.test(text));
  }

  /**
   * Add a pattern to ignore.
   */
  addIgnorePattern(pattern: RegExp): void {
    this.ignorePatterns.push(pattern);
  }

  /**
   * Get all collected errors.
   */
  getErrors(): ConsoleError[] {
    return [...this.errors];
  }

  /**
   * Get all collected warnings.
   */
  getWarnings(): ConsoleError[] {
    return [...this.warnings];
  }

  /**
   * Check if any errors were collected.
   */
  hasErrors(): boolean {
    return this.errors.length > 0;
  }

  /**
   * Clear all collected errors and warnings.
   */
  clear(): void {
    this.errors = [];
    this.warnings = [];
  }

  /**
   * Assert that no console errors occurred.
   * Throws an error with details if any errors were found.
   */
  assertNoErrors(): void {
    if (this.errors.length === 0) {
      return;
    }

    const errorDetails = this.errors
      .map(
        (e, i) =>
          `  ${i + 1}. [${e.type}] ${e.text}\n     Location: ${e.location}`
      )
      .join("\n");

    throw new Error(
      `Console errors detected (${this.errors.length}):\n${errorDetails}`
    );
  }

  /**
   * Assert that no console warnings occurred.
   */
  assertNoWarnings(): void {
    if (this.warnings.length === 0) {
      return;
    }

    const warningDetails = this.warnings
      .map((w, i) => `  ${i + 1}. ${w.text}`)
      .join("\n");

    throw new Error(
      `Console warnings detected (${this.warnings.length}):\n${warningDetails}`
    );
  }

  /**
   * Get a summary string of all errors.
   */
  getSummary(): string {
    if (this.errors.length === 0 && this.warnings.length === 0) {
      return "No console errors or warnings";
    }

    const parts: string[] = [];
    if (this.errors.length > 0) {
      parts.push(`${this.errors.length} error(s)`);
    }
    if (this.warnings.length > 0) {
      parts.push(`${this.warnings.length} warning(s)`);
    }

    return parts.join(", ");
  }
}
