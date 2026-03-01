import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Smartphone, Monitor, TrendingUp, Users, Download, Activity } from "lucide-react";
import { useMemo } from "react";

export default function PWAStatsPage() {
  const { data: stats, isLoading } = trpc.pwa.getStats.useQuery();

  const publicTotal = stats?.public ?? 0;
  const adminTotal = stats?.admin ?? 0;
  const totalInstalls = stats?.total ?? 0;

  const platformData = useMemo(() => {
    if (!stats?.recentInstalls) return [];
    // تجميع المنصات من recentInstalls
    const platformMap = new Map<string, number>();
    stats.recentInstalls.forEach((install: any) => {
      const platform = install.platform || 'غير معروف';
      platformMap.set(platform, (platformMap.get(platform) || 0) + 1);
    });
    return Array.from(platformMap.entries()).map(([platform, count]) => ({ platform, count }));
  }, [stats]);

  return (
    <DashboardLayout pageTitle="إحصائيات PWA" pageDescription="تتبع عمليات تثبيت تطبيقات الويب التقدمية">
      <div className="p-6 space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">إجمالي التثبيتات</CardTitle>
              <Download className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="h-8 w-16 bg-muted animate-pulse rounded" />
              ) : (
                <div className="text-3xl font-bold">{totalInstalls}</div>
              )}
              <p className="text-xs text-muted-foreground mt-1">عبر جميع التطبيقات</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">تطبيق الجمهور</CardTitle>
              <Users className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="h-8 w-16 bg-muted animate-pulse rounded" />
              ) : (
                <div className="text-3xl font-bold text-blue-600">{publicTotal}</div>
              )}
              <p className="text-xs text-muted-foreground mt-1">المستشفى السعودي الألماني</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">تطبيق الإدارة</CardTitle>
              <Monitor className="h-4 w-4 text-indigo-500" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="h-8 w-16 bg-muted animate-pulse rounded" />
              ) : (
                <div className="text-3xl font-bold text-indigo-600">{adminTotal}</div>
              )}
              <p className="text-xs text-muted-foreground mt-1">لوحة تحكم SGH</p>
            </CardContent>
          </Card>
        </div>

        {/* App Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* By App Type */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Activity className="h-4 w-4" />
                توزيع التثبيتات حسب التطبيق
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2].map(i => (
                    <div key={i} className="h-12 bg-muted animate-pulse rounded" />
                  ))}
                </div>
              ) : totalInstalls === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Download className="h-8 w-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">لا توجد تثبيتات بعد</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Public App Bar */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">تطبيق الجمهور</span>
                      <Badge variant="secondary" className="bg-blue-100 text-blue-700">{publicTotal}</Badge>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2.5">
                      <div
                        className="bg-blue-500 h-2.5 rounded-full transition-all duration-500"
                        style={{ width: totalInstalls > 0 ? `${(publicTotal / totalInstalls) * 100}%` : '0%' }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {totalInstalls > 0 ? Math.round((publicTotal / totalInstalls) * 100) : 0}% من الإجمالي
                    </p>
                  </div>

                  {/* Admin App Bar */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">تطبيق الإدارة</span>
                      <Badge variant="secondary" className="bg-indigo-100 text-indigo-700">{adminTotal}</Badge>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2.5">
                      <div
                        className="bg-indigo-500 h-2.5 rounded-full transition-all duration-500"
                        style={{ width: totalInstalls > 0 ? `${(adminTotal / totalInstalls) * 100}%` : '0%' }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {totalInstalls > 0 ? Math.round((adminTotal / totalInstalls) * 100) : 0}% من الإجمالي
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* By Platform */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Smartphone className="h-4 w-4" />
                توزيع التثبيتات حسب المنصة
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-10 bg-muted animate-pulse rounded" />
                  ))}
                </div>
              ) : platformData.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Smartphone className="h-8 w-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">لا توجد بيانات منصة بعد</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {platformData.map((item: any) => (
                    <div key={item.platform} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Smartphone className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{item.platform || 'غير معروف'}</span>
                      </div>
                      <Badge variant="outline">{item.count}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent Installs */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="h-4 w-4" />
              آخر عمليات التثبيت
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="h-10 bg-muted animate-pulse rounded" />
                ))}
              </div>
        ) : !stats?.recentInstalls || stats.recentInstalls.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <TrendingUp className="h-8 w-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm">لا توجد عمليات تثبيت بعد</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-right py-2 px-3 font-medium text-muted-foreground">التطبيق</th>
                  <th className="text-right py-2 px-3 font-medium text-muted-foreground">المنصة</th>
                  <th className="text-right py-2 px-3 font-medium text-muted-foreground">التاريخ</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentInstalls.map((install: any) => (
                      <tr key={install.id} className="border-b last:border-0 hover:bg-muted/30">
                        <td className="py-2 px-3">
                          <Badge
                            variant="secondary"
                            className={install.appType === 'admin'
                              ? 'bg-indigo-100 text-indigo-700'
                              : 'bg-blue-100 text-blue-700'
                            }
                          >
                            {install.appType === 'admin' ? 'الإدارة' : 'الجمهور'}
                          </Badge>
                        </td>
                        <td className="py-2 px-3 text-muted-foreground">{install.platform || 'غير معروف'}</td>
                        <td className="py-2 px-3 text-muted-foreground">
                          {install.installedAt
                            ? new Date(install.installedAt).toLocaleDateString('ar-YE', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })
                            : '-'
                          }
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
