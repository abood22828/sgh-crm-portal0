/**
 * Doctors List Page - صفحة قائمة الأطباء
 * 
 * Displays all doctors with search and filtering capabilities.
 * Features: Search by name/specialty, filter by specialty, responsive grid layout
 * 
 * @component
 * @returns {JSX.Element} The doctors list page
 */
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { trpc } from '@/lib/trpc/client';

/**
 * DoctorsPage Component
 * 
 * Displays:
 * - Search bar for doctor names and specialties
 * - Filter by specialty
 * - Grid of doctor cards with images
 * - Direct links to individual doctor pages
 */
export default function DoctorsPage() {
  const [doctors, setDoctors] = useState<any[]>([]);
  const [filteredDoctors, setFilteredDoctors] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>('all');
  const [specialties, setSpecialties] = useState<string[]>([]);

  // Fetch doctors from tRPC
  const { data: doctorsData } = trpc.doctors.getAll.useQuery();

  useEffect(() => {
    if (doctorsData) {
      setDoctors(doctorsData);
      
      // Extract unique specialties
      const uniqueSpecialties = Array.from(
        new Set(doctorsData.map((doc: any) => doc.specialty))
      ) as string[];
      setSpecialties(uniqueSpecialties.sort());
      
      filterDoctors(doctorsData, searchTerm, 'all');
    }
  }, [doctorsData]);

  /**
   * Filter doctors based on search term and specialty
   */
  const filterDoctors = (data: any[], search: string, specialty: string) => {
    let filtered = data;

    // Filter by specialty
    if (specialty !== 'all') {
      filtered = filtered.filter((doc) => doc.specialty === specialty);
    }

    // Filter by search term
    if (search) {
      filtered = filtered.filter(
        (doc) =>
          doc.name.toLowerCase().includes(search.toLowerCase()) ||
          doc.specialty.toLowerCase().includes(search.toLowerCase())
      );
    }

    setFilteredDoctors(filtered);
  };

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    filterDoctors(doctors, value, selectedSpecialty);
  };

  const handleSpecialtyFilter = (value: string) => {
    setSelectedSpecialty(value);
    filterDoctors(doctors, searchTerm, value);
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Page Header */}
      <section className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-12">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl font-bold mb-4">فريق الأطباء المتخصصين</h1>
          <p className="text-xl text-blue-100">
            اختر من بين أفضل الأطباء المتخصصين في المستشفى السعودي الألماني بصنعاء
          </p>
        </div>
      </section>

      {/* Search and Filter Section */}
      <section className="container mx-auto px-4 py-12">
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>البحث والتصفية</CardTitle>
            <CardDescription>ابحث عن الطبيب أو التخصص الذي تريده</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Search Input */}
              <div>
                <label className="block text-sm font-medium mb-2">البحث</label>
                <Input
                  type="text"
                  placeholder="ابحث بالاسم أو التخصص..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="w-full"
                />
              </div>

              {/* Specialty Filter */}
              <div>
                <label className="block text-sm font-medium mb-2">التخصص</label>
                <select
                  value={selectedSpecialty}
                  onChange={(e) => handleSpecialtyFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="all">جميع التخصصات ({doctors.length})</option>
                  {specialties.map((specialty) => (
                    <option key={specialty} value={specialty}>
                      {specialty} ({doctors.filter((d) => d.specialty === specialty).length})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results Count */}
        <div className="mb-6">
          <p className="text-lg text-gray-700">
            عرض <span className="font-bold text-blue-600">{filteredDoctors.length}</span> من{' '}
            <span className="font-bold text-blue-600">{doctors.length}</span> طبيب
          </p>
        </div>

        {/* Doctors Grid */}
        {filteredDoctors.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDoctors.map((doctor: any) => (
              <Link key={doctor.id} href={`/doctors/${doctor.slug}`}>
                <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer overflow-hidden">
                  {/* Doctor Image */}
                  <div className="relative w-full h-64 bg-gray-200">
                    {doctor.image ? (
                      <Image
                        src={doctor.image}
                        alt={doctor.name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-100 to-blue-200">
                        <span className="text-blue-400 text-sm">صورة غير متاحة</span>
                      </div>
                    )}
                  </div>

                  {/* Doctor Info */}
                  <CardContent className="pt-6">
                    <h3 className="text-xl font-bold text-blue-900 mb-2">{doctor.name}</h3>
                    <p className="text-sm text-gray-600 mb-4">{doctor.specialty}</p>
                    
                    {/* Doctor Details */}
                    {doctor.bio && (
                      <p className="text-sm text-gray-600 mb-4 line-clamp-2">{doctor.bio}</p>
                    )}

                    {/* Rating (if available) */}
                    {doctor.rating && (
                      <div className="flex items-center gap-1 mb-4">
                        <span className="text-yellow-400">★</span>
                        <span className="text-sm font-semibold">{doctor.rating}/5</span>
                      </div>
                    )}

                    {/* CTA Button */}
                    <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                      حجز موعد
                    </Button>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <Card className="text-center py-12">
            <CardContent>
              <p className="text-gray-500 text-lg">لم يتم العثور على أطباء مطابقين للبحث</p>
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm('');
                  setSelectedSpecialty('all');
                  filterDoctors(doctors, '', 'all');
                }}
                className="mt-4"
              >
                إعادة تعيين البحث
              </Button>
            </CardContent>
          </Card>
        )}
      </section>

      {/* CTA Section */}
      <section className="bg-blue-50 py-12 mt-12">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-blue-900 mb-4">لم تجد الطبيب المناسب؟</h2>
          <p className="text-gray-600 mb-6">
            اتصل بنا مباشرة أو زر عيادتنا للحصول على استشارة مجانية
          </p>
          <div className="flex gap-4 justify-center">
            <a href="tel:+967713133333">
              <Button className="bg-green-600 hover:bg-green-700">
                📞 اتصل بنا
              </Button>
            </a>
            <a href="https://wa.me/967713133333">
              <Button className="bg-green-500 hover:bg-green-600">
                💬 واتساب
              </Button>
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
