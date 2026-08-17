import React from "react";

const styles = {
  error: "border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-300",
  success: "border-pitch/30 bg-pitch-soft text-pitch-strong",
  info: "border-line bg-surface-2 text-muted"
};

const Notice = ({ tone = "info", children, className = "" }) => {
  if (!children) {
    return null;
  }

  return (
    <div className={`rounded-xl border px-3.5 py-2.5 text-sm font-medium ${styles[tone]} ${className}`.trim()}>
      {children}
    </div>
  );
};

export default Notice;
