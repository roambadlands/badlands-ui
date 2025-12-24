"use client";

import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface PromptSuggestion {
  title: string;
  prompt: string;
  category: "basics" | "defi" | "dev" | "analytics";
}

const THORCHAIN_PROMPTS: PromptSuggestion[] = [
  {
    title: "What is THORChain?",
    prompt: "Explain THORChain and how it enables cross-chain swaps without wrapped tokens.",
    category: "basics",
  },
  {
    title: "How do RUNE tokenomics work?",
    prompt: "Explain RUNE tokenomics, including its role in liquidity pools and network security.",
    category: "basics",
  },
  {
    title: "How to provide liquidity",
    prompt: "How do I provide liquidity to a THORChain pool? What are the risks and rewards?",
    category: "defi",
  },
  {
    title: "Explain impermanent loss",
    prompt: "How does impermanent loss protection work on THORChain? When does it apply?",
    category: "defi",
  },
  {
    title: "Run a local Mocknet",
    prompt: "How do I set up a local THORChain Mocknet for development?",
    category: "dev",
  },
  {
    title: "THORChain API endpoints",
    prompt: "What are the main THORNode API endpoints and how do I query pool data?",
    category: "dev",
  },
  {
    title: "Current pool depths",
    prompt: "What are the current liquidity depths for the major pools on THORChain?",
    category: "analytics",
  },
  {
    title: "Network stats overview",
    prompt: "Show me the current THORChain network statistics including TVL, volume, and active nodes.",
    category: "analytics",
  },
];

const CATEGORY_COLORS: Record<PromptSuggestion["category"], string> = {
  basics: "bg-blue-500/10 hover:bg-blue-500/20 border-blue-500/20",
  defi: "bg-green-500/10 hover:bg-green-500/20 border-green-500/20",
  dev: "bg-purple-500/10 hover:bg-purple-500/20 border-purple-500/20",
  analytics: "bg-orange-500/10 hover:bg-orange-500/20 border-orange-500/20",
};

interface EmptyStateProps {
  onSelectPrompt: (prompt: string) => void;
}

export function EmptyState({ onSelectPrompt }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[400px] px-4 py-8">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold mb-2">Welcome to THORChain Assistant</h2>
        <p className="text-muted-foreground">
          Ask anything about THORChain, or try one of these suggestions:
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full max-w-2xl">
        {THORCHAIN_PROMPTS.map((suggestion, index) => (
          <button
            key={index}
            onClick={() => onSelectPrompt(suggestion.prompt)}
            className={cn(
              "group flex items-center justify-between gap-3 p-4 rounded-lg border text-left transition-all",
              CATEGORY_COLORS[suggestion.category]
            )}
          >
            <div className="flex-1 min-w-0">
              <div className="font-medium text-sm">{suggestion.title}</div>
              <div className="text-xs text-muted-foreground truncate mt-0.5">
                {suggestion.prompt}
              </div>
            </div>
            <ArrowRight className="h-4 w-4 shrink-0 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
          </button>
        ))}
      </div>
    </div>
  );
}
