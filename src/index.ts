import { Worker, j } from "@notionhq/workers";

const worker = new Worker();
export default worker;

const OPENSANCTIONS_API_URL = (
  process.env.OPENSANCTIONS_API_URL ?? "https://api.opensanctions.org"
).replace(/\/$/, "");
const OPENSANCTIONS_API_KEY = process.env.OPENSANCTIONS_API_KEY ?? "";
const BRAVE_SEARCH_API_KEY = process.env.BRAVE_SEARCH_API_KEY ?? "";
const BRAVE_SEARCH_URL = "https://api.search.brave.com/res/v1/web/search";

// ---------------------------------------------------------------------------
// Tool 1: Match Entity Against Sanctions Lists
// ---------------------------------------------------------------------------

worker.tool("matchEntity", {
  title: "Match Entity Against Sanctions Lists",
  description:
    "Search the OpenSanctions database for matching sanctioned entities, PEPs, or watchlist entries. Returns match results with confidence scores.",
  schema: j.object({
    schema: j
      .enum("Person", "Company", "Organization", "Vessel")
      .describe(
        'Entity type schema: "Person" for individuals, "Company" for commercial organisations, "Organization" for non-commercial bodies, "Vessel" for ships.'
      ),
    propertiesJson: j
      .string()
      .describe(
        'OpenSanctions properties as a JSON string. All values must be arrays of strings. Example: {"name": ["John Smith"], "birthDate": ["1975-03-15"], "nationality": ["GB"]}'
      ),
    dataset: j
      .string()
      .nullable()
      .describe(
        'Dataset to search against. Options: "default" (~2.1M entities, recommended), "sanctions" (~100K), "peps" (~900K), "crime", "debarment", "regulatory", "maritime". Defaults to "default".'
      ),
    limit: j
      .number()
      .nullable()
      .describe(
        "Maximum number of match results to return (1-10). Defaults to 5. Use a lower limit for common names to avoid context overload."
      ),
  }),
  execute: async ({ schema, propertiesJson, dataset, limit }) => {
    if (!OPENSANCTIONS_API_KEY) {
      throw new Error(
        "OPENSANCTIONS_API_KEY is not configured. Set it with: ntn workers env set OPENSANCTIONS_API_KEY=your-key"
      );
    }

    let properties: Record<string, string[]>;
    try {
      properties = JSON.parse(propertiesJson);
    } catch {
      throw new Error(
        "Invalid propertiesJson — must be a valid JSON string of {key: [\"value\", ...]} pairs."
      );
    }

    const ds = dataset ?? "default";
    const url = `${OPENSANCTIONS_API_URL}/match/${ds}`;
    const payload = {
      queries: {
        subject: { schema, properties },
      },
      limit: limit ?? 5,
    };

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `ApiKey ${OPENSANCTIONS_API_KEY}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(
        `OpenSanctions API error ${response.status}: ${body}`
      );
    }

    return await response.json();
  },
});

// ---------------------------------------------------------------------------
// Tool 2: Get Sanctioned Entity Details
// ---------------------------------------------------------------------------

worker.tool("getEntity", {
  title: "Get Sanctioned Entity Details",
  description:
    "Fetch full details of a sanctioned entity by its OpenSanctions entity ID. Use this to get complete property data for a matched entity.",
  schema: j.object({
    entityId: j
      .string()
      .describe("OpenSanctions entity ID (e.g., 'NK-abc123' or 'ofac-12345')"),
  }),
  execute: async ({ entityId }) => {
    if (!OPENSANCTIONS_API_KEY) {
      throw new Error(
        "OPENSANCTIONS_API_KEY is not configured. Set it with: ntn workers env set OPENSANCTIONS_API_KEY=your-key"
      );
    }

    const url = `${OPENSANCTIONS_API_URL}/entities/${entityId}`;
    const response = await fetch(url, {
      headers: {
        Authorization: `ApiKey ${OPENSANCTIONS_API_KEY}`,
      },
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(
        `OpenSanctions API error ${response.status}: ${body}`
      );
    }

    return await response.json();
  },
});

// ---------------------------------------------------------------------------
// Tool 3: Web Search for OSINT
// ---------------------------------------------------------------------------

worker.tool("searchWeb", {
  title: "Web Search for OSINT",
  description:
    "Search the web using Brave Search for adverse media, news articles, public records, and other OSINT. Returns simplified results with title, URL, description, and age.",
  schema: j.object({
    query: j
      .string()
      .describe(
        'Search query string. Use quotes for exact name matches and operators for precision, e.g. \'"John Smith" sanctions OR "money laundering"\''
      ),
    count: j
      .number()
      .nullable()
      .describe("Number of results to return (1-20). Defaults to 10."),
    offset: j
      .number()
      .nullable()
      .describe("Pagination offset. Defaults to 0."),
    freshness: j
      .string()
      .nullable()
      .describe(
        'Limit results by recency. Options: "pd" (past day), "pw" (past week), "pm" (past month), "py" (past year). Omit for all-time results. Use "py" for adverse media searches.'
      ),
  }),
  execute: async ({ query, count, offset, freshness }) => {
    if (!BRAVE_SEARCH_API_KEY) {
      throw new Error(
        "BRAVE_SEARCH_API_KEY is not configured. Set it with: ntn workers env set BRAVE_SEARCH_API_KEY=your-key"
      );
    }

    const params = new URLSearchParams({
      q: query,
      count: String(count ?? 10),
    });
    if (offset) {
      params.set("offset", String(offset));
    }
    if (freshness) {
      params.set("freshness", freshness);
    }

    const response = await fetch(`${BRAVE_SEARCH_URL}?${params}`, {
      headers: {
        Accept: "application/json",
        "Accept-Encoding": "gzip",
        "X-Subscription-Token": BRAVE_SEARCH_API_KEY,
      },
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Brave Search API error ${response.status}: ${body}`);
    }

    const data = await response.json();

    // Simplify results for the agent
    const results = (
      (data as { web?: { results?: Array<{ title?: string; url?: string; description?: string; age?: string }> } }).web?.results ?? []
    ).map(
      (item: { title?: string; url?: string; description?: string; age?: string }) => ({
        title: item.title ?? "",
        url: item.url ?? "",
        description: item.description ?? "",
        age: item.age ?? "",
      })
    );

    return { results, query, total: results.length };
  },
});

// ---------------------------------------------------------------------------
// Tool 4: Health Check
// ---------------------------------------------------------------------------

worker.tool("healthCheck", {
  title: "Check API Connectivity",
  description:
    "Verify that OpenSanctions and Brave Search API keys are configured and the services are reachable. Run this after setup to confirm everything works.",
  schema: j.object({
    _unused: j
      .string()
      .nullable()
      .describe("Not used. Pass any value or null."),
  }),
  execute: async () => {
    const results: {
      opensanctions: { configured: boolean; reachable: boolean; error?: string };
      braveSearch: { configured: boolean };
      opensanctionsUrl: string;
    } = {
      opensanctions: { configured: !!OPENSANCTIONS_API_KEY, reachable: false },
      braveSearch: { configured: !!BRAVE_SEARCH_API_KEY },
      opensanctionsUrl: OPENSANCTIONS_API_URL,
    };

    // Test OpenSanctions connectivity
    if (OPENSANCTIONS_API_KEY) {
      try {
        const response = await fetch(`${OPENSANCTIONS_API_URL}/healthz`, {
          signal: AbortSignal.timeout(5000),
        });
        results.opensanctions.reachable = response.ok;
      } catch (err) {
        results.opensanctions.error =
          err instanceof Error ? err.message : "Unknown error";
      }
    }

    return results;
  },
});
