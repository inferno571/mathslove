'use client';

import Image from 'next/image';

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
      <Image
        src="/logo.png"
        alt="MathsLove"
        width={size}
        height={size}
        style={{ flexShrink: 0, borderRadius: size * 0.18, objectFit: 'cover' }}
        priority
      />
      {showText && (
        <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1 }}>
          <span style={{
            fontFamily: "'Outfit', sans-serif",
            fontWeight: 800,
            fontSize: size * 0.45,
            color: textColor,
            letterSpacing: '-0.02em',
          }}>
            <span>maths</span>
            <span style={{ color: '#F5A623' }}>love</span>
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
    <Image
      src="/logo.png"
      alt="MathsLove"
      width={size}
      height={size}
      style={{ flexShrink: 0, borderRadius: size * 0.18, objectFit: 'cover' }}
      priority
    />
  );
}
