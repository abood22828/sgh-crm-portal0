import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw, Clock, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { toast } from "sonner";

export default function QueueDashboard() {
  const [autoRefresh, setAutoRefresh] = useState(true);
  
  const { data: queueStats, isLoading, refetch } = trpc.queue.getStats.useQuery(undefined, {
    refetchInterval: autoRefresh ? 5000 : false, // Auto-refresh every 5 seconds
  });

  const { data: recentJobs, isLoading: isLoadingJobs, refetch: refetchJobs } = trpc.queue.getRecentJobs.useQuery(
    { limit: 20 },
    {
      refetchInterval: autoRefresh ? 10000 : false, // Auto-refresh every 10 seconds
    }
  );

  const handleRefresh = async () => {
    await Promise.all([refetch(), refetchJobs()]);
    toast.success("تم تحديث البيانات");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">مراقبة طوابير الرسائل</h1>
          <p className="text-muted-foreground mt-1">
            متابعة حالة إرسال رسائل WhatsApp
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            {autoRefresh ? "إيقاف التحديث التلقائي" : "تفعيل التحديث التلقائي"}
          </Button>
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            <RefreshCw className="w-4 h-4 mr-2" />
            تحديث
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">قيد الانتظار</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{queueStats?.waiting || 0}</div>
            <p className="text-xs text-muted-foreground">
              رسائل في قائمة الانتظار
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">قيد المعالجة</CardTitle>
            <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{queueStats?.active || 0}</div>
            <p className="text-xs text-muted-foreground">
              رسائل يتم إرسالها الآن
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">تم الإرسال</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{queueStats?.completed || 0}</div>
            <p className="text-xs text-muted-foreground">
              رسائل تم إرسالها بنجاح
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">فشل الإرسال</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{queueStats?.failed || 0}</div>
            <p className="text-xs text-muted-foreground">
              رسائل فشل إرسالها
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Jobs */}
      <Card>
        <CardHeader>
          <CardTitle>الرسائل الأخيرة</CardTitle>
          <CardDescription>
            آخر 20 رسالة تم معالجتها
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingJobs ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : recentJobs && recentJobs.length > 0 ? (
            <div className="space-y-4">
              {recentJobs.map((job: any) => (
                <div
                  key={job.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">{job.patientName || "غير محدد"}</span>
                      <Badge variant="outline" className="text-xs">
                        {job.bookingType === "appointment"
                          ? "موعد طبيب"
                          : job.bookingType === "offer"
                          ? "حجز عرض"
                          : "تسجيل مخيم"}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {job.phone} • {job.templateName}
                    </p>
                    {job.error && (
                      <div className="flex items-center gap-1 mt-2 text-xs text-red-600">
                        <AlertCircle className="w-3 h-3" />
                        <span>{job.error}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-xs text-muted-foreground">
                        {new Date(job.timestamp).toLocaleString("ar-SA")}
                      </div>
                      {job.attempts > 1 && (
                        <div className="text-xs text-yellow-600 mt-1">
                          محاولة {job.attempts}
                        </div>
                      )}
                    </div>
                    <Badge
                      variant={
                        job.state === "completed"
                          ? "default"
                          : job.state === "failed"
                          ? "destructive"
                          : job.state === "active"
                          ? "secondary"
                          : "outline"
                      }
                    >
                      {job.state === "completed"
                        ? "تم الإرسال"
                        : job.state === "failed"
                        ? "فشل"
                        : job.state === "active"
                        ? "قيد المعالجة"
                        : "قيد الانتظار"}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              لا توجد رسائل حتى الآن
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
