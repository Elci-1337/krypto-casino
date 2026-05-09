---
name: wp-make-automation
description: Clone a Make.com scenario for a new WordPress site. Fetches the Make-Connector API key from the target WP install, clones a template scenario, creates a fresh WordPress connection in Make, swaps every WordPress module's connection in the cloned scenario, and rewires all Google-Sheets modules to a Google Sheet ID provided by the user. Trigger when the user says things like "neue Seite an Make anbinden", "Szenario für <domain> aufsetzen", "klone das Make-Szenario für …", or invokes /wp-make-automation.
---

# WordPress + Make.com + Google Sheets Onboarding

This skill onboards a brand-new WordPress site to an existing Make.com workflow with zero manual clicking, except for one prerequisite: the user creates the target Google Sheet manually and supplies its ID.

## Required arguments

- `site-name` (string, required) — human-readable name, used as connection label in Make.
- `wp-url` (string, required) — full URL of the WordPress site, e.g. `https://example.com`.
- `sheet-id` (string, required) — Google Sheet ID. The user creates the sheet manually with the same Google account that's connected to Make under "Google Sheets", then copies the ID from the URL: `https://docs.google.com/spreadsheets/d/<THIS PART>/edit`.

If the user only gave some of these (or none), ASK for the missing values via `AskUserQuestion` before doing anything.

## Required environment variables

Read from `.claude/skills/wp-make-automation/.env` (gitignored). If a variable is missing, stop and tell the user which one. Do NOT prompt for secrets in chat.

| Var | Purpose |
| --- | --- |
| `MAKE_API_TOKEN` | Make.com API token (Profile → API → Add token, scopes: `scenarios:read scenarios:write connections:read connections:write teams:read`) |
| `MAKE_ZONE` | `eu1`, `eu2`, or `us1` — your Make region |
| `MAKE_TEAM_ID` | numeric team ID where the cloned scenario should live |
| `MAKE_TEMPLATE_SCENARIO_ID` | numeric ID of the scenario to clone |
| `WP_USERNAME` | admin username on the target WP — used to scrape the Make-Connector key page |
| `WP_PASSWORD` | admin password (or Application Password — try the App Password first) |

## Execution order

Run scripts in this order. Each one prints a JSON line to stdout that the next step consumes; pipe them or capture the output explicitly.

1. **Get the Make-Connector key from WP**
   ```
   node scripts/get-wp-key.mjs --url "$WP_URL"
   ```
   Tries WP Application-Password REST first, then falls back to cookie-login + admin-page scrape. If both fail, ASK the user via `AskUserQuestion` to paste the key manually, then export it as `WP_MAKE_KEY` and continue.

2. **Clone the template scenario**
   ```
   node scripts/clone-scenario.mjs --site-name "$SITE_NAME"
   ```
   Returns `{ "newScenarioId": <number>, "blueprint": {...} }`.

3. **Create the WordPress connection in Make**
   ```
   node scripts/create-wp-connection.mjs --site-name "$SITE_NAME" --wp-url "$WP_URL" --wp-key "$WP_MAKE_KEY"
   ```
   Returns `{ "connectionId": <number> }`.

4. **Patch the cloned scenario**
   ```
   node scripts/patch-scenario.mjs \
     --scenario-id "$NEW_SCENARIO_ID" \
     --wp-connection-id "$CONNECTION_ID" \
     --spreadsheet-id "$SHEET_ID"
   ```
   Walks the blueprint, replaces every `__IMTCONN__` of type `wordpress` with the new connection ID, and replaces every `spreadsheetId` parameter on Google-Sheets modules with the user-provided ID. Saves via `PATCH /scenarios/{id}/blueprint`.

Or do it all at once:
```
node scripts/run.mjs --site-name "Acme" --wp-url https://acme.com --sheet-id 1AbC…
```

## After running

Report to the user:
- new scenario URL: `https://{MAKE_ZONE}.make.com/{teamId}/scenarios/{newScenarioId}`
- the sheet URL (just `https://docs.google.com/spreadsheets/d/<sheetId>/edit`)
- the Make-Connector key was used but never logged

Do not auto-activate the scenario — the user verifies the wiring first.

## Failure handling

- **Make API 401** → token expired or wrong scopes. Tell the user, do not retry.
- **Make API 403 on connections** → the team isn't allowed to create that connection type; surface verbatim.
- **WP scrape fails** → ALWAYS fall back to asking the user to paste the key. Never silently skip the WP-key step.
- **Blueprint patch finds zero WordPress or zero Google-Sheets modules** → abort and tell the user the template doesn't match expectations; do not save a half-patched scenario.
- **Make scenario can't access the sheet** → the Google account connected to Make doesn't have edit access to the sheet. Tell the user to share the sheet with that account.

## Things this skill does NOT do

- It does not create the Google Sheet — the user does that manually and passes `--sheet-id`.
- It does not call any Google API.
- It does not click anything in the Make UI — pure REST.
- It does not activate the scenario or create webhooks.
- It does not store any secrets in chat history or commit them.
