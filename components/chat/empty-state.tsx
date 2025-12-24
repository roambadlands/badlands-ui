"use client";

import { cn } from "@/lib/utils";

interface PromptCategory {
  name: string;
  prompts: { title: string; prompt: string }[];
}

const CATEGORIES: PromptCategory[] = [
  {
    name: "Getting Started",
    prompts: [
      { title: "What is THORChain?", prompt: "What is THORChain and what problem does it solve?" },
      { title: "RUNE tokenomics", prompt: "Explain the RUNE token and its role in the THORChain ecosystem" },
      { title: "Cross-chain swaps", prompt: "How does THORChain achieve cross-chain swaps without wrapped tokens?" },
      { title: "Bifrost protocol", prompt: "What is the Bifrost protocol and how does it connect to external chains?" },
    ],
  },
  {
    name: "DeFi & Trading",
    prompts: [
      { title: "Top liquidity pools", prompt: "What are the top 5 deepest liquidity pools on THORChain right now?" },
      { title: "Swap BTC to ETH", prompt: "Get me a quote to swap 1 BTC for ETH through THORChain" },
      { title: "Provide liquidity", prompt: "How do I provide liquidity to a THORChain pool?" },
      { title: "What is Savers?", prompt: "What is Savers and how does it differ from traditional LP positions?" },
    ],
  },
  {
    name: "Network & Nodes",
    prompts: [
      { title: "Network status", prompt: "What's the current status of the THORChain network?" },
      { title: "Active validators", prompt: "List all active validator nodes and their bond amounts" },
      { title: "Asgard vaults", prompt: "List all Asgard vaults and their total value locked" },
      { title: "TSS security", prompt: "How does THORChain's threshold signature scheme (TSS) work?" },
    ],
  },
  {
    name: "Analytics",
    prompts: [
      { title: "Network stats", prompt: "Show me THORChain network statistics including TVL and volume" },
      { title: "TVL history", prompt: "Show me THORChain's TVL history over the past year" },
      { title: "RUNE price", prompt: "Show me RUNE's price history over the last 90 days" },
      { title: "Pool APY comparison", prompt: "Compare APY across all pools for liquidity provision" },
    ],
  },
  {
    name: "Developer",
    prompts: [
      { title: "API endpoints", prompt: "What APIs are available for integrating with THORChain?" },
      { title: "Query pools", prompt: "How do I query the current state of a liquidity pool?" },
      { title: "THORName lookup", prompt: "Look up the THORName 'satoshi' - what addresses does it resolve to?" },
      { title: "Run Mocknet", prompt: "How do I set up a local THORChain Mocknet?" },
    ],
  },
];

interface EmptyStateProps {
  onSelectPrompt: (prompt: string) => void;
}

export function EmptyState({ onSelectPrompt }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center h-full px-4 py-8">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold mb-2">Welcome to Badlands AI</h2>
        <p className="text-muted-foreground">
          Ask anything about THORChain, or try one of these:
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 w-full max-w-6xl">
        {CATEGORIES.map((category) => (
          <div key={category.name} className="space-y-2">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">
              {category.name}
            </h3>
            <div className="space-y-1">
              {category.prompts.map((item, index) => (
                <button
                  key={index}
                  onClick={() => onSelectPrompt(item.prompt)}
                  className={cn(
                    "w-full text-left px-3 py-2 rounded-md text-sm",
                    "text-muted-foreground hover:text-foreground",
                    "hover:bg-muted/50 transition-colors",
                    "cursor-pointer"
                  )}
                >
                  {item.prompt}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
