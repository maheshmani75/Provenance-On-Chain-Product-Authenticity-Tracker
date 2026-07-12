import React, { useEffect, useRef } from 'react';
import QRCode from 'qrcode';

/**
 * Renders a scannable QR code encoding the product's verification payload
 * (product id). Meant to be printed/affixed to the physical item; anyone
 * can scan it with the Verify view.
 */
export default function ProductQRCode({ productId }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    const payload = JSON.stringify({ productId });
    QRCode.toCanvas(canvasRef.current, payload, {
      width: 160,
      margin: 1,
      color: { dark: '#0E1116', light: '#E8FBF1' },
    }).catch(() => {});
  }, [productId]);

  return (
    <div className="flex flex-col items-center gap-2">
      <canvas ref={canvasRef} className="rounded-seal border border-rule" />
      <span className="text-[11px] font-mono text-slate-500">Affix to product for verification</span>
    </div>
  );
}
