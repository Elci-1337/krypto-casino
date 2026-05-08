import { parseArgs } from "./lib/env.mjs";
import { createSheet } from "./lib/google.mjs";

const args = parseArgs(process.argv);
const siteName = args["site-name"];
if (!siteName) {
  console.error("usage: create-sheet.mjs --site-name \"Some Site\"");
  process.exit(2);
}

const result = await createSheet({ name: `${siteName} Keyword List` });
process.stdout.write(JSON.stringify(result) + "\n");
