/**
 * usePWAInstall Hook - النسخة الجذرية المُصلَحة
 *
 * الإصلاحات الجوهرية:
 * 1. فصل تام بين تطبيقي الإدارة والواجهة العامة:
 *    - في صفحات /dashboard/* و /admin/*:
 *      * يُلغي تسجيل sw.js العام (scope: /) إذا كان مسجلاً
 *      * يُسجّل sw-admin.js فقط (scope: /dashboard/)
 *    - في الصفحات العامة:
 *      * يُسجّل sw.js فقط (scope: /)
 *      * لا يتدخل في sw-admin.js
 * 2. canInstall يبقى true حتى بعد إلغاء المستخدم للـ prompt
 * 3. isDismissed يُستخدم فقط عند الضغط على "لاحقاً" (7 أيام)
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
  /** هل تم رفض الطلب من قبل بشكل صريح (زر "لاحقاً") */
  isDismissed: boolean;
  /** تشغيل عملية التثبيت */
  installApp: () => Promise<'accepted' | 'dismissed' | 'unavailable'>;
  /** إخفاء زر التثبيت مؤقتاً (7 أيام) */
  dismissPrompt: () => void;
}

const DISMISS_STORAGE_KEY = (appType: PWAAppType) => `sgh-pwa-dismissed-${appType}`;
const INSTALL_COUNT_KEY = (appType: PWAAppType) => `sgh-pwa-install-count-${appType}`;

/**
 * إلغاء تسجيل Service Worker العام (scope: /) في صفحات الإدارة
 * CRITICAL: SW العام (scope: /) يغطي /admin/ و/dashboard/ ويمنع beforeinstallprompt لتطبيق الإدارة
 * الحل: إلغاء أي SW ليس sw-admin.js (أي لا يحتوي على /admin أو /dashboard في نطاقه)
 */
async function unregisterPublicSWInAdminPages(): Promise<void> {
  if (!('serviceWorker' in navigator)) return;
  try {
    const registrations = await navigator.serviceWorker.getRegistrations();
    for (const registration of registrations) {
      const scope = registration.scope;
      // إلغاء أي SW ليس خاصاً بالإدارة (لا يحتوي على /admin أو /dashboard في نطاقه)
      // هذا يشمل SW العام (scope: /) وأي SW آخر قد يتعارض
      const isAdminSW = scope.includes('/admin') || scope.includes('/dashboard');
      if (!isAdminSW) {
        console.log('[PWA-admin] FORCE unregistering conflicting SW at scope:', scope);
        await registration.unregister();
      }
    }
  } catch (error) {
    console.warn('[PWA-admin] Failed to unregister public SW:', error);
  }
}

export function usePWAInstall(appType: PWAAppType): PWAInstallState {
  const [canInstall, setCanInstall] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isPWASupported, setIsPWASupported] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  const deferredPromptRef = useRef<BeforeInstallPromptEvent | null>(null);
  const promptUsedRef = useRef(false);

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

    // التحقق من رفض صريح سابق (زر "لاحقاً" فقط)
    const dismissed = localStorage.getItem(DISMISS_STORAGE_KEY(appType));
    if (dismissed) {
      const dismissedAt = parseInt(dismissed, 10);
      const daysSinceDismiss = (Date.now() - dismissedAt) / (1000 * 60 * 60 * 24);
      if (daysSinceDismiss < 7) {
        setIsDismissed(true);
      } else {
        localStorage.removeItem(DISMISS_STORAGE_KEY(appType));
      }
    }

    if (supported && !isStandalone) {
      const currentPath = window.location.pathname;
      const isAdminPath = currentPath.startsWith('/dashboard') || currentPath.startsWith('/admin');

      if (appType === 'admin' && isAdminPath) {
        // CRITICAL: إلغاء تسجيل SW العام أولاً لتحرير النطاق
        // ثم تسجيل SW الإدارة
        unregisterPublicSWInAdminPages().then(() => {
          navigator.serviceWorker
            .register('/admin/sw-admin.js', { scope: '/admin/' })
            .then((registration) => {
              console.log('[PWA-admin] SW registered at scope:', registration.scope);
            })
            .catch((error) => {
              // Fallback to /dashboard/ scope for backward compatibility
              console.warn('[PWA-admin] SW registration at /admin/ failed, trying /dashboard/:', error);
              navigator.serviceWorker
                .register('/dashboard/sw-admin.js', { scope: '/dashboard/' })
                .then((reg) => console.log('[PWA-admin] SW registered at fallback scope:', reg.scope))
                .catch((err) => console.warn('[PWA-admin] SW registration failed completely:', err));
            });
        });
      } else if (appType === 'public' && !isAdminPath) {
        // تسجيل SW العام فقط في الصفحات العامة
        navigator.serviceWorker
          .register('/sw.js', { scope: '/' })
          .then((registration) => {
            console.log('[PWA-public] SW registered at scope:', registration.scope);
          })
          .catch((error) => {
            console.warn('[PWA-public] SW registration failed:', error);
          });
      }
    }

    // الاستماع لحدث beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      deferredPromptRef.current = e as BeforeInstallPromptEvent;
      promptUsedRef.current = false;
      setCanInstall(true);
      console.log(`[PWA-${appType}] Install prompt available`);
    };

    // الاستماع لحدث appinstalled
    const handleAppInstalled = () => {
      console.log(`[PWA-${appType}] App installed successfully!`);
      setIsInstalled(true);
      setCanInstall(false);
      deferredPromptRef.current = null;

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
    if (!deferredPromptRef.current || promptUsedRef.current) {
      console.warn(`[PWA-${appType}] No install prompt available`);
      return 'unavailable';
    }

    setIsInstalling(true);
    promptUsedRef.current = true;

    try {
      const prompt = deferredPromptRef.current;
      await prompt.prompt();
      const { outcome } = await prompt.userChoice;

      console.log(`[PWA-${appType}] Install outcome:`, outcome);

      deferredPromptRef.current = null;

      if (outcome === 'accepted') {
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
        return 'accepted';
      } else {
        // المستخدم ألغى - نُخفي الزر في هذه الجلسة فقط
        setCanInstall(false);
        return 'dismissed';
      }
    } catch (error) {
      console.error(`[PWA-${appType}] Install error:`, error);
      deferredPromptRef.current = null;
      setCanInstall(false);
      return 'unavailable';
    } finally {
      setIsInstalling(false);
    }
  }, [appType, trackInstallMutation]);

  // dismissPrompt: يُخفي الزر لمدة 7 أيام (زر "لاحقاً" الصريح)
  const dismissPrompt = useCallback(() => {
    localStorage.setItem(DISMISS_STORAGE_KEY(appType), String(Date.now()));
    setIsDismissed(true);
    setCanInstall(false);
    console.log(`[PWA-${appType}] Prompt explicitly dismissed for 7 days`);
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
