import React from 'react';

export default function Hero() {
  return (
    <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-14 pb-10">
      <div className="max-w-2xl">
        <span className="pill border-verified/30 text-verified bg-verified-soft/60">Soroban · Testnet</span>
        <h1 className="font-display text-3xl sm:text-5xl font-semibold tracking-tight mt-5 leading-[1.1]">
          Scan it. See everywhere
          <span className="text-verified"> it&apos;s been.</span>
        </h1>
        <p className="text-slate-400 mt-4 text-base sm:text-lg leading-relaxed">
          Every product is registered by its manufacturer and every handoff after that — distributor,
          retailer, you — is recorded on-chain. A fake can&apos;t produce this history. Only the real chain of custody can.
        </p>
      </div>
    </section>
  );
}
