/**
 * WhatsApp Analytics Dashboard
 * لوحة تحكم تحليلات WhatsApp
 */

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  BarChart,
  Bar,
} from "recharts";
import { MessageCircle, TrendingUp, Download, Calendar, Users, Clock, CheckCircle, XCircle, RefreshCw } from "lucide-react";

export default function WhatsAppAnalytics() {
  const [dateRange, setDateRange] = useState<"7d" | "30d" | "90d">("7d");

  // Queries
  const broadcastStatsQuery = trpc.whatsapp.getBroadcastStats.useQuery();
  const autoReplyRulesQuery = trpc.whatsapp.getAutoReplyRules.useQuery();
  const messageStatsQuery = trpc.whatsapp.getMessageStats.useQuery();

  // Use real data from API, fallback to empty arrays if loading/error
  const messageStats = messageStatsQuery.data?.dailyStats || [];
  const messageTypes = messageStatsQuery.data?.typeStats || [];

  const COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444"];

  const handleExport = () => {
    const data = {
      broadcastStats: broadcastStatsQuery.data?.stats,
      autoReplyRules: autoReplyRulesQuery.data?.rules,
      messageStats: messageStatsQuery.data,
      exportedAt: new Date().toISOString(),
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `whatsapp-analytics-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleRefresh = () => {
    broadcastStatsQuery.refetch();
    autoReplyRulesQuery.refetch();
    messageStatsQuery.refetch();
  };

  return (
    <DashboardLayout pageTitle="تحليلات WhatsApp" pageDescription="مراقبة الإحصائيات والأداء">
      <div className="space-y-6">
        {/* Header with Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">تحليلات WhatsApp</h1>
            <p className="text-muted-foreground text-sm">مراقبة الإحصائيات والأداء</p>
          </div>
          <div className="flex items-center gap-2">
            <Select value={dateRange} onValueChange={(value: any) => setDateRange(value)}>
              <SelectTrigger className="w-[140px]">
                <Calendar className="h-4 w-4 ml-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">آخر 7 أيام</SelectItem>
                <SelectItem value="30d">آخر 30 يوم</SelectItem>
                <SelectItem value="90d">آخر 90 يوم</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={handleRefresh} disabled={messageStatsQuery.isLoading}>
              <RefreshCw className={`h-4 w-4 ${messageStatsQuery.isLoading ? "animate-spin" : ""}`} />
            </Button>
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="h-4 w-4 ml-2" />
              تصدير
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <MessageCircle className="h-4 w-4 text-blue-500" />
                إجمالي البث
              </CardTitle>
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
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-500" />
                الرسائل المرسلة
              </CardTitle>
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
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                معدل النجاح
              </CardTitle>
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
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Users className="h-4 w-4 text-purple-500" />
                قواعد الرد التلقائي
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{autoReplyRulesQuery.data?.rules?.length || 0}</div>
              <p className="text-xs text-muted-foreground">قاعدة نشطة</p>
            </CardContent>
          </Card>
        </div>

        {/* Additional Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Clock className="h-4 w-4 text-orange-500" />
                متوسط وقت الاستجابة
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">2.5</div>
              <p className="text-xs text-muted-foreground">دقيقة</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                الرسائل المقروءة
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">85%</div>
              <p className="text-xs text-muted-foreground">نسبة القراءة</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <XCircle className="h-4 w-4 text-red-500" />
                الرسائل الفاشلة
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {broadcastStatsQuery.data?.stats?.totalMessagesFailed || 0}
              </div>
              <p className="text-xs text-muted-foreground">رسالة</p>
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

        {/* Bar Chart for Response Times */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              أداء الاستجابة حسب الساعة
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={[
                { name: "8-12", messages: 45, response: 2.1 },
                { name: "12-16", messages: 82, response: 2.8 },
                { name: "16-20", messages: 65, response: 2.5 },
                { name: "20-24", messages: 30, response: 3.2 },
              ]}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="messages" fill="#3b82f6" name="الرسائل" />
                <Bar dataKey="response" fill="#10b981" name="متوسط الاستجابة (دقيقة)" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
