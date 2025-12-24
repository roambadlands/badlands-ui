import type { Options } from "rehype-sanitize";

// Allowed URL protocols
const allowedProtocols = ["http", "https", "mailto"];

/**
 * Validates a URL to prevent XSS attacks
 */
export function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return allowedProtocols.includes(parsed.protocol.replace(":", ""));
  } catch {
    // Relative URLs are allowed
    if (url.startsWith("/") || url.startsWith("#")) {
      return true;
    }
    return false;
  }
}

/**
 * Sanitization options for rehype-sanitize
 * Based on GitHub's sanitization schema with additional restrictions
 */
export const sanitizeOptions: Options = {
  strip: ["script", "style", "iframe", "object", "embed", "form", "input"],
  tagNames: [
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6",
    "p",
    "br",
    "hr",
    "blockquote",
    "pre",
    "code",
    "em",
    "strong",
    "del",
    "a",
    "ul",
    "ol",
    "li",
    "table",
    "thead",
    "tbody",
    "tr",
    "th",
    "td",
    "img",
    "span",
    "div",
    "sup",
    "sub",
  ],
  attributes: {
    a: ["href", "title"],
    img: ["src", "alt", "title", "width", "height"],
    code: ["className"],
    pre: ["className"],
    span: ["className"],
    div: ["className"],
    "*": ["className"],
  },
  protocols: {
    href: ["http", "https", "mailto"],
    src: ["http", "https", "data"],
  },
  ancestors: {
    li: ["ul", "ol"],
    tr: ["table", "thead", "tbody"],
    th: ["tr"],
    td: ["tr"],
  },
  required: {
    a: { href: true },
    img: { src: true, alt: true },
  },
};

/**
 * Maximum allowed message length (32KB)
 */
export const MAX_MESSAGE_LENGTH = 32 * 1024;

/**
 * Validates message content
 */
export function validateMessage(content: string): { valid: boolean; error?: string } {
  if (!content || content.trim().length === 0) {
    return { valid: false, error: "Message cannot be empty" };
  }

  if (content.length > MAX_MESSAGE_LENGTH) {
    return {
      valid: false,
      error: `Message exceeds maximum length of ${MAX_MESSAGE_LENGTH} characters`,
    };
  }

  return { valid: true };
}
