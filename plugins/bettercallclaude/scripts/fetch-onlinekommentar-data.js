#!/usr/bin/env node
/**
 * OnlineKommentar Cache Builder
 *
 * Fetches all commentary data from onlinekommentar.ch API and stores it
 * as a JSON cache file that the MCP server can use when the live API
 * is unavailable (e.g., in sandboxed environments like Cowork Desktop).
 *
 * Usage:
 *   node scripts/fetch-onlinekommentar-data.js
 *
 * Output:
 *   plugins/bettercallclaude/mcp-servers/onlinekommentar/dist/onlinekommentar-cache.json
 */

const fs = require("fs");
const path = require("path");

const BASE_URL = "https://onlinekommentar.ch/api";
const RATE_LIMIT_MS = 1500; // Be polite: 1.5s between requests
const TIMEOUT_MS = 30000;
const OUTPUT_PATH = path.join(
  __dirname,
  "..",
  "mcp-servers",
  "onlinekommentar",
  "dist",
  "onlinekommentar-cache.json"
);

let lastRequestTime = 0;

async function rateLimitedFetch(url, options = {}) {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  if (timeSinceLastRequest < RATE_LIMIT_MS) {
    const waitTime = RATE_LIMIT_MS - timeSinceLastRequest;
    await new Promise((resolve) => setTimeout(resolve, waitTime));
  }
  lastRequestTime = Date.now();

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "User-Agent": "BetterCallClaude/2.0 CacheBuilder",
        ...options.headers,
      },
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

async function fetchAllCommentaries() {
  const commentaries = [];
  let page = 1;
  let hasMore = true;

  console.log("Fetching commentaries from onlinekommentar.ch...");

  while (hasMore) {
    try {
      const url = `${BASE_URL}/commentaries?page=${page}`;
      console.log(`  Page ${page}...`);
      const response = await rateLimitedFetch(url);
      const data = await response.json();

      const pageData = data.data ?? data;
      const items = pageData.commentaries || pageData;

      if (!Array.isArray(items) || items.length === 0) {
        hasMore = false;
        break;
      }

      commentaries.push(...items);
      console.log(`  Got ${items.length} commentaries (total: ${commentaries.length})`);

      const totalPages = pageData.total_pages || data.total_pages;
      if (totalPages && page >= totalPages) {
        hasMore = false;
      } else {
        page++;
      }
    } catch (error) {
      console.error(`  Error on page ${page}: ${error.message}`);
      hasMore = false;
    }
  }

  return commentaries;
}

async function fetchCommentaryDetails(commentaryIds) {
  const details = [];
  const total = commentaryIds.length;

  console.log(`\nFetching detailed content for ${total} commentaries...`);

  for (let i = 0; i < total; i++) {
    const id = commentaryIds[i];
    try {
      const url = `${BASE_URL}/commentaries/${encodeURIComponent(id)}`;
      const response = await rateLimitedFetch(url);
      const data = await response.json();
      const detail = data.data ?? data;
      details.push(detail);

      if ((i + 1) % 10 === 0 || i === total - 1) {
        console.log(`  ${i + 1}/${total} fetched`);
      }
    } catch (error) {
      console.error(`  Error fetching ${id}: ${error.message}`);
      // Keep the summary version
      details.push({ id, _fetchError: error.message });
    }
  }

  return details;
}

function extractLegislativeActs(commentaries) {
  console.log("\nExtracting legislative acts from commentaries...");
  const acts = new Map();
  for (const c of commentaries) {
    const la = c.legislative_act;
    if (la && la.id && !acts.has(la.id)) {
      acts.set(la.id, {
        id: la.id,
        name: la.title || la.name || "",
        abbreviation: la.title || la.abbreviation || "",
        language: c.language || "en",
      });
    }
  }
  const result = Array.from(acts.values());
  console.log(`  Extracted ${result.length} unique legislative acts`);
  return result;
}

async function main() {
  console.log("=== OnlineKommentar Cache Builder ===\n");
  console.log(`API: ${BASE_URL}`);
  console.log(`Output: ${OUTPUT_PATH}\n`);

  // Step 1: Fetch commentary list
  const summaries = await fetchAllCommentaries();

  if (summaries.length === 0) {
    console.error("\nNo commentaries found. Check your network connection.");
    process.exit(1);
  }

  // Step 2: Fetch detailed content for each commentary
  const commentaryIds = summaries
    .map((c) => c.id)
    .filter((id) => id);

  let commentaries;
  if (commentaryIds.length > 0 && commentaryIds.length <= 500) {
    commentaries = await fetchCommentaryDetails(commentaryIds);
  } else {
    console.log(`\nSkipping detail fetch (${commentaryIds.length} items — using summaries only)`);
    commentaries = summaries;
  }

  // Step 3: Extract legislative acts from commentary data
  const legislativeActs = extractLegislativeActs(commentaries);

  // Step 4: Build cache object
  const cache = {
    metadata: {
      fetchedAt: new Date().toISOString(),
      commentaryCount: commentaries.length,
      legislativeActCount: legislativeActs.length,
      apiUrl: BASE_URL,
      version: "1.0",
    },
    commentaries,
    legislativeActs,
  };

  // Step 5: Write cache file
  const outputDir = path.dirname(OUTPUT_PATH);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(cache, null, 2), "utf-8");

  const fileSizeMB = (fs.statSync(OUTPUT_PATH).size / (1024 * 1024)).toFixed(2);
  console.log(`\n=== Cache Build Complete ===`);
  console.log(`Commentaries: ${commentaries.length}`);
  console.log(`Legislative Acts: ${legislativeActs.length}`);
  console.log(`File Size: ${fileSizeMB} MB`);
  console.log(`Output: ${OUTPUT_PATH}`);
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
