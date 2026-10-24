import { formatDate } from "./dates";
import { formatMoney, formatPercent, pluralize } from "./format";
import type { Plan } from "./types";

function cell(value: string): string {
  return value.replace(/\|/g, "\\|").replace(/\n/g, " ").trim();
}

export function planToMarkdown(plan: Plan): string {
  const { brief } = plan;
  const lines: string[] = [];

  lines.push(`# ${cell(plan.headline)}`, "");
  lines.push(
    `${cell(brief.title)} · ${formatDate(brief.date)} · ${brief.guests} ${pluralize(brief.guests, "guest")} · ${cell(brief.location)}`,
    "",
  );

  lines.push("## Budget", "");
  lines.push("| Line | Amount | Share | Note |");
  lines.push("| --- | ---: | ---: | --- |");
  for (const line of plan.budget.lines) {
    lines.push(`| ${cell(line.label)} | ${formatMoney(line.amount, plan.currency)} | ${formatPercent(line.share)} | ${cell(line.note)} |`);
  }
  lines.push(`| **Total** | **${formatMoney(plan.budget.total, plan.currency)}** | 100% | ${formatMoney(plan.budget.perGuest, plan.currency)} per guest |`, "");

  lines.push("## Timeline", "");
  for (const item of plan.timeline.items) {
    lines.push(`- **${formatDate(item.dueDate)}** · ${cell(item.label)}: ${cell(item.detail)}`);
  }
  lines.push("");

  lines.push("## Vendors", "");
  for (const vendor of plan.vendors) {
    lines.push(`- [${vendor.booked ? "x" : " "}] **${cell(vendor.label)}** (${cell(vendor.category)}, ${vendor.priority}): ${cell(vendor.why)}`);
  }
  lines.push("");

  lines.push("## Ideas", "");
  for (const idea of plan.ideas) {
    lines.push(`- **${cell(idea.title)}**: ${cell(idea.detail)} (${idea.effort} effort, ${idea.costBand} cost)`);
  }
  lines.push("");

  if (plan.advice.length > 0) {
    lines.push("## Before you book", "");
    for (const item of plan.advice) lines.push(`- **${item.severity}**: ${cell(item.message)}`);
    lines.push("");
  }

  lines.push("## Assumptions", "");
  for (const assumption of plan.assumptions) lines.push(`- ${cell(assumption)}`);
  lines.push("", `Drafted in Trestle on ${formatDate(plan.createdAt.slice(0, 10))} (${plan.source === "gemini" ? plan.model ?? "Gemini" : "local planner"}).`);

  return `${lines.join("\n")}\n`;
}

export function downloadText(filename: string, text: string): void {
  const blob = new Blob([text], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function filenameFor(plan: Plan): string {
  const slug = plan.brief.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
  return `trestle-${slug || plan.brief.kind}-${plan.brief.date}.md`;
}
