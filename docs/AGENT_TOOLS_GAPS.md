# Agent tools: human role, current capabilities, and gaps

For each agent type we list: (1) what a human in that leadership role typically does to run the function, (2) what the agent can do today with the tools it has, and (3) gaps to fill before the agent can lead that function more autonomously.

---

## 1. Marketing / CMO

### What a human CMO needs to do to lead marketing

- **Strategy:** Set positioning, messaging, channel mix, and budget allocation; define ICP and personas; own brand voice and narrative.
- **Content & SEO:** Prioritize topics and keywords; own content calendar; brief and review content; optimize for search and conversion; track rankings and traffic.
- **Campaigns & channels:** Run paid (Google, Meta, LinkedIn); manage email nurture and lifecycle; plan and post social; run webinars/events; manage partnerships and affiliates.
- **Data & attribution:** Define funnel and KPIs (MQLs, CAC, LTV, conversion); connect analytics and ad platforms; report on ROI and pipeline influence.
- **Team & ops:** Brief designers/copywriters; manage agencies and tools (CMS, ESP, ad platforms); align with Sales on lead definitions and handoff.

### What the Marketing agent can do today (with current tools)

| Capability | Tool(s) | Notes |
|------------|---------|--------|
| Research topics / competitors | web_search, web_scraper | Good for research and scraping. |
| Draft content (blog, social, email) | content_generator | Outlines and drafts. |
| Analyze a URL for SEO | seo_analyzer | Title, meta, headings, word count. |
| Post (or draft) social | social_poster | LinkedIn/Twitter with tokens or draft-only. |
| Send email | email_sender | Via Resend (RESEND_API_KEY). |
| Notify team | slack_notifier | Webhook. |
| Remember context | memory_store, memory_get | Per-agent memory. |
| Store/read metrics | metrics_record, analytics_reader | Internal metric store (not GA/ad platforms). |
| Spreadsheets | google_sheets | Stub: needs MCP or use write_file for CSV. |
| Coordinate with other agents | post_coordination_message | Broadcast or target updates. |

### Gaps (Marketing)

| Gap | Why it matters | Possible fix |
|-----|----------------|--------------|
| No real analytics (GA4, ad platforms) | Can’t report real traffic, conversions, or ROI. | GA4 (or analytics) MCP; or native connector with ANALYTICS_* env. |
| No paid ads (Google/Meta/LinkedIn) | Can’t create, launch, or optimize campaigns. | MCP for ad platforms or dedicated tools (e.g. create_campaign, get_ad_metrics). |
| No content calendar / scheduling | Can’t own a real calendar or auto-schedule. | Calendar tool (e.g. Notion/Google Calendar MCP) or native content_calendar (read/write). |
| Google Sheets read/write | Can’t read from or push to real Sheets (pipelines, reports). | Google Sheets MCP or GOOGLE_SERVICE_ACCOUNT_JSON. |
| No CMS or publish step | Can’t publish to website/CMS. | MCP (Webflow, WordPress, etc.) or publish_to_cms tool. |
| No keyword/rank tracking | Can’t track SERP positions over time. | Keyword-tracking API or MCP (e.g. SEMrush, Ahrefs). |

---

## 2. Sales / VP Sales (or CRO)

### What a human VP Sales needs to do to lead sales

- **Pipeline & process:** Define stages, qualification (BANT etc.), and handoff from Marketing; run forecast and pipeline reviews; manage deal desk and pricing.
- **Outbound & inbound:** Run outbound sequences (research, personalize, send, book meetings); manage inbound leads and routing; own demo and follow-up cadence.
- **Tools & CRM:** Use CRM daily (contacts, companies, deals, activities); keep data clean; use calendar for demos and internal sync.
- **Reporting:** Pipeline value, conversion by stage, cycle length, quota attainment; align with Marketing on attribution.
- **Team & enablement:** Playbooks, objection handling, competitive intel; coordinate with CS on handoff and expansion.

### What the Sales agent can do today (with current tools)

| Capability | Tool(s) | Notes |
|------------|---------|--------|
| Research prospects / companies | web_search, web_scraper | Good for enrichment. |
| Draft outreach | content_generator | Email and message drafts. |
| Send email | email_sender | Resend. |
| Notify (e.g. new lead) | slack_notifier | Webhook. |
| Check availability / list events | calendar | Calendly (CALENDLY_API_KEY). |
| Look up CRM | crm_lookup | Stub: needs HubSpot/Salesforce MCP or CRM API. |
| Store/read metrics | metrics_record, analytics_reader | Internal store (demos, pipeline value, etc.). |
| Spreadsheets | google_sheets | Stub; write_file for CSV. |
| Remember leads/context | memory_store, memory_get | Per-agent. |
| Coordinate with other agents | post_coordination_message | E.g. “Demo booked with X”. |

### Gaps (Sales)

| Gap | Why it matters | Possible fix |
|-----|----------------|--------------|
| No real CRM read/write | Can’t see or update contacts, companies, deals, or activities. | HubSpot/Salesforce MCP or HUBSPOT_API_KEY integration in crm_lookup + create/update. |
| No calendar booking | Can’t book demos or send booking links. | Calendly MCP or native “create_meeting_link” / “book_slot”. |
| No sequence automation | Can’t run multi-step email sequences or track opens/clicks. | ESP (e.g. Resend sequences) or MCP; or sequence_run tool. |
| No pipeline/forecast data | Can’t report real pipeline or forecast. | CRM pipeline/forecast API or MCP. |
| No lead scoring / routing | Can’t qualify or route leads. | CRM or dedicated lead_score / route_lead tool. |

