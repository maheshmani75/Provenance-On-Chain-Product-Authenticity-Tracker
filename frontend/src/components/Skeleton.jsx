import React from 'react';

export default function Skeleton() {
  return (
    <div className="panel p-6 space-y-4 animate-pulse" role="status" aria-label="Loading verification data">
      <div className="h-16 bg-rule/60 rounded-seal" />
      <div className="h-4 w-32 bg-rule rounded" />
      <div className="space-y-3 pt-2">
        {[1, 2].map((i) => (
          <div key={i} className="h-10 bg-rule/50 rounded" />
        ))}
      </div>
    </div>
  );
}
