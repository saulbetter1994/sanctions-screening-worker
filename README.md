# Sanctions Screening Worker

Notion Worker that powers the Sanctions Screening Tool template. Provides 4 tools that Custom Agents use to screen entities against sanctions lists and run OSINT investigations.

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
