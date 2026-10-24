import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const css = readFileSync(new URL("../../app/globals.css", import.meta.url), "utf8");

function tokenBlock(selector: string): Record<string, string> {
  const start = css.indexOf(selector);
  if (start === -1) throw new Error(`Missing selector ${selector}`);
  const open = css.indexOf("{", start);
  const close = css.indexOf("}", open);
  const body = css.slice(open + 1, close);
  const tokens: Record<string, string> = {};
  for (const match of body.matchAll(/--([\w-]+):\s*(#[0-9a-fA-F]{6})/g)) {
    const name = match[1];
    const value = match[2];
    if (name && value) tokens[name] = value;
  }
  return tokens;
}

function channel(value: number): number {
  const srgb = value / 255;
  return srgb <= 0.03928 ? srgb / 12.92 : ((srgb + 0.055) / 1.055) ** 2.4;
}

function luminance(hex: string): number {
  const value = hex.replace("#", "");
  const r = Number.parseInt(value.slice(0, 2), 16);
  const g = Number.parseInt(value.slice(2, 4), 16);
  const b = Number.parseInt(value.slice(4, 6), 16);
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

function ratio(foreground: string, background: string): number {
  const a = luminance(foreground);
  const b = luminance(background);
  const lighter = Math.max(a, b);
  const darker = Math.min(a, b);
  return (lighter + 0.05) / (darker + 0.05);
}

const light = tokenBlock(":root");
const dark = tokenBlock('html[data-theme="dark"]');

const PAIRS = [
  ["ink", "paper"],
  ["ink", "sheet"],
  ["ink", "field"],
  ["ink", "accent-soft"],
  ["ink-soft", "paper"],
  ["ink-soft", "sheet"],
  ["ink-soft", "field"],
  ["accent-ink", "paper"],
  ["accent-ink", "sheet"],
  ["danger", "sheet"],
  ["safe", "sheet"],
  ["sheet", "ink"],
] as const;

describe.each([
  ["light", light],
  ["dark", dark],
] as const)("%s theme", (name, tokens) => {
  it("defines every palette token the components use", () => {
    const palette = new Set<string>(PAIRS.flat());
    for (const token of palette) {
      expect(tokens[token], `${name}.${token}`).toBeDefined();
    }
  });

  it.each(PAIRS)("keeps %s readable on %s at WCAG AA", (foreground, background) => {
    const fg = tokens[foreground];
    const bg = tokens[background];
    expect(fg, `${name}.${foreground}`).toBeDefined();
    expect(bg, `${name}.${background}`).toBeDefined();
    expect(ratio(fg!, bg!)).toBeGreaterThanOrEqual(4.5);
  });
});
