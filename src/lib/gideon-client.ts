export function collectGideonInteraction({
  kind,
  content,
  metadata,
}: {
  kind: "search" | "chat" | "research_note" | "prompt_button";
  content: string;
  metadata?: Record<string, unknown>;
}) {
  const trimmed = content.trim();
  if (!trimmed) return;

  void fetch("/api/gideon/collect", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      kind,
      content: trimmed,
      pagePath: typeof window !== "undefined" ? window.location.pathname : undefined,
      metadata,
    }),
  }).catch(() => {
    // Search and chat should never fail because analytics collection failed.
  });
}
