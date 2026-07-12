import React from 'react';

/**
 * The signature UI element: a verification "seal" that reads unambiguously
 * at a glance (verified vs flagged), paired with the full chain-of-custody
 * timeline beneath it. This is deliberately binary and high-contrast —
 * the whole point of an authenticity check is that there's no ambiguous
 * middle state to design around.
 */
export default function VerificationSeal({ product, history, onFlag, flagLoading }) {
  if (!product) {
    return (
      <div className="panel p-8 text-center">
        <p className="text-slate-500 text-sm">No product loaded. Scan a code or enter a Product ID to verify.</p>
      </div>
    );
  }

  const isFlagged = product.flagged_counterfeit;

  return (
    <div className="space-y-4">
      <div
        className={`panel p-6 sm:p-8 flex items-center gap-5 border-2 ${
          isFlagged ? 'border-flagged/50 bg-flagged-soft/30' : 'border-verified/50 bg-verified-soft/20'
        }`}
      >
        <div
          className={`w-16 h-16 rounded-full flex items-center justify-center shrink-0 border-2 ${
            isFlagged ? 'border-flagged text-flagged' : 'border-verified text-verified'
          }`}
        >
          <span className="font-display text-2xl">{isFlagged ? '!' : '✓'}</span>
        </div>
        <div>
          <p className={`font-display text-xl sm:text-2xl font-semibold ${isFlagged ? 'text-flagged' : 'text-verified'}`}>
            {isFlagged ? 'Flagged as suspected counterfeit' : 'Verified authentic'}
          </p>
          <p className="text-slate-400 text-sm mt-1">
            {product.name} · Serial {product.serial_number}
          </p>
        </div>
      </div>

      <div className="panel p-5 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display font-semibold text-slate-200 text-sm">Chain of custody</h3>
          {!isFlagged && (
            <button onClick={onFlag} disabled={flagLoading} className="text-xs text-flagged hover:underline">
              {flagLoading ? 'Flagging…' : 'Report as counterfeit'}
            </button>
          )}
        </div>

        {history.length === 0 ? (
          <p className="text-xs text-slate-500">No transfers yet — still with the manufacturer.</p>
        ) : (
          <ol className="relative border-l border-rule ml-2 space-y-6">
            {history.map((hop, i) => (
              <li key={i} className="ml-5">
                <span className="absolute -left-[5px] mt-1.5 w-2.5 h-2.5 rounded-full bg-verified" />
                <p className="text-sm text-slate-200">{hop.location}</p>
                <p className="text-xs text-slate-500 font-mono mt-0.5">
                  {hop.from.slice(0, 6)}…{hop.from.slice(-4)} → {hop.to.slice(0, 6)}…{hop.to.slice(-4)}
                </p>
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  );
}
