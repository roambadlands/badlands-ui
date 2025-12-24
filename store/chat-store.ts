import { create } from "zustand";
import type { ToolCall, Citation, ProgressPhase } from "@/lib/types";

interface ChatStore {
  // Streaming state
  isStreaming: boolean;
  streamingContent: string;
  streamingToolCalls: Map<string, ToolCall>;
  streamingCitations: Citation[];
  abortController: AbortController | null;

  // Progress state
  currentPhase: ProgressPhase | null;
  phaseStartedAt: number | null;

  // Actions
  startStreaming: () => AbortController;
  appendContent: (text: string) => void;
  addToolCallStart: (id: string, tool: string) => void;
  updateToolCallEnd: (
    id: string,
    tool: string,
    output?: Record<string, unknown>,
    error?: string
  ) => void;
  addCitation: (citation: Citation) => void;
  stopStreaming: () => void;
  resetStreaming: () => void;

  // Progress actions
  setProgress: (phase: ProgressPhase, startedAt: number) => void;

  // Getters for tool calls as array
  getToolCalls: () => ToolCall[];
}

export const useChatStore = create<ChatStore>((set, get) => ({
  isStreaming: false,
  streamingContent: "",
  streamingToolCalls: new Map(),
  streamingCitations: [],
  abortController: null,
  currentPhase: null,
  phaseStartedAt: null,

  startStreaming: () => {
    const controller = new AbortController();
    set({
      isStreaming: true,
      streamingContent: "",
      streamingToolCalls: new Map(),
      streamingCitations: [],
      abortController: controller,
      currentPhase: null,
      phaseStartedAt: null,
    });
    return controller;
  },

  appendContent: (text) => {
    set((state) => ({
      streamingContent: state.streamingContent + text,
    }));
  },

  addToolCallStart: (id, tool) => {
    set((state) => {
      const newToolCalls = new Map(state.streamingToolCalls);
      newToolCalls.set(id, {
        id,
        tool,
        status: "pending",
      });
      return { streamingToolCalls: newToolCalls };
    });
  },

  updateToolCallEnd: (id, _tool, output, error) => {
    set((state) => {
      const newToolCalls = new Map(state.streamingToolCalls);
      const existing = newToolCalls.get(id);
      if (existing) {
        newToolCalls.set(id, {
          ...existing,
          output,
          error,
          status: error ? "error" : "completed",
        });
      }
      return { streamingToolCalls: newToolCalls };
    });
  },

  addCitation: (citation) => {
    set((state) => ({
      streamingCitations: [...state.streamingCitations, citation],
    }));
  },

  stopStreaming: () => {
    const { abortController } = get();
    if (abortController) {
      abortController.abort();
    }
    set({
      isStreaming: false,
      abortController: null,
    });
  },

  resetStreaming: () => {
    set({
      isStreaming: false,
      streamingContent: "",
      streamingToolCalls: new Map(),
      streamingCitations: [],
      abortController: null,
      currentPhase: null,
      phaseStartedAt: null,
    });
  },

  setProgress: (phase, startedAt) => {
    console.log("[ChatStore] setProgress:", phase, startedAt);
    set({
      currentPhase: phase,
      phaseStartedAt: startedAt,
    });
  },

  getToolCalls: () => {
    return Array.from(get().streamingToolCalls.values());
  },
}));
