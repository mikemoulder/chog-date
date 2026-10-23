import { cx } from "./primitives";

// The signature: the date trades like a token. Every line prints a candle,
// green when it landed, red when it flopped.

export type Candle = { open: number; close: number; label?: string };

export function candlesFrom(start: number, deltas: number[]): Candle[] {
  let level = start;
  return deltas.map((d) => {
    const open = level;
    level = Math.max(0, Math.min(100, level + d * 0.9));
    return { open, close: level };
  });
}

export function ChemistryChart({ candles, height = 72, slots = 10, className }: { candles: Candle[]; height?: number; slots?: number; className?: string }) {
  const values = candles.flatMap((c) => [c.open, c.close]);
  const lo = Math.max(0, Math.min(...values, 100) - 3);
  const hi = Math.min(100, Math.max(...values, 0) + 3);
  const span = Math.max(10, hi - lo);
  const y = (v: number) => height - ((v - lo) / span) * height;
  const w = 100 / slots;
  return (
    <svg viewBox={`0 0 100 ${height}`} preserveAspectRatio="none" className={cx("block w-full", className)} style={{ height }} role="img" aria-label="Chemistry over this date">
      {[0.25, 0.5, 0.75].map((f) => (
        <line key={f} x1="0" x2="100" y1={height * f} y2={height * f} stroke="var(--line)" strokeWidth="0.6" vectorEffect="non-scaling-stroke" strokeDasharray="2 3" />
      ))}
      {candles.slice(-slots).map((c, i) => {
        const up = c.close >= c.open;
        const top = y(Math.max(c.open, c.close));
        const h = Math.max(4, Math.abs(y(c.open) - y(c.close)));
        const x = i * w + w * 0.2;
        return (
          <g key={i}>
            <line x1={x + w * 0.3} x2={x + w * 0.3} y1={top - 3} y2={top + h + 3} stroke="var(--line-strong)" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
            <rect
              x={x}
              y={top}
              width={w * 0.6}
              height={h}
              rx="0.8"
              fill={up ? "var(--success)" : "var(--danger)"}
              stroke="var(--line-strong)"
              strokeWidth="1.5"
              vectorEffect="non-scaling-stroke"
              style={{ transformOrigin: `${x}px ${up ? top + h : top}px`, transformBox: "view-box", animation: "candle-grow 160ms var(--motion-out) both" }}
            />
          </g>
        );
      })}
    </svg>
  );
}

export function Ticker({ value, delta, className }: { value: number; delta?: number; className?: string }) {
  const up = (delta ?? 0) >= 0;
  return (
    <div className={cx("flex items-baseline gap-2 font-mono", className)}>
      <span className="t-label !text-fg-mute">Chem</span>
      <span className="t-num text-[28px] leading-none">{Math.round(value)}</span>
      {delta !== undefined && delta !== 0 && (
        <span className={cx("text-[13px] font-semibold", up ? "text-success" : "text-danger")}>
          {up ? "▲" : "▼"} {Math.abs(Math.round(delta))}
        </span>
      )}
    </div>
  );
}
