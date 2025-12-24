import { describe, it, expect, beforeEach } from "vitest";
import { useChatStore } from "@/store/chat-store";

describe("ChatStore", () => {
  beforeEach(() => {
    // Reset store state before each test
    useChatStore.setState({
      isStreaming: false,
      streamingContent: "",
      streamingToolCalls: new Map(),
      streamingCitations: [],
      abortController: null,
    });
  });

  describe("startStreaming", () => {
    it("should set isStreaming to true and return AbortController", () => {
      const store = useChatStore.getState();
      const controller = store.startStreaming();

      const state = useChatStore.getState();
      expect(state.isStreaming).toBe(true);
      expect(state.streamingContent).toBe("");
      expect(state.abortController).toBe(controller);
      expect(controller).toBeInstanceOf(AbortController);
    });

    it("should reset streaming state when starting new stream", () => {
      // Add some content first
      useChatStore.getState().appendContent("test content");
      useChatStore.getState().addCitation({
        source: "test",
        source_ref: "ref",
        reference: "content",
      });

      // Start new streaming
      useChatStore.getState().startStreaming();

      const state = useChatStore.getState();
      expect(state.streamingContent).toBe("");
      expect(state.streamingCitations).toHaveLength(0);
    });
  });

  describe("appendContent", () => {
    it("should append text to streamingContent", () => {
      const store = useChatStore.getState();
      store.appendContent("Hello");
      store.appendContent(" World");

      expect(useChatStore.getState().streamingContent).toBe("Hello World");
    });
  });

  describe("addToolCallStart", () => {
    it("should add a pending tool call", () => {
      const store = useChatStore.getState();
      store.addToolCallStart("call-1", "get_weather");

      const toolCalls = store.getToolCalls();
      expect(toolCalls).toHaveLength(1);
      expect(toolCalls[0]).toEqual({
        id: "call-1",
        tool: "get_weather",
        status: "pending",
      });
    });
  });

  describe("updateToolCallEnd", () => {
    it("should update tool call with output", () => {
      const store = useChatStore.getState();
      store.addToolCallStart("call-1", "get_weather");
      store.updateToolCallEnd("call-1", "get_weather", { temp: 72 });

      const toolCalls = store.getToolCalls();
      expect(toolCalls[0].status).toBe("completed");
      expect(toolCalls[0].output).toEqual({ temp: 72 });
    });

    it("should update tool call with error", () => {
      const store = useChatStore.getState();
      store.addToolCallStart("call-1", "get_weather");
      store.updateToolCallEnd("call-1", "get_weather", undefined, "API error");

      const toolCalls = store.getToolCalls();
      expect(toolCalls[0].status).toBe("error");
      expect(toolCalls[0].error).toBe("API error");
    });
  });

  describe("addCitation", () => {
    it("should add citation to list", () => {
      const store = useChatStore.getState();
      store.addCitation({
        source: "mcp:get_pools",
        source_ref: "block:123",
        reference: "ETH pool depth",
      });

      const state = useChatStore.getState();
      expect(state.streamingCitations).toHaveLength(1);
      expect(state.streamingCitations[0].source).toBe("mcp:get_pools");
    });
  });

  describe("stopStreaming", () => {
    it("should abort the controller and set isStreaming to false", () => {
      const store = useChatStore.getState();
      const controller = store.startStreaming();
      const abortSpy = vi.spyOn(controller, "abort");

      store.stopStreaming();

      expect(abortSpy).toHaveBeenCalled();
      expect(useChatStore.getState().isStreaming).toBe(false);
      expect(useChatStore.getState().abortController).toBeNull();
    });
  });

  describe("resetStreaming", () => {
    it("should reset all streaming state", () => {
      const store = useChatStore.getState();
      store.startStreaming();
      store.appendContent("test");
      store.addCitation({
        source: "test",
        source_ref: "ref",
        reference: "content",
      });

      store.resetStreaming();

      const state = useChatStore.getState();
      expect(state.isStreaming).toBe(false);
      expect(state.streamingContent).toBe("");
      expect(state.streamingCitations).toHaveLength(0);
      expect(state.abortController).toBeNull();
    });
  });
});
