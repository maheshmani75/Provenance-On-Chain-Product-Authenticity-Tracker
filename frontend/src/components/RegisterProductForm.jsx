import React, { useState } from 'react';

export default function RegisterProductForm({ onRegister, loading, registeredProductId }) {
  const [name, setName] = useState('');
  const [serialNumber, setSerialNumber] = useState('');

  const canSubmit = name && serialNumber;

  return (
    <div className="space-y-4">
      <form
        className="panel p-5 sm:p-6 space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          onRegister({ name, serialNumber });
        }}
      >
        <h3 className="font-display text-lg font-semibold">Register a new product</h3>

        <div>
          <label className="block text-xs text-slate-500 mb-1.5">Product name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Leather Wallet — Chestnut"
            className="w-full bg-canvas border border-rule rounded-seal px-3 py-2 text-sm text-slate-200 focus:border-verified/60 outline-none"
          />
        </div>

        <div>
          <label className="block text-xs text-slate-500 mb-1.5">Serial number</label>
          <input
            value={serialNumber}
            onChange={(e) => setSerialNumber(e.target.value)}
            placeholder="SN-00042"
            className="w-full bg-canvas border border-rule rounded-seal px-3 py-2 text-sm font-mono text-slate-200 focus:border-verified/60 outline-none"
          />
        </div>

        <button type="submit" disabled={!canSubmit || loading} className="btn-primary text-sm w-full">
          {loading ? 'Registering…' : 'Register on-chain'}
        </button>
      </form>

      {registeredProductId !== null && registeredProductId !== undefined && (
        <div className="panel p-5 sm:p-6 text-center">
          <p className="text-xs text-slate-500 mb-2">Product registered with ID</p>
          <p className="font-mono text-2xl text-verified">{registeredProductId}</p>
        </div>
      )}
    </div>
  );
}
