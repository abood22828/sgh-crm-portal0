/**
 * WhatsApp Analytics Dashboard
 * لوحة تحكم تحليلات WhatsApp
 */

import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
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
import { MessageCircle, TrendingUp } from "lucide-react";

export default function WhatsAppAnalytics() {
  // Queries
  const broadcastStatsQuery = trpc.whatsapp.getBroadcastStats.useQuery();
  const autoReplyRulesQuery = trpc.whatsapp.getAutoReplyRules.useQuery();

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
    </div>
  );
}
