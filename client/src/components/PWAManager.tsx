import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Download, Bell, X } from "lucide-react";
import { toast } from "sonner";

export default function PWAManager() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallDialog, setShowInstallDialog] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>("default");
  const [isDashboard, setIsDashboard] = useState(false);

  useEffect(() => {
    // Check if we're on dashboard route
    const checkRoute = () => {
      setIsDashboard(window.location.pathname.startsWith('/dashboard'));
    };
    checkRoute();
    
    // Listen for route changes
    window.addEventListener('popstate', checkRoute);
    
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      
      // Show install dialog after 30 seconds if not installed
      setTimeout(() => {
        if (!isInstalled && !localStorage.getItem('pwa-install-dismissed')) {
          setShowInstallDialog(true);
        }
      }, 30000);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Listen for app installed event
    window.addEventListener('appinstalled', () => {
      console.log('PWA installed successfully');
      setIsInstalled(true);
      setDeferredPrompt(null);
      toast.success('تم تثبيت التطبيق بنجاح!');
    });

    // Check notification permission
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission);
    }

    // Register service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('Service Worker registered:', registration);
          
          // Check for updates
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  toast.info('تحديث جديد متاح! سيتم تطبيقه عند إعادة تحميل الصفحة.');
                }
              });
            }
          });
        })
        .catch((error) => {
          console.error('Service Worker registration failed:', error);
        });
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('popstate', checkRoute);
    };
  }, [isInstalled]);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      toast.error('التثبيت غير متاح حالياً');
      return;
    }

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
    } else {
      console.log('User dismissed the install prompt');
    }
    
    setDeferredPrompt(null);
    setShowInstallDialog(false);
  };

  const handleDismissInstall = () => {
    setShowInstallDialog(false);
    localStorage.setItem('pwa-install-dismissed', 'true');
  };

  const requestNotificationPermission = async () => {
    if (!('Notification' in window)) {
      toast.error('المتصفح لا يدعم الإشعارات');
      return;
    }

    if (Notification.permission === 'granted') {
      toast.success('الإشعارات مفعّلة بالفعل');
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
      
      if (permission === 'granted') {
        toast.success('تم تفعيل الإشعارات بنجاح!');
        
        // Subscribe to push notifications
        if ('serviceWorker' in navigator && 'PushManager' in window) {
          const registration = await navigator.serviceWorker.ready;
          
          try {
            const subscription = await registration.pushManager.subscribe({
              userVisibleOnly: true,
              applicationServerKey: urlBase64ToUint8Array(
                'BEl62iUYgUivxIkv69yViEuiBIa-Ib37J8xQmrEcxVcZ-hdGCzrTlHSsF_N4YPKQfD6sQmxSPedSjIMfliWsTgQ'
              )
            });
            
            console.log('Push subscription:', subscription);
            // TODO: Send subscription to server
          } catch (error) {
            console.error('Failed to subscribe to push notifications:', error);
          }
        }
      } else {
        toast.error('تم رفض تفعيل الإشعارات');
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      toast.error('حدث خطأ أثناء طلب الإشعارات');
    }
  };

  // Helper function to convert VAPID key
  function urlBase64ToUint8Array(base64String: string) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/\-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  // Don't render PWA features if not on dashboard
  if (!isDashboard) {
    return null;
  }

  return (
    <>
      {/* Install Dialog */}
      <Dialog open={showInstallDialog} onOpenChange={setShowInstallDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Download className="h-5 w-5 text-primary" />
              ثبّت التطبيق
            </DialogTitle>
            <DialogDescription>
              ثبّت تطبيق المستشفى السعودي الألماني على جهازك للوصول السريع وتجربة أفضل!
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="flex items-start gap-3">
              <div className="rounded-full bg-green-100 p-2">
                <Download className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <h4 className="font-medium">وصول سريع</h4>
                <p className="text-sm text-muted-foreground">افتح التطبيق مباشرة من الشاشة الرئيسية</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="rounded-full bg-blue-100 p-2">
                <Bell className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <h4 className="font-medium">إشعارات فورية</h4>
                <p className="text-sm text-muted-foreground">احصل على تنبيهات بالحجوزات الجديدة</p>
              </div>
            </div>
          </div>

          <DialogFooter className="flex-row gap-2">
            <Button variant="outline" onClick={handleDismissInstall} className="flex-1">
              <X className="h-4 w-4 ml-2" />
              لاحقاً
            </Button>
            <Button onClick={handleInstallClick} className="flex-1">
              <Download className="h-4 w-4 ml-2" />
              تثبيت الآن
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Floating Install Button (only show if not installed and prompt available) */}
      {!isInstalled && deferredPrompt && (
        <div className="fixed bottom-4 left-4 z-50 md:bottom-6 md:left-6">
          <Button
            onClick={handleInstallClick}
            size="lg"
            className="shadow-lg hover:shadow-xl transition-shadow"
          >
            <Download className="h-5 w-5 ml-2" />
            <span className="hidden sm:inline">تثبيت التطبيق</span>
            <span className="sm:hidden">تثبيت</span>
          </Button>
        </div>
      )}

      {/* Notification Permission Button (only show if installed and permission not granted) */}
      {isInstalled && notificationPermission !== 'granted' && (
        <div className="fixed bottom-20 left-4 z-50 md:bottom-24 md:left-6">
          <Button
            onClick={requestNotificationPermission}
            size="lg"
            variant="secondary"
            className="shadow-lg hover:shadow-xl transition-shadow"
          >
            <Bell className="h-5 w-5 ml-2" />
            <span className="hidden sm:inline">تفعيل الإشعارات</span>
            <span className="sm:hidden">إشعارات</span>
          </Button>
        </div>
      )}
    </>
  );
}
