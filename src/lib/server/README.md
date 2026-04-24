# lib/server

**Server-only** code. Never import from client components.

Lives here:

- Supabase **service-role** client (bypasses RLS).
- Secret RNG / server-seed generation.
- Wager settlement, payout writes, balance mutations.
- Solana deposit/withdrawal signers.

Anything in this folder must be reachable **only** from Route Handlers
(`src/app/api/*`) or Server Actions. Leaking a module from here to the
client bundle leaks secrets.
