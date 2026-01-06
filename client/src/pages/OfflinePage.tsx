import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { WifiOff, RefreshCw, Calendar, Users, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface CachedAppointment {
  id: number;
  fullName: string;
  phone: string;
  doctorName: string;
  createdAt: string;
  status: string;
}

export default function OfflinePage() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [cachedAppointments, setCachedAppointments] = useState<CachedAppointment[]>([]);
  const [lastSync, setLastSync] = useState<string | null>(null);

  useEffect(() => {
    // Listen for online/offline events
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Load cached data from IndexedDB
    loadCachedData();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const loadCachedData = async () => {
    try {
      // Try to open IndexedDB
      const db = await openDatabase();
      const appointments = await getAppointmentsFromDB(db);
      setCachedAppointments(appointments);

      // Get last sync time
      const lastSyncTime = localStorage.getItem('lastSyncTime');
      if (lastSyncTime) {
        setLastSync(new Date(lastSyncTime).toLocaleString('ar-YE'));
      }
    } catch (error) {
      console.error('Error loading cached data:', error);
    }
  };

  const openDatabase = (): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('SGH_CRM_DB', 1);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains('appointments')) {
          db.createObjectStore('appointments', { keyPath: 'id' });
        }
      };
    });
  };

  const getAppointmentsFromDB = (db: IDBDatabase): Promise<CachedAppointment[]> => {
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['appointments'], 'readonly');
      const store = transaction.objectStore('appointments');
      const request = store.getAll();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  };

  const handleRefresh = () => {
    if (isOnline) {
      window.location.reload();
    } else {
      loadCachedData();
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      pending: { label: "قيد الانتظار", variant: "secondary" },
      confirmed: { label: "مؤكد", variant: "default" },
      completed: { label: "مكتمل", variant: "outline" },
      cancelled: { label: "ملغي", variant: "destructive" },
    };

    const statusInfo = statusMap[status] || { label: status, variant: "outline" };
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl space-y-6">
        {/* Status Card */}
        <Card className="border-2">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className={`rounded-full p-4 ${isOnline ? 'bg-green-100' : 'bg-red-100'}`}>
                {isOnline ? (
                  <RefreshCw className="h-12 w-12 text-green-600" />
                ) : (
                  <WifiOff className="h-12 w-12 text-red-600" />
                )}
              </div>
            </div>
            <CardTitle className="text-2xl">
              {isOnline ? 'الاتصال متاح الآن!' : 'لا يوجد اتصال بالإنترنت'}
            </CardTitle>
            <CardDescription className="text-base">
              {isOnline 
                ? 'تم استعادة الاتصال بالإنترنت. يمكنك الآن تحديث الصفحة للوصول إلى جميع الميزات.'
                : 'أنت غير متصل بالإنترنت حالياً. يمكنك عرض البيانات المحفوظة محلياً أدناه.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center gap-4">
            <Button onClick={handleRefresh} size="lg">
              <RefreshCw className="h-5 w-5 ml-2" />
              {isOnline ? 'تحديث الصفحة' : 'إعادة المحاولة'}
            </Button>
            {isOnline && (
              <Button onClick={() => window.location.href = '/dashboard'} variant="outline" size="lg">
                <Calendar className="h-5 w-5 ml-2" />
                العودة للوحة التحكم
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Cached Appointments */}
        {!isOnline && cachedAppointments.length > 0 && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  <CardTitle>المواعيد المحفوظة محلياً</CardTitle>
                </div>
                <Badge variant="secondary">
                  {cachedAppointments.length} موعد
                </Badge>
              </div>
              {lastSync && (
                <CardDescription>
                  آخر مزامنة: {lastSync}
                </CardDescription>
              )}
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {cachedAppointments.map((appointment) => (
                  <div
                    key={appointment.id}
                    className="flex items-start justify-between p-4 border rounded-lg bg-card hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{appointment.fullName}</span>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        الطبيب: {appointment.doctorName}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        الهاتف: {appointment.phone}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(appointment.createdAt).toLocaleString('ar-YE')}
                      </div>
                    </div>
                    <div>
                      {getStatusBadge(appointment.status)}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* No Cached Data */}
        {!isOnline && cachedAppointments.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                لا توجد بيانات محفوظة محلياً. يرجى الاتصال بالإنترنت للوصول إلى البيانات.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Info Card */}
        <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <div className="rounded-full bg-blue-100 dark:bg-blue-900 p-2">
                <WifiOff className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-1">
                  نصيحة: العمل بدون اتصال
                </h4>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  عند الاتصال بالإنترنت، يتم حفظ المواعيد تلقائياً على جهازك لعرضها عند عدم توفر الاتصال.
                  سيتم مزامنة أي تغييرات تقوم بها عند استعادة الاتصال.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
