import type {
  ContentBlock,
  TextBlock,
  CodeBlock,
  HeadingBlock,
  ListBlock,
  BlockquoteBlock,
  TableBlock,
  HrBlock,
} from "./types";

/**
 * Parses markdown text into structured ContentBlock array.
 * This allows streaming content to be rendered using the same
 * ContentBlockRenderer as finalized messages.
 */
export function parseMarkdownToBlocks(markdown: string): ContentBlock[] {
  if (!markdown.trim()) {
    return [];
  }

  const blocks: ContentBlock[] = [];
  const lines = markdown.split("\n");
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Skip empty lines
    if (line.trim() === "") {
      i++;
      continue;
    }

    // Horizontal rule: ---, ***, ___
    if (/^(\*{3,}|-{3,}|_{3,})$/.test(line.trim())) {
      blocks.push({ type: "hr" } as HrBlock);
      i++;
      continue;
    }

    // Heading: # through ######
    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      blocks.push({
        type: "heading",
        level: headingMatch[1].length as 1 | 2 | 3 | 4 | 5 | 6,
        text: headingMatch[2],
      } as HeadingBlock);
      i++;
      continue;
    }

    // Fenced code block: ``` or ~~~
    if (line.startsWith("```") || line.startsWith("~~~")) {
      const fence = line.startsWith("```") ? "```" : "~~~";
      const language = line.slice(3).trim() || undefined;
      const codeLines: string[] = [];
      i++;

      while (i < lines.length && !lines[i].startsWith(fence)) {
        codeLines.push(lines[i]);
        i++;
      }

      blocks.push({
        type: "code",
        code: codeLines.join("\n"),
        language,
      } as CodeBlock);
      i++; // Skip closing fence
      continue;
    }

    // Blockquote: >
    if (line.startsWith(">")) {
      const quoteLines: string[] = [];
      while (i < lines.length && lines[i].startsWith(">")) {
        // Remove the > prefix and optional space
        quoteLines.push(lines[i].replace(/^>\s?/, ""));
        i++;
      }
      blocks.push({
        type: "blockquote",
        text: quoteLines.join("\n"),
      } as BlockquoteBlock);
      continue;
    }

    // Ordered list: 1. or 1)
    if (/^\d+[.)]\s/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+[.)]\s/.test(lines[i])) {
        items.push(lines[i].replace(/^\d+[.)]\s/, ""));
        i++;
      }
      blocks.push({
        type: "list",
        items,
        ordered: true,
      } as ListBlock);
      continue;
    }

    // Unordered list: -, *, +
    if (/^[-*+]\s/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^[-*+]\s/.test(lines[i])) {
        items.push(lines[i].replace(/^[-*+]\s/, ""));
        i++;
      }
      blocks.push({
        type: "list",
        items,
        ordered: false,
      } as ListBlock);
      continue;
    }

    // Table: | header | header |
    if (line.includes("|") && line.trim().startsWith("|")) {
      const tableLines: string[] = [];
      while (
        i < lines.length &&
        lines[i].includes("|") &&
        lines[i].trim().startsWith("|")
      ) {
        tableLines.push(lines[i]);
        i++;
      }

      if (tableLines.length >= 2) {
        // Parse header row
        const headerRow = tableLines[0];
        const headers = headerRow
          .split("|")
          .filter((cell) => cell.trim() !== "")
          .map((cell) => cell.trim());

        // Skip separator row (| --- | --- |)
        const dataRows = tableLines.slice(2);
        const rows: string[][] = dataRows.map((row) =>
          row
            .split("|")
            .filter((cell) => cell.trim() !== "")
            .map((cell) => cell.trim())
        );

        blocks.push({
          type: "table",
          headers,
          rows,
        } as TableBlock);
      }
      continue;
    }

    // Regular text paragraph
    // Collect consecutive lines of text until we hit a special block
    const textLines: string[] = [];
    while (i < lines.length) {
      const currentLine = lines[i];

      // Stop if we hit a special block marker
      if (
        currentLine.trim() === "" ||
        /^#{1,6}\s/.test(currentLine) ||
        currentLine.startsWith("```") ||
        currentLine.startsWith("~~~") ||
        currentLine.startsWith(">") ||
        /^\d+[.)]\s/.test(currentLine) ||
        /^[-*+]\s/.test(currentLine) ||
        /^(\*{3,}|-{3,}|_{3,})$/.test(currentLine.trim()) ||
        (currentLine.includes("|") && currentLine.trim().startsWith("|"))
      ) {
        break;
      }

      textLines.push(currentLine);
      i++;
    }

    if (textLines.length > 0) {
      blocks.push({
        type: "text",
        text: textLines.join("\n"),
      } as TextBlock);
    }
  }

  return blocks;
}
