/**
 * WhatsApp Broadcast Page
 * صفحة إرسال البث الجماعي
 */

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send } from "lucide-react";
import { toast } from "sonner";

export default function WhatsAppBroadcast() {
  const [broadcastMessage, setBroadcastMessage] = useState("");
  const [broadcastRecipients, setBroadcastRecipients] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Queries
  const broadcastStatsQuery = trpc.whatsapp.getBroadcastStats.useQuery();

  // Mutations
  const sendBroadcastMutation = trpc.whatsapp.sendBroadcast.useMutation();

  const handleSendBroadcast = async () => {
    if (!broadcastMessage || !broadcastRecipients) {
      toast.error("يرجى إدخال الرسالة والمستقبلين");
      return;
    }

    setIsLoading(true);
    try {
      const recipients = broadcastRecipients
        .split("\n")
        .map((r) => r.trim())
        .filter((r) => r.length > 0);

      const result = await sendBroadcastMutation.mutateAsync({
        message: broadcastMessage,
        recipients,
        priority: "normal",
      });

      if (result.success) {
        toast.success(`تم إرسال البث إلى ${recipients.length} مستقبل`);
        setBroadcastMessage("");
        setBroadcastRecipients("");
        broadcastStatsQuery.refetch();
      } else {
        toast.error(result.error || "فشل إرسال البث");
      }
    } catch (error) {
      toast.error("حدث خطأ أثناء إرسال البث");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">البث الجماعي</h1>
        <p className="text-muted-foreground">إرسال رسالة إلى عدة مستقبلين في نفس الوقت</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">إجمالي البث</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {broadcastStatsQuery.data?.stats?.totalBroadcasts || 0}
            </div>
            <p className="text-xs text-muted-foreground">حملات بث</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">الرسائل المرسلة</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {broadcastStatsQuery.data?.stats?.totalMessagesSent || 0}
            </div>
            <p className="text-xs text-muted-foreground">رسالة</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">معدل النجاح</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {broadcastStatsQuery.data?.stats?.totalMessagesSent
                ? Math.round(
                    ((broadcastStatsQuery.data.stats.totalMessagesSent -
                      broadcastStatsQuery.data.stats.totalMessagesFailed) /
                      broadcastStatsQuery.data.stats.totalMessagesSent) *
                      100
                  )
                : 0}
              %
            </div>
            <p className="text-xs text-muted-foreground">نسبة النجاح</p>
          </CardContent>
        </Card>
      </div>

      {/* Broadcast Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="w-5 h-5" />
            إرسال بث جماعي
          </CardTitle>
          <CardDescription>إرسال رسالة إلى عدة مستقبلين في نفس الوقت</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium">الرسالة</label>
            <Textarea
              placeholder="أدخل الرسالة..."
              value={broadcastMessage}
              onChange={(e) => setBroadcastMessage(e.target.value)}
              className="mt-1"
              rows={3}
            />
          </div>

          <div>
            <label className="text-sm font-medium">المستقبلون (واحد في كل سطر)</label>
            <Textarea
              placeholder="967777165305&#10;967777165306&#10;967777165307"
              value={broadcastRecipients}
              onChange={(e) => setBroadcastRecipients(e.target.value)}
              className="mt-1"
              rows={4}
            />
          </div>

          <Button onClick={handleSendBroadcast} disabled={isLoading} className="w-full">
            {isLoading ? "جاري الإرسال..." : "إرسال البث"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
