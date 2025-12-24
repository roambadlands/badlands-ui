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
  strip: ["script", "style", "iframe", "object", "embed", "form"],
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
    // Collapsible sections
    "details",
    "summary",
    // Task list checkboxes
    "input",
    // KaTeX math elements
    "math",
    "semantics",
    "mrow",
    "mi",
    "mo",
    "mn",
    "msup",
    "msub",
    "mfrac",
    "msqrt",
    "mroot",
    "mover",
    "munder",
    "munderover",
    "mtable",
    "mtr",
    "mtd",
    "mtext",
    "mspace",
    "annotation",
    // SVG for mermaid diagrams
    "svg",
    "g",
    "path",
    "rect",
    "circle",
    "ellipse",
    "line",
    "polyline",
    "polygon",
    "text",
    "tspan",
    "defs",
    "marker",
    "use",
    "clipPath",
    "foreignObject",
  ],
  attributes: {
    a: ["href", "title"],
    img: ["src", "alt", "title", "width", "height", "loading"],
    code: ["className"],
    pre: ["className"],
    span: ["className", "style"],
    div: ["className", "style"],
    details: ["open"],
    // Task list checkbox (disabled, readonly)
    input: ["type", "checked", "disabled"],
    // SVG attributes
    svg: ["className", "viewBox", "width", "height", "xmlns", "style", "aria-hidden", "role"],
    g: ["className", "transform", "style"],
    path: ["d", "fill", "stroke", "strokeWidth", "className", "style", "markerEnd", "markerStart"],
    rect: ["x", "y", "width", "height", "rx", "ry", "fill", "stroke", "strokeWidth", "className", "style"],
    circle: ["cx", "cy", "r", "fill", "stroke", "strokeWidth", "className", "style"],
    ellipse: ["cx", "cy", "rx", "ry", "fill", "stroke", "strokeWidth", "className", "style"],
    line: ["x1", "y1", "x2", "y2", "stroke", "strokeWidth", "className", "style", "markerEnd"],
    polyline: ["points", "fill", "stroke", "strokeWidth", "className", "style"],
    polygon: ["points", "fill", "stroke", "strokeWidth", "className", "style"],
    text: ["x", "y", "dx", "dy", "textAnchor", "dominantBaseline", "className", "style", "fill"],
    tspan: ["x", "y", "dx", "dy", "className", "style"],
    defs: [],
    marker: ["id", "markerWidth", "markerHeight", "refX", "refY", "orient", "markerUnits"],
    use: ["href", "x", "y", "width", "height"],
    clipPath: ["id"],
    foreignObject: ["x", "y", "width", "height"],
    // Math elements
    math: ["xmlns", "display"],
    annotation: ["encoding"],
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

/**
 * Converts ASCII-art tables to GitHub Flavored Markdown tables.
 * Handles tables with +---+ borders and | cell | separators.
 *
 * Example input:
 * +-------+-------+
 * | Field | Value |
 * +-------+-------+
 * | From  | BTC   |
 * +-------+-------+
 *
 * Example output:
 * | Field | Value |
 * |-------|-------|
 * | From  | BTC   |
 */
export function convertAsciiTablesToMarkdown(content: string): string {
  // Match ASCII table blocks (lines starting with + or |)
  const lines = content.split("\n");
  const result: string[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Check if this line starts an ASCII table (border line like +---+---+)
    if (/^\s*\+[-+]+\+\s*$/.test(line)) {
      const tableLines: string[] = [];
      const tableIndent = line.match(/^(\s*)/)?.[1] || "";

      // Collect all lines that are part of this table
      while (i < lines.length) {
        const currentLine = lines[i];
        const trimmedLine = currentLine.trim();

        // Check if it's a border line (+---+) or content line (| ... |)
        if (/^\+[-+]+\+$/.test(trimmedLine) || /^\|.*\|$/.test(trimmedLine)) {
          tableLines.push(trimmedLine);
          i++;
        } else {
          break;
        }
      }

      // Convert ASCII table to markdown
      const markdownTable = convertSingleAsciiTable(tableLines);
      // Add back the original indentation
      result.push(
        ...markdownTable.map((l) => (l ? tableIndent + l : l))
      );
    } else {
      result.push(line);
      i++;
    }
  }

  return result.join("\n");
}

/**
 * Converts a single ASCII table (array of lines) to markdown format
 */
function convertSingleAsciiTable(lines: string[]): string[] {
  const result: string[] = [];
  let headerProcessed = false;
  let headerColumnCount = 0;

  for (const line of lines) {
    // Skip border lines (they look like +---+---+)
    if (/^\+[-+]+\+$/.test(line)) {
      // After the first content row, add the markdown separator
      if (result.length === 1 && !headerProcessed) {
        // Create separator based on the number of columns in the header
        headerProcessed = true;
        const separator =
          "|" + Array(headerColumnCount).fill("---").join("|") + "|";
        result.push(separator);
      }
      continue;
    }

    // Process content lines (| cell | cell |)
    if (/^\|.*\|$/.test(line)) {
      // Extract cells, trim whitespace, and rejoin
      const cells = line
        .split("|")
        .slice(1, -1) // Remove first and last empty elements
        .map((cell) => cell.trim());

      if (result.length === 0) {
        headerColumnCount = cells.length;
      }

      result.push("| " + cells.join(" | ") + " |");
    }
  }

  return result;
}
