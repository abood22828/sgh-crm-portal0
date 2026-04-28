import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Users, CheckCircle, XCircle, RefreshCw, Search, UserCheck, UserX } from "lucide-react";
import { toast } from "sonner";

export default function WhatsAppUserSubscriptionsPage() {
  const [activeTab, setActiveTab] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [optInType, setOptInType] = useState<"general" | "marketing">("general");

  const { data: subscriptions, isLoading, refetch } = trpc.whatsapp.userSubscriptions.getAll.useQuery(
    { optInType, limit: 100 },
    { refetchInterval: 30000 }
  );

  const { data: stats, refetch: refetchStats } = trpc.whatsapp.userSubscriptions.getStats.useQuery(
    undefined,
    { refetchInterval: 30000 }
  );

  const updateStatusMutation = trpc.whatsapp.userSubscriptions.updateStatus.useMutation({
    onSuccess: () => {
      toast.success("تم تحديث حالة الاشتراك");
      refetch();
      refetchStats();
    },
    onError: () => {
      toast.error("فشل تحديث حالة الاشتراك");
    },
  });

  const handleRefresh = () => {
    refetch();
    refetchStats();
    toast.success("تم تحديث البيانات");
  };

  const handleUpdateStatus = (phone: string, status: "opted_in" | "opted_out") => {
    updateStatusMutation.mutate({
      phoneNumber: phone,
      status,
      optInType,
      source: "manual",
    });
  };

  const filteredSubscriptions = subscriptions?.filter((sub: any) => {
    const matchesSearch = sub.phoneNumber.includes(searchTerm) || 
                         (sub.details && JSON.parse(sub.details).name?.includes(searchTerm));
    const matchesTab = activeTab === "all" || 
                      (activeTab === "opted_in" && sub.status === "opted_in") ||
                      (activeTab === "opted_out" && sub.status === "opted_out");
    return matchesSearch && matchesTab;
  });

  return (
    <div className="container mx-auto py-6 px-4" dir="rtl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">اشتراكات المستخدمين</h1>
          <p className="text-gray-600 mt-1">إدارة اشتراكات المستخدمين في WhatsApp (Opt-in/Opt-out)</p>
        </div>
        <Button onClick={handleRefresh} variant="outline" className="gap-2">
          <RefreshCw className="h-4 w-4" />
          تحديث
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">مشتركين عام</p>
                <p className="text-2xl font-bold text-green-600">
                  {stats?.general.optedIn || 0}
                </p>
              </div>
              <UserCheck className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">غير مشتركين عام</p>
                <p className="text-2xl font-bold text-red-600">
                  {stats?.general.optedOut || 0}
                </p>
              </div>
              <UserX className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">مشتركين تسويقي</p>
                <p className="text-2xl font-bold text-blue-600">
                  {stats?.marketing.optedIn || 0}
                </p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">غير مشتركين تسويقي</p>
                <p className="text-2xl font-bold text-orange-600">
                  {stats?.marketing.optedOut || 0}
                </p>
              </div>
              <XCircle className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            placeholder="بحث برقم الهاتف..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pr-10"
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant={optInType === "general" ? "default" : "outline"}
            onClick={() => setOptInType("general")}
          >
            عام
          </Button>
          <Button
            variant={optInType === "marketing" ? "default" : "outline"}
            onClick={() => setOptInType("marketing")}
          >
            تسويقي
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="all">الكل</TabsTrigger>
          <TabsTrigger value="opted_in">مشتركين</TabsTrigger>
          <TabsTrigger value="opted_out">غير مشتركين</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab}>
          <Card>
            <CardHeader>
              <CardTitle>قائمة الاشتراكات</CardTitle>
              <CardDescription>
                {optInType === "general" ? "اشتراكات عامة" : "اشتراكات تسويقية"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">جاري التحميل...</div>
              ) : filteredSubscriptions && filteredSubscriptions.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-right py-3 px-4">رقم الهاتف</th>
                        <th className="text-right py-3 px-4">الحالة</th>
                        <th className="text-right py-3 px-4">المصدر</th>
                        <th className="text-right py-3 px-4">تاريخ التحديث</th>
                        <th className="text-right py-3 px-4">إجراءات</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredSubscriptions.map((sub: any) => (
                        <tr key={sub.id} className="border-b hover:bg-gray-50">
                          <td className="py-3 px-4 font-mono">{sub.phoneNumber}</td>
                          <td className="py-3 px-4">
                            {sub.status === "opted_in" ? (
                              <Badge className="bg-green-500 text-white gap-1">
                                <CheckCircle className="h-3 w-3" />
                                مشترك
                              </Badge>
                            ) : (
                              <Badge className="bg-red-500 text-white gap-1">
                                <XCircle className="h-3 w-3" />
                                غير مشترك
                              </Badge>
                            )}
                          </td>
                          <td className="py-3 px-4">{sub.source}</td>
                          <td className="py-3 px-4">
                            {new Date(sub.updatedAt).toLocaleString("ar-SA")}
                          </td>
                          <td className="py-3 px-4">
                            {sub.status === "opted_in" ? (
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-red-600 hover:bg-red-50"
                                onClick={() => handleUpdateStatus(sub.phoneNumber, "opted_out")}
                                disabled={updateStatusMutation.isPending}
                              >
                                <XCircle className="h-4 w-4 mr-1" />
                                إلغاء الاشتراك
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-green-600 hover:bg-green-50"
                                onClick={() => handleUpdateStatus(sub.phoneNumber, "opted_in")}
                                disabled={updateStatusMutation.isPending}
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                اشتراك
                              </Button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Users className="h-12 w-12 mx-auto mb-2" />
                  <p>لا توجد اشتراكات متطابقة مع البحث</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
