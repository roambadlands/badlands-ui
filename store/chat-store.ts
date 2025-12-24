import { create } from "zustand";
import type { ToolCall, Citation, ProgressPhase, ContentBlock } from "@/lib/types";

interface ChatStore {
  // Streaming state
  isStreaming: boolean;
  streamingContent: string;
  streamingContentBlocks: Map<number, ContentBlock>;
  streamingToolCalls: Map<string, ToolCall>;
  streamingCitations: Citation[];
  abortController: AbortController | null;

  // Progress state
  currentPhase: ProgressPhase | null;
  phaseStartedAt: number | null;
  currentToolName: string | null;
  currentIteration: number | null;

  // Actions
  startStreaming: () => AbortController;
  appendContent: (text: string) => void;
  addContentBlock: (index: number, block: ContentBlock) => void;
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
  setProgress: (phase: ProgressPhase, startedAt: number, toolName?: string, iteration?: number) => void;

  // Getters
  getToolCalls: () => ToolCall[];
  getContentBlocks: () => ContentBlock[];
}

export const useChatStore = create<ChatStore>((set, get) => ({
  isStreaming: false,
  streamingContent: "",
  streamingContentBlocks: new Map(),
  streamingToolCalls: new Map(),
  streamingCitations: [],
  abortController: null,
  currentPhase: null,
  phaseStartedAt: null,
  currentToolName: null,
  currentIteration: null,

  startStreaming: () => {
    const controller = new AbortController();
    set({
      isStreaming: true,
      streamingContent: "",
      streamingContentBlocks: new Map(),
      streamingToolCalls: new Map(),
      streamingCitations: [],
      abortController: controller,
      currentPhase: null,
      phaseStartedAt: null,
      currentToolName: null,
      currentIteration: null,
    });
    return controller;
  },

  appendContent: (text) => {
    set((state) => ({
      streamingContent: state.streamingContent + text,
    }));
  },

  addContentBlock: (index, block) => {
    set((state) => {
      const newBlocks = new Map(state.streamingContentBlocks);
      newBlocks.set(index, block);
      return { streamingContentBlocks: newBlocks };
    });
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
      streamingContentBlocks: new Map(),
      streamingToolCalls: new Map(),
      streamingCitations: [],
      abortController: null,
      currentPhase: null,
      phaseStartedAt: null,
      currentToolName: null,
      currentIteration: null,
    });
  },

  setProgress: (phase, startedAt, toolName, iteration) => {
    console.log("[ChatStore] setProgress:", phase, startedAt, toolName, iteration);
    set({
      currentPhase: phase,
      phaseStartedAt: startedAt,
      currentToolName: toolName ?? null,
      currentIteration: iteration ?? null,
    });
  },

  getToolCalls: () => {
    return Array.from(get().streamingToolCalls.values());
  },

  getContentBlocks: () => {
    const blocks = get().streamingContentBlocks;
    // Sort blocks by index and return as array
    const sortedEntries = Array.from(blocks.entries()).sort(([a], [b]) => a - b);
    return sortedEntries.map(([, block]) => block);
  },
}));
