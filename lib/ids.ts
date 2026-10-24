export function randomToken(length = 8): string {
  const source = typeof globalThis.crypto !== "undefined" && "getRandomValues" in globalThis.crypto ? globalThis.crypto : undefined;
  if (!source) return Math.random().toString(36).slice(2, 2 + length);

  const bytes = new Uint8Array(Math.ceil(length / 2));
  source.getRandomValues(bytes);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("").slice(0, length);
}

export function makeId(prefix: string): string {
  return `${prefix}-${randomToken(8)}`;
}
