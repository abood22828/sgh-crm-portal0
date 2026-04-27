import { useFormatDate } from "@/hooks/useFormatDate";
import { useState } from "react";
import { useLocation } from "wouter";
import Navbar from "@/components/Navbar";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Loader2, Search, Heart, Calendar, ArrowLeft, Clock, CheckCircle2, Users } from "lucide-react";
import InstallPWAButton from "@/components/InstallPWAButton";

export default function CampsListPage() {
  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <Navbar />
      <CampsListContent />
    </div>
  );
}

function CampsListContent() {
  const { formatDate, formatDateTime } = useFormatDate();
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");

  const { data: camps, isLoading } = trpc.camps.getAll.useQuery();
  const { data: registrations } = trpc.campRegistrations.list.useQuery();

  // Separate active and expired camps based on endDate
  const now = new Date();
  const activeCamps = camps?.filter((camp: any) => {
    if (!camp.endDate) return true;
    return new Date(camp.endDate) >= now;
  });
  const expiredCamps = camps?.filter((camp: any) => {
    if (!camp.endDate) return false;
    return new Date(camp.endDate) < now;
  });

  const filteredActiveCamps = activeCamps?.filter((camp: any) =>
    camp.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredExpiredCamps = expiredCamps?.filter((camp: any) =>
    camp.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Calculate registration stats for each camp
  const getCampStats = (campId: number) => {
    const campRegistrations = registrations?.filter((r: any) => r.campId === campId) || [];
    const total = campRegistrations.length;
    const confirmed = campRegistrations.filter((r: any) => r.status === "confirmed" || r.status === "attended" || r.status === "completed").length;
    const attended = campRegistrations.filter((r: any) => r.status === "attended" || r.status === "completed").length;
    return { total, confirmed, attended };
  };

  const CampCard = ({ camp, isExpired = false }: { camp: any; isExpired?: boolean }) => {
    const stats = getCampStats(camp.id);
    
    return (
      <Card
        key={camp.id}
        className="group hover:shadow-2xl transition-all duration-300 cursor-pointer border-t-4 border-red-500 overflow-hidden"
        onClick={() => setLocation(`/camps/${camp.slug || camp.id}`)}
      >
        <CardContent className="p-0">
          {camp.imageUrl ? (
            <div className="relative h-44 sm:h-56 md:h-64 overflow-hidden">
              <img
                src={camp.imageUrl}
                alt={camp.name}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <div className="absolute top-2.5 sm:top-4 right-2.5 sm:right-4">
                <div className={`${isExpired ? 'bg-gray-500' : 'bg-red-500'} text-white px-2.5 sm:px-4 py-1 sm:py-2 rounded-full font-bold text-[10px] sm:text-sm flex items-center gap-1 sm:gap-2`}>
                  {isExpired ? (
                    <>
                      <CheckCircle2 className="h-3 w-3 sm:h-4 sm:w-4" />
                      منتهي
                    </>
                  ) : (
                    <>
                      <Heart className="h-3 w-3 sm:h-4 sm:w-4 fill-white" />
                      مخيم خيري
                    </>
                  )}
                </div>
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-5 md:p-6">
                <h3 className="text-base sm:text-xl md:text-2xl font-bold text-white mb-1 sm:mb-2 line-clamp-2">{camp.name}</h3>
              </div>
            </div>
          ) : (
            <div className="relative h-44 sm:h-56 md:h-64 bg-gradient-to-br from-green-500 to-blue-500 flex items-center justify-center">
              <div className="absolute top-2.5 sm:top-4 right-2.5 sm:right-4">
                <div className={`${isExpired ? 'bg-gray-500' : 'bg-red-500'} text-white px-2.5 sm:px-4 py-1 sm:py-2 rounded-full font-bold text-[10px] sm:text-sm flex items-center gap-1 sm:gap-2`}>
                  {isExpired ? (
                    <>
                      <CheckCircle2 className="h-3 w-3 sm:h-4 sm:w-4" />
                      منتهي
                    </>
                  ) : (
                    <>
                      <Heart className="h-3 w-3 sm:h-4 sm:w-4 fill-white" />
                      مخيم خيري
                    </>
                  )}
                </div>
              </div>
              <Heart className="h-16 w-16 sm:h-20 sm:w-20 md:h-24 md:w-24 text-white/30 fill-white/30" />
              <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-5 md:p-6">
                <h3 className="text-base sm:text-xl md:text-2xl font-bold text-white mb-1 sm:mb-2 line-clamp-2">{camp.name}</h3>
              </div>
            </div>
          )}

          <div className="p-3.5 sm:p-5 md:p-6">
            {camp.description && (
              <p className="text-muted-foreground mb-3 sm:mb-4 line-clamp-2 sm:line-clamp-3 text-right text-xs sm:text-sm md:text-base">
                {camp.description}
              </p>
            )}

            {/* Registration Stats */}
            {stats.total > 0 && (
              <div className="flex items-center gap-2 mb-3 sm:mb-4 flex-wrap">
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {stats.total} تسجيل
                </Badge>
                {stats.confirmed > 0 && (
                  <Badge variant="outline" className="flex items-center gap-1 border-green-500 text-green-600">
                    <CheckCircle2 className="h-3 w-3" />
                    {stats.confirmed} مؤكد
                  </Badge>
                )}
                {stats.attended > 0 && (
                  <Badge variant="outline" className="flex items-center gap-1 border-blue-500 text-blue-600">
                    <Clock className="h-3 w-3" />
                    {stats.attended} حضر
                  </Badge>
                )}
              </div>
            )}

            {(camp.startDate || camp.endDate) && (
              <div className="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs md:text-sm text-muted-foreground mb-3 sm:mb-4">
                <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span>
                  {camp.startDate && formatDate(camp.startDate)}
                  {camp.startDate && camp.endDate && ' - '}
                  {camp.endDate && formatDate(camp.endDate)}
                </span>
              </div>
            )}

            <Button 
              className={`w-full text-xs sm:text-sm md:text-base h-9 sm:h-10 md:h-11 ${isExpired ? 'bg-gray-600 hover:bg-gray-700' : 'bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700'}`}
              onClick={(e) => {
                e.stopPropagation();
                setLocation(`/camps/${camp.slug || camp.id}`);
              }}
            >
              {isExpired ? 'عرض التفاصيل' : 'سجّل الآن'}
              <ArrowLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6" dir="rtl">

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-green-600 to-blue-600 text-white py-8 sm:py-12 md:py-16">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="max-w-3xl mx-auto text-center">
            <Heart className="h-10 w-10 sm:h-14 sm:w-14 md:h-16 md:w-16 mx-auto mb-3 sm:mb-5 md:mb-6 fill-red-400 text-red-400" />
            <h1 className="text-lg sm:text-2xl md:text-4xl lg:text-5xl font-bold mb-2 sm:mb-3 md:mb-4">
              المخيمات الطبية الخيرية
            </h1>
            <p className="text-xs sm:text-sm md:text-lg lg:text-xl text-white/90 px-2">
              مبادراتنا الإنسانية في إطار المسؤولية المجتمعية لخدمة المحتاجين
            </p>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="py-6 sm:py-8 md:py-12 bg-white dark:bg-card">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-base sm:text-xl md:text-2xl lg:text-3xl font-bold text-foreground mb-3 sm:mb-4 md:mb-6">
              عن المخيمات الطبية الخيرية
            </h2>
            <p className="text-xs sm:text-sm md:text-base lg:text-lg text-foreground leading-relaxed text-right px-1">
              يأتي تنظيم المخيمات الطبية الخيرية ضمن مبادرات المستشفى السعودي الألماني
              في إطار المسؤولية المجتمعية، حيث نسعى لتقديم خدمات طبية عالية الجودة
              للمحتاجين والمستحقين بأسعار رمزية أو مجاناً. يشرف على المخيمات نخبة من
              أفضل الأطباء والجراحين المتخصصين، مع توفير أحدث الأجهزة والتقنيات الطبية.
            </p>
          </div>
        </div>
      </section>

      {/* Search Section */}
      <section className="py-4 sm:py-6 md:py-8 bg-muted/50">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="max-w-2xl mx-auto relative">
            <Search className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="ابحث عن مخيم..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pr-9 sm:pr-12 py-4 sm:py-5 md:py-6 text-sm sm:text-base md:text-lg text-right"
            />
          </div>
        </div>
      </section>

      {/* Camps Tabs */}
      <section className="py-6 sm:py-10 md:py-16">
        <div className="container mx-auto px-4 sm:px-6">
          {isLoading ? (
            <div className="flex justify-center items-center min-h-[300px] sm:min-h-[400px]">
              <Loader2 className="h-8 w-8 sm:h-12 sm:w-12 animate-spin text-green-600" />
            </div>
          ) : (
            <Tabs defaultValue="active" className="w-full" dir="rtl">
              <TabsList className="grid w-full max-w-sm sm:max-w-md mx-auto grid-cols-2 mb-5 sm:mb-8 h-9 sm:h-10">
                <TabsTrigger value="active" className="flex items-center gap-1 sm:gap-2 text-[10px] sm:text-xs md:text-sm">
                  <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span>الجارية ({filteredActiveCamps?.length || 0})</span>
                </TabsTrigger>
                <TabsTrigger value="expired" className="flex items-center gap-1 sm:gap-2 text-[10px] sm:text-xs md:text-sm">
                  <CheckCircle2 className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span>المنتهية ({filteredExpiredCamps?.length || 0})</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="active">
                {filteredActiveCamps && filteredActiveCamps.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
                    {filteredActiveCamps.map((camp: any) => (
                      <CampCard key={camp.id} camp={camp} isExpired={false} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-10 sm:py-16">
                    <Heart className="h-16 w-16 sm:h-24 sm:w-24 mx-auto text-gray-300 mb-3 sm:mb-4" />
                    <h3 className="text-base sm:text-xl md:text-2xl font-bold text-foreground mb-1 sm:mb-2">
                      لا توجد مخيمات جارية حالياً
                    </h3>
                    <p className="text-xs sm:text-sm md:text-base text-muted-foreground">
                      تابعنا للحصول على آخر التحديثات عن المخيمات القادمة
                    </p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="expired">
                {filteredExpiredCamps && filteredExpiredCamps.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
                    {filteredExpiredCamps.map((camp: any) => (
                      <CampCard key={camp.id} camp={camp} isExpired={true} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-10 sm:py-16">
                    <CheckCircle2 className="h-16 w-16 sm:h-24 sm:w-24 mx-auto text-gray-300 mb-3 sm:mb-4" />
                    <h3 className="text-base sm:text-xl md:text-2xl font-bold text-foreground mb-1 sm:mb-2">
                      لا توجد مخيمات منتهية
                    </h3>
                    <p className="text-xs sm:text-sm md:text-base text-muted-foreground">
                      سيتم عرض المخيمات المنتهية هنا
                    </p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          )}
        </div>
      </section>

      <InstallPWAButton />
    </div>
  );
}
