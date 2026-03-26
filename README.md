# Sanctions Screening Tool

Automated sanctions, PEP, and adverse media screening powered by AI agents. Screen entities against 2.1M+ records from OpenSanctions, run OSINT investigations, generate compliance reports, and get MLRO-grade risk assessments.

**[View the full Notion template and documentation](https://www.notion.so/Sanctions-Screening-Tool-32512e3fb81d81ce981ff4b6893f482b)**

The Notion page contains the complete working template — 5 interconnected databases, 6 reference pages with domain knowledge, a dashboard, and a detailed setup guide. Start there to understand the full system before looking at the code.

---

## What This Does

A 4-stage automated compliance screening pipeline:

| Stage | Agent | What It Does |
|---|---|---|
| L1 Screening | L1 Screening Agent | Matches entity against OpenSanctions (sanctions, PEPs, watchlists). Classifies as True Match / Potential Match / False Positive / No Match. |
| L2 OSINT | L2 OSINT Agent | Runs 5-step investigation: identity verification, adverse media, PEP check, network analysis, red flag assessment. |
| Report Writing | Report Writer Agent | Generates professional EDD reports, false positive reports, or escalation reports. |
| MLRO Review | Deputy MLRO Agent | Risk assessment (High/Medium/Low), decision recommendation, SAR narrative if needed. |

You add a name to the Screening Cases database — the pipeline runs automatically from L1 through to a final risk decision.

## Pipeline Flow

```
New case submitted
  └─ L1 Screening
       ├─ No Match / False Positive  →  Status: "L1 Closed"
       │    └─ Report Writer  →  Short report  →  Status: "Completed"
       │
       └─ True Match / Potential Match  →  Status: "L1 Complete"
            └─ L2 OSINT Investigation  →  Status: "L2 Complete"
                 └─ Report Writer
                      ├─ False Positive (clean)  →  Short report  →  Status: "Completed"
                      └─ True Match / FP-Flagged / Escalate  →  Full report  →  Status: "Report Complete"
                           └─ Deputy MLRO  →  Risk assessment + decision  →  Status: "Completed"
```

### Status Values & Triggers

| Status | Set By | Triggers |
|---|---|---|
| New | User (form submission) | L1 Screening Agent |
| L1 Closed | L1 Agent (No Match / False Positive) | Report Writer Agent |
| L1 Complete | L1 Agent (True / Potential Match) | L2 OSINT Agent |
| L2 Complete | L2 Agent (all determinations) | Report Writer Agent |
| Report Complete | Report Writer (True Match / FP-Flagged / Escalate) | Deputy MLRO Agent |
| Completed | Report Writer (No Match / FP) or Deputy MLRO | — end of pipeline — |
| Needs Info | Human reviewer (manual) | — pipeline paused — |

> **Needs Info** is a reserved status for human-in-the-loop cases where the screening cannot proceed automatically — e.g. incomplete entity data, ambiguous identity, or documents required. In a future version, this will trigger a Document Collection Agent with email/WhatsApp outreach capability to request information from the subject or submitting party. For now, set manually when a case needs to be held pending additional information.

## Architecture

This implementation uses **Notion Custom Agents** + **Notion Workers** — everything runs inside Notion with no external servers.

- **This repo** contains the Worker (TypeScript) that wraps the OpenSanctions and Brave Search APIs into 4 tools
- **The Notion template** contains the databases, agent instructions, reference materials, and setup guide
- **You bring your own API keys** — OpenSanctions for sanctions/PEP data, Brave Search for OSINT

## Tools

| Tool | Description |
|---|---|
| `matchEntity` | Match entities against OpenSanctions (sanctions, PEPs, watchlists) |
| `getEntity` | Fetch full details of a matched entity by ID |
| `searchWeb` | Web search via Brave Search for adverse media and OSINT |
| `healthCheck` | Verify API keys and service connectivity |

## Setup

Full step-by-step instructions are in the [Setup Guide](https://www.notion.so/32512e3fb81d81e6ba09f964ef0fb596) on the Notion template. Quick version:

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
git clone https://github.com/saulbetter1994/sanctions-screening-worker.git
cd sanctions-screening-worker
npm install
ntn workers deploy --name "Sanctions Screening Worker"
```

### 4. Set API keys

```bash
ntn workers env set OPENSANCTIONS_API_KEY=your-key
ntn workers env set BRAVE_SEARCH_API_KEY=your-key
```

Keys are stored as encrypted environment variables on Notion's servers. They never appear in this code.

### 5. Create the 4 Custom Agents

The `agents/` folder contains instruction files for each agent. See the [Setup Guide](https://www.notion.so/32512e3fb81d81e6ba09f964ef0fb596) for exact configuration — triggers, permissions, and tool access for each one.

| File | Agent | Trigger |
|---|---|---|
| `agents/l1-screening.md` | L1 Screening Agent | New row added to Screening Cases |
| `agents/l2-osint.md` | L2 OSINT Agent | Status changed to "L1 Complete" |
| `agents/report-writer.md` | Report Writer Agent | Status changed to "L1 Closed" or "L2 Complete" |
| `agents/deputy-mlro.md` | Deputy MLRO Agent | Status changed to "Report Complete" |

## Security

- No API keys or secrets in this repository
- `.env.example` shows required variables but contains no values
- `workers.json` (contains your workspace/worker IDs) is gitignored
- All screening data stays in your Notion workspace

---

## Proof of Concept — Transferable Architecture

This is a proof of concept. It runs entirely within Notion to demonstrate the screening pipeline with zero external infrastructure. The architecture is designed to be transferable — the same pipeline can be rebuilt on different infrastructure depending on your needs:

| Layer | This template | Alternative implementation |
|---|---|---|
| Agent runtime | Notion Custom Agents | Claude API / Claude.ai Projects |
| Tool server | Notion Worker (`@notionhq/workers`) | MCP Server (`@modelcontextprotocol/sdk`) |
| Database | Notion databases | Supabase / Firebase / PostgreSQL |
| Reports | Notion pages | PDFs in Supabase Storage / Firestore |
| Hosting | Notion's infrastructure | Railway / Fly.io / Vercel / AWS |

The core logic — API integrations, scoring thresholds, pipeline stages — stays identical across all implementations. Only the hosting and storage layer changes.

The `src/index.ts` Worker code maps directly to an MCP server: replace `worker.tool()` with `server.tool()` from `@modelcontextprotocol/sdk` and the screening logic is unchanged.

---

*Built by Paul So. Powered by OpenSanctions + Brave Search.*
