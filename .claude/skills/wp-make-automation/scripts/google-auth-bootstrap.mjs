// One-time setup: exchange a Google OAuth consent for a refresh token.
//
// Prerequisites in .env:
//   GOOGLE_OAUTH_CLIENT_ID
//   GOOGLE_OAUTH_CLIENT_SECRET
//
// Steps to create those:
//   1. https://console.cloud.google.com/ → pick (or create) a project
//   2. APIs & Services → Library → enable "Google Drive API" and "Google Sheets API"
//   3. APIs & Services → OAuth consent screen → External → add yourself as Test User
//   4. APIs & Services → Credentials → Create Credentials → OAuth client ID
//      → type "Desktop app" → name "wp-make-automation" → Create
//   5. Copy Client ID + Client Secret into .env
//   6. Run:  node scripts/google-auth-bootstrap.mjs
//
// The script opens a localhost callback, prints a URL to visit, captures the
// code automatically, and prints the refresh token. Paste it into .env as
// GOOGLE_OAUTH_REFRESH_TOKEN.

import http from "node:http";
import { OAuth2Client } from "google-auth-library";
import { need } from "./lib/env.mjs";

const cid = need("GOOGLE_OAUTH_CLIENT_ID");
const cs = need("GOOGLE_OAUTH_CLIENT_SECRET");
const port = Number(process.env.OAUTH_PORT || 47823);
const redirect = `http://localhost:${port}/cb`;

const oauth = new OAuth2Client(cid, cs, redirect);
const url = oauth.generateAuthUrl({
  access_type: "offline",
  prompt: "consent",
  scope: [
    "https://www.googleapis.com/auth/drive",
    "https://www.googleapis.com/auth/spreadsheets",
  ],
});

console.log("\n1) Open this URL in your browser, log in, allow access:\n");
console.log(url);
console.log(`\n2) Waiting for callback on http://localhost:${port}/cb …\n`);

const code = await new Promise((resolve, reject) => {
  const server = http.createServer((req, res) => {
    const u = new URL(req.url, `http://localhost:${port}`);
    if (u.pathname !== "/cb") {
      res.writeHead(404);
      res.end();
      return;
    }
    const c = u.searchParams.get("code");
    const err = u.searchParams.get("error");
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end(`<html><body style="font-family:sans-serif"><h1>${c ? "Done." : "Error."}</h1><p>You can close this tab.</p></body></html>`);
    setTimeout(() => server.close(), 100);
    if (err) reject(new Error(`OAuth error: ${err}`));
    else if (c) resolve(c);
    else reject(new Error("no code in callback"));
  });
  server.listen(port);
  setTimeout(() => {
    server.close();
    reject(new Error("timeout waiting for callback"));
  }, 5 * 60 * 1000);
});

const { tokens } = await oauth.getToken(code);
if (!tokens.refresh_token) {
  console.error("\nNo refresh_token returned. This usually means you've authorized this client before.");
  console.error("Fix: revoke the app at https://myaccount.google.com/permissions and re-run.");
  process.exit(1);
}

console.log("\nSUCCESS. Add this to .env:\n");
console.log(`GOOGLE_OAUTH_REFRESH_TOKEN=${tokens.refresh_token}\n`);
