"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Megaphone, Target, Zap, BarChart3 } from "lucide-react";

const agentIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  marketing: Megaphone,
  sales: Target,
  engineering: Zap,
  finance: BarChart3,
};

type Message = {
  id: string;
  role: string;
  content: string;
  message_type: string;
  created_at: string;
};

export function AgentChat({
  agentId,
  orgId,
  displayName = "Agent",
  agentType = "marketing",
}: {
  agentId: string;
  orgId: string;
  displayName?: string;
  agentType?: string;
}) {
  const Icon = agentIcons[agentType] ?? Megaphone;
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const fetchMessages = useCallback(async () => {
    try {
      const res = await fetch(`/api/v1/orgs/${orgId}/agents/${agentId}/messages`);
      if (!res.ok) return;
      const data = await res.json();
      setMessages(data.messages ?? []);
    } catch {
      setMessages([]);
    }
  }, [orgId, agentId]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const content = input.trim();
    if (!content || loading) return;
    setInput("");
    setError(null);
    setLoading(true);
    const userMessage: Message = {
      id: `temp-${Date.now()}`,
      role: "user",
      content,
      message_type: "question",
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMessage]);
    try {
      const res = await fetch(`/api/v1/orgs/${orgId}/agents/${agentId}/message`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, message_type: "question" }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to send");
        setMessages((prev) => prev.filter((m) => m.id !== userMessage.id));
        return;
      }
      setMessages((prev) => [...prev, data]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
      setMessages((prev) => prev.filter((m) => m.id !== userMessage.id));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-1 flex-col rounded-lg border bg-card">
      <div className="flex flex-1 flex-col overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && !loading && (
          <p className="text-muted-foreground text-sm">Send a message to start the conversation.</p>
        )}
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex gap-2 ${m.role === "user" ? "justify-end" : "justify-start"}`}
          >
            {m.role !== "user" && (
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted">
                <Icon className="size-4 text-amber-500" />
              </div>
            )}
            {m.role === "user" && (
              <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium">
                M
              </div>
            )}
            <div
              className={`flex max-w-[85%] items-start rounded-lg px-3 py-2 text-sm ${
                m.role === "user"
                  ? "bg-teal-600 text-teal-50 dark:bg-teal-700"
                  : "bg-muted"
              }`}
            >
              <div className="min-w-0">
                <div className="mb-0.5 text-xs font-medium opacity-80">
                  {m.role === "user" ? "You" : displayName}
                </div>
                <div className="whitespace-pre-wrap">{m.content}</div>
              </div>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex gap-2 justify-start">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted">
              <Icon className="size-4 text-amber-500" />
            </div>
            <div className="rounded-lg bg-muted px-3 py-2 text-sm text-muted-foreground">
              Thinking…
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>
      <form onSubmit={handleSubmit} className="border-t p-4">
        {error && <p className="text-sm text-destructive mb-2">{error}</p>}
        <div className="flex gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={`Message ${displayName}…`}
            rows={2}
            disabled={loading}
            className="min-h-0 resize-none flex-1"
          />
          <Button
            type="submit"
            disabled={loading || !input.trim()}
            className="bg-amber-500 text-black hover:bg-amber-600 dark:bg-amber-500 dark:hover:bg-amber-600"
          >
            Send
          </Button>
        </div>
      </form>
    </div>
  );
}
