interface Props {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'dark' | 'light';
}

const sizes = {
  sm: { width: 100, height: 28 },
  md: { width: 140, height: 38 },
  lg: { width: 180, height: 50 },
  xl: { width: 240, height: 66 },
};

export function SrlPulseLogo({ size = 'md', variant = 'dark' }: Props) {
  const { width, height } = sizes[size];
  const textColor = variant === 'dark' ? '#1e293b' : '#ffffff';
  const accentColor = '#0DBBBD';

  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 240 66"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="SRL PULSE"
    >
      {/* Icon background pill */}
      <rect x="0" y="8" width="50" height="50" rx="14" fill={accentColor} />

      {/* Heartbeat / ECG line inside icon */}
      <polyline
        points="6,33 14,33 18,20 22,46 26,22 30,44 34,33 44,33"
        stroke="white"
        strokeWidth="2.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />

      {/* PULSE wordmark */}
      <text
        x="62"
        y="45"
        fontFamily="'Inter', 'Helvetica Neue', Arial, sans-serif"
        fontSize="30"
        fontWeight="800"
        letterSpacing="4"
        fill={textColor}
      >
        PULSE
      </text>

      {/* Thin teal underline accent */}
      <rect x="62" y="52" width="174" height="3" rx="1.5" fill={accentColor} opacity="0.5" />
    </svg>
  );
}
