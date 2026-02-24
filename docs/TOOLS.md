# Agent tools and MCP

Agents have **native tools** (built into the app) and optional **MCP** (Model Context Protocol) access to external servers.

---

## Native tools by category

### Web & content
| Tool | Description | Env / notes |
|------|-------------|-------------|
| **web_scraper** | Fetch and extract text from a URL | None |
| **web_search** | Search the web (Tavily or Serper) | `TAVILY_API_KEY` or `SERPER_API_KEY` |
| **content_generator** | Draft content (blog, social, email) | None (placeholder) |
| **seo_analyzer** | Analyze a URL for SEO (title, meta, headings, word count) | None |
| **social_poster** | Draft or post to LinkedIn/Twitter | `TWITTER_BEARER_TOKEN`, `LINKEDIN_ACCESS_TOKEN` (or draft-only) |

### Comms & calendar
| Tool | Description | Env / notes |
|------|-------------|-------------|
| **email_sender** | Send email via Resend | `RESEND_API_KEY`, optional `FROM_EMAIL` |
| **slack_notifier** | Post to Slack via webhook | `SLACK_WEBHOOK_URL` |
| **calendar** | Check availability, list events (Calendly) | `CALENDLY_API_KEY` or MCP |

### Memory, files, metrics
| Tool | Description | Env / notes |
|------|-------------|-------------|
| **memory_store** / **memory_get** | Per-agent long-term memory | DB |
| **read_file** / **write_file** | Per-agent sandboxed workspace | DB |
| **metrics_record** | Record a metric (MRR, demos, etc.) for later | DB |
| **analytics_reader** | Read metrics recorded with metrics_record | None (or connect GA via MCP) |

### By agent type
| Tool | Description | Env / notes |
|------|-------------|-------------|
| **google_sheets** | Read/write Sheets (or export CSV via write_file) | MCP or `GOOGLE_SERVICE_ACCOUNT_JSON` |
| **github_list_issues** / **github_create_issue** | List or create GitHub issues | `GITHUB_TOKEN` |
| **currency_convert** | Convert between currencies | `EXCHANGE_RATE_API_KEY` |
| **crm_lookup** | Look up contact/company/deal in CRM | HubSpot/Salesforce MCP or `HUBSPOT_API_KEY` |

- **Marketing**: SEO, analytics, social, content, email, Slack, memory, files, metrics.
- **Sales**: Email, Slack, calendar, CRM lookup, metrics, memory, files, web search.
- **Engineering**: GitHub issues, Slack, memory, files, metrics, web search.
- **Finance**: Currency convert, metrics, analytics, Google Sheets, memory, files.

---

## MCP (full external tool access)

When **MCP_SERVERS** is set, every agent conversation can use tools from the configured MCP servers. Claude’s API connects to those servers and runs the tools; you don’t implement them in this app.

### Setup

1. **MCP_SERVERS** must be a JSON array of server definitions. Example:

   ```json
   [
     { "name": "fetch", "url": "https://mcp.example.com/sse" },
     { "name": "github", "url": "https://github-mcp.example.com/sse", "authorization_token": "YOUR_TOKEN" }
   ]
   ```

2. Servers must be **publicly reachable over HTTPS** (SSE or Streamable HTTP). Local STDIO servers are not supported by the Messages API.

3. Add **MCP_SERVERS** to Vercel (or your runtime) env. You can paste the JSON string in the value.

### Finding MCP servers

- [MCP servers directory](https://github.com/modelcontextprotocol/servers) – community servers (GitHub, Slack, Google Drive, PostgreSQL, etc.).
- [Claude MCP](https://claudemcp.org) – list of servers that work with Claude.
- You can host your own MCP server and expose it via HTTPS.

### Beta

The MCP connector uses the Claude API beta: `mcp-client-2025-11-20`. Only **tool calls** are supported (no MCP prompts/resources in this integration).

---

## OpenClaw-style coverage

The native set gives agents:

- **Web**: fetch URL (`web_scraper`), search (`web_search`).
- **Memory**: persistent key-value store per agent (`memory_store`, `memory_get`).
- **Files**: sandboxed read/write per agent (`read_file`, `write_file`).
- **Comms**: email (Resend), Slack.

For more (browser automation, exec, etc.), add an MCP server that exposes those capabilities and put it in **MCP_SERVERS**.
