/**
 * WhatsApp Analytics Dashboard
 * لوحة تحكم تحليلات WhatsApp
 */

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { MessageCircle, Send, Settings, TrendingUp, AlertCircle } from "lucide-react";
import { toast } from "sonner";

export default function WhatsAppAnalytics() {
  const [broadcastMessage, setBroadcastMessage] = useState("");
  const [broadcastRecipients, setBroadcastRecipients] = useState("");
  const [autoReplyTrigger, setAutoReplyTrigger] = useState("");
  const [autoReplyResponse, setAutoReplyResponse] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Queries
  const broadcastStatsQuery = trpc.whatsapp.getBroadcastStats.useQuery();
  const autoReplyRulesQuery = trpc.whatsapp.getAutoReplyRules.useQuery();

  // Mutations
  const sendBroadcastMutation = trpc.whatsapp.sendBroadcast.useMutation();
  const addAutoReplyMutation = trpc.whatsapp.addAutoReplyRule.useMutation();
  const deleteAutoReplyMutation = trpc.whatsapp.deleteAutoReplyRule.useMutation();

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
      } else {
        toast.error(result.error || "فشل إرسال البث");
      }
    } catch (error) {
      toast.error("حدث خطأ أثناء إرسال البث");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddAutoReply = async () => {
    if (!autoReplyTrigger || !autoReplyResponse) {
      toast.error("يرجى إدخال المحفز والرد");
      return;
    }

    setIsLoading(true);
    try {
      const result = await addAutoReplyMutation.mutateAsync({
        name: autoReplyTrigger,
        triggerType: "keyword" as const,
        triggerValue: autoReplyTrigger,
        replyMessage: autoReplyResponse,
      });

      if (result.success) {
        toast.success("تم إضافة قاعدة الرد التلقائي");
        setAutoReplyTrigger("");
        setAutoReplyResponse("");
        autoReplyRulesQuery.refetch();
      } else {
        toast.error(result.error || "فشل إضافة القاعدة");
      }
    } catch (error) {
      toast.error("حدث خطأ أثناء إضافة القاعدة");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAutoReply = async (ruleId: number) => {
    try {
      const result = await deleteAutoReplyMutation.mutateAsync({ ruleId });
      if (result.success) {
        toast.success("تم حذف القاعدة");
        autoReplyRulesQuery.refetch();
      }
    } catch (error) {
      toast.error("فشل حذف القاعدة");
    }
  };

  // Sample data for charts
  const messageStats = [
    { name: "السبت", sent: 120, delivered: 115, failed: 5 },
    { name: "الأحد", sent: 180, delivered: 175, failed: 5 },
    { name: "الاثنين", sent: 150, delivered: 145, failed: 5 },
    { name: "الثلاثاء", sent: 200, delivered: 195, failed: 5 },
    { name: "الأربعاء", sent: 170, delivered: 165, failed: 5 },
    { name: "الخميس", sent: 190, delivered: 185, failed: 5 },
    { name: "الجمعة", sent: 210, delivered: 205, failed: 5 },
  ];

  const messageTypes = [
    { name: "نصية", value: 45 },
    { name: "قوالب", value: 30 },
    { name: "وسائط", value: 15 },
    { name: "تفاعلية", value: 10 },
  ];

  const COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444"];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">تحليلات WhatsApp</h1>
        <p className="text-muted-foreground">مراقبة الإحصائيات والأداء</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">قواعد الرد التلقائي</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{autoReplyRulesQuery.data?.rules?.length || 0}</div>
            <p className="text-xs text-muted-foreground">قاعدة نشطة</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Line Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              الرسائل المرسلة (آخر 7 أيام)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={messageStats}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="sent" stroke="#3b82f6" name="مرسلة" />
                <Line type="monotone" dataKey="delivered" stroke="#10b981" name="مسلمة" />
                <Line type="monotone" dataKey="failed" stroke="#ef4444" name="فشلت" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5" />
              أنواع الرسائل
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={messageTypes}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {messageTypes.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Broadcast Section */}
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

      {/* Auto Reply Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            قواعس الرد التلقائي
          </CardTitle>
          <CardDescription>إضافة قواعس للرد التلقائي على الرسائل الواردة</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">المحفز (الكلمة المفتاحية)</label>
              <Input
                placeholder="مثال: مرحبا"
                value={autoReplyTrigger}
                onChange={(e) => setAutoReplyTrigger(e.target.value)}
                className="mt-1"
              />
            </div>

            <div>
              <label className="text-sm font-medium">الرد</label>
              <Input
                placeholder="مثال: أهلا وسهلا"
                value={autoReplyResponse}
                onChange={(e) => setAutoReplyResponse(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>

          <Button onClick={handleAddAutoReply} disabled={isLoading} className="w-full">
            {isLoading ? "جاري الإضافة..." : "إضافة قاعدة"}
          </Button>

          {/* Rules List */}
          {autoReplyRulesQuery.data?.rules && autoReplyRulesQuery.data.rules.length > 0 && (
            <div className="mt-6 space-y-2">
              <h3 className="font-semibold">القواعس النشطة:</h3>
              {autoReplyRulesQuery.data.rules.map((rule) => (
                <div
                  key={rule.id}
                  className="flex items-center justify-between p-3 bg-muted rounded-lg"
                >
                  <div>
                    <p className="font-medium text-sm">{rule.triggerValue || rule.triggerType}</p>
                    <p className="text-xs text-muted-foreground">{rule.replyMessage}</p>
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDeleteAutoReply(rule.id)}
                  >
                    حذف
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
