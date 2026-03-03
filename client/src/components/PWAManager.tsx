/**
 * PWAManager - نظام تثبيت PWA الاحترافي الشامل
 *
 * يعمل في جميع صفحات المنصة (عامة + إدارة) مع:
 * - اكتشاف تلقائي للمسار: /dashboard/* أو /admin/* → تطبيق الإدارة
 * - بانر ترحيبي يظهر بعد 10 ثوانٍ يعرض مزايا التطبيق
 * - زر عائم دائم في الزاوية السفلية
 * - دعم iOS بتعليمات يدوية
 * - لا يزعج المستخدم (يختفي 7 أيام بعد الرفض)
 * - تتبع التثبيت في قاعدة البيانات
 */

import { useEffect, useState, useCallback } from 'react';
import { useLocation } from 'wouter';
import { Download, X, Smartphone, Share2, Plus, Bell, Zap, Shield, WifiOff } from 'lucide-react';
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

  return (
    <>
      <PWAInstallSystem appType={appType} />
    </>
  );
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
  const appName = appType === 'admin' ? 'لوحة تحكم SGH' : 'المستشفى السعودي الألماني';
  const appDescription = appType === 'admin'
    ? 'إدارة الحجوزات والمواعيد من أي مكان'
    : 'احجز مواعيدك وتابع عروضنا بسهولة';

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

  // Show banner after 10 seconds if installable and not dismissed
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

  // Don't render anything if installed or not installable
  if (isInstalled) return null;
  if (!canInstall && !isIOS) return null;

  return (
    <>
      {/* ===== Install Banner ===== */}
      {showBanner && !bannerDismissed && (
        <PWAInstallBanner
          appType={appType}
          appName={appName}
          appDescription={appDescription}
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
        appName={appName}
      />
    </>
  );
}

// ===== Install Banner Component =====
interface BannerProps {
  appType: PWAAppType;
  appName: string;
  appDescription: string;
  isInstalling: boolean;
  onInstall: () => void;
  onDismiss: () => void;
  onDismissAll: () => void;
}

function PWAInstallBanner({
  appType,
  appName,
  appDescription,
  isInstalling,
  onInstall,
  onDismiss,
  onDismissAll,
}: BannerProps) {
  const isAdmin = appType === 'admin';

  const features = isAdmin
    ? [
        { icon: Bell, text: 'إشعارات فورية للحجوزات الجديدة', color: 'text-yellow-500' },
        { icon: Zap, text: 'وصول سريع بدون متصفح', color: 'text-blue-500' },
        { icon: WifiOff, text: 'يعمل بدون اتصال بالإنترنت', color: 'text-green-500' },
      ]
    : [
        { icon: Zap, text: 'احجز مواعيدك بسرعة', color: 'text-blue-500' },
        { icon: Bell, text: 'تذكيرات بمواعيدك', color: 'text-yellow-500' },
        { icon: WifiOff, text: 'يعمل بدون اتصال', color: 'text-green-500' },
      ];

  return (
    <div
      className={cn(
        'fixed bottom-0 left-0 right-0 z-[100] p-4 md:bottom-6 md:left-auto md:right-6 md:max-w-sm',
        'animate-in slide-in-from-bottom-4 duration-500'
      )}
      dir="rtl"
    >
      <div
        className={cn(
          'relative rounded-2xl shadow-2xl overflow-hidden',
          isAdmin
            ? 'bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 text-white'
            : 'bg-gradient-to-br from-emerald-700 via-green-700 to-teal-800 text-white'
        )}
      >
        {/* Dismiss All Button */}
        <button
          onClick={onDismissAll}
          className="absolute top-3 left-3 rounded-full p-1.5 bg-white/10 hover:bg-white/20 transition-colors"
          aria-label="إغلاق نهائياً"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="p-5 pt-4">
          {/* Header */}
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/15 shadow-inner">
              <img
                src={isAdmin ? '/icon-admin-72x72.png' : '/icon-72x72.png'}
                alt={appName}
                className="h-10 w-10 object-contain rounded-xl"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                  (e.target as HTMLImageElement).parentElement!.innerHTML = '<span class="text-2xl">🏥</span>';
                }}
              />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-base leading-tight">{appName}</h3>
              <p className="text-xs text-white/75 mt-0.5">{appDescription}</p>
            </div>
          </div>

          {/* Features */}
          <div className="space-y-2 mb-4">
            {features.map((feature, i) => (
              <div key={i} className="flex items-center gap-2">
                <feature.icon className={cn('h-4 w-4 shrink-0', feature.color)} />
                <span className="text-sm text-white/90">{feature.text}</span>
              </div>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <button
              onClick={onDismiss}
              className="flex-1 rounded-xl py-2.5 text-sm font-medium bg-white/10 hover:bg-white/20 transition-colors"
            >
              لاحقاً
            </button>
            <button
              onClick={onInstall}
              disabled={isInstalling}
              className={cn(
                'flex-[2] rounded-xl py-2.5 text-sm font-bold flex items-center justify-center gap-2 transition-all',
                'bg-white shadow-lg',
                isAdmin ? 'text-blue-800 hover:bg-blue-50' : 'text-emerald-800 hover:bg-emerald-50',
                isInstalling && 'opacity-70 cursor-not-allowed'
              )}
            >
              <Download className="h-4 w-4" />
              {isInstalling ? 'جارٍ التثبيت...' : 'تثبيت مجاناً'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ===== Floating Button Component =====
interface FloatingButtonProps {
  appType: PWAAppType;
  isInstalling: boolean;
  onInstall: () => void;
  onDismiss: () => void;
}

function PWAFloatingButton({ appType, isInstalling, onInstall, onDismiss }: FloatingButtonProps) {
  const [expanded, setExpanded] = useState(false);
  const isAdmin = appType === 'admin';

  return (
    <div
      className={cn(
        'fixed z-[90] flex flex-col items-end gap-2',
        // On mobile: bottom-left (above bottom nav bar)
        'bottom-20 left-4',
        // On desktop: bottom-left
        'md:bottom-8 md:left-6'
      )}
      dir="rtl"
    >
      {/* Expanded tooltip */}
      {expanded && (
        <div
          className={cn(
            'rounded-xl px-4 py-3 shadow-xl text-white text-sm max-w-[200px] text-right',
            'animate-in fade-in slide-in-from-bottom-2 duration-200',
            isAdmin
              ? 'bg-gradient-to-br from-blue-700 to-blue-900'
              : 'bg-gradient-to-br from-emerald-600 to-green-800'
          )}
        >
          <p className="font-bold mb-1">ثبّت التطبيق!</p>
          <p className="text-xs text-white/80">
            {isAdmin ? 'إدارة أسرع وإشعارات فورية' : 'وصول سريع وتجربة أفضل'}
          </p>
        </div>
      )}

      {/* Floating Button */}
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
          onClick={() => {
            if (expanded) {
              onInstall();
            } else {
              setExpanded(true);
              // Auto collapse after 4 seconds if not clicked
              setTimeout(() => setExpanded(false), 4000);
            }
          }}
          disabled={isInstalling}
          className={cn(
            'flex items-center gap-2 rounded-full shadow-2xl transition-all duration-300',
            'font-bold text-white',
            expanded ? 'px-5 py-3 text-sm' : 'h-14 w-14 justify-center',
            isAdmin
              ? 'bg-gradient-to-br from-blue-600 to-blue-800 hover:from-blue-500 hover:to-blue-700'
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
          {expanded && (
            <span>{isInstalling ? 'جارٍ...' : 'تثبيت'}</span>
          )}
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
