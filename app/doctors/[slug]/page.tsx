/**
 * Individual Doctor Landing Page - صفحة الطبيب الفردية
 * 
 * Displays detailed information about a specific doctor with appointment booking form.
 * Features: Doctor bio, specialties, appointment booking, Meta Pixel integration
 * 
 * @component
 * @param {Object} params - Route parameters
 * @param {string} params.slug - Doctor slug
 * @returns {JSX.Element} The doctor landing page
 */
'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { trpc } from '@/lib/trpc/client';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

/**
 * Appointment booking form validation schema
 */
const appointmentSchema = z.object({
  fullName: z.string().min(3, 'الاسم يجب أن يكون 3 أحرف على الأقل'),
  phone: z.string().regex(/^[0-9+\-\s()]+$/, 'رقم الهاتف غير صحيح'),
  email: z.string().email('البريد الإلكتروني غير صحيح'),
  preferredDate: z.string().min(1, 'اختر تاريخ مفضل'),
  notes: z.string().optional(),
});

type AppointmentFormData = z.infer<typeof appointmentSchema>;

/**
 * DoctorPage Component
 * 
 * Displays:
 * - Doctor profile information
 * - Doctor image
 * - Specialties and experience
 * - Appointment booking form
 * - Meta Pixel tracking
 */
