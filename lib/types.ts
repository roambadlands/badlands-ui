// User and Auth types
export interface User {
  id: string;
  name: string;
  email: string;
  provider: "google" | "discord" | "apple";
}

export interface AuthMeResponse {
  tenant_id: string;
  tenant_name: string;
  email: string;
  name: string;
  provider: string;
  linked_providers: string[];
}

// Session types
export interface Session {
  id: string;
  mode: "chat" | "explorer";
  title?: string;
  created_at: string;
  updated_at: string;
  message_count?: number;
  last_message?: string;
}

export interface SessionsResponse {
  sessions: Session[];
  total: number;
  limit: number;
  offset: number;
}

export interface SessionWithMessages extends Session {
  messages: Message[];
}

// Content block types for structured message rendering
export type ContentBlock =
  | TextBlock
  | CodeBlock
  | HeadingBlock
  | ListBlock
  | BlockquoteBlock
  | TableBlock
  | HrBlock
  | MathBlock
  | TaskListBlock
  | CalloutBlock
  | ImageBlock
  | DetailsBlock
  | ChartBlock;

export interface TextBlock {
  type: "text";
  text: string;
}

export interface CodeBlock {
  type: "code";
  code: string;
  language?: string;
}

export interface HeadingBlock {
  type: "heading";
  text: string;
  level: 1 | 2 | 3 | 4 | 5 | 6;
}

export interface ListBlock {
  type: "list";
  items: string[];
  ordered: boolean;
}

export interface BlockquoteBlock {
  type: "blockquote";
  text: string;
}

export interface TableBlock {
  type: "table";
  headers: string[];
  rows: string[][];
}

export interface HrBlock {
  type: "hr";
}

export interface MathBlock {
  type: "math";
  math: string;
  inline?: boolean;
}

export interface TaskItem {
  text: string;
  checked: boolean;
}

export interface TaskListBlock {
  type: "tasklist";
  tasks: TaskItem[];
}

export type CalloutType = "NOTE" | "WARNING" | "TIP" | "IMPORTANT" | "CAUTION";

export interface CalloutBlock {
  type: "callout";
  callout_type: CalloutType;
  text: string;
}

export interface ImageBlock {
  type: "image";
  image_url: string;
  image_alt?: string;
}

export interface DetailsBlock {
  type: "details";
  text: string;
  children?: ContentBlock[];
}

// Chart block types
export type ChartType = "bar" | "line" | "pie" | "area" | "scatter";

export interface ChartAxisConfig {
  label?: string;
  data?: string[];
}

export interface ChartSeriesItem {
  name: string;
  data: number[];
}

export interface PieSeriesItem {
  name: string;
  value: number;
}

export interface ScatterPoint {
  x: number;
  y: number;
}

export interface ScatterSeriesItem {
  name: string;
  data: ScatterPoint[];
}

export interface ChartData {
  title?: string;
  x_axis?: ChartAxisConfig;
  y_axis?: ChartAxisConfig;
  series?: ChartSeriesItem[] | PieSeriesItem[] | ScatterSeriesItem[];
}

export interface ChartBlock {
  type: "chart";
  chart_type: ChartType;
  chart_title?: string;
  chart_data: ChartData;
}

// Message types
export interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  content_format?: "markdown" | "text";
  content_blocks?: ContentBlock[];
  created_at: string;
  tool_calls?: ToolCall[];
  citations?: Citation[];
  response_time_ms?: number;
}

export interface MessagesResponse {
  messages: Message[];
}

// Tool call types
export interface ToolCall {
  id: string;
  tool: string;
  input?: Record<string, unknown>;
  output?: Record<string, unknown>;
  error?: string;
  status: "pending" | "completed" | "error";
}

// Citation types
export interface Citation {
  source: string;
  source_ref: string;
  reference: string;
}

// Budget types
export interface BudgetResponse {
  has_budget: boolean;
  daily_budget_usd: number;
  daily_used_usd: number;
  daily_remaining_usd: number;
  monthly_budget_usd: number;
  monthly_used_usd: number;
  monthly_remaining_usd: number;
}

export interface UsageResponse {
  daily_used_usd: number;
  monthly_used_usd: number;
  budget_remaining_usd: number;
}

// SSE Event types
export interface SSEContentEvent {
  type: "content";
  data: { text: string };
}

export interface SSEToolCallStartEvent {
  type: "tool_call_start";
  data: { id: string; tool: string };
}

export interface SSEToolCallEndEvent {
  type: "tool_call_end";
  data: {
    id: string;
    tool: string;
    output?: Record<string, unknown>;
    error?: string;
  };
}

export interface SSECitationEvent {
  type: "citation";
  data: Citation;
}

export interface SSEUsageEvent {
  type: "usage";
  data: {
    input_tokens: number;
    output_tokens: number;
    total_tokens: number;
    cost_usd: number;
  };
}

export interface SSEDoneEvent {
  type: "done";
  data: { message_id: string };
}

export interface SSEErrorEvent {
  type: "error";
  data: { code: string; message: string };
}

// Progress phases
export type ProgressPhase =
  | "received"
  | "loading_context"
  | "loading_tools"
  | "thinking"
  | "calling_tool"
  | "iteration"
  | "responding";

export interface SSEProgressEvent {
  type: "progress";
  data: {
    phase: ProgressPhase;
    started_at: number; // Unix timestamp in milliseconds
    tool_name?: string; // Tool name for calling_tool phase
    iteration?: number; // Iteration number for iteration phase (1-based)
  };
}

export interface SSEContentBlockEvent {
  type: "content_block";
  data: {
    index: number;
    block: ContentBlock;
  };
}

// Human-readable phase labels
export const PHASE_LABELS: Record<ProgressPhase, string> = {
  received: "Processing",
  loading_context: "Loading context",
  loading_tools: "Loading tools",
  thinking: "Thinking",
  calling_tool: "Calling tool",
  iteration: "Processing",
  responding: "Responding",
};

export type SSEEvent =
  | SSEContentEvent
  | SSEContentBlockEvent
  | SSEToolCallStartEvent
  | SSEToolCallEndEvent
  | SSECitationEvent
  | SSEUsageEvent
  | SSEDoneEvent
  | SSEErrorEvent
  | SSEProgressEvent;

// Request types
export interface CreateSessionRequest {
  mode: "chat" | "explorer";
}

export interface SendMessageRequest {
  content: string;
  model?: string;
  max_tokens?: number;
  temperature?: number;
  tools?: string[];
  chain?: string;
}

// API Error
export interface APIError {
  error: string;
  code?: string;
}

// Status types (backend info)
export interface StatusResponse {
  dev_mode: boolean;
  version: string;
  commit: string;
  build_date: string;
}
