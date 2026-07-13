'use client';

interface LogoProps {
  size?: number;
  showText?: boolean;
  textColor?: string;
  className?: string;
  style?: React.CSSProperties;
}

export default function Logo({ size = 48, showText = false, textColor = 'white', className, style }: LogoProps) {
  return (
    <div className={className} style={{ display: 'flex', alignItems: 'center', gap: size * 0.25, ...style }}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 200 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ flexShrink: 0 }}
      >
        {/* Heart shape - left half (blue) */}
        <path
          d="M100 180C100 180 20 130 20 75C20 45 45 25 70 25C85 25 95 35 100 45"
          stroke="#3B82F6"
          strokeWidth="14"
          strokeLinecap="round"
          fill="none"
        />
        {/* Heart shape - right half (orange) */}
        <path
          d="M100 180C100 180 180 130 180 75C180 45 155 25 130 25C115 25 105 35 100 45"
          stroke="#FF7A00"
          strokeWidth="14"
          strokeLinecap="round"
          fill="none"
        />
        {/* M letter - left stroke */}
        <path
          d="M55 145L55 65L100 115"
          stroke="#1B2B5E"
          strokeWidth="16"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        {/* M letter - right stroke */}
        <path
          d="M145 145L145 65L100 115"
          stroke="#1B2B5E"
          strokeWidth="16"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        {/* Square root symbol */}
        <text
          x="90"
          y="52"
          fontFamily="serif"
          fontSize="30"
          fill="#3B82F6"
          fontWeight="bold"
        >
          √x
        </text>
        {/* Plus sign */}
        <text x="40" y="120" fontFamily="sans-serif" fontSize="22" fill="#3B82F6" fontWeight="bold">+</text>
        {/* Division sign */}
        <text x="148" y="120" fontFamily="sans-serif" fontSize="22" fill="#FF7A00" fontWeight="bold">÷</text>
      </svg>
      {showText && (
        <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1 }}>
          <span style={{
            fontFamily: "'Outfit', sans-serif",
            fontWeight: 800,
            fontSize: size * 0.45,
            color: textColor,
            letterSpacing: '-0.02em',
          }}>
            <span style={{ color: '#3B82F6' }}>Maths</span>
            <span style={{ color: '#FF7A00' }}>L</span>
            <span style={{ color: '#FF7A00', fontSize: size * 0.35 }}>♥</span>
            <span style={{ color: '#FF7A00' }}>ve</span>
          </span>
          <span style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: size * 0.16,
            color: textColor === 'white' ? 'rgba(255,255,255,0.8)' : '#666',
            fontWeight: 500,
            letterSpacing: '0.02em',
          }}>
            Love Maths. Think Better.
          </span>
        </div>
      )}
    </div>
  );
}

export function LogoIcon({ size = 36 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ flexShrink: 0 }}
    >
      <circle cx="100" cy="100" r="98" fill="white" />
      {/* Heart shape - left half (blue) */}
      <path
        d="M100 170C100 170 28 125 28 75C28 48 50 30 72 30C86 30 95 39 100 48"
        stroke="#3B82F6"
        strokeWidth="12"
        strokeLinecap="round"
        fill="none"
      />
      {/* Heart shape - right half (orange) */}
      <path
        d="M100 170C100 170 172 125 172 75C172 48 150 30 128 30C114 30 105 39 100 48"
        stroke="#FF7A00"
        strokeWidth="12"
        strokeLinecap="round"
        fill="none"
      />
      {/* M letter */}
      <path
        d="M58 140L58 68L100 108L142 68L142 140"
        stroke="#1B2B5E"
        strokeWidth="14"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      {/* Plus sign */}
      <text x="42" y="115" fontFamily="sans-serif" fontSize="20" fill="#3B82F6" fontWeight="bold">+</text>
      {/* Division sign */}
      <text x="145" y="115" fontFamily="sans-serif" fontSize="20" fill="#FF7A00" fontWeight="bold">÷</text>
    </svg>
  );
}
