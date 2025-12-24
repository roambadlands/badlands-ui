import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export function useBudget() {
  return useQuery({
    queryKey: ["budget"],
    queryFn: () => api.getBudget(),
    refetchInterval: 60000, // Refetch every minute
  });
}
