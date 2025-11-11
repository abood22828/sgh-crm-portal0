import { useEffect } from "react";

interface MetaPixelProps {
  pixelId?: string;
}

declare global {
  interface Window {
    fbq: any;
    _fbq: any;
  }
}

export function MetaPixel({ pixelId }: MetaPixelProps) {
  useEffect(() => {
    if (!pixelId) return;

    // Initialize Meta Pixel
    (function(f: any, b: any, e: any, v: any, n?: any, t?: any, s?: any) {
      if (f.fbq) return;
      n = f.fbq = function() {
        n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
      };
      if (!f._fbq) f._fbq = n;
      n.push = n;
      n.loaded = !0;
      n.version = '2.0';
      n.queue = [];
      t = b.createElement(e);
      t.async = !0;
      t.src = v;
      s = b.getElementsByTagName(e)[0];
      s.parentNode.insertBefore(t, s);
    })(
      window,
      document,
      'script',
      'https://connect.facebook.net/en_US/fbevents.js'
    );

    window.fbq('init', pixelId);
    window.fbq('track', 'PageView');
  }, [pixelId]);

  return null;
}

export function trackMetaEvent(eventName: string, data?: Record<string, any>) {
  if (typeof window !== 'undefined' && window.fbq) {
    window.fbq('track', eventName, data);
  }
}

export function trackMetaLead(data: { fullName: string; phone: string; email?: string }) {
  trackMetaEvent('Lead', {
    content_name: 'Medical Camp Registration',
    content_category: 'Healthcare',
    value: 1,
    currency: 'YER',
  });
}

export function trackMetaCompleteRegistration(data: { fullName: string; phone: string }) {
  trackMetaEvent('CompleteRegistration', {
    content_name: 'Medical Camp',
    status: 'completed',
  });
}
