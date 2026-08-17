/**
 * Shared glassmorphism class tokens so every frosted surface stays consistent.
 * Tuned for the app's light slate/emerald palette.
 */

// Standard frosted panel (cards, feature tiles).
export const glassPanel =
    "border border-white/60 bg-white/70 backdrop-blur-xl backdrop-saturate-150 " +
    "shadow-[0_12px_40px_rgba(15,23,42,0.06)]";

// Elevated panel (hero, primary surfaces).
export const glassPanelStrong =
    "border border-white/70 bg-white/75 backdrop-blur-2xl backdrop-saturate-150 " +
    "shadow-[0_24px_70px_rgba(15,23,42,0.10)]";

// Interactive card that lifts on hover.
export const glassCardHover =
    "border border-white/60 bg-white/70 backdrop-blur-xl backdrop-saturate-150 " +
    "shadow-[0_12px_36px_rgba(15,23,42,0.06)] transition duration-300 " +
    "hover:-translate-y-1 hover:border-white/80 hover:bg-white/80 " +
    "hover:shadow-[0_28px_60px_rgba(15,23,42,0.14)]";

// Dark frosted panel for use over imagery.
export const glassOnDark =
    "border border-white/15 bg-white/10 backdrop-blur-2xl backdrop-saturate-150 " +
    "shadow-[0_20px_60px_rgba(0,0,0,0.35)]";
