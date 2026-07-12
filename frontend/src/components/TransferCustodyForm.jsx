import React, { useState } from 'react';

export default function TransferCustodyForm({ onTransfer, loading }) {
  const [productId, setProductId] = useState('');
  const [toAddress, setToAddress] = useState('');
  const [location, setLocation] = useState('');

  const canSubmit = productId && toAddress && location;

  return (
    <form
      className="panel p-5 sm:p-6 space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        onTransfer({ productId, toAddress, location });
      }}
    >
      <h3 className="font-display text-lg font-semibold">Transfer custody</h3>
      <p className="text-xs text-slate-500">
        You must be the current owner of the product to hand it off to the next party.
      </p>

      <div>
        <label className="block text-xs text-slate-500 mb-1.5">Product ID</label>
        <input
          value={productId}
          onChange={(e) => setProductId(e.target.value)}
          placeholder="0"
          className="w-full bg-canvas border border-rule rounded-seal px-3 py-2 text-sm font-mono text-slate-200 focus:border-verified/60 outline-none"
        />
      </div>

      <div>
        <label className="block text-xs text-slate-500 mb-1.5">Receiving party address</label>
        <input
          value={toAddress}
          onChange={(e) => setToAddress(e.target.value)}
          placeholder="G..."
          className="w-full bg-canvas border border-rule rounded-seal px-3 py-2 text-sm font-mono text-slate-200 focus:border-verified/60 outline-none"
        />
      </div>

      <div>
        <label className="block text-xs text-slate-500 mb-1.5">Checkpoint / location</label>
        <input
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="Regional distribution center"
          className="w-full bg-canvas border border-rule rounded-seal px-3 py-2 text-sm text-slate-200 focus:border-verified/60 outline-none"
        />
      </div>

      <button type="submit" disabled={!canSubmit || loading} className="btn-primary text-sm w-full">
        {loading ? 'Recording transfer…' : 'Transfer custody on-chain'}
      </button>
    </form>
  );
}
