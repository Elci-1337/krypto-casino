import { need } from "./env.mjs";

// The "Make" / "Integromat" plugin for WordPress stores its API key in the
// wp_options table (typically under `integromat_api_key` or `make_api_key`)
// and surfaces it on its admin page. There is no official REST endpoint, so
// we scrape the admin page after a cookie login.
//
// Returns { key, source } on success; throws on failure. Callers should fall
// back to asking the user to paste the key manually.

const KEY_REGEXES = [
  /name=['"]integromat_api_key['"][^>]*value=['"]([A-Za-z0-9_-]{16,})['"]/,
  /name=['"]make_api_key['"][^>]*value=['"]([A-Za-z0-9_-]{16,})['"]/,
  /id=['"]integromat-api-key['"][^>]*value=['"]([A-Za-z0-9_-]{16,})['"]/,
  /<code[^>]*>([A-Za-z0-9_-]{32,})<\/code>/,
  /api[_-]?key[^A-Za-z0-9]{1,8}([A-Za-z0-9_-]{32,})/i,
];

function extractKey(html) {
  for (const re of KEY_REGEXES) {
    const m = html.match(re);
    if (m) return m[1];
  }
  return null;
}

async function loginAndFetch(wpUrl, username, password) {
  const loginUrl = `${wpUrl.replace(/\/$/, "")}/wp-login.php`;
  const form = new URLSearchParams({
    log: username,
    pwd: password,
    "wp-submit": "Log In",
    redirect_to: `${wpUrl.replace(/\/$/, "")}/wp-admin/`,
    testcookie: "1",
  });
  const loginRes = await fetch(loginUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Cookie: "wordpress_test_cookie=WP%20Cookie%20check",
    },
    body: form,
    redirect: "manual",
  });
  const setCookie = loginRes.headers.getSetCookie?.() || [loginRes.headers.get("set-cookie")].filter(Boolean);
  const cookies = setCookie
    .map((c) => c.split(";")[0])
    .filter((c) => c && !c.startsWith("wordpress_test_cookie"))
    .join("; ");
  if (!cookies.includes("wordpress_logged_in")) {
    throw new Error("WP login failed: no session cookie returned");
  }
  return cookies;
}

async function fetchAdminPage(wpUrl, cookies, slug) {
  const url = `${wpUrl.replace(/\/$/, "")}/wp-admin/admin.php?page=${slug}`;
  const res = await fetch(url, { headers: { Cookie: cookies } });
  if (!res.ok) return null;
  return res.text();
}

export async function fetchMakeKey(wpUrl) {
  const username = need("WP_USERNAME");
  const password = need("WP_PASSWORD");
  const cookies = await loginAndFetch(wpUrl, username, password);
  for (const slug of ["integromat-webhooks", "make-webhooks", "integromat", "make"]) {
    const html = await fetchAdminPage(wpUrl, cookies, slug);
    if (!html) continue;
    const key = extractKey(html);
    if (key) return { key, source: slug };
  }
  throw new Error("Could not locate Make-Connector API key on any known admin page");
}
