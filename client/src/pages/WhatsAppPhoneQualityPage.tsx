import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Smartphone, RefreshCw, TrendingUp, TrendingDown, Minus, Activity } from "lucide-react";
import { toast } from "sonner";

export default function WhatsAppPhoneQualityPage() {
  const [phoneFilter, setPhoneFilter] = useState("");
  const [activeTab, setActiveTab] = useState("overview");

  const { data: currentQuality, isLoading: currentLoading, refetch: refetchCurrent } = trpc.whatsapp.phoneQuality.getCurrent.useQuery(
    undefined,
    { refetchInterval: 60000 }
  );

  const { data: qualityHistory, isLoading: historyLoading, refetch: refetchHistory } = trpc.whatsapp.phoneQuality.getHistory.useQuery(
    { phoneNumber: phoneFilter || undefined, limit: 100 },
    { refetchInterval: 60000 }
  );

  const { data: qualityWebhookEvents, isLoading: webhookLoading, refetch: refetchWebhook } = trpc.whatsapp.webhookEvents.getEventsByCategory.useQuery(
    { category: "quality", limit: 50 },
    { refetchInterval: 60000 }
  );

  const handleRefresh = () => {
    refetchCurrent();
    refetchHistory();
    refetchWebhook();
    toast.success("تم تحديث البيانات");
  };

  const getRatingColor = (rating: string) => {
    switch (rating) {
      case "green":
        return "bg-green-500 text-white";
      case "yellow":
        return "bg-yellow-500 text-black";
      case "red":
        return "bg-red-500 text-white";
      case "gray":
        return "bg-gray-500 text-white";
      default:
        return "bg-gray-300 text-black";
    }
  };

  const getRatingText = (rating: string) => {
    switch (rating) {
      case "green":
        return "ممتاز";
      case "yellow":
        return "جيد";
      case "red":
        return "ضعيف";
      case "gray":
        return "غير معروف";
      default:
        return rating;
    }
  };

  const getTrendIcon = (current: number, previous: number) => {
    if (current > previous) {
      return <TrendingUp className="h-4 w-4 text-green-500" />;
    } else if (current < previous) {
      return <TrendingDown className="h-4 w-4 text-red-500" />;
    }
    return <Minus className="h-4 w-4 text-gray-500" />;
  };

  // Calculate trend from history
  const getQualityTrend = () => {
    if (!qualityHistory || qualityHistory.length < 2) return null;
    const current = qualityHistory[0]?.qualityScore || 0;
    const previous = qualityHistory[1]?.qualityScore || 0;
    return { icon: getTrendIcon(current, previous), change: current - previous };
  };

  const trend = getQualityTrend();

  return (
    <div className="container mx-auto py-6 px-4" dir="rtl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">جودة رقم الهاتف</h1>
          <p className="text-gray-600 mt-1">مراقبة جودة رقم WhatsApp Business API</p>
        </div>
        <Button onClick={handleRefresh} variant="outline" className="gap-2">
          <RefreshCw className="h-4 w-4" />
          تحديث
        </Button>
      </div>

      {/* Current Quality Card */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="h-6 w-6" />
            الجودة الحالية
          </CardTitle>
          <CardDescription>
            {currentQuality?.phoneNumber || "غير متوفر"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {currentLoading ? (
            <div className="text-center py-8">جاري التحميل...</div>
          ) : currentQuality ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`p-4 rounded-full ${getRatingColor(currentQuality.qualityRating)}`}>
                  <Smartphone className="h-8 w-8" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">التقييم الحالي</p>
                  <div className="flex items-center gap-2">
                    <h2 className="text-3xl font-bold">{getRatingText(currentQuality.qualityRating)}</h2>
                    {trend && (
                      <div className="flex items-center gap-1">
                        {trend.icon}
                        <span className={`text-sm ${trend.change >= 0 ? "text-green-600" : "text-red-600"}`}>
                          {trend.change > 0 ? "+" : ""}{trend.change}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="text-left">
                <p className="text-sm text-gray-600">درجة الجودة</p>
                <p className="text-3xl font-bold">{currentQuality.qualityScore || "N/A"}/100</p>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Smartphone className="h-12 w-12 mx-auto mb-2" />
              <p>لا توجد بيانات جودة حالياً</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="overview">نظرة عامة</TabsTrigger>
          <TabsTrigger value="webhook-events">أحداث Webhook</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          {/* History Table */}
          <Card>
            <CardHeader>
              <CardTitle>تاريخ الجودة</CardTitle>
              <CardDescription>سجل تحديثات جودة رقم الهاتف</CardDescription>
            </CardHeader>
            <CardContent>
              {historyLoading ? (
                <div className="text-center py-8">جاري التحميل...</div>
              ) : qualityHistory && qualityHistory.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-right py-3 px-4">التاريخ</th>
                        <th className="text-right py-3 px-4">رقم الهاتف</th>
                        <th className="text-right py-3 px-4">التقييم</th>
                        <th className="text-right py-3 px-4">الدرجة</th>
                        <th className="text-right py-3 px-4">التفاصيل</th>
                      </tr>
                    </thead>
                    <tbody>
                      {qualityHistory.map((record: any, index: number) => (
                        <tr key={record.id} className="border-b hover:bg-gray-50">
                          <td className="py-3 px-4">
                            {new Date(record.createdAt).toLocaleString("ar-SA")}
                          </td>
                          <td className="py-3 px-4">{record.phoneNumber}</td>
                          <td className="py-3 px-4">
                            <Badge className={getRatingColor(record.qualityRating)}>
                              {getRatingText(record.qualityRating)}
                            </Badge>
                          </td>
                          <td className="py-3 px-4">{record.qualityScore || "N/A"}</td>
                          <td className="py-3 px-4">
                            {record.details && (
                              <details>
                                <summary className="cursor-pointer text-blue-600">عرض</summary>
                                <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto max-h-32">
                                  {JSON.stringify(JSON.parse(record.details), null, 2)}
                                </pre>
                              </details>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>لا يوجد تاريخ جودة متوفر</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="webhook-events">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                أحداث Webhook للجودة
              </CardTitle>
              <CardDescription>أحداث تحديث الجودة الواردة مباشرة من Meta</CardDescription>
            </CardHeader>
            <CardContent>
              {webhookLoading ? (
                <div className="text-center py-8">جاري التحميل...</div>
              ) : qualityWebhookEvents && qualityWebhookEvents.length > 0 ? (
                <div className="space-y-3">
                  {qualityWebhookEvents.map((event: any) => (
                    <div key={event.id} className="p-4 border rounded-lg bg-gray-50">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-semibold">{event.eventType}</h4>
                            {event.subType && (
                              <Badge variant="outline">{event.subType}</Badge>
                            )}
                          </div>
                          {event.phoneNumber && (
                            <p className="text-sm text-gray-600 mt-1">
                              الرقم: {event.phoneNumber}
                            </p>
                          )}
                          <p className="text-xs text-gray-500 mt-2">
                            {new Date(event.createdAt).toLocaleString("ar-SA")}
                          </p>
                        </div>
                        <Badge className={event.handlerExists ? "bg-green-500" : "bg-red-500"}>
                          {event.handlerExists ? "معالج" : "غير معالج"}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Activity className="h-12 w-12 mx-auto mb-2" />
                  <p>لا توجد أحداث جودة حالياً</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
