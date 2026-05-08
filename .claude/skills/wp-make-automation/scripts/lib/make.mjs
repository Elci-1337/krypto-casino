import { need, opt } from "./env.mjs";

const ZONE = opt("MAKE_ZONE", "eu1");
const TOKEN = need("MAKE_API_TOKEN");
const BASE = `https://${ZONE}.make.com/api/v2`;

async function makeFetch(path, init = {}) {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Token ${TOKEN}`,
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(init.headers || {}),
    },
  });
  const text = await res.text();
  let body;
  try {
    body = text ? JSON.parse(text) : {};
  } catch {
    body = { raw: text };
  }
  if (!res.ok) {
    const msg = body?.message || body?.detail || JSON.stringify(body);
    throw new Error(`Make API ${res.status} ${init.method || "GET"} ${path}: ${msg}`);
  }
  return body;
}

export async function cloneScenario({ scenarioId, teamId, name }) {
  const body = await makeFetch(`/scenarios/${scenarioId}/clone`, {
    method: "POST",
    body: JSON.stringify({ name, teamId: Number(teamId) }),
  });
  return body.scenario || body;
}

export async function getBlueprint(scenarioId) {
  const body = await makeFetch(`/scenarios/${scenarioId}/blueprint`);
  return body.response?.blueprint || body.blueprint || body;
}

export async function setBlueprint(scenarioId, blueprint) {
  return makeFetch(`/scenarios/${scenarioId}`, {
    method: "PATCH",
    body: JSON.stringify({ blueprint: JSON.stringify(blueprint) }),
  });
}

export async function listConnections(teamId) {
  const body = await makeFetch(`/connections?teamId=${teamId}`);
  return body.connections || [];
}

export async function createConnection({ teamId, accountName, accountType, data }) {
  const params = new URLSearchParams({ teamId: String(teamId) });
  const body = await makeFetch(`/connections?${params}`, {
    method: "POST",
    body: JSON.stringify({ accountName, accountType, ...data }),
  });
  return body.connection || body;
}

export const MAKE_ZONE = ZONE;
export const MAKE_TEAM_ID = need("MAKE_TEAM_ID");
