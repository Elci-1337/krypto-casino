import { parseArgs, need } from "./lib/env.mjs";
import { cloneScenario, getBlueprint, MAKE_TEAM_ID } from "./lib/make.mjs";

const args = parseArgs(process.argv);
const siteName = args["site-name"];
if (!siteName) {
  console.error("usage: clone-scenario.mjs --site-name \"Some Site\"");
  process.exit(2);
}
const templateId = need("MAKE_TEMPLATE_SCENARIO_ID");

const cloned = await cloneScenario({
  scenarioId: templateId,
  teamId: MAKE_TEAM_ID,
  name: `${siteName} — Keyword Pipeline`,
});
const newScenarioId = cloned.id || cloned.scenarioId;
if (!newScenarioId) {
  console.error("clone returned no id:", JSON.stringify(cloned));
  process.exit(1);
}
const blueprint = await getBlueprint(newScenarioId);
process.stdout.write(JSON.stringify({ newScenarioId, blueprint }) + "\n");
