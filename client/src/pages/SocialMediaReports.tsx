import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  TrendingUp, 
  Users, 
  Heart, 
  MessageCircle, 
  Eye, 
  Share2,
  Instagram,
  Facebook,
  ArrowRight,
  Loader2,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

/**
 * Social Media Reports Page
 * صفحة تقارير السوشيال ميديا - Instagram و Facebook
 */
export default function SocialMediaReports() {
  const { data: stats, isLoading, error, refetch } = trpc.socialMedia.getStats.useQuery();

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const handleRefresh = async () => {
    toast.info("جاري تحديث البيانات...");
    await refetch();
    toast.success("تم تحديث البيانات بنجاح!");
  };

  // Calculate totals
  const totalFollowers = (stats?.instagram?.followers_count || 0) + (stats?.facebook?.fan_count || 0);
  const totalEngagement = (stats?.instagram?.reach || 0) + (stats?.facebook?.page_engaged_users || 0);
  const totalReach = (stats?.instagram?.reach || 0) + (stats?.facebook?.page_impressions || 0);
  const avgEngagementRate = stats?.instagram && stats?.facebook
    ? ((stats.instagram.engagement + (stats.facebook.page_engaged_users / (stats.facebook.fan_count || 1) * 100)) / 2).toFixed(1)
    : "0.0";

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50" dir="rtl">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/admin">
              <Button variant="ghost" size="sm">
                ← العودة للوحة التحكم
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                تقارير السوشيال ميديا
              </h1>
              <p className="text-sm text-muted-foreground">تحليل أداء Instagram و Facebook</p>
            </div>
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleRefresh}
            disabled={isLoading}
          >
            <RefreshCw className={`w-4 h-4 ml-2 ${isLoading ? 'animate-spin' : ''}`} />
            تحديث البيانات
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Error State */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              حدث خطأ أثناء جلب البيانات. يرجى التحقق من إعدادات Meta API والمحاولة مرة أخرى.
            </AlertDescription>
          </Alert>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <span className="mr-3 text-muted-foreground">جاري تحميل البيانات...</span>
          </div>
        )}

        {/* No Data State */}
        {!isLoading && !stats?.instagram && !stats?.facebook && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              لم يتم تكوين Meta API بعد. يرجى إضافة META_ACCESS_TOKEN و INSTAGRAM_BUSINESS_ACCOUNT_ID و FACEBOOK_PAGE_ID في إعدادات البيئة.
            </AlertDescription>
          </Alert>
        )}

        {/* Data Display */}
        {!isLoading && (stats?.instagram || stats?.facebook) && (
          <>
            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-purple-100 text-sm mb-1">إجمالي المتابعين</p>
                      <p className="text-3xl font-bold">{formatNumber(totalFollowers)}</p>
                      <p className="text-purple-100 text-xs mt-1">Instagram + Facebook</p>
                    </div>
                    <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                      <Users className="w-6 h-6" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-pink-500 to-pink-600 text-white border-0">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-pink-100 text-sm mb-1">التفاعل</p>
                      <p className="text-3xl font-bold">{formatNumber(totalEngagement)}</p>
                      <p className="text-pink-100 text-xs mt-1">آخر 28 يوم</p>
                    </div>
                    <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                      <Heart className="w-6 h-6" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-100 text-sm mb-1">الوصول</p>
                      <p className="text-3xl font-bold">{formatNumber(totalReach)}</p>
                      <p className="text-blue-100 text-xs mt-1">آخر 28 يوم</p>
                    </div>
                    <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                      <Eye className="w-6 h-6" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-0">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-green-100 text-sm mb-1">معدل التفاعل</p>
                      <p className="text-3xl font-bold">{avgEngagementRate}%</p>
                      <p className="text-green-100 text-xs mt-1">متوسط المنصتين</p>
                    </div>
                    <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                      <TrendingUp className="w-6 h-6" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Instagram Section */}
            {stats?.instagram && (
              <Card className="border-2 border-purple-200 bg-gradient-to-br from-white to-purple-50/30">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                      <Instagram className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-2xl">Instagram</CardTitle>
                      <CardDescription>تحليل أداء حساب Instagram Business</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Instagram Stats */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white rounded-lg p-4 border">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm text-muted-foreground">المتابعين</p>
                        <Users className="w-4 h-4 text-purple-500" />
                      </div>
                      <p className="text-2xl font-bold">{formatNumber(stats.instagram.followers_count)}</p>
                      <p className="text-xs text-muted-foreground mt-1">{stats.instagram.media_count} منشور</p>
                    </div>

                    <div className="bg-white rounded-lg p-4 border">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm text-muted-foreground">الوصول</p>
                        <Eye className="w-4 h-4 text-blue-500" />
                      </div>
                      <p className="text-2xl font-bold">{formatNumber(stats.instagram.reach)}</p>
                      <p className="text-xs text-green-600 mt-1">آخر 28 يوم</p>
                    </div>

                    <div className="bg-white rounded-lg p-4 border">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm text-muted-foreground">مشاهدات البروفايل</p>
                        <Eye className="w-4 h-4 text-green-500" />
                      </div>
                      <p className="text-2xl font-bold">{formatNumber(stats.instagram.profile_views)}</p>
                      <p className="text-xs text-green-600 mt-1">آخر 28 يوم</p>
                    </div>
                  </div>

                  {/* Instagram Insights */}
                  <div className="bg-white rounded-lg p-6 border">
                    <h3 className="font-semibold mb-4 flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-purple-500" />
                      رؤى Instagram
                    </h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between py-2 border-b">
                        <span className="text-sm">معدل التفاعل</span>
                        <span className="font-semibold text-purple-600">{stats.instagram.engagement}%</span>
                      </div>
                      <div className="flex items-center justify-between py-2 border-b">
                        <span className="text-sm">الانطباعات</span>
                        <span className="font-semibold">{formatNumber(stats.instagram.impressions)}</span>
                      </div>
                      <div className="flex items-center justify-between py-2 border-b">
                        <span className="text-sm">عدد المنشورات</span>
                        <span className="font-semibold">{stats.instagram.media_count}</span>
                      </div>
                      <div className="flex items-center justify-between py-2">
                        <span className="text-sm">المتابعة</span>
                        <span className="font-semibold">{formatNumber(stats.instagram.follows_count)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Instagram Actions */}
                  <div className="flex gap-3">
                    <Button 
                      className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                      onClick={() => window.open('https://www.instagram.com/', '_blank')}
                    >
                      <Instagram className="w-4 h-4 ml-2" />
                      فتح Instagram
                    </Button>
                    <Button 
                      variant="outline"
                      className="flex-1"
                      onClick={() => window.open('https://business.facebook.com/latest/insights', '_blank')}
                    >
                      عرض التحليلات المفصلة
                      <ArrowRight className="w-4 h-4 mr-2" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Facebook Section */}
            {stats?.facebook && (
              <Card className="border-2 border-blue-200 bg-gradient-to-br from-white to-blue-50/30">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                      <Facebook className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-2xl">Facebook</CardTitle>
                      <CardDescription>تحليل أداء صفحة Facebook</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Facebook Stats */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white rounded-lg p-4 border">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm text-muted-foreground">متابعي الصفحة</p>
                        <Users className="w-4 h-4 text-blue-500" />
                      </div>
                      <p className="text-2xl font-bold">{formatNumber(stats.facebook.fan_count)}</p>
                      <p className="text-xs text-muted-foreground mt-1">إجمالي المعجبين</p>
                    </div>

                    <div className="bg-white rounded-lg p-4 border">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm text-muted-foreground">الانطباعات</p>
                        <Eye className="w-4 h-4 text-green-500" />
                      </div>
                      <p className="text-2xl font-bold">{formatNumber(stats.facebook.page_impressions)}</p>
                      <p className="text-xs text-green-600 mt-1">آخر 28 يوم</p>
                    </div>

                    <div className="bg-white rounded-lg p-4 border">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm text-muted-foreground">التفاعل</p>
                        <Heart className="w-4 h-4 text-pink-500" />
                      </div>
                      <p className="text-2xl font-bold">{formatNumber(stats.facebook.page_post_engagements)}</p>
                      <p className="text-xs text-green-600 mt-1">آخر 28 يوم</p>
                    </div>
                  </div>

                  {/* Facebook Insights */}
                  <div className="bg-white rounded-lg p-6 border">
                    <h3 className="font-semibold mb-4 flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-blue-500" />
                      رؤى Facebook
                    </h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between py-2 border-b">
                        <span className="text-sm">معدل التفاعل</span>
                        <span className="font-semibold text-blue-600">
                          {((stats.facebook.page_engaged_users / (stats.facebook.fan_count || 1)) * 100).toFixed(1)}%
                        </span>
                      </div>
                      <div className="flex items-center justify-between py-2 border-b">
                        <span className="text-sm">مشاهدات الصفحة</span>
                        <span className="font-semibold">{formatNumber(stats.facebook.page_views_total)}</span>
                      </div>
                      <div className="flex items-center justify-between py-2 border-b">
                        <span className="text-sm">المستخدمون المتفاعلون</span>
                        <span className="font-semibold">{formatNumber(stats.facebook.page_engaged_users)}</span>
                      </div>
                      <div className="flex items-center justify-between py-2">
                        <span className="text-sm">الوصول العضوي</span>
                        <span className="font-semibold">{formatNumber(stats.facebook.page_impressions_organic)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Facebook Actions */}
                  <div className="flex gap-3">
                    <Button 
                      className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
                      onClick={() => window.open('https://www.facebook.com/', '_blank')}
                    >
                      <Facebook className="w-4 h-4 ml-2" />
                      فتح Facebook
                    </Button>
                    <Button 
                      variant="outline"
                      className="flex-1"
                      onClick={() => window.open('https://business.facebook.com/latest/insights', '_blank')}
                    >
                      عرض التحليلات المفصلة
                      <ArrowRight className="w-4 h-4 mr-2" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Combined Insights */}
            <Card>
              <CardHeader>
                <CardTitle>رؤى مجمعة</CardTitle>
                <CardDescription>مقارنة الأداء بين Instagram و Facebook</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-6">
                    <h4 className="font-semibold mb-3">📊 ملخص الأداء</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground mb-2">
                          • Instagram: {formatNumber(stats?.instagram?.followers_count || 0)} متابع
                        </p>
                        <p className="text-muted-foreground mb-2">
                          • Facebook: {formatNumber(stats?.facebook?.fan_count || 0)} معجب
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground mb-2">
                          • إجمالي الوصول: {formatNumber(totalReach)}
                        </p>
                        <p className="text-muted-foreground mb-2">
                          • متوسط التفاعل: {avgEngagementRate}%
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-6">
                    <h4 className="font-semibold mb-3">💡 توصيات</h4>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li>• زيادة المحتوى المرئي (صور وفيديوهات) لزيادة التفاعل</li>
                      <li>• التركيز على نشر العروض الطبية في أوقات الذروة</li>
                      <li>• استخدام Instagram Stories بشكل أكبر للتفاعل المباشر</li>
                      <li>• إنشاء حملات إعلانية مستهدفة على Facebook للوصول الأوسع</li>
                    </ul>
                  </div>

                  {stats?.timestamp && (
                    <div className="text-center text-xs text-muted-foreground">
                      آخر تحديث: {new Date(stats.timestamp).toLocaleString('ar-SA')}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </main>
    </div>
  );
}
