/**
 * Provably-fair primitives. Pure, deterministic, runtime-agnostic.
 * Runs identically on Node (Web Crypto via globalThis) and in the browser,
 * so clients can independently re-verify server outcomes.
 */

const encoder = new TextEncoder();

/**
 * Encode a string into a Uint8Array backed by a real ArrayBuffer. At runtime
 * TextEncoder always returns an ArrayBuffer-backed view, but TS 5.7+ lib
 * types widen to ArrayBufferLike (which includes SharedArrayBuffer) and that
 * is not assignable to Web Crypto's BufferSource — hence the narrow cast.
 */
function encode(text: string): Uint8Array<ArrayBuffer> {
  return encoder.encode(text) as Uint8Array<ArrayBuffer>;
}

async function hmacSha256Hex(key: string, message: string): Promise<string> {
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    encode(key),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", cryptoKey, encode(message));
  return bytesToHex(new Uint8Array(signature));
}

async function sha256Hex(message: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", encode(message));
  return bytesToHex(new Uint8Array(digest));
}

function bytesToHex(bytes: Uint8Array): string {
  let out = "";
  for (let i = 0; i < bytes.length; i++) {
    out += bytes[i].toString(16).padStart(2, "0");
  }
  return out;
}

export type FairInputs = {
  serverSeed: string;
  clientSeed: string;
  nonce: number;
};

/** Deterministic hex digest that binds a round to its three inputs. */
export async function roundHash({
  serverSeed,
  clientSeed,
  nonce,
}: FairInputs): Promise<string> {
  return hmacSha256Hex(serverSeed, `${clientSeed}:${nonce}`);
}

/** Public commitment to an unrevealed server seed. */
export async function commitServerSeed(serverSeed: string): Promise<string> {
  return sha256Hex(serverSeed);
}

/** Uniform float in [0, 1) derived from the first 52 bits of the round hash. */
export async function floatFromRound(inputs: FairInputs): Promise<number> {
  const hex = await roundHash(inputs);
  const slice = hex.slice(0, 13);
  const scaled = parseInt(slice, 16);
  return scaled / 0x10000000000000;
}
