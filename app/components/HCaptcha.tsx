'use client';

import HCaptchaLib from '@hcaptcha/react-hcaptcha';
import { useRef, useEffect } from 'react';

interface HCaptchaProps {
  onVerify: (token: string) => void;
  onExpire?: () => void;
  /** Call this to programmatically reset the widget (e.g. on form error) */
  resetRef?: React.MutableRefObject<(() => void) | null>;
}

// hCaptcha test sitekey — works locally without any account.
// Set NEXT_PUBLIC_HCAPTCHA_SITE_KEY in .env.local with your real key for production.
const SITE_KEY =
  process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY ||
  '10000000-ffff-ffff-ffff-000000000001';

export default function HCaptcha({ onVerify, onExpire, resetRef }: HCaptchaProps) {
  const captchaRef = useRef<HCaptchaLib | null>(null);

  // Expose a reset function via the ref so parent forms can reset after errors
  useEffect(() => {
    if (resetRef) {
      resetRef.current = () => captchaRef.current?.resetCaptcha();
    }
  }, [resetRef]);

  return (
    <div style={{ display: 'flex', justifyContent: 'center', marginTop: '4px' }}>
      <HCaptchaLib
        ref={captchaRef}
        sitekey={SITE_KEY}
        onVerify={onVerify}
        onExpire={() => {
          onExpire?.();
        }}
        theme="light"
        size="normal"
      />
    </div>
  );
}
