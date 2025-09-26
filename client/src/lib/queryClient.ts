import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

// New overloaded apiRequest function that accepts either (method, url, data) or (url, options)
export async function apiRequest(
  urlOrMethod: string,
  urlOrOptions?: string | { method?: string; body?: any; headers?: Record<string, string> },
  data?: unknown | undefined,
): Promise<Response> {
  let url: string;
  let method: string;
  let body: any;
  let headers: Record<string, string> = {};

  // Handle both call patterns
  if (typeof urlOrOptions === 'string') {
    // Old pattern: apiRequest(method, url, data)
    method = urlOrMethod;
    url = urlOrOptions;
    body = data ? JSON.stringify(data) : undefined;
    headers = data ? { "Content-Type": "application/json" } : {};
  } else {
    // New pattern: apiRequest(url, options)
    url = urlOrMethod;
    const options = urlOrOptions || {};
    method = options.method || "GET";
    body = options.body;
    headers = options.headers || {};
    
    // If body is FormData, don't set Content-Type (let browser set it)
    if (body && !(body instanceof FormData) && !headers["Content-Type"]) {
      headers["Content-Type"] = "application/json";
      if (typeof body !== 'string') {
        body = JSON.stringify(body);
      }
    }
  }

  // Add JWT token from localStorage if available  
  const token = localStorage.getItem('jwt_token');
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(url, {
    method,
    headers,
    body,
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
    // Add JWT token from localStorage if available
    const headers: Record<string, string> = {};
    const token = localStorage.getItem('jwt_token');
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const res = await fetch(queryKey.join("/") as string, {
      credentials: "include",
      headers,
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
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
