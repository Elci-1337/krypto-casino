import { parseArgs, opt } from "./lib/env.mjs";
import { createConnection, MAKE_TEAM_ID } from "./lib/make.mjs";

const args = parseArgs(process.argv);
const siteName = args["site-name"];
const wpUrl = args["wp-url"];
const wpKey = args["wp-key"] || process.env.WP_MAKE_KEY;
if (!siteName || !wpUrl || !wpKey) {
  console.error("usage: create-wp-connection.mjs --site-name X --wp-url https://… --wp-key …");
  process.exit(2);
}

// Account type slug differs between Make app versions; override via env if needed.
const accountType = opt("MAKE_WP_ACCOUNT_TYPE", "wordpress");

const conn = await createConnection({
  teamId: MAKE_TEAM_ID,
  accountName: `${siteName} — WordPress`,
  accountType,
  data: { url: wpUrl, apiKey: wpKey },
});
const connectionId = conn.id || conn.connectionId;
if (!connectionId) {
  console.error("connection create returned no id:", JSON.stringify(conn));
  process.exit(1);
}
process.stdout.write(JSON.stringify({ connectionId }) + "\n");
