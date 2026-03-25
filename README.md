# Sanctions Screening Worker

Notion Worker that powers the [Sanctions Screening Tool](https://www.notion.so/Sanctions-Screening-Tool-32512e3fb81d81ce981ff4b6893f482b) template. Provides 4 tools that Custom Agents use to screen entities against sanctions lists and run OSINT investigations.

## Tools

| Tool | Description |
|---|---|
| `matchEntity` | Match entities against OpenSanctions (sanctions, PEPs, watchlists) |
| `getEntity` | Fetch full details of a matched entity by ID |
| `searchWeb` | Web search via Brave Search for adverse media and OSINT |
| `healthCheck` | Verify API keys and service connectivity |

## Setup

### 1. Prerequisites

- [Node.js 22+](https://nodejs.org)
- A Notion Business or Enterprise workspace
- [OpenSanctions API key](https://opensanctions.org/api)
- [Brave Search API key](https://brave.com/search/api)

### 2. Install Notion CLI

```bash
npm install -g ntn
ntn login
```

### 3. Deploy

```bash
npm install
ntn workers deploy --name "Sanctions Screening Worker"
```

### 4. Set API keys

```bash
ntn workers env set OPENSANCTIONS_API_KEY=your-key
ntn workers env set BRAVE_SEARCH_API_KEY=your-key
```

Keys are stored as encrypted environment variables on Notion's servers. They never appear in this code.

## Agent Instructions

The `agents/` folder contains instruction files for the 4 Custom Agents. Copy-paste each into the corresponding agent's Instructions field in Notion:

| File | Agent | Trigger |
|---|---|---|
| `agents/l1-screening.md` | L1 Screening Agent | New row in Screening Cases |
| `agents/l2-osint.md` | L2 OSINT Agent | Status changed to "L1 Complete" |
| `agents/report-writer.md` | Report Writer Agent | Status changed to "L2 Complete" |
| `agents/deputy-mlro.md` | Deputy MLRO Agent | Status changed to "Report Complete" |

See the **Setup Guide** page in the Notion template for full step-by-step instructions.

## Security

- No API keys or secrets in this repository
- `.env.example` shows required variables but contains no values
- `workers.json` (contains your workspace/worker IDs) is gitignored
- All screening data stays in your Notion workspace

---

## This Is a Proof of Concept

This implementation runs entirely within Notion — no external servers, no SaaS infrastructure. It is intentionally minimal to demonstrate what is possible with Notion Custom Agents and Workers.

The architecture is designed to be transferable. The same screening pipeline can be rebuilt on different infrastructure depending on your needs:

| Layer | This template | Alternative implementation |
|---|---|---|
| Agent runtime | Notion Custom Agents | Claude API / Claude.ai Projects |
| Tool server | Notion Worker (`@notionhq/workers`) | MCP Server (`@modelcontextprotocol/sdk`) |
| Database | Notion databases | Supabase / Firebase / PostgreSQL |
| Reports | Notion pages | PDFs in Supabase Storage / Firestore |
| Hosting | Notion's infrastructure | Railway / Fly.io / Vercel / AWS |

**The core logic — API integrations, scoring thresholds, pipeline stages — stays identical across all implementations.** Only the hosting and storage layer changes.

If you need:
- A standalone web app with user authentication → rebuild with Claude API + Supabase
- A tool accessible from Claude.ai directly → port the Worker to an MCP server
- Enterprise-scale volume with audit trails → Claude API + PostgreSQL + event logging

The `src/index.ts` Worker code maps directly to an MCP server: replace `worker.tool()` with `server.tool()` from `@modelcontextprotocol/sdk` and the logic is unchanged.

This template exists to validate the screening workflow and demonstrate the AI pipeline. It is a starting point, not a ceiling.
