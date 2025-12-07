import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { apiUrl } from "./api";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  // Convert relative URL to full URL if needed
  const fullUrl = url.startsWith('http') ? url : apiUrl(url);
  
  const res = await fetch(fullUrl, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    // Query key is an array like ["/api/stocks"] or ["/api/users", "me"]
    const path = queryKey.join("/");
    const fullUrl = apiUrl(path);
    
    const res = await fetch(fullUrl, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      refetchOnMount: false, // Don't refetch when component mounts
      refetchOnReconnect: false, // Don't refetch on reconnect
      staleTime: 5 * 60 * 1000, // Data is fresh for 5 minutes (was Infinity - too aggressive)
      gcTime: 10 * 60 * 1000, // Keep unused queries for 10 minutes
      retry: false,
      // Use cached data as placeholder to prevent refetch when enabled changes
      placeholderData: (previousData: unknown) => previousData as unknown,
      // Prevent refetch when query key changes but data exists
      structuralSharing: true,
    },
    mutations: {
      retry: false,
    },
  },
});
