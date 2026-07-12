import React, { useEffect, useRef, useState } from 'react';
import jsQR from 'jsqr';

/**
 * Camera-based QR scanner for the "scan to verify" flow. Falls back to
 * manual product-ID entry if camera access is denied.
 */
export default function QRScanner({ onScan }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const [scanning, setScanning] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [manualId, setManualId] = useState('');

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  async function startScanning() {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      streamRef.current = stream;
      videoRef.current.srcObject = stream;
      await videoRef.current.play();
      setScanning(true);
      requestAnimationFrame(tick);
    } catch (err) {
      setCameraError('Camera unavailable. Use manual entry below.');
    }
  }

  function stopScanning() {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    setScanning(false);
  }

  function tick() {
    if (!videoRef.current || videoRef.current.readyState !== videoRef.current.HAVE_ENOUGH_DATA) {
      if (streamRef.current) requestAnimationFrame(tick);
      return;
    }
    const canvas = canvasRef.current;
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const code = jsQR(imageData.data, imageData.width, imageData.height);

    if (code) {
      try {
        const payload = JSON.parse(code.data);
        if (payload.productId !== undefined) {
          stopScanning();
          onScan(payload.productId);
          return;
        }
      } catch {
        /* not our payload format, keep scanning */
      }
    }
    if (streamRef.current) requestAnimationFrame(tick);
  }

  return (
    <div className="panel p-5 sm:p-6">
      <h3 className="font-display text-lg font-semibold mb-3">Scan to verify</h3>

      {!scanning ? (
        <button onClick={startScanning} className="btn-primary text-sm w-full">
          Start camera
        </button>
      ) : (
        <div className="space-y-3">
          <video ref={videoRef} className="w-full rounded-seal border border-rule" muted playsInline />
          <button onClick={stopScanning} className="btn-secondary text-sm w-full">
            Stop camera
          </button>
        </div>
      )}
      <canvas ref={canvasRef} className="hidden" />

      {cameraError && <p className="text-xs text-flagged mt-2">{cameraError}</p>}

      <div className="mt-5 pt-4 border-t border-rule">
        <p className="text-xs text-slate-500 mb-2">Or enter a Product ID manually</p>
        <div className="flex gap-2">
          <input
            value={manualId}
            onChange={(e) => setManualId(e.target.value)}
            placeholder="Product ID"
            className="flex-1 bg-canvas border border-rule rounded-seal px-3 py-2 text-sm font-mono text-slate-200 focus:border-verified/60 outline-none"
          />
          <button
            onClick={() => onScan(manualId)}
            disabled={!manualId}
            className="btn-secondary text-sm"
          >
            Verify
          </button>
        </div>
      </div>
    </div>
  );
}
