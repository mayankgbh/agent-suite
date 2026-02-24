import type { Tool } from "./types";

interface CalendarInput {
  action: "check_availability" | "list_events" | "request_meeting";
  date?: string;
  duration_minutes?: number;
}

export const calendarTool: Tool<CalendarInput> = {
  name: "calendar",
  description:
    "Check availability, list upcoming events, or request a meeting. Use when coordinating demos or follow-ups. Requires Calendly or Google Calendar MCP.",
  inputSchema: {
    type: "object",
    properties: {
      action: {
        type: "string",
        description: "check_availability, list_events, or request_meeting",
      },
      date: { type: "string", description: "Date (YYYY-MM-DD) for availability" },
      duration_minutes: { type: "number", description: "Meeting length in minutes" },
    },
    required: ["action"],
  },
  async execute(input) {
    const hasCalendly = Boolean(process.env.CALENDLY_API_KEY);
    if (!hasCalendly) {
      return {
        content:
          "Calendar not connected. Set CALENDLY_API_KEY or add a Google Calendar / Calendly MCP server. For now, use memory_store to note meeting requests and ask the user to share their Calendly link.",
        error: true,
      };
    }
    try {
      if (input.action === "list_events") {
        const res = await fetch("https://api.calendly.com/scheduled_events?user=https://api.calendly.com/users/me", {
          headers: { Authorization: `Bearer ${process.env.CALENDLY_API_KEY}` },
        });
        if (!res.ok) return { content: `Calendly API ${res.status}`, error: true };
        const data = (await res.json()) as { collection?: Array<{ uri: string; name: string; start_time: string }> };
        const events = data.collection ?? [];
        const lines = events.slice(0, 10).map((e) => `${e.start_time}: ${e.name}`);
        return { content: lines.length ? lines.join("\n") : "No upcoming events." };
      }
      if (input.action === "check_availability" && input.date) {
        const res = await fetch(
          `https://api.calendly.com/event_type_available_times?event_type=&start_time=${input.date}T00:00:00Z&end_time=${input.date}T23:59:59Z`,
          { headers: { Authorization: `Bearer ${process.env.CALENDLY_API_KEY}` } }
        );
        if (!res.ok) return { content: "Set CALENDLY_EVENT_TYPE_URI for availability. Or use MCP.", error: true };
        const data = (await res.json()) as { collection?: Array<{ start_time: string }> };
        const times = (data.collection ?? []).map((t) => t.start_time);
        return { content: times.length ? times.join(", ") : "No slots that day." };
      }
      return {
        content:
          "Use request_meeting to suggest a time; store it with memory_store and ask the user to book via their Calendly link.",
      };
    } catch (e) {
      return {
        content: `Error: ${e instanceof Error ? e.message : "Calendar failed"}. Use memory_store for meeting notes.`,
        error: true,
      };
    }
  },
};
