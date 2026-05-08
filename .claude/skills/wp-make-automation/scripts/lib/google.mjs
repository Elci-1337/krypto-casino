import { readFileSync } from "node:fs";
import { JWT } from "google-auth-library";
import { need, opt } from "./env.mjs";

const SA_PATH = need("GOOGLE_SA_JSON_PATH");
const SCOPES = [
  "https://www.googleapis.com/auth/spreadsheets",
  "https://www.googleapis.com/auth/drive",
];

let _client;
function client() {
  if (_client) return _client;
  const key = JSON.parse(readFileSync(SA_PATH, "utf8"));
  _client = new JWT({
    email: key.client_email,
    key: key.private_key,
    scopes: SCOPES,
  });
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
  const created = await googleFetch("https://sheets.googleapis.com/v4/spreadsheets", {
    method: "POST",
    body: JSON.stringify({ properties: { title: name } }),
  });
  if (parentFolderId) {
    await googleFetch(
      `https://www.googleapis.com/drive/v3/files/${created.spreadsheetId}?addParents=${parentFolderId}&removeParents=root&supportsAllDrives=true`,
      { method: "PATCH", body: "{}" }
    );
  }
  return { spreadsheetId: created.spreadsheetId, url: created.spreadsheetUrl };
}

export async function createSheet({ name }) {
  const tplId = opt("GOOGLE_SHEETS_TEMPLATE_ID");
  const parent = opt("GOOGLE_DRIVE_PARENT_FOLDER_ID");
  if (tplId) return copyTemplateSheet({ templateId: tplId, name, parentFolderId: parent });
  return createBlankSheet({ name, parentFolderId: parent });
}
