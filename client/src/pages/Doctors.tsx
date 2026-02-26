import { useState } from "react";
import { useLocation } from "wouter";
import DashboardLayout from "@/components/DashboardLayout";
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
import { Loader2, Search, Stethoscope, Calendar, User } from "lucide-react";
import { APP_LOGO } from "@/const";
import SEO from "@/components/SEO";
import InstallPWAButton from "@/components/InstallPWAButton";

export default function Doctors() {
  return (
    <DashboardLayout pageTitle="الأطباء" pageDescription="قائمة جميع الأطباء المتاحين">
      <DoctorsContent />
    </DashboardLayout>
  );
}

function DoctorsContent() {
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
    <div className="space-y-6" dir="rtl">

        {/* Hero Section */}
        <section className="pt-6 sm:pt-10 md:pt-24 pb-4 sm:pb-8 md:pb-12 px-4 sm:px-5 md:px-6">
          <div className="container mx-auto text-center">
            <div className="inline-flex items-center gap-1.5 sm:gap-2 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full mb-3 sm:mb-6">
              <Stethoscope className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="text-xs sm:text-sm font-medium">أطباء متخصصون</span>
            </div>
            <h1 className="text-lg sm:text-2xl md:text-4xl lg:text-5xl font-bold text-foreground dark:text-white mb-2 sm:mb-3 md:mb-4">
              أطباؤنا المتميزون
            </h1>
            <p className="text-xs sm:text-sm md:text-lg lg:text-xl text-muted-foreground dark:text-muted-foreground max-w-2xl mx-auto px-2">
              فريق طبي متكامل من أفضل الأطباء في مختلف التخصصات
            </p>
          </div>
        </section>

        {/* Search and Filter */}
        <section className="pb-4 sm:pb-6 md:pb-8 px-4 sm:px-5 md:px-6">
          <div className="container mx-auto max-w-4xl">
            <Card className="dark:bg-gray-800/50 dark:border-gray-700/50">
              <CardContent className="pt-4 sm:pt-6 px-3 sm:px-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3 md:gap-4">
                  <div className="relative">
                    <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4 sm:w-5 sm:h-5" />
                    <Input
                      placeholder="ابحث عن طبيب أو تخصص..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pr-9 sm:pr-10 text-right text-xs sm:text-sm h-9 sm:h-10"
                    />
                  </div>
                  <Select value={specialtyFilter} onValueChange={setSpecialtyFilter}>
                    <SelectTrigger className="text-xs sm:text-sm h-9 sm:h-10">
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
        <section className="pb-8 sm:pb-12 md:pb-16 px-4 sm:px-5 md:px-6">
          <div className="container mx-auto">
            {isLoading ? (
              <div className="flex justify-center items-center py-16 sm:py-20">
                <Loader2 className="w-6 h-6 sm:w-8 sm:h-8 animate-spin text-emerald-600" />
              </div>
            ) : filteredDoctors && filteredDoctors.length > 0 ? (
              <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 md:gap-5">
                {filteredDoctors.map((doctor) => (
                  <Card
                    key={doctor.id}
                    className="hover:shadow-lg transition-all cursor-pointer group dark:bg-gray-800/50 dark:border-gray-700/50 dark:hover:border-emerald-600/50 overflow-hidden"
                    onClick={() => setLocation(`/doctors/${doctor.slug}`)}
                  >
                    {/* Mobile: Horizontal layout | Desktop: Vertical layout */}
                    <div className="flex flex-row sm:flex-col">
                      {/* Image */}
                      <div className="flex items-center justify-center p-2.5 sm:p-0 sm:pt-5">
                        {doctor.image ? (
                          <img
                            src={doctor.image}
                            alt={doctor.name}
                            className="w-16 h-16 sm:w-24 sm:h-24 md:w-28 md:h-28 lg:w-32 lg:h-32 rounded-full object-cover border-2 border-emerald-100 dark:border-emerald-800 group-hover:border-emerald-300 dark:group-hover:border-emerald-600 transition-colors shrink-0"
                          />
                        ) : (
                          <div className="w-16 h-16 sm:w-24 sm:h-24 md:w-28 md:h-28 lg:w-32 lg:h-32 rounded-full bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900/40 dark:to-teal-900/40 flex items-center justify-center border-2 border-emerald-200 dark:border-emerald-800 shrink-0">
                            <User className="w-6 h-6 sm:w-10 sm:h-10 md:w-12 md:h-12 lg:w-14 lg:h-14 text-emerald-500 dark:text-emerald-400" />
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 p-2.5 sm:p-3 md:p-4 sm:text-center">
                        <h3 className="text-xs sm:text-sm md:text-base lg:text-lg font-bold text-foreground dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors line-clamp-2 mb-0.5 sm:mb-1">
                          {doctor.name}
                        </h3>
                        <p className="text-[10px] sm:text-xs md:text-sm text-emerald-600 dark:text-emerald-400 font-medium mb-1.5 sm:mb-2 line-clamp-1">
                          {doctor.specialty}
                        </p>
                        
                        {doctor.experience && (
                          <p className="text-[10px] sm:text-xs text-muted-foreground dark:text-muted-foreground mb-0.5 sm:mb-1 line-clamp-1">
                            <span className="font-semibold">الخبرة:</span> {doctor.experience}
                          </p>
                        )}
                        {doctor.consultationFee && (
                          <p className="text-[10px] sm:text-xs text-muted-foreground dark:text-muted-foreground mb-1.5 sm:mb-2">
                            <span className="font-semibold">رسوم الاستشارة:</span> {doctor.consultationFee}
                          </p>
                        )}
                        
                        <Button
                          size="sm"
                          className="w-full mt-0.5 sm:mt-1 bg-emerald-600 hover:bg-emerald-700 text-[10px] sm:text-xs md:text-sm h-7 sm:h-8 md:h-9"
                          onClick={(e) => {
                            e.stopPropagation();
                            setLocation(`/doctors/${doctor.slug}`);
                          }}
                        >
                          <Calendar className="w-3 h-3 sm:w-3.5 sm:h-3.5 ml-1 sm:ml-1.5" />
                          احجز موعد
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 sm:py-20">
                <Stethoscope className="w-12 h-12 sm:w-16 sm:h-16 text-gray-300 dark:text-muted-foreground mx-auto mb-3 sm:mb-4" />
                <p className="text-base sm:text-xl text-muted-foreground dark:text-muted-foreground">لا توجد نتائج مطابقة للبحث</p>
                <p className="text-xs sm:text-base text-muted-foreground dark:text-muted-foreground mt-1 sm:mt-2">جرب تغيير معايير البحث</p>
              </div>
            )}
          </div>
        </section>
        <InstallPWAButton />
    </div>
  );
}
