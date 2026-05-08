import { parseArgs } from "./lib/env.mjs";
import { getBlueprint, setBlueprint } from "./lib/make.mjs";

const args = parseArgs(process.argv);
const scenarioId = args["scenario-id"];
const wpConnectionId = args["wp-connection-id"];
const spreadsheetId = args["spreadsheet-id"];
if (!scenarioId || !wpConnectionId || !spreadsheetId) {
  console.error("usage: patch-scenario.mjs --scenario-id N --wp-connection-id N --spreadsheet-id ID");
  process.exit(2);
}

const blueprint = await getBlueprint(scenarioId);
const stats = { wpModules: 0, sheetsModules: 0, sheetIdReplacements: 0 };

function moduleApp(node) {
  return typeof node?.module === "string" ? node.module.split(":")[0] : null;
}

function patchModule(node) {
  const app = moduleApp(node);
  if (app === "wordpress" || app === "wp") {
    stats.wpModules++;
    if (node.parameters && "__IMTCONN__" in node.parameters) {
      node.parameters.__IMTCONN__ = Number(wpConnectionId);
    } else {
      node.parameters = { ...(node.parameters || {}), __IMTCONN__: Number(wpConnectionId) };
    }
  }
  if (app === "google-sheets" || app === "googlesheets") {
    stats.sheetsModules++;
    for (const bag of [node.parameters, node.mapper]) {
      if (bag && "spreadsheetId" in bag) {
        bag.spreadsheetId = spreadsheetId;
        stats.sheetIdReplacements++;
      }
    }
  }
}

function walk(node) {
  if (Array.isArray(node)) {
    for (const child of node) walk(child);
    return;
  }
  if (node && typeof node === "object") {
    if (typeof node.module === "string") patchModule(node);
    for (const v of Object.values(node)) walk(v);
  }
}

walk(blueprint);

if (stats.wpModules === 0) {
  console.error("aborting: blueprint contains no WordPress modules — template mismatch?");
  process.exit(1);
}
if (stats.sheetsModules === 0) {
  console.error("aborting: blueprint contains no Google-Sheets modules — template mismatch?");
  process.exit(1);
}

await setBlueprint(scenarioId, blueprint);
process.stdout.write(JSON.stringify({ ok: true, ...stats }) + "\n");
