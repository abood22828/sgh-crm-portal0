import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertTriangle, Shield, CheckCircle, AlertCircle, RefreshCw } from "lucide-react";
import { toast } from "sonner";

export default function WhatsAppAccountHealthPage() {
  const [activeTab, setActiveTab] = useState("alerts");
  const [severityFilter, setSeverityFilter] = useState<string | null>(null);

  const { data: alerts, isLoading: alertsLoading, refetch: refetchAlerts } = trpc.whatsapp.accountHealth.getAlerts.useQuery(
    { severity: severityFilter as any, resolved: false, limit: 50 },
    { refetchInterval: 30000 }
  );

  const { data: securityEvents, isLoading: securityLoading, refetch: refetchSecurity } = trpc.whatsapp.accountHealth.getSecurityEvents.useQuery(
    { severity: severityFilter as any, limit: 50 },
    { refetchInterval: 30000 }
  );

  const resolveAlertMutation = trpc.whatsapp.accountHealth.resolveAlert.useMutation({
    onSuccess: () => {
      toast.success("تم تحديث حالة التنبيه");
      refetchAlerts();
    },
    onError: () => {
      toast.error("فشل تحديث حالة التنبيه");
    },
  });

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "bg-red-500 text-white";
      case "high":
        return "bg-orange-500 text-white";
      case "medium":
        return "bg-yellow-500 text-black";
      case "low":
        return "bg-blue-500 text-white";
      default:
        return "bg-gray-500 text-white";
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "critical":
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      case "high":
        return <AlertCircle className="h-5 w-5 text-orange-500" />;
      case "medium":
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      case "low":
        return <AlertCircle className="h-5 w-5 text-blue-500" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-500" />;
    }
  };

  const handleResolveAlert = (alertId: number) => {
    resolveAlertMutation.mutate({ id: alertId, resolvedBy: 1 }); // TODO: Get actual user ID
  };

  const handleRefresh = () => {
    refetchAlerts();
    refetchSecurity();
    toast.success("تم تحديث البيانات");
  };

  return (
    <div className="container mx-auto py-6 px-4" dir="rtl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">صحة الحساب والأمان</h1>
          <p className="text-gray-600 mt-1">مراقبة تنبيهات الحساب وأحداث الأمان من Meta</p>
        </div>
        <Button onClick={handleRefresh} variant="outline" className="gap-2">
          <RefreshCw className="h-4 w-4" />
          تحديث
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">تنبيهات حرجة</p>
                <p className="text-2xl font-bold text-red-600">
                  {alerts?.filter((a: any) => a.severity === "critical" && !a.resolved).length || 0}
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">تنبيهات عالية</p>
                <p className="text-2xl font-bold text-orange-600">
                  {alerts?.filter((a: any) => a.severity === "high" && !a.resolved).length || 0}
                </p>
              </div>
              <AlertCircle className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">أحداث أمان</p>
                <p className="text-2xl font-bold text-blue-600">
                  {securityEvents?.length || 0}
                </p>
              </div>
              <Shield className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">تم حلها</p>
                <p className="text-2xl font-bold text-green-600">
                  {alerts?.filter((a: any) => a.resolved).length || 0}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-4">
        <Button
          variant={severityFilter === null ? "default" : "outline"}
          size="sm"
          onClick={() => setSeverityFilter(null)}
        >
          الكل
        </Button>
        <Button
          variant={severityFilter === "critical" ? "default" : "outline"}
          size="sm"
          onClick={() => setSeverityFilter("critical")}
          className="bg-red-100 hover:bg-red-200 text-red-700"
        >
          حرجة
        </Button>
        <Button
          variant={severityFilter === "high" ? "default" : "outline"}
          size="sm"
          onClick={() => setSeverityFilter("high")}
          className="bg-orange-100 hover:bg-orange-200 text-orange-700"
        >
          عالية
        </Button>
        <Button
          variant={severityFilter === "medium" ? "default" : "outline"}
          size="sm"
          onClick={() => setSeverityFilter("medium")}
          className="bg-yellow-100 hover:bg-yellow-200 text-yellow-700"
        >
          متوسطة
        </Button>
        <Button
          variant={severityFilter === "low" ? "default" : "outline"}
          size="sm"
          onClick={() => setSeverityFilter("low")}
          className="bg-blue-100 hover:bg-blue-200 text-blue-700"
        >
          منخفضة
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="alerts">تنبيهات الحساب</TabsTrigger>
          <TabsTrigger value="security">أحداث الأمان</TabsTrigger>
        </TabsList>

        <TabsContent value="alerts">
          <Card>
            <CardHeader>
              <CardTitle>تنبيهات الحساب</CardTitle>
              <CardDescription>تنبيهات مهمة من Meta حول حالة الحساب</CardDescription>
            </CardHeader>
            <CardContent>
              {alertsLoading ? (
                <div className="text-center py-8">جاري التحميل...</div>
              ) : alerts && alerts.length > 0 ? (
                <div className="space-y-4">
                  {alerts.map((alert: any) => (
                    <div
                      key={alert.id}
                      className={`p-4 border rounded-lg ${alert.resolved ? "bg-gray-50 opacity-60" : "bg-white"}`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          {getSeverityIcon(alert.severity)}
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-semibold">{alert.alertType}</h4>
                              <Badge className={getSeverityColor(alert.severity)}>
                                {alert.severity}
                              </Badge>
                              {alert.resolved && (
                                <Badge variant="outline" className="text-green-600">
                                  محلول
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-gray-600 mt-1">
                              {alert.details ? JSON.parse(alert.details).message || alert.details : ""}
                            </p>
                            <p className="text-xs text-gray-400 mt-2">
                              {new Date(alert.createdAt).toLocaleString("ar-SA")}
                            </p>
                          </div>
                        </div>
                        {!alert.resolved && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleResolveAlert(alert.id)}
                            disabled={resolveAlertMutation.isPending}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            تحديد كمحلول
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <CheckCircle className="h-12 w-12 mx-auto mb-2 text-green-500" />
                  <p>لا توجد تنبيهات حالياً</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>أحداث الأمان</CardTitle>
              <CardDescription>أحداث أمان متعلقة بحساب WhatsApp</CardDescription>
            </CardHeader>
            <CardContent>
              {securityLoading ? (
                <div className="text-center py-8">جاري التحميل...</div>
              ) : securityEvents && securityEvents.length > 0 ? (
                <div className="space-y-4">
                  {securityEvents.map((event: any) => (
                    <div key={event.id} className="p-4 border rounded-lg bg-white">
                      <div className="flex items-start gap-3">
                        <Shield className="h-5 w-5 text-blue-500" />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold">{event.eventType}</h4>
                            <Badge className={getSeverityColor(event.severity)}>
                              {event.severity}
                            </Badge>
                          </div>
                          {event.phoneNumber && (
                            <p className="text-sm text-gray-600 mt-1">
                              الرقم: {event.phoneNumber}
                            </p>
                          )}
                          <p className="text-sm text-gray-600 mt-1">
                            {event.details ? JSON.parse(event.details).message || event.details : ""}
                          </p>
                          <p className="text-xs text-gray-400 mt-2">
                            {new Date(event.createdAt).toLocaleString("ar-SA")}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Shield className="h-12 w-12 mx-auto mb-2 text-green-500" />
                  <p>لا توجد أحداث أمان حالياً</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
