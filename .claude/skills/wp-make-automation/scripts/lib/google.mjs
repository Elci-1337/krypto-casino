import { readFileSync } from "node:fs";
import { JWT, OAuth2Client } from "google-auth-library";
import { need, opt } from "./env.mjs";

const SCOPES = [
  "https://www.googleapis.com/auth/spreadsheets",
  "https://www.googleapis.com/auth/drive",
];

let _client;
function client() {
  if (_client) return _client;
  const refresh = opt("GOOGLE_OAUTH_REFRESH_TOKEN");
  if (refresh) {
    const cid = need("GOOGLE_OAUTH_CLIENT_ID");
    const cs = need("GOOGLE_OAUTH_CLIENT_SECRET");
    const c = new OAuth2Client(cid, cs);
    c.setCredentials({ refresh_token: refresh });
    _client = c;
    return _client;
  }
  const saPath = opt("GOOGLE_SA_JSON_PATH");
  if (!saPath) {
    console.error("[google] no auth: set GOOGLE_OAUTH_REFRESH_TOKEN (run google-auth-bootstrap.mjs) or GOOGLE_SA_JSON_PATH");
    process.exit(2);
  }
  const key = JSON.parse(readFileSync(saPath, "utf8"));
  _client = new JWT({ email: key.client_email, key: key.private_key, scopes: SCOPES });
  return _client;
}

async function googleFetch(url, init = {}) {
  const c = client();
  const { token } = await c.getAccessToken();
  const res = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
  });
  const text = await res.text();
  const body = text ? JSON.parse(text) : {};
  if (!res.ok) {
    throw new Error(`Google ${res.status} ${init.method || "GET"} ${url}: ${body?.error?.message || text}`);
  }
  return body;
}

export async function copyTemplateSheet({ templateId, name, parentFolderId }) {
  const body = { name };
  if (parentFolderId) body.parents = [parentFolderId];
  const file = await googleFetch(
    `https://www.googleapis.com/drive/v3/files/${templateId}/copy?supportsAllDrives=true`,
    { method: "POST", body: JSON.stringify(body) }
  );
  return { spreadsheetId: file.id, url: `https://docs.google.com/spreadsheets/d/${file.id}/edit` };
}

export async function createBlankSheet({ name, parentFolderId }) {
  // Drive API create avoids Sheets API "caller does not have permission" when
  // the service account has no quota project but DOES have edit access to a
  // shared parent folder. Requires parentFolderId in practice.
  const body = {
    name,
    mimeType: "application/vnd.google-apps.spreadsheet",
  };
  if (parentFolderId) body.parents = [parentFolderId];
  const file = await googleFetch(
    "https://www.googleapis.com/drive/v3/files?supportsAllDrives=true&fields=id",
    { method: "POST", body: JSON.stringify(body) }
  );
  return {
    spreadsheetId: file.id,
    url: `https://docs.google.com/spreadsheets/d/${file.id}/edit`,
  };
}

export async function createSheet({ name }) {
  const tplId = opt("GOOGLE_SHEETS_TEMPLATE_ID");
  const parent = opt("GOOGLE_DRIVE_PARENT_FOLDER_ID");
  if (tplId) return copyTemplateSheet({ templateId: tplId, name, parentFolderId: parent });
  return createBlankSheet({ name, parentFolderId: parent });
}
