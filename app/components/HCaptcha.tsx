'use client';

import ReCAPTCHA from 'react-google-recaptcha';
import { useRef, useEffect } from 'react';

interface ReCaptchaProps {
  onVerify: (token: string) => void;
  onExpire?: () => void;
  /** Call this to programmatically reset the widget (e.g. on form error) */
  resetRef?: React.MutableRefObject<(() => void) | null>;
}

const SITE_KEY =
  process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY ||
  '6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI'; // Google test key

export default function GoogleReCaptcha({ onVerify, onExpire, resetRef }: ReCaptchaProps) {
  const captchaRef = useRef<ReCAPTCHA | null>(null);

  // Expose a reset function via the ref so parent forms can reset after errors
  useEffect(() => {
    if (resetRef) {
      resetRef.current = () => captchaRef.current?.reset();
    }
  }, [resetRef]);

  return (
    <div style={{ display: 'flex', justifyContent: 'center', marginTop: '4px' }}>
      <ReCAPTCHA
        ref={captchaRef}
        sitekey={SITE_KEY}
        onChange={(token: string | null) => {
          if (token) onVerify(token);
        }}
        onExpired={() => {
          onExpire?.();
        }}
        theme="light"
        size="normal"
      />
    </div>
  );
}
