# lib/shared

Runtime-agnostic code that runs **identically on client and server**.

Rules:

- **No** Node-only APIs (`fs`, `process.env` secrets, `node:*`).
- **No** browser-only APIs (`window`, `document`).
- **No** database or network calls.
- Pure, deterministic math + type contracts only.

This boundary lets players independently replay any round from its public
inputs (`serverSeed`, `clientSeed`, `nonce`) and confirm the result.
