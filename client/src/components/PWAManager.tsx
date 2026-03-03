/**
 * PWAManager - نظام تثبيت PWA الاحترافي الشامل
 *
 * يعمل في جميع صفحات المنصة (عامة + إدارة) مع:
 * - اكتشاف تلقائي للمسار: /dashboard/* أو /admin/* → تطبيق الإدارة
 * - بانر مركزي يظهر بعد 10 ثوانٍ في وسط الشاشة
 * - زر عائم دائم في الزاوية السفلية مع نص + أيقونة
 * - دعم iOS بتعليمات يدوية
 * - لا يزعج المستخدم (يختفي 7 أيام بعد "لاحقاً")
 */

import { useEffect, useState, useCallback } from 'react';
import { useLocation } from 'wouter';
import { Download, X, Smartphone, Share2, Plus, Bell, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { usePWAInstall, type PWAAppType } from '@/hooks/usePWAInstall';
import { cn } from '@/lib/utils';

// ===== Helper: Detect App Type from URL =====
function detectAppType(pathname: string): PWAAppType {
  if (pathname.startsWith('/dashboard') || pathname.startsWith('/admin')) {
    return 'admin';
  }
  return 'public';
}

// ===== Main PWAManager Component =====
export default function PWAManager() {
  const [location] = useLocation();
  const appType = detectAppType(location);
  return <PWAInstallSystem appType={appType} />;
}

// ===== PWA Install System =====
function PWAInstallSystem({ appType }: { appType: PWAAppType }) {
  const {
    canInstall,
    isInstalled,
    isIOS,
    isInstalling,
    isDismissed,
    installApp,
    dismissPrompt,
  } = usePWAInstall(appType);

  const [showBanner, setShowBanner] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [showFloatingButton, setShowFloatingButton] = useState(false);

  const BANNER_DISMISS_KEY = `sgh-pwa-banner-dismissed-${appType}`;

  // Check if banner was dismissed recently
  useEffect(() => {
    const dismissed = localStorage.getItem(BANNER_DISMISS_KEY);
    if (dismissed) {
      const dismissedAt = parseInt(dismissed, 10);
      const daysSince = (Date.now() - dismissedAt) / (1000 * 60 * 60 * 24);
      if (daysSince < 7) {
        setBannerDismissed(true);
      } else {
        localStorage.removeItem(BANNER_DISMISS_KEY);
      }
    }
  }, [BANNER_DISMISS_KEY]);

  // Show banner after 10 seconds
  useEffect(() => {
    if (isInstalled || bannerDismissed || isDismissed) return;
    if (!canInstall && !isIOS) return;

    const timer = setTimeout(() => {
      setShowBanner(true);
    }, 10000);

    return () => clearTimeout(timer);
  }, [canInstall, isIOS, isInstalled, bannerDismissed, isDismissed]);

  // Show floating button after 3 seconds
  useEffect(() => {
    if (isInstalled || isDismissed) return;
    if (!canInstall && !isIOS) return;

    const timer = setTimeout(() => {
      setShowFloatingButton(true);
    }, 3000);

    return () => clearTimeout(timer);
  }, [canInstall, isIOS, isInstalled, isDismissed]);

  const handleInstall = useCallback(async () => {
    if (isIOS) {
      setShowIOSGuide(true);
      return;
    }
    const result = await installApp();
    if (result === 'accepted') {
      setShowBanner(false);
      setShowFloatingButton(false);
    }
  }, [isIOS, installApp]);

  const handleDismissBanner = useCallback(() => {
    setShowBanner(false);
    setBannerDismissed(true);
    localStorage.setItem(BANNER_DISMISS_KEY, String(Date.now()));
  }, [BANNER_DISMISS_KEY]);

  const handleDismissAll = useCallback(() => {
    handleDismissBanner();
    dismissPrompt();
    setShowFloatingButton(false);
  }, [handleDismissBanner, dismissPrompt]);

  if (isInstalled) return null;
  if (!canInstall && !isIOS) return null;

  const isAdmin = appType === 'admin';

  return (
    <>
      {/* ===== Install Banner (Modal in Center) ===== */}
      {showBanner && !bannerDismissed && (
        <PWAInstallBanner
          appType={appType}
          isInstalling={isInstalling}
          onInstall={handleInstall}
          onDismiss={handleDismissBanner}
          onDismissAll={handleDismissAll}
        />
      )}

      {/* ===== Floating Install Button ===== */}
      {showFloatingButton && !showBanner && (
        <PWAFloatingButton
          appType={appType}
          isInstalling={isInstalling}
          onInstall={handleInstall}
          onDismiss={handleDismissAll}
        />
      )}

      {/* ===== iOS Install Guide ===== */}
      <IOSInstallGuide
        open={showIOSGuide}
        onClose={() => setShowIOSGuide(false)}
        appName={isAdmin ? 'لوحة تحكم SGH' : 'المستشفى السعودي الألماني'}
      />
    </>
  );
}

// ===== Install Banner - Modal in Center =====
function PWAInstallBanner({
  appType,
  isInstalling,
  onInstall,
  onDismiss,
  onDismissAll,
}: {
  appType: PWAAppType;
  isInstalling: boolean;
  onInstall: () => void;
  onDismiss: () => void;
  onDismissAll: () => void;
}) {
  const isAdmin = appType === 'admin';

  // Admin: الأزرق الرسمي للشعار #1a6faf / #1565a8
  // Public: الأخضر الرسمي للمستشفى
  const gradientClass = isAdmin
    ? 'from-[#1a6faf] via-[#1565a8] to-[#0d4f8a]'
    : 'from-emerald-600 via-green-700 to-teal-800';

  const features = isAdmin
    ? [
        { icon: Bell, text: 'إشعارات فورية للحجوزات الجديدة', color: 'text-yellow-300' },
        { icon: Zap, text: 'وصول سريع بدون متصفح', color: 'text-blue-200' },
      ]
    : [
        { icon: Zap, text: 'احجز مواعيدك بسرعة', color: 'text-blue-200' },
        { icon: Bell, text: 'تذكيرات بمواعيدك', color: 'text-yellow-300' },
      ];

  return (
    // Overlay
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      dir="rtl"
      onClick={onDismiss}
    >
      {/* Card */}
      <div
        className={cn(
          'relative w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden',
          `bg-gradient-to-br ${gradientClass} text-white`
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onDismissAll}
          className="absolute top-4 left-4 rounded-full p-1.5 bg-white/15 hover:bg-white/25 transition-colors z-10"
          aria-label="إغلاق"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="p-6">
          {/* Header: Icon + Name */}
          <div className="flex items-center gap-4 mb-5">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white/15 shadow-inner">
              <img
                src={isAdmin ? '/icon-admin-72x72.png' : '/icon-72x72.png'}
                alt={isAdmin ? 'لوحة تحكم SGH' : 'المستشفى السعودي الألماني'}
                className="h-11 w-11 object-contain rounded-xl"
                onError={(e) => {
                  const img = e.target as HTMLImageElement;
                  img.style.display = 'none';
                  const parent = img.parentElement;
                  if (parent) parent.innerHTML = '<span class="text-3xl">🏥</span>';
                }}
              />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-lg leading-tight">
                {isAdmin ? 'لوحة تحكم SGH' : 'المستشفى السعودي الألماني'}
              </h3>
              <p className="text-sm text-white/75 mt-0.5">
                {isAdmin ? 'إدارة الحجوزات والمواعيد' : 'احجز مواعيدك وتابع عروضنا'}
              </p>
            </div>
          </div>

          {/* Features */}
          <div className="space-y-3 mb-6">
            {features.map((feature, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/15">
                  <feature.icon className={cn('h-4 w-4', feature.color)} />
                </div>
                <span className="text-sm text-white/90">{feature.text}</span>
              </div>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={onDismiss}
              className="flex-1 rounded-2xl py-3 text-sm font-medium bg-white/15 hover:bg-white/25 transition-colors"
            >
              لاحقاً
            </button>
            <button
              onClick={onInstall}
              disabled={isInstalling}
              className={cn(
                'flex-[2] rounded-2xl py-3 text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-lg',
                'bg-white',
                isAdmin ? 'text-[#1a6faf] hover:bg-blue-50' : 'text-emerald-800 hover:bg-emerald-50',
                isInstalling && 'opacity-70 cursor-not-allowed'
              )}
            >
              {isInstalling ? (
                <div className="h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              {isInstalling ? 'جارٍ التثبيت...' : 'تثبيت التطبيق'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ===== Floating Button - Always shows text + icon =====
function PWAFloatingButton({
  appType,
  isInstalling,
  onInstall,
  onDismiss,
}: {
  appType: PWAAppType;
  isInstalling: boolean;
  onInstall: () => void;
  onDismiss: () => void;
}) {
  const isAdmin = appType === 'admin';

  return (
    <div
      className={cn(
        'fixed z-[90] flex flex-col items-end gap-2',
        'bottom-20 left-4 md:bottom-8 md:left-6'
      )}
      dir="rtl"
    >
      <div className="flex items-center gap-2">
        {/* Dismiss button */}
        <button
          onClick={onDismiss}
          className="h-8 w-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center shadow hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          aria-label="إغلاق"
        >
          <X className="h-3.5 w-3.5 text-gray-600 dark:text-gray-300" />
        </button>

        {/* Main install button - always shows icon + text */}
        <button
          onClick={onInstall}
          disabled={isInstalling}
          className={cn(
            'flex items-center gap-2 rounded-full px-5 py-3 shadow-2xl transition-all duration-200',
            'font-bold text-white text-sm',
            isAdmin
              ? 'bg-gradient-to-br from-[#1a6faf] to-[#0d4f8a] hover:from-[#1565a8] hover:to-[#0a3d6e]'
              : 'bg-gradient-to-br from-emerald-500 to-green-700 hover:from-emerald-400 hover:to-green-600',
            isInstalling && 'opacity-70 cursor-not-allowed'
          )}
          aria-label="تثبيت التطبيق"
        >
          {isInstalling ? (
            <div className="h-5 w-5 rounded-full border-2 border-white border-t-transparent animate-spin" />
          ) : (
            <Download className="h-5 w-5 shrink-0" />
          )}
          <span>{isInstalling ? 'جارٍ...' : 'تثبيت التطبيق'}</span>
        </button>
      </div>
    </div>
  );
}

// ===== iOS Install Guide Dialog =====
function IOSInstallGuide({
  open,
  onClose,
  appName,
}: {
  open: boolean;
  onClose: () => void;
  appName: string;
}) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5 text-blue-500" />
            تثبيت {appName}
          </DialogTitle>
        </DialogHeader>

        <p className="text-sm text-muted-foreground">
          اتبع الخطوات التالية لتثبيت التطبيق على جهاز iPhone أو iPad
        </p>

        <div className="space-y-4 py-2">
          <div className="flex items-start gap-3">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">1</div>
            <div>
              <p className="text-sm font-medium">اضغط على زر المشاركة</p>
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                ابحث عن أيقونة <Share2 className="h-3 w-3 inline" /> في شريط المتصفح
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">2</div>
            <div>
              <p className="text-sm font-medium">اختر "إضافة إلى الشاشة الرئيسية"</p>
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                <Plus className="h-3 w-3 inline" /> مرر للأسفل في قائمة المشاركة
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">3</div>
            <div>
              <p className="text-sm font-medium">اضغط "إضافة" للتأكيد</p>
              <p className="text-xs text-muted-foreground mt-1">سيظهر التطبيق على شاشتك الرئيسية</p>
            </div>
          </div>
        </div>

        <Button onClick={onClose} className="w-full">فهمت</Button>
      </DialogContent>
    </Dialog>
  );
}
