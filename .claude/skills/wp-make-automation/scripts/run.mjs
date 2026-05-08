// One-shot orchestrator. Call individual scripts when you want fine control;
// call this when you trust the happy path.
//
// usage: node scripts/run.mjs --site-name "Acme" --wp-url https://acme.com [--wp-key …]

import { parseArgs, opt } from "./lib/env.mjs";
import { fetchMakeKey } from "./lib/wp.mjs";
import {
  cloneScenario,
  getBlueprint,
  setBlueprint,
  createConnection,
  MAKE_TEAM_ID,
  MAKE_ZONE,
} from "./lib/make.mjs";
import { createSheet } from "./lib/google.mjs";

const args = parseArgs(process.argv);
const siteName = args["site-name"];
const wpUrl = args["wp-url"];
let wpKey = args["wp-key"] || process.env.WP_MAKE_KEY;

if (!siteName || !wpUrl) {
  console.error("usage: run.mjs --site-name X --wp-url https://… [--wp-key …]");
  process.exit(2);
}

if (!wpKey) {
  try {
    const r = await fetchMakeKey(wpUrl);
    wpKey = r.key;
    console.error(`[run] retrieved WP Make key from admin page (${r.source})`);
  } catch (e) {
    console.error(`[run] WP key auto-fetch failed: ${e.message}`);
    console.error("[run] re-run with --wp-key <key> after copying it from WP Admin → Make.");
    process.exit(1);
  }
}

const templateId = process.env.MAKE_TEMPLATE_SCENARIO_ID;
if (!templateId) {
  console.error("missing MAKE_TEMPLATE_SCENARIO_ID");
  process.exit(2);
}

console.error("[run] cloning template scenario");
const cloned = await cloneScenario({
  scenarioId: templateId,
  teamId: MAKE_TEAM_ID,
  name: `${siteName} — Keyword Pipeline`,
});
const newScenarioId = cloned.id || cloned.scenarioId;

console.error("[run] creating WordPress connection");
const conn = await createConnection({
  teamId: MAKE_TEAM_ID,
  accountName: `${siteName} — WordPress`,
  accountType: opt("MAKE_WP_ACCOUNT_TYPE", "wordpress"),
  data: { url: wpUrl, apiKey: wpKey },
});
const connectionId = conn.id || conn.connectionId;

console.error("[run] creating Google Sheet");
const sheet = await createSheet({ name: `${siteName} Keyword List` });

console.error("[run] patching blueprint");
const blueprint = await getBlueprint(newScenarioId);
const stats = { wpModules: 0, sheetsModules: 0 };
const walk = (node) => {
  if (Array.isArray(node)) return node.forEach(walk);
  if (!node || typeof node !== "object") return;
  if (typeof node.module === "string") {
    const app = node.module.split(":")[0];
    if (app === "wordpress" || app === "wp") {
      stats.wpModules++;
      node.parameters = { ...(node.parameters || {}), __IMTCONN__: Number(connectionId) };
    }
    if (app === "google-sheets" || app === "googlesheets") {
      stats.sheetsModules++;
      for (const bag of [node.parameters, node.mapper]) {
        if (bag && "spreadsheetId" in bag) bag.spreadsheetId = sheet.spreadsheetId;
      }
    }
  }
  for (const v of Object.values(node)) walk(v);
};
walk(blueprint);
if (stats.wpModules === 0 || stats.sheetsModules === 0) {
  console.error(`[run] template mismatch: ${JSON.stringify(stats)} — aborting before save`);
  process.exit(1);
}
await setBlueprint(newScenarioId, blueprint);

const out = {
  scenarioUrl: `https://${MAKE_ZONE}.make.com/${MAKE_TEAM_ID}/scenarios/${newScenarioId}`,
  newScenarioId,
  connectionId,
  sheetUrl: sheet.url,
  spreadsheetId: sheet.spreadsheetId,
  stats,
};
process.stdout.write(JSON.stringify(out, null, 2) + "\n");
