import React from 'react';

export default function Banner({ type = 'error', message, onDismiss }) {
  if (!message) return null;
  const styles = type === 'error'
    ? 'border-flagged/40 bg-flagged-soft/40 text-flagged'
    : 'border-verified/40 bg-verified-soft/40 text-verified';

  return (
    <div className={`border rounded-seal px-4 py-3 text-sm flex items-start justify-between gap-3 ${styles}`}>
      <span className="leading-relaxed">{message}</span>
      {onDismiss && (
        <button onClick={onDismiss} className="shrink-0 opacity-70 hover:opacity-100" aria-label="Dismiss">
          ×
        </button>
      )}
    </div>
  );
}
