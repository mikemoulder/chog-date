// One outline icon set, 16px, 1.5px stroke, grey unless a parent colours it.
const base = { width: 16, height: 16, viewBox: "0 0 16 16", fill: "none", stroke: "currentColor", strokeWidth: 1.5, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true };

export const HeartIcon = () => (
  <svg {...base}>
    <path d="M8 13.5S2.5 10.3 2.5 6.4A2.9 2.9 0 0 1 8 5a2.9 2.9 0 0 1 5.5 1.4c0 3.9-5.5 7.1-5.5 7.1Z" />
  </svg>
);
export const CrossIcon = () => (
  <svg {...base}>
    <path d="m4 4 8 8M12 4l-8 8" />
  </svg>
);

// Gifts use the real thing people recognise.
export const RoseIcon = () => <span aria-hidden className="text-[18px] leading-none">🌹</span>;
export const CandleIcon = () => <span aria-hidden className="text-[18px] leading-none">🕯️</span>;
export const StarIcon = () => <span aria-hidden className="text-[16px] leading-none">⭐</span>;
