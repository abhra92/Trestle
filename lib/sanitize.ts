const CONTROL_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/g;
const FORMAT_CHARS = /[\u200B-\u200F\u202A-\u202E\u2060-\u2064\uFEFF]/g;
const EMOJI = /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}\u{200D}]/gu;
const EM_DASH = /\u2014/g;

export function stripEmoji(value: string): string {
  return value.replace(EMOJI, "");
}

/**
 * Collapses any model or user text into one clean line of a bounded length.
 * Removes control characters, zero width format characters, emoji, and the
 * em dash, which is banned by the project copy rules.
 */
export function cleanLine(value: unknown, maxLength: number): string {
  if (typeof value !== "string") return "";
  return value
    .normalize("NFC")
    .replace(EM_DASH, ", ")
    .replace(CONTROL_CHARS, " ")
    .replace(FORMAT_CHARS, "")
    .replace(EMOJI, "")
    .replace(/\s+/g, " ")
    .replace(/\s+([,.;:!?])/g, "$1")
    .trim()
    .slice(0, maxLength)
    .trim();
}

/** Keeps line breaks out of the way while still allowing a short paragraph. */
export function cleanParagraph(value: unknown, maxLength: number): string {
  if (typeof value !== "string") return "";
  return value
    .normalize("NFC")
    .replace(EM_DASH, ", ")
    .replace(CONTROL_CHARS, " ")
    .replace(FORMAT_CHARS, "")
    .replace(EMOJI, "")
    .replace(/\s+/g, " ")
    .replace(/\s+([,.;:!?])/g, "$1")
    .trim()
    .slice(0, maxLength)
    .trim();
}

export function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
