"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";
import katex from "katex";
import DOMPurify from "isomorphic-dompurify";
import { ChevronRight, Info, AlertTriangle, Lightbulb, AlertCircle, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import { CodeBlock as CodeBlockComponent } from "./code-block";
import { MermaidDiagram } from "./mermaid-diagram";
import { ChartBlockRenderer } from "./chart-block";
import type {
  ContentBlock,
  TextBlock,
  CodeBlock,
  HeadingBlock,
  ListBlock,
  BlockquoteBlock,
  TableBlock,
  MathBlock,
  TaskListBlock,
  CalloutBlock,
  ImageBlock,
  DetailsBlock,
  ChartBlock,
  CalloutType,
} from "@/lib/types";

import "katex/dist/katex.min.css";
import { ContentBlockErrorBoundary } from "@/components/error-boundary";

interface ContentBlockRendererProps {
  blocks: ContentBlock[];
}

/**
 * Renders an array of structured content blocks.
 * Each block type has its own dedicated renderer for optimal display.
 * Individual blocks are wrapped in error boundaries to prevent one failed block
 * from breaking the entire message.
 */
export function ContentBlockRenderer({ blocks }: ContentBlockRendererProps) {
  return (
    <div className="space-y-4">
      {blocks.map((block, index) => (
        <ContentBlockErrorBoundary key={index}>
          <BlockRenderer block={block} />
        </ContentBlockErrorBoundary>
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
    case "math":
      return <MathBlockRenderer block={block} />;
    case "tasklist":
      return <TaskListBlockRenderer block={block} />;
    case "callout":
      return <CalloutBlockRenderer block={block} />;
    case "image":
      return <ImageBlockRenderer block={block} />;
    case "details":
      return <DetailsBlockRenderer block={block} />;
    case "chart":
      return <ChartBlockRenderer block={block as ChartBlock} />;
    default:
      return null;
  }
}

/**
 * Text blocks may contain inline markdown (bold, italic, links, inline code).
 * We use react-markdown with minimal plugins to render these.
 */
function TextBlockRenderer({ block }: { block: TextBlock }) {
  // Check if text has multiple paragraphs (needs block display)
  const hasMultipleParagraphs = block.text.includes("\n\n");

  return (
    <div className="prose prose-sm dark:prose-invert max-w-none">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkBreaks]}
        components={{
          // Use inline display for single paragraphs to avoid trailing newline on copy
          p: ({ children }) => (
            <span className={hasMultipleParagraphs ? "block" : "inline"}>
              {children}
            </span>
          ),
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
 * Text may contain inline markdown (bold, italic, code, links).
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
  const content = <InlineMarkdown text={block.text} />;

  switch (block.level) {
    case 1:
      return <h1 className={className}>{content}</h1>;
    case 2:
      return <h2 className={className}>{content}</h2>;
    case 3:
      return <h3 className={className}>{content}</h3>;
    case 4:
      return <h4 className={className}>{content}</h4>;
    case 5:
      return <h5 className={className}>{content}</h5>;
    case 6:
      return <h6 className={className}>{content}</h6>;
    default:
      return <h2 className={className}>{content}</h2>;
  }
}

/**
 * List blocks render as <ul> or <ol> based on ordered flag.
 * List items may contain inline markdown and preserve newlines.
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
            remarkPlugins={[remarkGfm, remarkBreaks]}
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

/**
 * Math block rendered using KaTeX.
 * Display math is centered and block-level, inline math is inline.
 * Output is sanitized with DOMPurify for security.
 */
function MathBlockRenderer({ block }: { block: MathBlock }) {
  const html = katex.renderToString(block.math, {
    throwOnError: false,
    displayMode: !block.inline,
    output: "html",
  });

  // Sanitize KaTeX output - allow only KaTeX-specific elements and classes
  const sanitizedHtml = DOMPurify.sanitize(html, {
    ADD_TAGS: ["semantics", "annotation", "mrow", "mi", "mo", "mn", "msup", "msub", "mfrac", "mroot", "msqrt", "mspace", "mtext", "mover", "munder", "munderover", "mtable", "mtr", "mtd", "menclose"],
    ADD_ATTR: ["encoding", "mathvariant", "stretchy", "fence", "separator", "lspace", "rspace", "accent", "accentunder", "columnalign", "rowalign", "columnspacing", "rowspacing", "notation"],
  });

  if (block.inline) {
    return (
      <span
        className="inline"
        dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
      />
    );
  }

  return (
    <div
      className="my-4 flex justify-center overflow-x-auto"
      dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
    />
  );
}

/**
 * Task list with checkboxes.
 */
function TaskListBlockRenderer({ block }: { block: TaskListBlock }) {
  return (
    <ul className="list-none pl-0 space-y-1">
      {block.tasks.map((task, index) => (
        <li key={index} className="flex items-start gap-2">
          <input
            type="checkbox"
            checked={task.checked}
            disabled
            className="mt-1 h-4 w-4 rounded border-border accent-primary cursor-default"
          />
          <span className="prose prose-sm dark:prose-invert">
            <ReactMarkdown
              remarkPlugins={[remarkGfm, remarkBreaks]}
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
              {task.text}
            </ReactMarkdown>
          </span>
        </li>
      ))}
    </ul>
  );
}

/**
 * Callout/admonition styling configuration by type.
 */
const CALLOUT_CONFIG: Record<CalloutType, {
  icon: typeof Info;
  bgClass: string;
  borderClass: string;
  iconClass: string;
  titleClass: string;
  label: string;
}> = {
  NOTE: {
    icon: Info,
    bgClass: "bg-blue-500/10",
    borderClass: "border-blue-500/50",
    iconClass: "text-blue-500",
    titleClass: "text-blue-600 dark:text-blue-400",
    label: "Note",
  },
  WARNING: {
    icon: AlertTriangle,
    bgClass: "bg-yellow-500/10",
    borderClass: "border-yellow-500/50",
    iconClass: "text-yellow-500",
    titleClass: "text-yellow-600 dark:text-yellow-400",
    label: "Warning",
  },
  TIP: {
    icon: Lightbulb,
    bgClass: "bg-green-500/10",
    borderClass: "border-green-500/50",
    iconClass: "text-green-500",
    titleClass: "text-green-600 dark:text-green-400",
    label: "Tip",
  },
  IMPORTANT: {
    icon: AlertCircle,
    bgClass: "bg-purple-500/10",
    borderClass: "border-purple-500/50",
    iconClass: "text-purple-500",
    titleClass: "text-purple-600 dark:text-purple-400",
    label: "Important",
  },
  CAUTION: {
    icon: ShieldAlert,
    bgClass: "bg-red-500/10",
    borderClass: "border-red-500/50",
    iconClass: "text-red-500",
    titleClass: "text-red-600 dark:text-red-400",
    label: "Caution",
  },
};

/**
 * Callout/admonition block with styled alert box.
 */
function CalloutBlockRenderer({ block }: { block: CalloutBlock }) {
  const config = CALLOUT_CONFIG[block.callout_type] || CALLOUT_CONFIG.NOTE;
  const Icon = config.icon;

  return (
    <div
      className={cn(
        "my-4 rounded-lg border-l-4 p-4",
        config.bgClass,
        config.borderClass
      )}
    >
      <div className={cn("flex items-center gap-2 font-semibold mb-2", config.titleClass)}>
        <Icon className={cn("h-5 w-5", config.iconClass)} />
        <span>{config.label}</span>
      </div>
      <div className="prose prose-sm dark:prose-invert max-w-none">
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
      </div>
    </div>
  );
}

/**
 * Image block with lazy loading and error handling.
 */
function ImageBlockRenderer({ block }: { block: ImageBlock }) {
  return (
    <figure className="my-4">
      <img
        src={block.image_url}
        alt={block.image_alt || ""}
        loading="lazy"
        className="max-w-full h-auto rounded-lg border border-border"
        onError={(e) => {
          const target = e.target as HTMLImageElement;
          target.style.display = "none";
          target.insertAdjacentHTML(
            "afterend",
            `<span class="text-muted-foreground text-sm italic">Image failed to load</span>`
          );
        }}
      />
      {block.image_alt && (
        <figcaption className="text-center text-sm text-muted-foreground mt-2">
          {block.image_alt}
        </figcaption>
      )}
    </figure>
  );
}

/**
 * Details/collapsible block with nested children.
 * Summary text may contain inline markdown.
 */
function DetailsBlockRenderer({ block }: { block: DetailsBlock }) {
  return (
    <details className="my-4 rounded-lg border border-border bg-muted/30 group">
      <summary className="cursor-pointer px-4 py-2 font-medium hover:bg-muted/50 rounded-t-lg list-none flex items-center gap-2">
        <ChevronRight className="h-4 w-4 transition-transform group-open:rotate-90" />
        <InlineMarkdown text={block.text} />
      </summary>
      {block.children && block.children.length > 0 && (
        <div className="px-4 pb-4 pt-2">
          <ContentBlockRenderer blocks={block.children} />
        </div>
      )}
    </details>
  );
}
