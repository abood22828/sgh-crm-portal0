import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Search, Gift, Calendar, ArrowLeft, CheckCircle2 } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import InstallPWAButton from "@/components/InstallPWAButton";

export default function OffersListPage() {
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");

  const { data: offers, isLoading } = trpc.offers.getAll.useQuery();

  // Separate active and expired offers based on endDate
  const now = new Date();
  const activeOffers = offers?.filter((offer: any) => {
    if (!offer.endDate) return true; // If no endDate, consider it active
    return new Date(offer.endDate) >= now;
  });
  const expiredOffers = offers?.filter((offer: any) => {
    if (!offer.endDate) return false; // If no endDate, it's not expired
    return new Date(offer.endDate) < now;
  });

  const filteredActiveOffers = activeOffers?.filter((offer: any) =>
    offer.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredExpiredOffers = expiredOffers?.filter((offer: any) =>
    offer.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const OfferCard = ({ offer, isExpired = false }: { offer: any; isExpired?: boolean }) => (
    <Card
      key={offer.id}
      className="group hover:shadow-2xl transition-all duration-300 cursor-pointer border-t-4 border-green-600 overflow-hidden"
      onClick={() => setLocation(`/offers/${offer.slug || offer.id}`)}
    >
      <CardContent className="p-0">
        {offer.imageUrl ? (
          <div className="relative h-64 overflow-hidden">
            <img
              src={offer.imageUrl}
              alt={offer.title}
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
                    <Gift className="h-4 w-4" />
                    عرض خاص
                  </>
                )}
              </div>
            </div>
            <div className="absolute bottom-4 right-4 left-4 text-white">
              <h3 className="text-2xl font-bold mb-1">{offer.title}</h3>
            </div>
          </div>
        ) : (
          <div className="relative h-64 bg-gradient-to-br from-green-600 to-blue-600 flex flex-col items-center justify-center text-white p-6">
            <div className="absolute top-4 right-4">
              <div className={`${isExpired ? 'bg-gray-500' : 'bg-red-500'} text-white px-4 py-2 rounded-full font-bold text-sm flex items-center gap-2`}>
                {isExpired ? (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    منتهي
                  </>
                ) : (
                  <>
                    <Gift className="h-4 w-4" />
                    عرض خاص
                  </>
                )}
              </div>
            </div>
            <Gift className="h-16 w-16 mb-4" />
            <h3 className="text-2xl font-bold text-center">{offer.title}</h3>
          </div>
        )}

        <div className="p-6">
          {offer.description && (
            <p className="text-gray-600 text-right line-clamp-3 mb-4">
              {offer.description}
            </p>
          )}

          {offer.startDate && offer.endDate && (
            <div className="flex items-center gap-2 text-gray-500 text-sm mb-4">
              <Calendar className="h-4 w-4" />
              <span>
                صالح حتى {new Date(offer.endDate).toLocaleDateString("ar-EG")}
              </span>
            </div>
          )}

          <Button
            className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white"
            onClick={(e) => {
              e.stopPropagation();
              setLocation(`/offers/${offer.slug || offer.id}`);
            }}
          >
            {isExpired ? "عرض التفاصيل" : "اطلب العرض"}
            <ArrowLeft className="mr-2 h-4 w-4 rotate-180" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50" dir="rtl">
      <Navbar />

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-green-600 to-blue-600 text-white py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <Gift className="h-16 w-16 mx-auto mb-6" />
            <h1 className="text-2xl sm:text-3xl md:text-5xl font-bold mb-4">
              عروضنا الطبية المميزة
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-white/90 px-4">
              استفد من عروضنا الخاصة على مختلف الخدمات الطبية بأسعار تنافسية
            </p>
          </div>
        </div>
      </section>

      {/* Search Section */}
      <section className="py-8 bg-white shadow-sm">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto relative">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              type="text"
              placeholder="ابحث عن عرض..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pr-12 py-6 text-lg text-right"
            />
          </div>
        </div>
      </section>

      {/* Offers Tabs */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          {isLoading ? (
            <div className="flex justify-center items-center min-h-[400px]">
              <Loader2 className="h-12 w-12 animate-spin text-green-600" />
            </div>
          ) : (
            <Tabs defaultValue="active" className="w-full" dir="rtl">
              <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-8">
                <TabsTrigger value="active" className="text-base">
                  العروض الجارية ({filteredActiveOffers?.length || 0})
                </TabsTrigger>
                <TabsTrigger value="expired" className="text-base">
                  العروض المنتهية ({filteredExpiredOffers?.length || 0})
                </TabsTrigger>
              </TabsList>

              {/* Active Offers */}
              <TabsContent value="active">
                {filteredActiveOffers && filteredActiveOffers.length > 0 ? (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {filteredActiveOffers.map((offer: any) => (
                      <OfferCard key={offer.id} offer={offer} isExpired={false} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-16">
                    <Gift className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                    <p className="text-xl text-gray-500">
                      {searchQuery
                        ? "لم يتم العثور على عروض جارية مطابقة للبحث"
                        : "لا توجد عروض جارية حالياً"}
                    </p>
                  </div>
                )}
              </TabsContent>

              {/* Expired Offers */}
              <TabsContent value="expired">
                {filteredExpiredOffers && filteredExpiredOffers.length > 0 ? (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {filteredExpiredOffers.map((offer: any) => (
                      <OfferCard key={offer.id} offer={offer} isExpired={true} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-16">
                    <CheckCircle2 className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                    <p className="text-xl text-gray-500">
                      {searchQuery
                        ? "لم يتم العثور على عروض منتهية مطابقة للبحث"
                        : "لا توجد عروض منتهية"}
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
