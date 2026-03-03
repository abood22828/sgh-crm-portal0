/**
 * PWAManager - نظام تثبيت PWA الاحترافي الشامل - النسخة الجذرية المُصلَحة
 *
 * الإصلاحات الجوهرية:
 * 1. الزر العائم يظهر دائماً في صفحات الإدارة بمجرد دعم PWA (بغض النظر عن canInstall)
 * 2. البانر يظهر فقط عندما يكون canInstall=true (حدث beforeinstallprompt متاح)
 * 3. فصل تام بين تطبيقي الإدارة والواجهة العامة
 * 4. تصميم مخصص لكل تطبيق (أزرق للإدارة، أخضر للعامة)
 */

import { useEffect, useState, useCallback } from 'react';
import { useLocation } from 'wouter';
import { Download, X, Smartphone, Share2, Plus, Bell, Zap, Monitor } from 'lucide-react';
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
    isPWASupported,
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
  const FLOAT_DISMISS_KEY = `sgh-pwa-float-dismissed-${appType}`;

  const isAdmin = appType === 'admin';

  // Check if banner/float was dismissed recently
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

  // Show banner after 10 seconds - only when canInstall=true
  useEffect(() => {
    if (isInstalled || bannerDismissed || isDismissed) return;
    if (!canInstall && !isIOS) return;

    const timer = setTimeout(() => {
      setShowBanner(true);
    }, 10000);

    return () => clearTimeout(timer);
  }, [canInstall, isIOS, isInstalled, bannerDismissed, isDismissed]);

  // Show floating button:
  // - For admin: always show after 2 seconds if PWA is supported and not installed
  // - For public: only show when canInstall=true
  useEffect(() => {
    if (isInstalled || isDismissed) return;

    // Check if float was dismissed
    const floatDismissed = localStorage.getItem(FLOAT_DISMISS_KEY);
    if (floatDismissed) {
      const dismissedAt = parseInt(floatDismissed, 10);
      const daysSince = (Date.now() - dismissedAt) / (1000 * 60 * 60 * 24);
      if (daysSince < 7) return;
      localStorage.removeItem(FLOAT_DISMISS_KEY);
    }

    // Admin: show button always (even before beforeinstallprompt fires)
    // Public: only show when canInstall=true
    const shouldShow = isAdmin
      ? isPWASupported || isIOS
      : (canInstall || isIOS);

    if (!shouldShow) return;

    const timer = setTimeout(() => {
      setShowFloatingButton(true);
    }, 2000);

    return () => clearTimeout(timer);
  }, [canInstall, isIOS, isInstalled, isDismissed, isAdmin, isPWASupported, FLOAT_DISMISS_KEY]);

  const handleInstall = useCallback(async () => {
    if (isIOS) {
      setShowIOSGuide(true);
      return;
    }
    if (!canInstall) {
      // إذا لم يكن canInstall=true، نعرض رسالة توجيهية
      setShowIOSGuide(true);
      return;
    }
    const result = await installApp();
    if (result === 'accepted') {
      setShowBanner(false);
      setShowFloatingButton(false);
    }
  }, [isIOS, canInstall, installApp]);

  const handleDismissBanner = useCallback(() => {
    setShowBanner(false);
    setBannerDismissed(true);
    localStorage.setItem(BANNER_DISMISS_KEY, String(Date.now()));
  }, [BANNER_DISMISS_KEY]);

  const handleDismissFloat = useCallback(() => {
    setShowFloatingButton(false);
    localStorage.setItem(FLOAT_DISMISS_KEY, String(Date.now()));
  }, [FLOAT_DISMISS_KEY]);

  const handleDismissAll = useCallback(() => {
    handleDismissBanner();
    handleDismissFloat();
    dismissPrompt();
  }, [handleDismissBanner, handleDismissFloat, dismissPrompt]);

  // Don't show anything if already installed
  if (isInstalled) return null;

  // For public: don't show if no install capability
  if (!isAdmin && !canInstall && !isIOS) return null;

  // For admin: don't show if PWA not supported at all
  if (isAdmin && !isPWASupported && !isIOS) return null;

  return (
    <>
      {/* ===== Install Banner (Modal in Center) ===== */}
      {showBanner && !bannerDismissed && canInstall && (
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
          canInstall={canInstall}
          onInstall={handleInstall}
          onDismiss={handleDismissFloat}
        />
      )}

      {/* ===== iOS Install Guide / Manual Install Guide ===== */}
      <InstallGuideDialog
        open={showIOSGuide}
        onClose={() => setShowIOSGuide(false)}
        appName={isAdmin ? 'لوحة تحكم SGH' : 'المستشفى السعودي الألماني'}
        isIOS={isIOS}
        isAdmin={isAdmin}
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
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      dir="rtl"
      onClick={onDismiss}
    >
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

// ===== Floating Button =====
function PWAFloatingButton({
  appType,
  isInstalling,
  canInstall,
  onInstall,
  onDismiss,
}: {
  appType: PWAAppType;
  isInstalling: boolean;
  canInstall: boolean;
  onInstall: () => void;
  onDismiss: () => void;
}) {
  const isAdmin = appType === 'admin';

  // إذا لم يكن canInstall=true في لوحة التحكم، نُظهر زراً مختلفاً
  // يشرح للمستخدم كيفية التثبيت يدوياً
  const buttonLabel = isInstalling
    ? 'جارٍ...'
    : canInstall
    ? 'تثبيت التطبيق'
    : 'تثبيت التطبيق';

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

        {/* Main install button */}
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
          ) : canInstall ? (
            <Download className="h-5 w-5 shrink-0" />
          ) : (
            <Monitor className="h-5 w-5 shrink-0" />
          )}
          <span>{buttonLabel}</span>
        </button>
      </div>
    </div>
  );
}

// ===== Install Guide Dialog (iOS + Manual) =====
function InstallGuideDialog({
  open,
  onClose,
  appName,
  isIOS,
  isAdmin,
}: {
  open: boolean;
  onClose: () => void;
  appName: string;
  isIOS: boolean;
  isAdmin: boolean;
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

        {isIOS ? (
          <>
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
          </>
        ) : (
          <>
            <p className="text-sm text-muted-foreground">
              لتثبيت {isAdmin ? 'لوحة تحكم SGH' : 'تطبيق المستشفى'} على جهازك، استخدم زر التثبيت في شريط عنوان المتصفح
            </p>
            <div className="space-y-3 py-2">
              <div className="flex items-start gap-3">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">1</div>
                <p className="text-sm">ابحث عن أيقونة التثبيت في شريط العنوان (Chrome/Edge)</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">2</div>
                <p className="text-sm">اضغط عليها واختر "تثبيت"</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">3</div>
                <p className="text-sm">سيظهر التطبيق على سطح المكتب أو الشاشة الرئيسية</p>
              </div>
            </div>
          </>
        )}

        <Button onClick={onClose} className="w-full">فهمت</Button>
      </DialogContent>
    </Dialog>
  );
}
