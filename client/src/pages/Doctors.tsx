import { useState } from "react";
import { useLocation } from "wouter";
import Navbar from "@/components/Navbar";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { Loader2, Search, Stethoscope, Calendar } from "lucide-react";
import { APP_LOGO } from "@/const";
import SEO from "@/components/SEO";
import InstallPWAButton from "@/components/InstallPWAButton";

export default function Doctors() {
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [specialtyFilter, setSpecialtyFilter] = useState<string>("all");

  // Fetch doctors list (only available doctors)
  const { data: doctors, isLoading } = trpc.doctors.list.useQuery();

  // Filter doctors based on search and specialty
  const filteredDoctors = doctors?.filter((doctor) => {
    // Only show available doctors
    if (doctor.available !== "yes") return false;

    // Search filter
    const matchesSearch =
      doctor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doctor.specialty.toLowerCase().includes(searchTerm.toLowerCase());

    // Specialty filter
    const matchesSpecialty =
      specialtyFilter === "all" || doctor.specialty === specialtyFilter;

    return matchesSearch && matchesSpecialty;
  });

  // Get unique specialties for filter
  const specialties = Array.from(
    new Set(doctors?.filter((d) => d.available === "yes").map((d) => d.specialty) || [])
  );

  return (
    <>
      <SEO
        title="أطباؤنا - المستشفى السعودي الألماني"
        description="تعرف على أطبائنا المتميزين في مختلف التخصصات. احجز موعدك الآن مع أفضل الأطباء في صنعاء."
        image={APP_LOGO}
      />
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50" dir="rtl">
        <Navbar />

        {/* Hero Section */}
        <section className="pt-10 sm:pt-24 pb-8 sm:pb-12 px-5 sm:px-6">
          <div className="container mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-700 px-4 py-2 rounded-full mb-6">
              <Stethoscope className="w-5 h-5" />
              <span className="text-sm font-medium">أطباء متخصصون</span>
            </div>
            <h1 className="text-xl sm:text-3xl md:text-5xl font-bold text-gray-900 dark:text-white mb-3 sm:mb-4">
              أطباؤنا المتميزون
            </h1>
            <p className="text-sm sm:text-lg md:text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              فريق طبي متكامل من أفضل الأطباء في مختلف التخصصات
            </p>
          </div>
        </section>

        {/* Search and Filter */}
        <section className="pb-6 sm:pb-8 px-5 sm:px-6">
          <div className="container mx-auto max-w-4xl">
            <Card>
              <CardContent className="pt-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="relative">
                    <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <Input
                      placeholder="ابحث عن طبيب أو تخصص..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pr-10 text-right"
                    />
                  </div>
                  <Select value={specialtyFilter} onValueChange={setSpecialtyFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="جميع التخصصات" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">جميع التخصصات</SelectItem>
                      {specialties.map((specialty) => (
                        <SelectItem key={specialty} value={specialty}>
                          {specialty}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Doctors Grid */}
        <section className="pb-12 sm:pb-16 px-5 sm:px-6">
          <div className="container mx-auto">
            {isLoading ? (
              <div className="flex justify-center items-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
              </div>
            ) : filteredDoctors && filteredDoctors.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
                {filteredDoctors.map((doctor) => (
                  <Card
                    key={doctor.id}
                    className="hover:shadow-lg transition-all cursor-pointer group"
                    onClick={() => setLocation(`/doctors/${doctor.slug}`)}
                  >
                    <CardHeader className="text-center pb-3">
                      <div className="mx-auto mb-3 relative">
                        {doctor.image ? (
                          <img
                            src={doctor.image}
                            alt={doctor.name}
                            className="w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 rounded-full object-cover border-2 sm:border-3 border-emerald-100 group-hover:border-emerald-200 transition-colors"
                          />
                        ) : (
                          <div className="w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 rounded-full bg-emerald-100 flex items-center justify-center border-2 sm:border-3 border-emerald-200">
                            <Stethoscope className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 text-emerald-600" />
                          </div>
                        )}
                      </div>
                      <CardTitle className="text-sm sm:text-base md:text-lg text-gray-900 group-hover:text-emerald-600 transition-colors line-clamp-2">
                        {doctor.name}
                      </CardTitle>
                      <CardDescription className="text-xs sm:text-sm line-clamp-1">
                        {doctor.specialty}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="text-center space-y-2 pt-3">
                      {doctor.experience && (
                        <p className="text-xs sm:text-sm text-gray-600 text-right line-clamp-1">
                          <span className="font-semibold">الخبرة:</span> {doctor.experience}
                        </p>
                      )}
                      {doctor.languages && (
                        <p className="text-xs sm:text-sm text-gray-600 text-right line-clamp-1">
                          <span className="font-semibold">اللغات:</span> {doctor.languages}
                        </p>
                      )}
                      {doctor.consultationFee && (
                        <p className="text-xs sm:text-sm text-emerald-600 font-semibold text-center">
                          رسوم الاستشارة: {doctor.consultationFee}
                        </p>
                      )}
                      <Button
                        size="sm"
                        className="w-full mt-2 bg-emerald-600 hover:bg-emerald-700 text-xs sm:text-sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setLocation(`/doctors/${doctor.slug}`);
                        }}
                      >
                        <Calendar className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                        احجز موعد
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-20">
                <Stethoscope className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-xl text-gray-500">لا توجد نتائج مطابقة للبحث</p>
                <p className="text-gray-400 mt-2">جرب تغيير معايير البحث</p>
              </div>
            )}
          </div>
        </section>
        <InstallPWAButton />
      </div>
    </>
  );
}
