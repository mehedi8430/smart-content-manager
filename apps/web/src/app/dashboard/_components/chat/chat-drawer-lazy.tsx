"use client";

import dynamic from "next/dynamic";

/**
 * Client-side lazy loader for the ChatDrawer.
 *
 * `next/dynamic` with `ssr: false` is only allowed inside a Client Component,
 * so this tiny wrapper holds the split point. The heavy chat bundle (streaming
 * client, thread, composer, SSE) is only downloaded when the drawer is opened.
 */
const ChatDrawer = dynamic(
  () =>
    import("./chat-drawer").then((mod) => mod.ChatDrawer),
  { ssr: false, loading: () => null },
);

export function ChatDrawerLazy() {
  return <ChatDrawer />;
}