// One ECG "beat" 120px wide on a baseline of y=40 — repeated to build a
// seamless heart-monitor line that scrolls by exactly one beat (.animate-ecg).
const beat = (x: number) =>
  `M ${x},40 H ${x + 30} L ${x + 38},32 L ${x + 46},40 L ${x + 50},46 ` +
  `L ${x + 56},10 L ${x + 62},64 L ${x + 68},40 L ${x + 82},33 L ${x + 96},40 H ${x + 120}`;

export const ecgPath = Array.from({ length: 10 }, (_, i) => beat(i * 120)).join(' ');
