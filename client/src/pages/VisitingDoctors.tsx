/**
 * VisitingDoctors - صفحة الأطباء الزائرين
 * 
 * Displays visiting doctors (isVisiting = 'yes') with search and filtering
 */
import { useState, useMemo } from "react";
import { Link } from "wouter";
import { Search, Stethoscope, Calendar, Award, Loader2, Users, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import { trpc } from "@/lib/trpc";

export default function VisitingDoctors() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>("all");

  const { data: allDoctors, isLoading } = trpc.doctors.list.useQuery();

  // Filter only visiting doctors who are available
  const visitingDoctors = useMemo(() => {
    if (!allDoctors) return [];
    return allDoctors.filter(
      (doctor: any) => doctor.isVisiting === "yes" && doctor.available === "yes"
    );
  }, [allDoctors]);

  // Get unique specialties from visiting doctors
  const specialties = useMemo(() => {
    if (!visitingDoctors) return [];
    const uniqueSpecialties = Array.from(
      new Set(visitingDoctors.map((doc: any) => doc.specialty))
    );
    return uniqueSpecialties;
  }, [visitingDoctors]);

  // Filter doctors based on search and specialty
  const filteredDoctors = useMemo(() => {
    let filtered = visitingDoctors;

    // Filter by specialty
    if (selectedSpecialty !== "all") {
      filtered = filtered.filter((doc: any) => doc.specialty === selectedSpecialty);
    }

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (doc: any) =>
          doc.name.toLowerCase().includes(term) ||
          doc.specialty.toLowerCase().includes(term) ||
          (doc.bio && doc.bio.toLowerCase().includes(term))
      );
    }

    return filtered;
  }, [visitingDoctors, selectedSpecialty, searchTerm]);

  return (
    <>
      <SEO
        title="الأطباء الزائرين | المستشفى السعودي الألماني"
        description="تعرف على الأطباء الزائرين في المستشفى السعودي الألماني - صنعاء. استشاريون متخصصون من مختلف التخصصات الطبية. احجز موعدك الآن: 8000018"
        keywords="أطباء زائرين, استشاريين, تخصصات طبية, المستشفى السعودي الألماني, صنعاء"
      />
      <div className="min-h-screen flex flex-col bg-gradient-to-b from-green-50 to-white">
        <Navbar />

        {/* Hero Section */}
        <section className="py-12 bg-gradient-to-r from-green-600 to-blue-600 text-white">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <div className="flex justify-center mb-4">
                <div className="bg-white/20 p-4 rounded-full">
                  <Users className="h-12 w-12" />
                </div>
              </div>
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                الأطباء الزائرين
              </h1>
              <p className="text-lg md:text-xl text-green-100">
                استشاريون متخصصون من مختلف التخصصات الطبية لخدمتكم
              </p>
              <div className="mt-6 flex items-center justify-center gap-2 text-green-100">
                <Phone className="h-5 w-5" />
                <span className="text-lg">للحجز والاستفسار: </span>
                <a
                  href="tel:8000018"
                  className="text-2xl font-bold hover:text-white transition-colors"
                >
                  8000018
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Search and Filter Section */}
        <section className="py-8 bg-white border-b">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <Input
                    type="text"
                    placeholder="ابحث عن طبيب أو تخصص..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pr-10 h-12 text-lg"
                  />
                </div>

                {/* Specialty Filter */}
                <div className="relative">
                  <Stethoscope className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <select
                    value={selectedSpecialty}
                    onChange={(e) => setSelectedSpecialty(e.target.value)}
                    className="w-full h-12 pr-10 pl-4 text-lg border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
                  >
                    <option value="all">جميع التخصصات</option>
                    {specialties.map((specialty: string) => (
                      <option key={specialty} value={specialty}>
                        {specialty}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Results Count */}
              <div className="mt-4 text-center text-gray-600">
                <span className="font-semibold">{filteredDoctors.length}</span> طبيب زائر متاح
              </div>
            </div>
          </div>
        </section>

        {/* Doctors Grid */}
        <section className="py-12 flex-1">
          <div className="container mx-auto px-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-12 w-12 animate-spin text-green-600" />
              </div>
            ) : filteredDoctors.length === 0 ? (
              <div className="text-center py-20">
                <Stethoscope className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-gray-700 mb-2">
                  {searchTerm || selectedSpecialty !== "all"
                    ? "لا توجد نتائج للبحث"
                    : "لا يوجد أطباء زائرين حالياً"}
                </h3>
                <p className="text-gray-600 mb-6">
                  {searchTerm || selectedSpecialty !== "all"
                    ? "جرب البحث بكلمات مختلفة أو اختر تخصص آخر"
                    : "سيتم إضافة الأطباء الزائرين قريباً"}
                </p>
                <Link href="/doctors">
                  <Button className="bg-green-600 hover:bg-green-700">
                    عرض جميع الأطباء
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredDoctors.map((doctor: any) => (
                  <Link key={doctor.id} href={`/doctors/${doctor.slug}`}>
                    <Card className="h-full hover:shadow-xl transition-all duration-300 cursor-pointer border-2 border-transparent hover:border-green-500 group">
                      <CardHeader className="pb-4">
                        <div className="flex items-start gap-4">
                          <div className="relative flex-shrink-0">
                            <div className="w-20 h-20 rounded-full overflow-hidden border-3 border-green-500 shadow-lg">
                              <img
                                src={doctor.image || "/images/default-doctor.jpg"}
                                alt={doctor.name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="absolute -bottom-1 -right-1 bg-blue-600 text-white rounded-full p-1.5 shadow-lg">
                              <Award className="h-4 w-4" />
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <CardTitle className="text-xl font-bold text-green-900 group-hover:text-green-600 transition-colors mb-1 line-clamp-2">
                              {doctor.name}
                            </CardTitle>
                            <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-200">
                              {doctor.specialty}
                            </Badge>
                            <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-200 mr-2">
                              طبيب زائر
                            </Badge>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {doctor.bio && (
                          <p className="text-gray-600 text-sm line-clamp-3">
                            {doctor.bio}
                          </p>
                        )}

                        <div className="flex flex-wrap gap-2 pt-2">
                          {doctor.experience && (
                            <div className="flex items-center gap-1 text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
                              <Award className="h-4 w-4 text-blue-600" />
                              <span>{doctor.experience}</span>
                            </div>
                          )}
                          {doctor.consultationFee && (
                            <div className="flex items-center gap-1 text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
                              <Calendar className="h-4 w-4 text-green-600" />
                              <span>{doctor.consultationFee} ريال</span>
                            </div>
                          )}
                        </div>

                        <Button className="w-full bg-green-600 hover:bg-green-700 mt-4 group-hover:shadow-lg transition-all">
                          <Calendar className="ml-2 h-4 w-4" />
                          احجز موعد
                        </Button>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>

        <Footer />
      </div>
    </>
  );
}
