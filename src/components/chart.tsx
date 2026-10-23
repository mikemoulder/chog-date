import { cx } from "./ui";

// The signature: a date trades like a token. Every text prints a candle. One hue only:
// a text that landed is a filled orange candle, one that flopped is a hollow one.

export type Candle = { open: number; close: number };

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
    <svg viewBox={`0 0 100 ${height}`} preserveAspectRatio="none" className={cx("block w-full", className)} style={{ height }} role="img" aria-label="Chemistry over this date, one candle per text">
      {[0.33, 0.66].map((f) => (
        <line key={f} x1="0" x2="100" y1={height * f} y2={height * f} stroke="var(--grid)" strokeWidth="1" vectorEffect="non-scaling-stroke" strokeDasharray="3 3" />
      ))}
      {candles.slice(-slots).map((c, i) => {
        const up = c.close >= c.open;
        const top = y(Math.max(c.open, c.close));
        const h = Math.max(3, Math.abs(y(c.open) - y(c.close)));
        const x = i * w + w * 0.25;
        return (
          <rect
            key={i}
            x={x}
            y={top}
            width={w * 0.5}
            height={h}
            rx="0.6"
            fill={up ? "var(--accent)" : "transparent"}
            stroke={up ? "var(--accent)" : "var(--faint)"}
            strokeWidth="1.5"
            vectorEffect="non-scaling-stroke"
            style={{ transformOrigin: `${x}px ${up ? top + h : top}px`, transformBox: "view-box", animation: "candle-grow 180ms var(--ease) both" }}
          />
        );
      })}
    </svg>
  );
}

// Chemistry as a figure. The change says good or bad: a text that landed is positive.
export function Ticker({ value, delta, className }: { value: number; delta?: number; className?: string }) {
  return (
    <div className={cx("text-right", className)}>
      <div className="num text-[24px] font-semibold leading-none">
        {Math.round(value)}
        <span className="text-[14px] font-normal text-faint"> /100</span>
      </div>
      <div className="mt-1 text-[12px] text-muted">
        Chemistry
        {delta ? <span className={cx("num ml-1.5", delta > 0 ? "text-positive" : "text-negative")}>{delta > 0 ? `+${Math.round(delta)}` : Math.round(delta)}</span> : null}
      </div>
    </div>
  );
}
