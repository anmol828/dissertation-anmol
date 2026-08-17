/**
 * Shared surface class tokens so every card/panel stays consistent.
 * Now theme-aware (light + dark) and tuned for the pitch-green / charcoal
 * futsal identity. Export names are unchanged so existing imports keep working.
 */

// Standard panel (cards, feature tiles).
export const glassPanel = "fh-card";

// Elevated panel (hero, primary surfaces).
export const glassPanelStrong = "fh-panel";

// Interactive card that lifts on hover.
export const glassCardHover = "fh-card-hover";

// Dark panel for use over imagery / charcoal sections.
export const glassOnDark =
    "border border-white/15 bg-white/10 backdrop-blur-2xl backdrop-saturate-150 " +
    "shadow-[0_20px_60px_rgba(0,0,0,0.45)]";