---

## 3. Engineering / CTO (or VP Eng)

### What a human CTO/VP Eng needs to do to lead engineering

- **Roadmap & delivery:** Prioritize backlog; scope and ship features; manage releases and dependencies; balance tech debt and reliability.
- **Code & repos:** Review PRs; manage branches and releases; own CI/CD and deployment.
- **Quality & reliability:** Define SLOs/SLAs; run incidents and postmortems; manage on-call and alerts.
- **Docs & specs:** RFCs, runbooks, API docs; align with Product and other teams.
- **Tooling:** Repos (GitHub/GitLab), project tracking (Jira/Linear), monitoring (Datadog, etc.).

### What the Engineering agent can do today (with current tools)

| Capability | Tool(s) | Notes |
|------------|---------|--------|
| Research (docs, specs) | web_search, web_scraper | Good for external docs. |
| Draft RFCs/runbooks | content_generator | Text drafts. |
| List / create GitHub issues | github_list_issues, github_create_issue | GITHUB_TOKEN. |
| Notify (e.g. deploy, incident) | slack_notifier | Webhook. |
| Store/read metrics | metrics_record, analytics_reader | Internal (e.g. deploys, bugs). |
| Spreadsheets | google_sheets | Stub; write_file for CSV. |
| Remember context | memory_store, memory_get | Per-agent. |
| Read/write files | read_file, write_file | Agent sandbox only (not repo). |
| Coordinate with other agents | post_coordination_message | E.g. “Shipping X; avoid touching Y”. |

### Gaps (Engineering)

| Gap | Why it matters | Possible fix |
|-----|----------------|--------------|
| No repo read/write (code, PRs) | Can’t read code, create branches, or open PRs. | GitHub MCP (code, PRs) or native git/repo tools. |
| No project management (Jira/Linear) | Can’t see or update tickets, sprints, or roadmap. | Jira/Linear MCP or native list_tickets, create_ticket, update_sprint. |
| No CI/CD or deploy trigger | Can’t run builds or deploys. | MCP (e.g. GitHub Actions, Vercel) or deploy_trigger tool (with safety). |
| No monitoring/alerting | Can’t read errors, latency, or SLOs. | Datadog/PagerDuty MCP or metrics API. |
| read_file/write_file not in repo | Can’t edit real codebase; only agent sandbox. | Repo-aware tool (path scoped to repo + approval) or MCP. |

---

## 4. Finance / CFO (or Head of Finance)

### What a human CFO needs to do to lead finance

- **Planning & reporting:** Budgets, forecasts, P&L, cash flow; board and investor updates; variance analysis.
- **Metrics:** MRR/ARR, burn, runway, unit economics; KPIs by segment or product.
- **Data sources:** Stripe/billing, bank/credit, payroll; consolidate into a single view.
- **Compliance & data room:** Data room structure; audit trails; cap table and legal.
- **Stakeholders:** Board, investors, auditors; align with Sales (pipeline) and Eng (e.g. usage for billing).

### What the Finance agent can do today (with current tools)

| Capability | Tool(s) | Notes |
|------------|---------|--------|
| Fetch market/rates | web_search, web_scraper | External data. |
| Draft reports | content_generator | Narrative drafts. |
| Convert currencies | currency_convert | EXCHANGE_RATE_API_KEY. |
| Store/read metrics | metrics_record, analytics_reader | Internal (MRR, burn, runway). |
| Spreadsheets | google_sheets | Stub; write_file for CSV. |
| Notify | slack_notifier | Webhook. |
| Remember context | memory_store, memory_get | Per-agent. |
| Read/write files | read_file, write_file | E.g. report drafts. |
| Coordinate with other agents | post_coordination_message | E.g. “MRR updated; pipeline closed”. |

### Gaps (Finance)

| Gap | Why it matters | Possible fix |
|-----|----------------|--------------|
| No billing/Stripe data | Can’t report real MRR, churn, or revenue. | Stripe MCP or STRIPE_API for subscriptions and revenue. |
| No bank/cash data | Can’t report cash position or runway from real data. | Accounting/bank MCP or read-only API. |
| No Google Sheets read/write | Can’t read from or push to existing models and reports. | Google Sheets MCP or service account. |
| No structured P&L / forecast | Can’t build or update P&L/forecast. | Spreadsheet MCP + template; or native forecast_read/write. |
| No data room or doc gen | Can’t assemble or update data room. | Drive/Notion MCP or document assembly tool. |

---

## Summary: fill order (suggested)

1. **Shared:** Real **Google Sheets** (or equivalent) read/write – unblocks Marketing, Sales, and Finance for reports and pipelines.
2. **Marketing:** **Analytics** (GA4 or similar) read; **keyword/rank** tracking; then paid ads or CMS if needed.
3. **Sales:** **CRM** read/write (HubSpot or Salesforce); **calendar booking**; then sequences.
4. **Engineering:** **Project management** (Jira/Linear) read/write; **repo/PR** (e.g. GitHub MCP); then CI/monitoring.
5. **Finance:** **Stripe** (or billing) read for MRR/revenue; **Sheets** for models; then bank/cash if needed.

Using **MCP** for external systems (Sheets, CRM, GitHub, Stripe, GA, etc.) keeps the app small and lets you add capabilities per-org by configuring servers. Native tools still make sense for high-use, security-sensitive, or agent-specific flows (e.g. metrics_record, coordination, memory).
