import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export function useStatus() {
  return useQuery({
    queryKey: ["status"],
    queryFn: () => api.getStatus(),
    staleTime: 1000 * 60 * 60, // 1 hour
    refetchOnWindowFocus: false,
  });
}
