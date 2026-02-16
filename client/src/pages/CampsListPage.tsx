import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Search, Heart, Calendar, ArrowLeft, Clock, CheckCircle2 } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import InstallPWAButton from "@/components/InstallPWAButton";
import SEO from "@/components/SEO";

export default function CampsListPage() {
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");

  const { data: camps, isLoading } = trpc.camps.getAll.useQuery();

  // Separate active and expired camps based on endDate
  const now = new Date();
  const activeCamps = camps?.filter((camp: any) => {
    if (!camp.endDate) return true; // If no endDate, consider it active
    return new Date(camp.endDate) >= now;
  });
  const expiredCamps = camps?.filter((camp: any) => {
    if (!camp.endDate) return false; // If no endDate, it's not expired
    return new Date(camp.endDate) < now;
  });

  const filteredActiveCamps = activeCamps?.filter((camp: any) =>
    camp.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredExpiredCamps = expiredCamps?.filter((camp: any) =>
    camp.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const CampCard = ({ camp, isExpired = false }: { camp: any; isExpired?: boolean }) => (
    <Card
      key={camp.id}
      className="group hover:shadow-2xl transition-all duration-300 cursor-pointer border-t-4 border-red-500 overflow-hidden"
      onClick={() => setLocation(`/camps/${camp.slug || camp.id}`)}
    >
      <CardContent className="p-0">
        {camp.imageUrl ? (
          <div className="relative h-64 overflow-hidden">
            <img
              src={camp.imageUrl}
              alt={camp.name}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            <div className="absolute top-4 right-4">
              <div className={`${isExpired ? 'bg-gray-500' : 'bg-red-500'} text-white px-4 py-2 rounded-full font-bold text-sm flex items-center gap-2`}>
                {isExpired ? (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    منتهي
                  </>
                ) : (
                  <>
                    <Heart className="h-4 w-4 fill-white" />
                    مخيم خيري
                  </>
                )}
              </div>
            </div>
            <div className="absolute bottom-0 left-0 right-0 p-6">
              <h3 className="text-2xl font-bold text-white mb-2">{camp.name}</h3>
            </div>
          </div>
        ) : (
          <div className="relative h-64 bg-gradient-to-br from-green-500 to-blue-500 flex items-center justify-center">
            <div className="absolute top-4 right-4">
              <div className={`${isExpired ? 'bg-gray-500' : 'bg-red-500'} text-white px-4 py-2 rounded-full font-bold text-sm flex items-center gap-2`}>
                {isExpired ? (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    منتهي
                  </>
                ) : (
                  <>
                    <Heart className="h-4 w-4 fill-white" />
                    مخيم خيري
                  </>
                )}
              </div>
            </div>
            <Heart className="h-24 w-24 text-white/30 fill-white/30" />
            <div className="absolute bottom-0 left-0 right-0 p-6">
              <h3 className="text-2xl font-bold text-white mb-2">{camp.name}</h3>
            </div>
          </div>
        )}

        <div className="p-6">
          {camp.description && (
            <p className="text-gray-600 mb-4 line-clamp-3 text-right">
              {camp.description}
            </p>
          )}

          {(camp.startDate || camp.endDate) && (
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
              <Calendar className="h-4 w-4" />
              <span>
                {camp.startDate && new Date(camp.startDate).toLocaleDateString('ar-YE')}
                {camp.startDate && camp.endDate && ' - '}
                {camp.endDate && new Date(camp.endDate).toLocaleDateString('ar-YE')}
              </span>
            </div>
          )}

          <Button 
            className={`w-full ${isExpired ? 'bg-gray-600 hover:bg-gray-700' : 'bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700'}`}
            onClick={(e) => {
              e.stopPropagation();
              setLocation(`/camps/${camp.slug || camp.id}`);
            }}
          >
            {isExpired ? 'عرض التفاصيل' : 'سجّل الآن'}
            <ArrowLeft className="h-4 w-4 mr-2" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50" dir="rtl">
      <SEO 
        title="المخيمات الطبية الخيرية | المستشفى السعودي الألماني"
        description="مبادراتنا الإنسانية في إطار المسؤولية المجتمعية لخدمة المحتاجين. مخيمات طبية مجانية بإشراف أفضل الأطباء والجراحين المتخصصين"
        keywords="مخيمات طبية, مخيمات خيرية, خدمات مجانية, صنعاء, المستشفى السعودي الألماني"
      />
      <Navbar />

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-green-600 to-blue-600 text-white py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <Heart className="h-16 w-16 mx-auto mb-6 fill-red-400 text-red-400" />
            <h1 className="text-2xl sm:text-3xl md:text-5xl font-bold mb-4">
              المخيمات الطبية الخيرية
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-white/90 px-4">
              مبادراتنا الإنسانية في إطار المسؤولية المجتمعية لخدمة المحتاجين
            </p>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="py-12 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6">
              عن المخيمات الطبية الخيرية
            </h2>
            <p className="text-base sm:text-lg text-gray-700 leading-relaxed text-right">
              يأتي تنظيم المخيمات الطبية الخيرية ضمن مبادرات المستشفى السعودي الألماني
              في إطار المسؤولية المجتمعية، حيث نسعى لتقديم خدمات طبية عالية الجودة
              للمحتاجين والمستحقين بأسعار رمزية أو مجاناً. يشرف على المخيمات نخبة من
              أفضل الأطباء والجراحين المتخصصين، مع توفير أحدث الأجهزة والتقنيات الطبية.
            </p>
          </div>
        </div>
      </section>

      {/* Search Section */}
      <section className="py-8 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto relative">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              type="text"
              placeholder="ابحث عن مخيم..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pr-12 py-6 text-lg text-right"
            />
          </div>
        </div>
      </section>

      {/* Camps Tabs */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          {isLoading ? (
            <div className="flex justify-center items-center min-h-[400px]">
              <Loader2 className="h-12 w-12 animate-spin text-green-600" />
            </div>
          ) : (
            <Tabs defaultValue="active" className="w-full" dir="rtl">
              <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-8">
                <TabsTrigger value="active" className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  المخيمات الجارية ({filteredActiveCamps?.length || 0})
                </TabsTrigger>
                <TabsTrigger value="expired" className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  المخيمات المنتهية ({filteredExpiredCamps?.length || 0})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="active">
                {filteredActiveCamps && filteredActiveCamps.length > 0 ? (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {filteredActiveCamps.map((camp: any) => (
                      <CampCard key={camp.id} camp={camp} isExpired={false} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-16">
                    <Heart className="h-24 w-24 mx-auto text-gray-300 mb-4" />
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">
                      لا توجد مخيمات جارية حالياً
                    </h3>
                    <p className="text-gray-600">
                      تابعنا للحصول على آخر التحديثات عن المخيمات القادمة
                    </p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="expired">
                {filteredExpiredCamps && filteredExpiredCamps.length > 0 ? (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {filteredExpiredCamps.map((camp: any) => (
                      <CampCard key={camp.id} camp={camp} isExpired={true} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-16">
                    <CheckCircle2 className="h-24 w-24 mx-auto text-gray-300 mb-4" />
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">
                      لا توجد مخيمات منتهية
                    </h3>
                    <p className="text-gray-600">
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
      <Footer />
    </div>
  );
}
