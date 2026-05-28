import React from "react";

const styles = {
  error: "border-red-200 bg-red-50 text-red-700",
  success: "border-emerald-200 bg-emerald-50 text-emerald-700",
  info: "border-slate-200 bg-slate-50 text-slate-700"
};

const Notice = ({ tone = "info", children, className = "" }) => {
  if (!children) {
    return null;
  }

  return (
    <div className={`rounded-lg border px-3 py-2 text-sm ${styles[tone]} ${className}`.trim()}>
      {children}
    </div>
  );
};

export default Notice;
