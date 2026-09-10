import React, { useEffect, useRef, useState } from 'react';
import { Play, Pause } from 'lucide-react';

interface ECGWaveformProps {
  heartRate: number;
  rhythm?: string;
  lead?: string;
  height?: number;
  interactive?: boolean;
  id?: string;
}

export const ECGWaveform: React.FC<ECGWaveformProps> = ({
  heartRate = 75,
  rhythm = 'Sinus Rhythm',
  lead = 'Lead II',
  height = 180,
  interactive = true,
  id = 'ecg-waveform-canvas',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isRunning, setIsRunning] = useState<boolean>(true);
  const [gain, setGain] = useState<number>(1.0); // 1x, 1.5x, 2x
  const animFrameIdRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = (canvas.width = canvas.parentElement?.clientWidth || 600);
    let h = (canvas.height = height);

    let x = 0;
    let lastY = h / 2;
    let phase = 0;

    // Determine cycle speed from heart rate
    const bpm = Math.max(40, Math.min(180, heartRate));
    const cycleLength = (60 / bpm) * 60; // frames per beat

    // Pre-fill background grid
    const drawGrid = (context: CanvasRenderingContext2D, w: number, totalH: number) => {
      context.fillStyle = '#252823'; // Deep natural olive tone
      context.fillRect(0, 0, w, totalH);

      // Minor grid lines (10px)
      context.strokeStyle = 'rgba(107, 112, 92, 0.15)';
      context.lineWidth = 0.5;
      context.beginPath();
      for (let gx = 0; gx < w; gx += 10) {
        context.moveTo(gx, 0);
        context.lineTo(gx, totalH);
      }
      for (let gy = 0; gy < totalH; gy += 10) {
        context.moveTo(0, gy);
        context.lineTo(w, gy);
      }
      context.stroke();

      // Major grid lines (50px)
      context.strokeStyle = 'rgba(107, 112, 92, 0.35)';
      context.lineWidth = 1;
      context.beginPath();
      for (let gx = 0; gx < w; gx += 50) {
        context.moveTo(gx, 0);
        context.lineTo(gx, totalH);
      }
      for (let gy = 0; gy < totalH; gy += 50) {
        context.moveTo(0, gy);
        context.lineTo(w, gy);
      }
      context.stroke();
    };

    // Draw initial grid
    drawGrid(ctx, width, h);

    // ECG wave generator function (P-Q-R-S-T synthesis)
    const getECGValue = (t: number, rhythmType: string): number => {
      const normT = (t % cycleLength) / cycleLength; // 0 to 1

      // Atrial Fibrillation baseline noise
      let noise = 0;
      if (rhythmType.includes('Atrial Fibrillation')) {
        noise = (Math.sin(t * 0.8) + Math.cos(t * 1.3) + (Math.random() - 0.5) * 0.5) * 4;
      }

      const baseline = h / 2;
      let wave = 0;

      // P wave
      if (normT >= 0.1 && normT < 0.2) {
        const pPhase = (normT - 0.1) / 0.1;
        wave = Math.sin(pPhase * Math.PI) * 10 * gain;
      }
      // PR segment (flat)
      else if (normT >= 0.2 && normT < 0.3) {
        wave = 0;
      }
      // Q wave
      else if (normT >= 0.3 && normT < 0.33) {
        wave = -8 * gain;
      }
      // R wave (ventricular depolarization peak)
      else if (normT >= 0.33 && normT < 0.39) {
        const rPhase = (normT - 0.33) / 0.06;
        if (rhythmType.includes('Ventricular Ectopy') && Math.sin(t * 0.05) > 0.6) {
          wave = (Math.sin(rPhase * Math.PI) * 45 - 20) * gain;
        } else {
          wave = Math.sin(rPhase * Math.PI) * 55 * gain;
        }
      }
      // S wave
      else if (normT >= 0.39 && normT < 0.44) {
        wave = -14 * gain;
      }
      // ST segment
      else if (normT >= 0.44 && normT < 0.55) {
        wave = 0;
      }
      // T wave
      else if (normT >= 0.55 && normT < 0.72) {
        const tPhase = (normT - 0.55) / 0.17;
        wave = Math.sin(tPhase * Math.PI) * 16 * gain;
      }

      return baseline - wave + noise;
    };

    const render = () => {
      if (!isRunning) return;

      const speed = 2.5; // pixels per frame
      const clearWidth = 24; // erase zone ahead of sweep cursor

      // Clear slice ahead of sweep line
      ctx.fillStyle = '#252823';
      ctx.fillRect(x, 0, clearWidth, h);

      // Re-draw grid lines in clear zone
      ctx.strokeStyle = 'rgba(107, 112, 92, 0.15)';
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      for (let gx = Math.floor(x / 10) * 10; gx <= x + clearWidth; gx += 10) {
        ctx.moveTo(gx, 0);
        ctx.lineTo(gx, h);
      }
      for (let gy = 0; gy < h; gy += 10) {
        ctx.moveTo(x, gy);
        ctx.lineTo(x + clearWidth, gy);
      }
      ctx.stroke();

      // Major grid in clear zone
      ctx.strokeStyle = 'rgba(107, 112, 92, 0.35)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let gx = Math.floor(x / 50) * 50; gx <= x + clearWidth; gx += 50) {
        ctx.moveTo(gx, 0);
        ctx.lineTo(gx, h);
      }
      for (let gy = 0; gy < h; gy += 50) {
        ctx.moveTo(x, gy);
        ctx.lineTo(x + clearWidth, gy);
      }
      ctx.stroke();

      // Calculate next Y point
      const nextY = getECGValue(phase, rhythm);

      // Draw active ECG trace line
      ctx.strokeStyle = '#A3B18A'; // Sage green trace
      ctx.lineWidth = 2.2;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      ctx.beginPath();
      ctx.moveTo(x === 0 ? 0 : x - speed, lastY);
      ctx.lineTo(x, nextY);
      ctx.stroke();

      // Draw sweep leading glowing dot
      ctx.fillStyle = '#DDA15E';
      ctx.beginPath();
      ctx.arc(x, nextY, 2.5, 0, Math.PI * 2);
      ctx.fill();

      lastY = nextY;
      x += speed;
      phase += 1;

      if (x >= width) {
        x = 0;
        lastY = getECGValue(phase, rhythm);
      }

      animFrameIdRef.current = requestAnimationFrame(render);
    };

    render();

    const handleResize = () => {
      if (!canvas || !canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.clientWidth;
      h = canvas.height = height;
      drawGrid(ctx, width, h);
      x = 0;
    };

    window.addEventListener('resize', handleResize);

    return () => {
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
      window.removeEventListener('resize', handleResize);
    };
  }, [heartRate, rhythm, height, isRunning, gain]);

  return (
    <div id={id} className="relative rounded-xl overflow-hidden border border-[#3a3f37] bg-[#252823] shadow-xs">
      {/* Top telemetry bar */}
      <div className="absolute top-2 left-3 right-3 flex items-center justify-between pointer-events-none z-10">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#3a3f37] border border-stone-600/50 text-stone-200 text-xs font-mono-data font-semibold">
            <span className="w-2 h-2 rounded-full bg-[#A3B18A] animate-ping inline-block" />
            {lead}
          </div>
          <span className="text-xs text-stone-300 font-mono-data font-medium">
            {rhythm}
          </span>
        </div>

        <div className="flex items-center gap-3 text-xs font-mono-data text-stone-400">
          <span>25 mm/s</span>
          <span>10 mm/mV</span>
          <span className="bg-[#3a3f37] px-1.5 py-0.5 rounded text-[11px] text-stone-300 border border-stone-600/50">
            250 Hz (ESP32)
          </span>
        </div>
      </div>

      {/* Canvas */}
      <canvas ref={canvasRef} className="w-full block cursor-crosshair" style={{ height: `${height}px` }} />

      {/* Bottom controls */}
      {interactive && (
        <div className="absolute bottom-2 right-3 flex items-center gap-1.5 z-10">
          <button
            id="ecg-gain-toggle"
            onClick={() => setGain((prev) => (prev === 1.0 ? 1.5 : prev === 1.5 ? 2.0 : 1.0))}
            className="text-[10px] font-mono-data px-2 py-0.5 rounded bg-[#3a3f37] hover:bg-[#4a5046] border border-stone-600/50 text-stone-200 transition-colors"
            title="Cycle ECG Gain calibration"
          >
            Gain: {gain}x
          </button>
          <button
            id="ecg-play-pause-btn"
            onClick={() => setIsRunning((prev) => !prev)}
            className="p-1 rounded bg-[#3a3f37] hover:bg-[#4a5046] border border-stone-600/50 text-stone-200 transition-colors"
            title={isRunning ? 'Pause ECG sweep' : 'Resume live ECG sweep'}
          >
            {isRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          </button>
        </div>
      )}

      {/* ECG watermark in corner */}
      <div className="absolute bottom-2 left-3 text-[10px] text-stone-500 font-mono-data pointer-events-none">
        LIVE ESP32 ECG TELEMETRY STREAM
      </div>
    </div>
  );
};
