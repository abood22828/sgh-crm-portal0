/**
 * Admin Offers Management - إدارة العروض
 * 
 * This page allows admins to manage medical offers.
 * Features: Create, Read, Update, Delete (CRUD) operations
 * 
 * @component
 * @returns {JSX.Element} The offers management page
 */
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { trpc } from '@/lib/trpc/client';
import { toast } from 'sonner';

/**
 * AdminOffersPage Component
 * 
 * Displays a management interface for medical offers with:
 * - List of all offers
 * - Add new offer form
 * - Edit offer functionality
 * - Delete offer functionality
 */
export default function AdminOffersPage() {
  const [offers, setOffers] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    imageUrl: '',
    startDate: '',
    endDate: '',
    isActive: true,
  });

  // Fetch offers
  const { data: offersData } = trpc.offers.getAll.useQuery();

  useEffect(() => {
    if (offersData) {
      setOffers(offersData);
    }
  }, [offersData]);

  // Create mutation
  const createMutation = trpc.offers.create.useMutation({
    onSuccess: () => {
      toast.success('تم إنشاء العرض بنجاح');
      setFormData({
        title: '',
        description: '',
        imageUrl: '',
        startDate: '',
        endDate: '',
        isActive: true,
      });
      setShowForm(false);
      // Refresh offers
      window.location.reload();
    },
    onError: (error) => {
      toast.error('فشل في إنشاء العرض');
      console.error(error);
    },
  });

  // Update mutation
  const updateMutation = trpc.offers.update.useMutation({
    onSuccess: () => {
      toast.success('تم تحديث العرض بنجاح');
      setEditingId(null);
      setFormData({
        title: '',
        description: '',
        imageUrl: '',
        startDate: '',
        endDate: '',
        isActive: true,
      });
      // Refresh offers
      window.location.reload();
    },
    onError: (error) => {
      toast.error('فشل في تحديث العرض');
      console.error(error);
    },
  });

  // Delete mutation
  const deleteMutation = trpc.offers.delete.useMutation({
    onSuccess: () => {
      toast.success('تم حذف العرض بنجاح');
      // Refresh offers
      window.location.reload();
    },
    onError: (error) => {
      toast.error('فشل في حذف العرض');
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

  const handleEdit = (offer: any) => {
    setEditingId(offer.id);
    setFormData({
      title: offer.title,
      description: offer.description,
      imageUrl: offer.imageUrl || '',
      startDate: offer.startDate ? new Date(offer.startDate).toISOString().split('T')[0] : '',
      endDate: offer.endDate ? new Date(offer.endDate).toISOString().split('T')[0] : '',
      isActive: offer.isActive,
    });
    setShowForm(true);
  };

  const handleDelete = (id: number) => {
    if (window.confirm('هل أنت متأكد من حذف هذا العرض؟')) {
      deleteMutation.mutate({ id });
    }
  };

  return (
    <main className="container mx-auto px-4 py-12">
      {/* Page Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-blue-900">إدارة العروض</h1>
          <p className="text-gray-600">أدر جميع العروض الطبية</p>
        </div>
        <Link href="/admin" className="inline-block">
          <Button variant="outline">العودة إلى لوحة التحكم</Button>
        </Link>
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>{editingId ? 'تعديل العرض' : 'إضافة عرض جديد'}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">العنوان</label>
                <Input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">الوصف</label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  required
                  rows={4}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">رابط الصورة</label>
                <Input
                  type="url"
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">تاريخ البداية</label>
                  <Input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">تاريخ النهاية</label>
                  <Input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  />
                </div>
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
                      title: '',
                      description: '',
                      imageUrl: '',
                      startDate: '',
                      endDate: '',
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
            + إضافة عرض جديد
          </Button>
        </div>
      )}

      {/* Offers List */}
      <Card>
        <CardHeader>
          <CardTitle>قائمة العروض</CardTitle>
          <CardDescription>
            إجمالي العروض: {offers.length}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {offers.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-right py-2 px-4">العنوان</th>
                    <th className="text-right py-2 px-4">الحالة</th>
                    <th className="text-right py-2 px-4">تاريخ البداية</th>
                    <th className="text-right py-2 px-4">تاريخ النهاية</th>
                    <th className="text-right py-2 px-4">الإجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {offers.map((offer: any) => (
                    <tr key={offer.id} className="border-b hover:bg-gray-50">
                      <td className="py-2 px-4">{offer.title}</td>
                      <td className="py-2 px-4">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${
                          offer.isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {offer.isActive ? 'نشط' : 'غير نشط'}
                        </span>
                      </td>
                      <td className="py-2 px-4">
                        {offer.startDate ? new Date(offer.startDate).toLocaleDateString('ar-SA') : '-'}
                      </td>
                      <td className="py-2 px-4">
                        {offer.endDate ? new Date(offer.endDate).toLocaleDateString('ar-SA') : '-'}
                      </td>
                      <td className="py-2 px-4">
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(offer)}
                          >
                            تعديل
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDelete(offer.id)}
                          >
                            حذف
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-center text-gray-500 py-8">لا توجد عروض حتى الآن</p>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
