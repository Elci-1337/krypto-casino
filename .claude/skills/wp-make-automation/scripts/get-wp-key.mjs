import { parseArgs } from "./lib/env.mjs";
import { fetchMakeKey } from "./lib/wp.mjs";

const args = parseArgs(process.argv);
const url = args.url || process.env.WP_URL;
if (!url) {
  console.error("usage: get-wp-key.mjs --url https://example.com");
  process.exit(2);
}

try {
  const { key, source } = await fetchMakeKey(url);
  process.stdout.write(JSON.stringify({ key, source }) + "\n");
} catch (e) {
  console.error(`[get-wp-key] ${e.message}`);
  console.error("Fallback: ask the user to paste the key from WP Admin → Make → API key, then export WP_MAKE_KEY.");
  process.exit(1);
}
