import React from 'react';

function truncate(address) {
  if (!address) return '';
  return `${address.slice(0, 4)}…${address.slice(-4)}`;
}

export default function NavBar({ wallet, view, onViewChange }) {
  return (
    <header className="sticky top-0 z-30 bg-canvas/90 backdrop-blur border-b border-rule">
      <div className="max-w-6xl mx-auto flex items-center justify-between px-4 sm:px-6 py-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-seal bg-verified-soft border border-verified/40 flex items-center justify-center">
            <span className="font-display font-bold text-verified text-sm">P</span>
          </div>
          <span className="font-display font-semibold text-slate-100 tracking-tight">Provenance</span>
          <span className="hidden sm:inline text-[10px] font-mono text-slate-500 border border-rule rounded px-1.5 py-0.5 ml-1 uppercase">
            testnet
          </span>
        </div>

        <nav className="hidden sm:flex items-center gap-1">
          {[
            { id: 'verify', label: 'Verify' },
            { id: 'manufacturer', label: 'Register' },
            { id: 'custody', label: 'Transfer' },
          ].map((v) => (
            <button
              key={v.id}
              onClick={() => onViewChange(v.id)}
              className={`text-sm px-3 py-1.5 rounded-seal transition-colors ${
                view === v.id ? 'bg-verified-soft border border-verified/30 text-verified' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {v.label}
            </button>
          ))}
        </nav>

        {wallet.isConnected ? (
          <button onClick={wallet.disconnect} className="btn-secondary text-sm font-mono">
            {truncate(wallet.address)}
          </button>
        ) : (
          <button onClick={wallet.connect} disabled={wallet.connecting} className="btn-primary text-sm">
            {wallet.connecting ? 'Connecting…' : 'Connect wallet'}
          </button>
        )}
      </div>

      <div className="sm:hidden flex border-t border-rule">
        {[
          { id: 'verify', label: 'Verify' },
          { id: 'manufacturer', label: 'Register' },
          { id: 'custody', label: 'Transfer' },
        ].map((v) => (
          <button
            key={v.id}
            onClick={() => onViewChange(v.id)}
            className={`flex-1 text-xs py-2.5 ${view === v.id ? 'text-verified border-b-2 border-verified' : 'text-slate-500'}`}
          >
            {v.label}
          </button>
        ))}
      </div>
    </header>
  );
}
