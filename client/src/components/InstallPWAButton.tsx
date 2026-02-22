import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Download, X } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function InstallPWAButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showButton, setShowButton] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      return;
    }

    // Check if user dismissed before
    const isDismissed = localStorage.getItem('pwa-install-dismissed');
    if (isDismissed) {
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowButton(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      console.log('[PWA] User accepted the install prompt');
    } else {
      console.log('[PWA] User dismissed the install prompt');
    }

    setDeferredPrompt(null);
    setShowButton(false);
  };

  const handleDismiss = () => {
    localStorage.setItem('pwa-install-dismissed', 'true');
    setShowButton(false);
    setDismissed(true);
  };

  // Only show on mobile devices
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );

  if (!showButton || !isMobile || dismissed) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 md:hidden">
      <div className="bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-lg shadow-2xl p-4 flex items-center gap-3">
        <div className="flex-shrink-0">
          <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
            <Download className="w-6 h-6" />
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-sm mb-1">ثبّت التطبيق</p>
          <p className="text-xs text-white/90">للوصول السريع وتجربة أفضل</p>
        </div>
        <Button
          onClick={handleInstallClick}
          size="sm"
          className="bg-white dark:bg-card text-green-700 hover:bg-white/90 font-bold flex-shrink-0"
        >
          تثبيت
        </Button>
        <button
          onClick={handleDismiss}
          className="flex-shrink-0 p-1 hover:bg-white/20 rounded-full transition-colors"
          aria-label="إغلاق"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
