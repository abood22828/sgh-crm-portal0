/**
 * Admin Dashboard - لوحة التحكم الإدارية
 * 
 * Main admin dashboard page showing overview statistics and quick actions.
 * 
 * @component
 * @returns {JSX.Element} The admin dashboard
 */
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { trpc } from '@/lib/trpc/client';

/**
 * AdminDashboard Component
 * 
 * Displays:
 * - Overview statistics (leads, offers, doctors, camps)
 * - Quick action buttons
 * - Recent activities
 * - Management links
 */
export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalLeads: 0,
    totalOffers: 0,
    totalDoctors: 0,
    totalCamps: 0,
  });

  // Fetch statistics from the server
  const { data: leadsData } = trpc.leads.getAll.useQuery();
  const { data: offersData } = trpc.offers.getAll.useQuery();

  useEffect(() => {
    if (leadsData) {
      setStats((prev) => ({ ...prev, totalLeads: leadsData.length }));
    }
    if (offersData) {
      setStats((prev) => ({ ...prev, totalOffers: offersData.length }));
    }
  }, [leadsData, offersData]);

  return (
    <main className="container mx-auto px-4 py-12">
      {/* Page Header */}
      <div className="mb-12">
        <h1 className="text-4xl font-bold text-blue-900 mb-2">لوحة التحكم الإدارية</h1>
        <p className="text-gray-600">مرحبًا بك في لوحة التحكم. إدارة جميع جوانب المستشفى من هنا.</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        {/* Total Leads */}
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-blue-900">إجمالي العملاء المحتملين</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold text-blue-600">{stats.totalLeads}</p>
            <p className="text-sm text-blue-700 mt-2">عميل محتمل</p>
          </CardContent>
        </Card>

        {/* Total Offers */}
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-green-900">إجمالي العروض</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold text-green-600">{stats.totalOffers}</p>
            <p className="text-sm text-green-700 mt-2">عرض نشط</p>
          </CardContent>
        </Card>

        {/* Total Doctors */}
        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-purple-900">إجمالي الأطباء</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold text-purple-600">{stats.totalDoctors}</p>
            <p className="text-sm text-purple-700 mt-2">طبيب متخصص</p>
          </CardContent>
        </Card>

        {/* Total Camps */}
        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-orange-900">إجمالي المخيمات</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold text-orange-600">{stats.totalCamps}</p>
            <p className="text-sm text-orange-700 mt-2">مخيم طبي</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold text-blue-900 mb-6">الإجراءات السريعة</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link href="/admin/offers" className="block">
            <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
              إدارة العروض
            </Button>
          </Link>

          <Link href="/admin/doctors" className="block">
            <Button className="w-full bg-purple-600 hover:bg-purple-700 text-white">
              إدارة الأطباء
            </Button>
          </Link>

          <Link href="/admin/camps" className="block">
            <Button className="w-full bg-orange-600 hover:bg-orange-700 text-white">
              إدارة المخيمات
            </Button>
          </Link>

          <Link href="/admin/leads" className="block">
            <Button className="w-full bg-green-600 hover:bg-green-700 text-white">
              عرض العملاء المحتملين
            </Button>
          </Link>
        </div>
      </div>

      {/* Recent Leads */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold text-blue-900 mb-6">آخر العملاء المحتملين</h2>
        <Card>
          <CardContent className="pt-6">
            {leadsData && leadsData.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-right py-2 px-4">الاسم</th>
                      <th className="text-right py-2 px-4">الهاتف</th>
                      <th className="text-right py-2 px-4">البريد الإلكتروني</th>
                      <th className="text-right py-2 px-4">المصدر</th>
                      <th className="text-right py-2 px-4">التاريخ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leadsData.slice(0, 5).map((lead: any, index: number) => (
                      <tr key={index} className="border-b hover:bg-gray-50">
                        <td className="py-2 px-4">{lead.fullName}</td>
                        <td className="py-2 px-4">{lead.phone}</td>
                        <td className="py-2 px-4">{lead.email}</td>
                        <td className="py-2 px-4">
                          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                            {lead.sourceType}
                          </span>
                        </td>
                        <td className="py-2 px-4">
                          {new Date(lead.createdAt).toLocaleDateString('ar-SA')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-center text-gray-500">لا توجد عملاء محتملين حتى الآن</p>
            )}
            <div className="mt-4">
              <Link href="/admin/leads" className="inline-block">
                <Button variant="outline">عرض الكل</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Management Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Offers Management */}
        <Card>
          <CardHeader>
            <CardTitle>إدارة العروض</CardTitle>
            <CardDescription>
              أضف وعدّل وحذف العروض الطبية
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              أدر جميع العروض الطبية المتاحة. أضف عروض جديدة أو عدّل العروض الموجودة.
            </p>
            <Link href="/admin/offers" className="inline-block">
              <Button variant="outline">الذهاب إلى إدارة العروض</Button>
            </Link>
          </CardContent>
        </Card>

        {/* Doctors Management */}
        <Card>
          <CardHeader>
            <CardTitle>إدارة الأطباء</CardTitle>
            <CardDescription>
              أدر بيانات الأطباء والتخصصات
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              أضف أطباء جدد وعدّل بيانات الأطباء الموجودين وأدر تخصصاتهم.
            </p>
            <Link href="/admin/doctors" className="inline-block">
              <Button variant="outline">الذهاب إلى إدارة الأطباء</Button>
            </Link>
          </CardContent>
        </Card>

        {/* Camps Management */}
        <Card>
          <CardHeader>
            <CardTitle>إدارة المخيمات الطبية</CardTitle>
            <CardDescription>
              أدر المخيمات الطبية والفعاليات
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              أضف مخيمات جديدة وعدّل المخيمات الموجودة وأدر التسجيلات.
            </p>
            <Link href="/admin/camps" className="inline-block">
              <Button variant="outline">الذهاب إلى إدارة المخيمات</Button>
            </Link>
          </CardContent>
        </Card>

        {/* Leads Management */}
        <Card>
          <CardHeader>
            <CardTitle>إدارة العملاء المحتملين</CardTitle>
            <CardDescription>
              عرض وإدارة جميع العملاء المحتملين
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              عرض جميع العملاء المحتملين من جميع المصادر وإدارة متابعتهم.
            </p>
            <Link href="/admin/leads" className="inline-block">
              <Button variant="outline">الذهاب إلى إدارة العملاء</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
