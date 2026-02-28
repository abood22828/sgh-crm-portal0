/**
 * InstallPWAButton Component
 * 
 * مكون زر تثبيت PWA الموحد - يعمل مع كلا التطبيقين (عام + إدارة)
 * 
 * الميزات:
 * - يظهر فقط عندما يكون التثبيت متاحاً (beforeinstallprompt)
 * - يدعم iOS بعرض تعليمات يدوية
 * - يتتبع عمليات التثبيت في قاعدة البيانات
 * - لا يزعج المستخدم (يختفي بعد الرفض لمدة 7 أيام)
 * - يدعم وضع compact (للهيدر) ووضع sidebar (للشريط الجانبي) ووضع banner (بانر كامل)
 * 
 * الاستخدام:
 * <InstallPWAButton appType="public" variant="banner" />
 * <InstallPWAButton appType="admin" variant="compact" />
 * 
 * أماكن الاستخدام:
 * - Navbar (الواجهة العامة) - variant="compact"
 * - TopNavbar (لوحة التحكم) - variant="compact"
 * - DashboardSidebarV2 bottom (لوحة التحكم) - variant="sidebar"
 */

import { useState } from 'react';
import { Download, X, Smartphone, Share2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { usePWAInstall, type PWAAppType } from '@/hooks/usePWAInstall';
import { cn } from '@/lib/utils';

interface InstallPWAButtonProps {
  appType?: PWAAppType;
  /** compact: زر صغير في الهيدر | sidebar: في الشريط الجانبي | banner: بانر كامل */
  variant?: 'compact' | 'sidebar' | 'banner';
  className?: string;
}

export default function InstallPWAButton({
  appType = 'public',
  variant = 'banner',
  className,
}: InstallPWAButtonProps) {
  const {
    canInstall,
    isInstalled,
    isIOS,
    isInstalling,
    installApp,
    dismissPrompt,
  } = usePWAInstall(appType);

  const [showIOSGuide, setShowIOSGuide] = useState(false);

  const appName = appType === 'admin' ? 'لوحة تحكم SGH' : 'المستشفى السعودي الألماني';

  // لا تعرض الزر إذا:
  // - التطبيق مثبت بالفعل
  // - لا يمكن التثبيت ولا يوجد iOS
  if (isInstalled || (!canInstall && !isIOS)) {
    return null;
  }

  const handleInstall = async () => {
    if (isIOS) {
      setShowIOSGuide(true);
      return;
    }
    await installApp();
  };

  // ===== Variant: Sidebar =====
  if (variant === 'sidebar') {
    return (
      <>
        <button
          onClick={handleInstall}
          disabled={isInstalling}
          className={cn(
            'flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors',
            'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
            className
          )}
        >
          <Download className="h-4 w-4 shrink-0" />
          <span className="truncate">
            {isInstalling ? 'جارٍ التثبيت...' : 'تثبيت التطبيق'}
          </span>
        </button>
        <IOSInstallGuide open={showIOSGuide} onClose={() => setShowIOSGuide(false)} appName={appName} />
      </>
    );
  }

  // ===== Variant: Compact =====
  if (variant === 'compact') {
    return (
      <>
        <Button
          variant="outline"
          size="sm"
          onClick={handleInstall}
          disabled={isInstalling}
          className={cn(
            'gap-2 border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 dark:border-blue-800 dark:bg-blue-950/30 dark:text-blue-400',
            className
          )}
          title={`تثبيت ${appName}`}
        >
          <Download className="h-4 w-4" />
          <span className="hidden sm:inline">{isInstalling ? 'جارٍ...' : 'تثبيت'}</span>
        </Button>
        <IOSInstallGuide open={showIOSGuide} onClose={() => setShowIOSGuide(false)} appName={appName} />
      </>
    );
  }

  // ===== Variant: Banner (default) =====
  // يظهر فقط على الهاتف
  return (
    <>
      <div className={cn('fixed bottom-20 left-4 right-4 z-50 md:hidden', className)}>
        <div className="flex items-center gap-3 rounded-xl border border-blue-200 bg-gradient-to-r from-blue-600 to-blue-700 p-4 shadow-2xl text-white">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/20">
            <Smartphone className="h-6 w-6" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold">ثبّت التطبيق</p>
            <p className="text-xs text-white/80">للوصول السريع وتجربة أفضل</p>
          </div>
          <Button
            size="sm"
            onClick={handleInstall}
            disabled={isInstalling}
            className="bg-white text-blue-700 hover:bg-white/90 font-bold shrink-0"
          >
            {isInstalling ? 'جارٍ...' : 'تثبيت'}
          </Button>
          <button
            onClick={dismissPrompt}
            className="shrink-0 rounded-full p-1 hover:bg-white/20 transition-colors"
            aria-label="إغلاق"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>
      <IOSInstallGuide open={showIOSGuide} onClose={() => setShowIOSGuide(false)} appName={appName} />
    </>
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
          <DialogDescription>
            اتبع الخطوات التالية لتثبيت التطبيق على جهاز iPhone أو iPad
          </DialogDescription>
        </DialogHeader>

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
