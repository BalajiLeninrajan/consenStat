const TERM_SEASONS = ["winter", "spring", "fall"] as const;

export function normalizeCourseCode(input: string) {
  return input.trim().toUpperCase().replace(/\s+/g, " ");
}

export function normalizeText(input: string) {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ");
}

export function parseTerm(input: string) {
  const cleaned = input.trim().replace(/\s+/g, " ");
  const match = cleaned.match(/^(winter|spring|fall)\s+(\d{4})$/i);
  if (!match) {
    throw new Error("Term must look like Fall 2026");
  }

  const season = match[1].toLowerCase() as (typeof TERM_SEASONS)[number];
  if (!TERM_SEASONS.includes(season)) {
    throw new Error("Unsupported term season");
  }

  return {
    season,
    year: Number(match[2]),
    label: `${season[0].toUpperCase()}${season.slice(1)} ${match[2]}`,
  };
}

export function similarityScore(a: string, b: string) {
  if (a === b) {
    return 1;
  }

  const aTokens = new Set(a.split(" "));
  const bTokens = new Set(b.split(" "));
  const intersection = [...aTokens].filter((token) => bTokens.has(token)).length;
  const union = new Set([...aTokens, ...bTokens]).size;
  return union === 0 ? 0 : intersection / union;
}

export function json(data: unknown, init?: ResponseInit) {
  return Response.json(data, {
    headers: {
      "Cache-Control": "no-store",
    },
    ...init,
  });
}

export async function sha256(value: string) {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

async function hmac(secret: string, value: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value));
  return btoa(String.fromCharCode(...new Uint8Array(signature)));
}

export async function signCookieValue(secret: string, value: string) {
  const signature = await hmac(secret, value);
  return `${value}.${signature}`;
}

export async function verifyCookieValue(secret: string, signedValue: string | undefined) {
  if (!signedValue) {
    return null;
  }

  const separator = signedValue.lastIndexOf(".");
  if (separator === -1) {
    return null;
  }

  const value = signedValue.slice(0, separator);
  const signature = signedValue.slice(separator + 1);
  const expected = await hmac(secret, value);
  return signature === expected ? value : null;
}

export function parseCookie(header: string | null, key: string) {
  if (!header) {
    return undefined;
  }

  const pair = header
    .split(";")
    .map((entry) => entry.trim())
    .find((entry) => entry.startsWith(`${key}=`));

  if (!pair) {
    return undefined;
  }

  return decodeURIComponent(pair.slice(key.length + 1));
}
