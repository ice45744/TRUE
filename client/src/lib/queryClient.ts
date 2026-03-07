import { QueryClient, QueryFunction } from "@tanstack/react-query";

function getAuthUserId(): string | null {
  try {
    const saved = localStorage.getItem("st_kaona_user");
    if (saved) {
      const parsed = JSON.parse(saved);
      return parsed.id;
    }
  } catch {}
  return null;
}

async function buildHeaders(data?: unknown): Promise<Record<string, string>> {
  const headers: Record<string, string> = {};
  if (data) headers["Content-Type"] = "application/json";
  const userId = getAuthUserId();
  if (userId) {
    headers["x-user-id"] = userId;
    headers["X-User-Id"] = userId;
  }
  return headers;
}

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    let errorMessage = `${res.status}: ${res.statusText}`;
    try {
      const data = await res.json();
      errorMessage = data.message || errorMessage;
    } catch (e) {
      // Not JSON, use text if available
      try {
        const text = await res.text();
        if (text) errorMessage = text;
      } catch (e2) {}
    }
    throw new Error(errorMessage);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const res = await fetch(url, {
    method,
    headers: await buildHeaders(data),
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
    const url = queryKey[0] === "" ? queryKey.join("/") : "/" + queryKey.join("/");
    const res = await fetch(url, {
      headers: await buildHeaders(),
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
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
