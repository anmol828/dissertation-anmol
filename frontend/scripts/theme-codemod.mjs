import { readFileSync, writeFileSync } from "node:fs";

/**
 * Maps hard-coded slate/emerald/etc utility classes to the new semantic
 * design tokens (see tailwind.config.js + index.css). Order matters:
 * longer / more-specific patterns first so they win over generic ones.
 *
 * These are plain string replacements applied token-by-token, so they only
 * touch className strings and never logic.
 */
const REPLACEMENTS = [
  // --- Surfaces / backgrounds ---
  ["bg-white/95", "bg-surface"],
  ["bg-white/90", "bg-surface"],
  ["bg-white/85", "bg-surface"],
  ["bg-white/80", "bg-surface"],
  ["bg-white/70", "bg-surface"],
  ["bg-white/60", "bg-surface"],
  ["bg-white/50", "bg-surface-2"],
  ["hover:bg-slate-50/50", "hover:bg-surface-2"],
  ["bg-slate-50/70", "bg-surface-2"],
  ["bg-slate-50/50", "bg-surface-2"],
  ["bg-slate-50", "bg-surface-2"],
  ["bg-slate-100/80", "bg-surface-2"],
  ["bg-slate-100", "bg-surface-2"],
  ["bg-slate-150", "bg-surface-2"],
  ["bg-slate-200", "bg-surface-2"],
  ["hover:bg-slate-50", "hover:bg-surface-2"],
  ["hover:bg-slate-100", "hover:bg-surface-2"],
  ["bg-white", "bg-surface"],

  // --- Charcoal / dark hero surfaces ---
  ["bg-slate-950", "bg-charcoal"],
  ["bg-slate-900", "bg-charcoal"],
  ["hover:bg-slate-800", "hover:bg-charcoal"],

  // --- Borders ---
  ["border-white/70", "border-line"],
  ["border-white/60", "border-line"],
  ["border-white/50", "border-line"],
  ["border-slate-300", "border-line"],
  ["border-slate-200/80", "border-line"],
  ["border-slate-200", "border-line"],
  ["border-slate-150", "border-line"],
  ["border-slate-100", "border-line"],
  ["hover:border-slate-300", "hover:border-pitch/40"],

  // --- Text colors ---
  ["text-slate-955", "text-foreground"],
  ["text-slate-950", "text-foreground"],
  ["text-slate-900", "text-foreground"],
  ["text-slate-800", "text-foreground"],
  ["text-slate-700", "text-foreground"],
  ["text-slate-600", "text-muted"],
  ["text-slate-500", "text-muted"],
  ["text-slate-400", "text-muted"],
  ["group-hover:text-emerald-600", "group-hover:text-pitch"],
  ["hover:text-slate-900", "hover:text-foreground"],
  ["hover:text-slate-955", "hover:text-foreground"],

  // --- Emerald accents -> pitch ---
  ["text-emerald-700", "text-pitch-strong"],
  ["text-emerald-600", "text-pitch"],
  ["text-emerald-300", "text-pitch-strong"],
  ["bg-emerald-600", "bg-pitch"],
  ["hover:bg-emerald-700", "hover:bg-pitch-strong"],
  ["bg-emerald-500/15", "bg-pitch-soft"],
  ["bg-emerald-500", "bg-pitch"],
  ["bg-emerald-100", "bg-pitch-soft"],
  ["text-emerald-800", "text-pitch-strong"],
  ["bg-emerald-50", "bg-pitch-soft"],
  ["ring-slate-900", "ring-pitch"],

  // --- Rose / danger ---
  ["bg-rose-600", "bg-red-600"],
  ["hover:bg-rose-700", "hover:bg-red-700"],
  ["text-rose-700", "text-red-600"],
  ["hover:bg-rose-50", "hover:bg-red-500/10"],
  ["bg-rose-50", "bg-red-500/10"],
  ["text-rose-800", "text-red-600"],

  // --- Rounded shells to match new radius ---
  ["rounded-[28px]", "rounded-4xl"],
  ["rounded-[24px]", "rounded-3xl"],
];

const files = process.argv.slice(2);
if (files.length === 0) {
  console.error("Usage: node theme-codemod.mjs <file> [file...]");
  process.exit(1);
}

for (const file of files) {
  let src = readFileSync(file, "utf8");
  let count = 0;
  for (const [from, to] of REPLACEMENTS) {
    const parts = src.split(from);
    if (parts.length > 1) {
      count += parts.length - 1;
      src = parts.join(to);
    }
  }
  writeFileSync(file, src);
  console.log(`[codemod] ${file}: ${count} replacements`);
}
