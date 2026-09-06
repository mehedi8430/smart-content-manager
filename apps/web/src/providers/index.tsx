"use client";

import { ReactNode, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "./theme-provider";
import { ChatProvider } from "./chat-provider";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30 * 1000, // sensible project-wide default; override per-query where needed
            retry: 1,
            // Data is user-scoped and not real-time; avoid surprise refetches when
            // the window regains focus (reduces unnecessary network + CPU churn).
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
        <ThemeProvider
          defaultTheme="system"
          storageKey="smart-content-manager-theme"
        >
          <ChatProvider>
            {children}
            {process.env.NODE_ENV === 'development' && <ReactQueryDevtools initialIsOpen={false} />}
          </ChatProvider>
        </ThemeProvider>
    </QueryClientProvider>
  );
}