export default function DoctorPage({ params }: { params: { slug: string } }) {
  const [doctor, setDoctor] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [bookingSubmitted, setBookingSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<AppointmentFormData>({
    resolver: zodResolver(appointmentSchema),
  });

  // Fetch doctor by slug
  const { data: doctorData } = trpc.doctors.getBySlug.useQuery(params.slug);

  // Create appointment mutation
  const createAppointmentMutation = trpc.appointments.create.useMutation({
    onSuccess: () => {
      toast.success('تم حجز الموعد بنجاح! سيتم التواصل معك قريبًا');
      setBookingSubmitted(true);
      reset();

      // Track with Meta Pixel
      if (window.fbq) {
        window.fbq('track', 'Lead', {
          value: 0,
          currency: 'SAR',
          content_name: `Doctor Appointment - ${doctor?.name}`,
        });
      }

      // Send WhatsApp message
      const message = `مرحبًا، أود حجز موعد مع د. ${doctor?.name}`;
      window.open(`https://wa.me/967713133333?text=${encodeURIComponent(message)}`);
    },
    onError: (error) => {
      toast.error('فشل في حجز الموعد. حاول مرة أخرى');
      console.error(error);
    },
  });

  useEffect(() => {
    if (doctorData) {
      setDoctor(doctorData);
      setLoading(false);
    }
  }, [doctorData]);

  const onSubmit = (data: AppointmentFormData) => {
    if (!doctor) return;

    createAppointmentMutation.mutate({
      doctorId: doctor.id,
      fullName: data.fullName,
      phone: data.phone,
      email: data.email,
      preferredDate: new Date(data.preferredDate),
      notes: data.notes,
    });
  };

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">جاري التحميل...</p>
        </div>
      </main>
    );
  }

  if (!doctor) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <p className="text-gray-600 mb-4">لم يتم العثور على الطبيب</p>
            <Button onClick={() => window.history.back()}>العودة</Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Breadcrumb */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <a href="/doctors" className="text-blue-600 hover:underline">
            ← الأطباء
          </a>
        </div>
      </div>

      {/* Doctor Profile Section */}
      <section className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Doctor Image and Info */}
          <div className="lg:col-span-1">
            <Card className="sticky top-4">
              {/* Doctor Image */}
              <div className="relative w-full h-80 bg-gray-200">
                {doctor.image ? (
                  <Image
                    src={doctor.image}
                    alt={doctor.name}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-100 to-blue-200">
                    <span className="text-blue-400">صورة غير متاحة</span>
                  </div>
                )}
              </div>

              <CardContent className="pt-6">
                {/* Doctor Name */}
                <h1 className="text-2xl font-bold text-blue-900 mb-2">{doctor.name}</h1>

                {/* Specialty */}
                <p className="text-sm text-blue-600 font-semibold mb-4">{doctor.specialty}</p>

                {/* Rating */}
                {doctor.rating && (
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-yellow-400">★★★★★</span>
                    <span className="text-sm font-semibold">{doctor.rating}/5</span>
                  </div>
                )}

                {/* Contact Buttons */}
                <div className="space-y-2">
                  <a href={`tel:+967713133333`} className="block">
                    <Button className="w-full bg-blue-600 hover:bg-blue-700">
                      📞 اتصل الآن
                    </Button>
                  </a>
                  <a href={`https://wa.me/967713133333`} className="block">
                    <Button className="w-full bg-green-600 hover:bg-green-700">
                      💬 واتساب
                    </Button>
                  </a>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Doctor Details and Booking Form */}
          <div className="lg:col-span-2 space-y-8">
            {/* About Doctor */}
            <Card>
              <CardHeader>
                <CardTitle>نبذة عن الطبيب</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 leading-relaxed">
                  {doctor.bio ||
                    `د. ${doctor.name} متخصص في ${doctor.specialty} بخبرة عملية واسعة. يقدم الطبيب خدمات طبية متميزة بأحدث التقنيات الطبية في المستشفى السعودي الألماني بصنعاء.`}
                </p>
              </CardContent>
            </Card>

            {/* Specialties */}
            {doctor.specialties && (
              <Card>
                <CardHeader>
                  <CardTitle>التخصصات</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {doctor.specialties.map((specialty: string, index: number) => (
                      <li key={index} className="flex items-center gap-2">
                        <span className="text-blue-600">✓</span>
                        <span>{specialty}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Appointment Booking Form */}
            {!bookingSubmitted ? (
              <Card>
                <CardHeader>
                  <CardTitle>حجز موعد</CardTitle>
                  <CardDescription>
                    ملء النموذج أدناه لحجز موعد مع د. {doctor.name}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    {/* Full Name */}
                    <div>
                      <label className="block text-sm font-medium mb-1">الاسم الكامل</label>
                      <Input
                        type="text"
                        placeholder="أدخل اسمك الكامل"
                        {...register('fullName')}
                        className={errors.fullName ? 'border-red-500' : ''}
                      />
                      {errors.fullName && (
                        <p className="text-red-500 text-sm mt-1">{errors.fullName.message}</p>
                      )}
                    </div>

                    {/* Phone */}
                    <div>
                      <label className="block text-sm font-medium mb-1">رقم الهاتف</label>
                      <Input
                        type="tel"
                        placeholder="أدخل رقم هاتفك"
                        {...register('phone')}
                        className={errors.phone ? 'border-red-500' : ''}
                      />
                      {errors.phone && (
                        <p className="text-red-500 text-sm mt-1">{errors.phone.message}</p>
                      )}
                    </div>

                    {/* Email */}
                    <div>
                      <label className="block text-sm font-medium mb-1">البريد الإلكتروني</label>
                      <Input
                        type="email"
                        placeholder="أدخل بريدك الإلكتروني"
                        {...register('email')}
                        className={errors.email ? 'border-red-500' : ''}
                      />
                      {errors.email && (
                        <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
                      )}
                    </div>

                    {/* Preferred Date */}
                    <div>
                      <label className="block text-sm font-medium mb-1">التاريخ المفضل</label>
                      <Input
                        type="date"
                        {...register('preferredDate')}
                        className={errors.preferredDate ? 'border-red-500' : ''}
                      />
                      {errors.preferredDate && (
                        <p className="text-red-500 text-sm mt-1">{errors.preferredDate.message}</p>
                      )}
                    </div>

                    {/* Notes */}
                    <div>
                      <label className="block text-sm font-medium mb-1">ملاحظات إضافية</label>
                      <Textarea
                        placeholder="أضف أي ملاحظات أو أسئلة..."
                        {...register('notes')}
                        rows={4}
                      />
                    </div>

                    {/* Submit Button */}
                    <Button
                      type="submit"
                      className="w-full bg-blue-600 hover:bg-blue-700"
                      disabled={createAppointmentMutation.isPending}
                    >
                      {createAppointmentMutation.isPending ? 'جاري الحجز...' : 'حجز الموعد'}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            ) : (
              <Card className="bg-green-50 border-green-200">
                <CardContent className="pt-6 text-center">
                  <div className="text-4xl mb-4">✓</div>
                  <h3 className="text-xl font-bold text-green-900 mb-2">تم حجز الموعد بنجاح!</h3>
                  <p className="text-green-700 mb-4">
                    شكرًا لك! سيتم التواصل معك قريبًا لتأكيد الموعد.
                  </p>
                  <Button
                    onClick={() => setBookingSubmitted(false)}
                    variant="outline"
                  >
                    حجز موعد آخر
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
