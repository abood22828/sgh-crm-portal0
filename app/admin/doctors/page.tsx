/**
 * Admin Doctors Management - إدارة الأطباء
 * 
 * This page allows admins to manage doctor profiles and information.
 * Features: Create, Read, Update, Delete (CRUD) operations
 * 
 * @component
 * @returns {JSX.Element} The doctors management page
 */
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { trpc } from '@/lib/trpc/client';
import { toast } from 'sonner';

/**
 * AdminDoctorsPage Component
 * 
 * Displays a management interface for doctors with:
 * - List of all doctors
 * - Add new doctor form
 * - Edit doctor functionality
 * - Delete doctor functionality
 */
export default function AdminDoctorsPage() {
  const [doctors, setDoctors] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    specialty: '',
    bio: '',
    image: '',
    phone: '',
    email: '',
    isActive: true,
  });

  // Fetch doctors
  const { data: doctorsData } = trpc.doctors.getAll.useQuery();

  useEffect(() => {
    if (doctorsData) {
      setDoctors(doctorsData);
    }
  }, [doctorsData]);

  // Create mutation
  const createMutation = trpc.doctors.create.useMutation({
    onSuccess: () => {
      toast.success('تم إضافة الطبيب بنجاح');
      setFormData({
        name: '',
        specialty: '',
        bio: '',
        image: '',
        phone: '',
        email: '',
        isActive: true,
      });
      setShowForm(false);
      window.location.reload();
    },
    onError: (error) => {
      toast.error('فشل في إضافة الطبيب');
      console.error(error);
    },
  });

  // Update mutation
  const updateMutation = trpc.doctors.update.useMutation({
    onSuccess: () => {
      toast.success('تم تحديث الطبيب بنجاح');
      setEditingId(null);
      setFormData({
        name: '',
        specialty: '',
        bio: '',
        image: '',
        phone: '',
        email: '',
        isActive: true,
      });
      window.location.reload();
    },
    onError: (error) => {
      toast.error('فشل في تحديث الطبيب');
      console.error(error);
    },
  });

  // Delete mutation
  const deleteMutation = trpc.doctors.delete.useMutation({
    onSuccess: () => {
      toast.success('تم حذف الطبيب بنجاح');
      window.location.reload();
    },
    onError: (error) => {
      toast.error('فشل في حذف الطبيب');
      console.error(error);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (editingId) {
      updateMutation.mutate({
        id: editingId,
        ...formData,
      });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (doctor: any) => {
    setEditingId(doctor.id);
    setFormData({
      name: doctor.name,
      specialty: doctor.specialty,
      bio: doctor.bio || '',
      image: doctor.image || '',
      phone: doctor.phone || '',
      email: doctor.email || '',
      isActive: doctor.isActive,
    });
    setShowForm(true);
  };

  const handleDelete = (id: number) => {
    if (window.confirm('هل أنت متأكد من حذف هذا الطبيب؟')) {
      deleteMutation.mutate({ id });
    }
  };

  return (
    <main className="container mx-auto px-4 py-12">
      {/* Page Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-blue-900">إدارة الأطباء</h1>
          <p className="text-gray-600">أدر بيانات الأطباء والتخصصات</p>
        </div>
        <Link href="/admin" className="inline-block">
          <Button variant="outline">العودة إلى لوحة التحكم</Button>
        </Link>
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>{editingId ? 'تعديل الطبيب' : 'إضافة طبيب جديد'}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">الاسم</label>
                  <Input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">التخصص</label>
                  <Input
                    type="text"
                    value={formData.specialty}
                    onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">رقم الهاتف</label>
                  <Input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">البريد الإلكتروني</label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">النبذة</label>
                <Textarea
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  rows={4}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">رابط الصورة</label>
                <Input
                  type="url"
                  value={formData.image}
                  onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                />
              </div>

              <div className="flex gap-2">
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                  {editingId ? 'تحديث' : 'إضافة'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowForm(false);
                    setEditingId(null);
                    setFormData({
                      name: '',
                      specialty: '',
                      bio: '',
                      image: '',
                      phone: '',
                      email: '',
                      isActive: true,
                    });
                  }}
                >
                  إلغاء
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Add Button */}
      {!showForm && (
        <div className="mb-8">
          <Button
            onClick={() => setShowForm(true)}
            className="bg-green-600 hover:bg-green-700"
          >
            + إضافة طبيب جديد
          </Button>
        </div>
      )}

      {/* Doctors List */}
      <Card>
        <CardHeader>
          <CardTitle>قائمة الأطباء</CardTitle>
          <CardDescription>
            إجمالي الأطباء: {doctors.length}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {doctors.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {doctors.map((doctor: any) => (
                <Card key={doctor.id} className="overflow-hidden">
                  {/* Doctor Image */}
                  {doctor.image && (
                    <div className="relative w-full h-48 bg-gray-200">
                      <Image
                        src={doctor.image}
                        alt={doctor.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}

                  <CardContent className="pt-4">
                    <h3 className="font-bold text-lg mb-1">{doctor.name}</h3>
                    <p className="text-sm text-gray-600 mb-3">{doctor.specialty}</p>

                    {doctor.phone && (
                      <p className="text-sm text-gray-600 mb-1">
                        <span className="font-semibold">الهاتف:</span> {doctor.phone}
                      </p>
                    )}

                    {doctor.email && (
                      <p className="text-sm text-gray-600 mb-3">
                        <span className="font-semibold">البريد:</span> {doctor.email}
                      </p>
                    )}

                    <div className="flex gap-2 mt-4">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(doctor)}
                      >
                        تعديل
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(doctor.id)}
                      >
                        حذف
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-500 py-8">لا توجد أطباء حتى الآن</p>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
