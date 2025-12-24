"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";
import { cn } from "@/lib/utils";
import { CodeBlock as CodeBlockComponent } from "./code-block";
import { MermaidDiagram } from "./mermaid-diagram";
import type {
  ContentBlock,
  TextBlock,
  CodeBlock,
  HeadingBlock,
  ListBlock,
  BlockquoteBlock,
  TableBlock,
} from "@/lib/types";

interface ContentBlockRendererProps {
  blocks: ContentBlock[];
}

/**
 * Renders an array of structured content blocks.
 * Each block type has its own dedicated renderer for optimal display.
 */
export function ContentBlockRenderer({ blocks }: ContentBlockRendererProps) {
  return (
    <div className="space-y-4">
      {blocks.map((block, index) => (
        <BlockRenderer key={index} block={block} />
      ))}
    </div>
  );
}

interface BlockRendererProps {
  block: ContentBlock;
}

function BlockRenderer({ block }: BlockRendererProps) {
  switch (block.type) {
    case "text":
      return <TextBlockRenderer block={block} />;
    case "code":
      return <CodeBlockRenderer block={block} />;
    case "heading":
      return <HeadingBlockRenderer block={block} />;
    case "list":
      return <ListBlockRenderer block={block} />;
    case "blockquote":
      return <BlockquoteRenderer block={block} />;
    case "table":
      return <TableBlockRenderer block={block} />;
    case "hr":
      return <hr className="my-6 border-border" />;
    default:
      return null;
  }
}

/**
 * Text blocks may contain inline markdown (bold, italic, links, inline code).
 * We use react-markdown with minimal plugins to render these.
 */
function TextBlockRenderer({ block }: { block: TextBlock }) {
  return (
    <div className="prose prose-sm dark:prose-invert max-w-none">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkBreaks]}
        components={{
          // Prevent wrapping in <p> for cleaner inline rendering
          p: ({ children }) => <span className="block">{children}</span>,
          code: ({ children }) => (
            <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono">
              {children}
            </code>
          ),
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline break-all"
            >
              {children}
            </a>
          ),
        }}
      >
        {block.text}
      </ReactMarkdown>
    </div>
  );
}

/**
 * Code blocks with syntax highlighting, language label, and copy button.
 * Special handling for mermaid diagrams.
 */
function CodeBlockRenderer({ block }: { block: CodeBlock }) {
  const language = block.language || "text";

  // Handle Mermaid diagrams
  if (language === "mermaid") {
    return <MermaidDiagram>{block.code}</MermaidDiagram>;
  }

  return <CodeBlockComponent language={language}>{block.code}</CodeBlockComponent>;
}

/**
 * Heading blocks render as h1-h6 based on level.
 */
function HeadingBlockRenderer({ block }: { block: HeadingBlock }) {
  const sizeClasses: Record<number, string> = {
    1: "text-2xl font-bold",
    2: "text-xl font-bold",
    3: "text-lg font-semibold",
    4: "text-base font-semibold",
    5: "text-sm font-semibold",
    6: "text-sm font-medium text-muted-foreground",
  };

  const className = cn(sizeClasses[block.level], "mt-4 first:mt-0");

  switch (block.level) {
    case 1:
      return <h1 className={className}>{block.text}</h1>;
    case 2:
      return <h2 className={className}>{block.text}</h2>;
    case 3:
      return <h3 className={className}>{block.text}</h3>;
    case 4:
      return <h4 className={className}>{block.text}</h4>;
    case 5:
      return <h5 className={className}>{block.text}</h5>;
    case 6:
      return <h6 className={className}>{block.text}</h6>;
    default:
      return <h2 className={className}>{block.text}</h2>;
  }
}

/**
 * List blocks render as <ul> or <ol> based on ordered flag.
 * List items may contain inline markdown.
 */
function ListBlockRenderer({ block }: { block: ListBlock }) {
  const ListTag = block.ordered ? "ol" : "ul";

  return (
    <ListTag
      className={cn(
        "pl-6 space-y-1",
        block.ordered ? "list-decimal" : "list-disc"
      )}
    >
      {block.items.map((item, index) => (
        <li key={index} className="prose prose-sm dark:prose-invert">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              p: ({ children }) => <>{children}</>,
              code: ({ children }) => (
                <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono">
                  {children}
                </code>
              ),
              a: ({ href, children }) => (
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline break-all"
                >
                  {children}
                </a>
              ),
            }}
          >
            {item}
          </ReactMarkdown>
        </li>
      ))}
    </ListTag>
  );
}

/**
 * Blockquote with styled left border.
 * Text may contain inline markdown.
 */
function BlockquoteRenderer({ block }: { block: BlockquoteBlock }) {
  return (
    <blockquote className="border-l-4 border-muted-foreground/30 pl-4 italic text-muted-foreground">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkBreaks]}
        components={{
          p: ({ children }) => <span className="block">{children}</span>,
          code: ({ children }) => (
            <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono">
              {children}
            </code>
          ),
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline break-all"
            >
              {children}
            </a>
          ),
        }}
      >
        {block.text}
      </ReactMarkdown>
    </blockquote>
  );
}

/**
 * Table with headers and data rows.
 * Cell content may contain inline markdown.
 */
function TableBlockRenderer({ block }: { block: TableBlock }) {
  return (
    <div className="overflow-x-auto my-4">
      <table className="min-w-full border-collapse border border-border">
        <thead>
          <tr>
            {block.headers.map((header, index) => (
              <th
                key={index}
                className="border border-border bg-muted px-3 py-2 text-left font-semibold"
              >
                <InlineMarkdown text={header} />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {block.rows.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {row.map((cell, cellIndex) => (
                <td key={cellIndex} className="border border-border px-3 py-2">
                  <InlineMarkdown text={cell} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * Helper component for rendering inline markdown in table cells and other contexts.
 */
function InlineMarkdown({ text }: { text: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        p: ({ children }) => <>{children}</>,
        code: ({ children }) => (
          <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono">
            {children}
          </code>
        ),
        a: ({ href, children }) => (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline break-all"
          >
            {children}
          </a>
        ),
      }}
    >
      {text}
    </ReactMarkdown>
  );
}
