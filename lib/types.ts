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

// Message types
export interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  created_at: string;
  tool_calls?: ToolCall[];
  citations?: Citation[];
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
  | "responding";

export interface SSEProgressEvent {
  type: "progress";
  data: {
    phase: ProgressPhase;
    started_at: number; // Unix timestamp in milliseconds
  };
}

// Human-readable phase labels
export const PHASE_LABELS: Record<ProgressPhase, string> = {
  received: "Processing",
  loading_context: "Loading context",
  loading_tools: "Loading tools",
  thinking: "Thinking",
  responding: "Responding",
};

export type SSEEvent =
  | SSEContentEvent
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
