/**
 * usePWAInstall Hook
 * 
 * Hook موحد لإدارة تثبيت PWA لكلا التطبيقين:
 * - التطبيق العام (Public App): للمرضى والزوار
 * - تطبيق الإدارة (Admin App): للموظفين
 * 
 * الميزات:
 * - اكتشاف حدث beforeinstallprompt
 * - عرض/إخفاء زر التثبيت بشكل ذكي
 * - تتبع عمليات التثبيت الناجحة لكل تطبيق
 * - تسجيل Service Worker المناسب لكل تطبيق
 * - دعم iOS (لا يدعم beforeinstallprompt)
 * 
 * الاستخدام:
 * const { canInstall, isInstalled, isIOS, installApp, dismissPrompt } = usePWAInstall('public');
 * const { canInstall, isInstalled, isIOS, installApp, dismissPrompt } = usePWAInstall('admin');
 * 
 * أماكن الاستخدام:
 * - InstallPWAButton (الواجهة العامة)
 * - PWAManager (لوحة التحكم)
 * - DashboardLayout header
 * - Navbar (الواجهة العامة)
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { trpc } from '@/lib/trpc';

export type PWAAppType = 'public' | 'admin';

export interface PWAInstallState {
  /** هل يمكن تثبيت التطبيق (حدث beforeinstallprompt متاح) */
  canInstall: boolean;
  /** هل التطبيق مثبت بالفعل (standalone mode) */
  isInstalled: boolean;
  /** هل الجهاز iOS (يحتاج تعليمات يدوية) */
  isIOS: boolean;
  /** هل يدعم المتصفح PWA */
  isPWASupported: boolean;
  /** هل عملية التثبيت جارية */
  isInstalling: boolean;
  /** هل تم رفض الطلب من قبل */
  isDismissed: boolean;
  /** تشغيل عملية التثبيت */
  installApp: () => Promise<'accepted' | 'dismissed' | 'unavailable'>;
  /** إخفاء زر التثبيت مؤقتاً */
  dismissPrompt: () => void;
}

const DISMISS_STORAGE_KEY = (appType: PWAAppType) => `sgh-pwa-dismissed-${appType}`;
const INSTALL_COUNT_KEY = (appType: PWAAppType) => `sgh-pwa-install-count-${appType}`;

export function usePWAInstall(appType: PWAAppType): PWAInstallState {
  const [canInstall, setCanInstall] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isPWASupported, setIsPWASupported] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  const deferredPromptRef = useRef<BeforeInstallPromptEvent | null>(null);

  // tRPC mutation لتسجيل التثبيت في قاعدة البيانات
  const trackInstallMutation = trpc.pwa.trackInstall.useMutation();

  useEffect(() => {
    // التحقق من iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(isIOSDevice);

    // التحقق من دعم PWA
    const supported = 'serviceWorker' in navigator;
    setIsPWASupported(supported);

    // التحقق من وضع standalone (مثبت بالفعل)
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;
    setIsInstalled(isStandalone);

    // التحقق من رفض سابق
    const dismissed = localStorage.getItem(DISMISS_STORAGE_KEY(appType));
    if (dismissed) {
      const dismissedAt = parseInt(dismissed, 10);
      const daysSinceDismiss = (Date.now() - dismissedAt) / (1000 * 60 * 60 * 24);
      // إعادة عرض الزر بعد 7 أيام من الرفض
      if (daysSinceDismiss < 7) {
        setIsDismissed(true);
      } else {
        localStorage.removeItem(DISMISS_STORAGE_KEY(appType));
      }
    }

    // تسجيل Service Worker المناسب
    // CRITICAL: Admin SW must be registered from /dashboard/sw-admin.js
    // because browsers require SW files to be within or above their scope
    // The server serves /dashboard/sw-admin.js with Service-Worker-Allowed: /dashboard/ header
    if (supported && !isStandalone) {
      const swPath = appType === 'admin' ? '/dashboard/sw-admin.js' : '/sw.js';
      const swScope = appType === 'admin' ? '/dashboard/' : '/';

      navigator.serviceWorker
        .register(swPath, { scope: swScope })
        .then((registration) => {
          console.log(`[PWA-${appType}] Service Worker registered at scope:`, registration.scope);
        })
        .catch((error) => {
          console.warn(`[PWA-${appType}] Service Worker registration failed:`, error);
          // Fallback: try without explicit scope
          if (appType === 'admin') {
            navigator.serviceWorker
              .register('/dashboard/sw-admin.js')
              .then(reg => console.log('[PWA-admin] Fallback SW registered:', reg.scope))
              .catch(err => console.error('[PWA-admin] Fallback SW failed:', err));
          }
        });
    }

    // الاستماع لحدث beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      deferredPromptRef.current = e as BeforeInstallPromptEvent;
      setCanInstall(true);
      console.log(`[PWA-${appType}] Install prompt available`);
    };

    // الاستماع لحدث appinstalled
    const handleAppInstalled = () => {
      console.log(`[PWA-${appType}] App installed successfully!`);
      setIsInstalled(true);
      setCanInstall(false);
      deferredPromptRef.current = null;

      // تحديث عداد التثبيت المحلي
      const currentCount = parseInt(localStorage.getItem(INSTALL_COUNT_KEY(appType)) || '0', 10);
      localStorage.setItem(INSTALL_COUNT_KEY(appType), String(currentCount + 1));
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [appType]);

  const installApp = useCallback(async (): Promise<'accepted' | 'dismissed' | 'unavailable'> => {
    if (!deferredPromptRef.current) {
      console.warn(`[PWA-${appType}] No install prompt available`);
      return 'unavailable';
    }

    setIsInstalling(true);

    try {
      const prompt = deferredPromptRef.current;
      await prompt.prompt();
      const { outcome } = await prompt.userChoice;

      console.log(`[PWA-${appType}] Install outcome:`, outcome);

      if (outcome === 'accepted') {
        // تسجيل التثبيت في قاعدة البيانات
        try {
          await trackInstallMutation.mutateAsync({
            appType,
            userAgent: navigator.userAgent,
            platform: navigator.platform || 'unknown',
          });
        } catch (trackError) {
          console.warn(`[PWA-${appType}] Failed to track install:`, trackError);
        }

        setIsInstalled(true);
        setCanInstall(false);
        deferredPromptRef.current = null;
        return 'accepted';
      } else {
        deferredPromptRef.current = null;
        setCanInstall(false);
        return 'dismissed';
      }
    } catch (error) {
      console.error(`[PWA-${appType}] Install error:`, error);
      return 'unavailable';
    } finally {
      setIsInstalling(false);
    }
  }, [appType, trackInstallMutation]);

  const dismissPrompt = useCallback(() => {
    localStorage.setItem(DISMISS_STORAGE_KEY(appType), String(Date.now()));
    setIsDismissed(true);
    setCanInstall(false);
    console.log(`[PWA-${appType}] Prompt dismissed`);
  }, [appType]);

  return {
    canInstall: canInstall && !isDismissed && !isInstalled,
    isInstalled,
    isIOS,
    isPWASupported,
    isInstalling,
    isDismissed,
    installApp,
    dismissPrompt,
  };
}

// Type declaration for BeforeInstallPromptEvent
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
  prompt(): Promise<void>;
}
