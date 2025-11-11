/**
 * Admin Leads Management - إدارة العملاء المحتملين
 * 
 * This page displays all leads from various sources with filtering and export options.
 * 
 * @component
 * @returns {JSX.Element} The leads management page
 */
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { trpc } from '@/lib/trpc/client';

/**
 * AdminLeadsPage Component
 * 
 * Displays all leads with:
 * - Filtering by source type
 * - Search functionality
 * - Export to CSV
 * - Lead details
 */
export default function AdminLeadsPage() {
  const [leads, setLeads] = useState<any[]>([]);
  const [filteredLeads, setFilteredLeads] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSource, setFilterSource] = useState<string>('all');

  // Fetch all leads
  const { data: leadsData } = trpc.leads.getAll.useQuery();

  useEffect(() => {
    if (leadsData) {
      setLeads(leadsData);
      filterLeads(leadsData, searchTerm, filterSource);
    }
  }, [leadsData]);

  const filterLeads = (data: any[], search: string, source: string) => {
    let filtered = data;

    // Filter by source
    if (source !== 'all') {
      filtered = filtered.filter((lead) => lead.sourceType === source);
    }

    // Filter by search term
    if (search) {
      filtered = filtered.filter(
        (lead) =>
          lead.fullName.toLowerCase().includes(search.toLowerCase()) ||
          lead.phone.includes(search) ||
          lead.email.toLowerCase().includes(search.toLowerCase())
      );
    }

    setFilteredLeads(filtered);
  };

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    filterLeads(leads, value, filterSource);
  };

  const handleFilterSource = (value: string) => {
    setFilterSource(value);
    filterLeads(leads, searchTerm, value);
  };

  const handleExportCSV = () => {
    if (filteredLeads.length === 0) {
      alert('لا توجد بيانات للتصدير');
      return;
    }

    // Prepare CSV content
    const headers = ['الاسم', 'الهاتف', 'البريد الإلكتروني', 'الملاحظات', 'المصدر', 'التاريخ'];
    const rows = filteredLeads.map((lead) => [
      lead.fullName,
      lead.phone,
      lead.email,
      lead.notes || '-',
      lead.sourceType,
      new Date(lead.createdAt).toLocaleDateString('ar-SA'),
    ]);

    // Create CSV string
    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n');

    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `leads-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <main className="container mx-auto px-4 py-12">
      {/* Page Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-blue-900">إدارة العملاء المحتملين</h1>
          <p className="text-gray-600">عرض وإدارة جميع العملاء المحتملين</p>
        </div>
        <Link href="/admin" className="inline-block">
          <Button variant="outline">العودة إلى لوحة التحكم</Button>
        </Link>
      </div>

      {/* Filters and Search */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>البحث والتصفية</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search Input */}
            <div>
              <label className="block text-sm font-medium mb-2">البحث</label>
              <Input
                type="text"
                placeholder="ابحث بالاسم أو الهاتف أو البريد..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
              />
            </div>

            {/* Filter by Source */}
            <div>
              <label className="block text-sm font-medium mb-2">المصدر</label>
              <select
                value={filterSource}
                onChange={(e) => handleFilterSource(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="all">جميع المصادر</option>
                <option value="offer">العروض</option>
                <option value="doctor">الأطباء</option>
                <option value="camp">المخيمات</option>
                <option value="campaign">الحملات</option>
              </select>
            </div>

            {/* Export Button */}
            <div className="flex items-end">
              <Button
                onClick={handleExportCSV}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                📥 تصدير إلى CSV
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-gray-600">إجمالي العملاء</p>
            <p className="text-2xl font-bold text-blue-600">{leads.length}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-gray-600">النتائج المعروضة</p>
            <p className="text-2xl font-bold text-green-600">{filteredLeads.length}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-gray-600">من العروض</p>
            <p className="text-2xl font-bold text-purple-600">
              {leads.filter((l) => l.sourceType === 'offer').length}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-gray-600">من الأطباء</p>
            <p className="text-2xl font-bold text-orange-600">
              {leads.filter((l) => l.sourceType === 'doctor').length}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Leads Table */}
      <Card>
        <CardHeader>
          <CardTitle>قائمة العملاء المحتملين</CardTitle>
          <CardDescription>
            عرض {filteredLeads.length} من {leads.length} عميل محتمل
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredLeads.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-right py-2 px-4">الاسم</th>
                    <th className="text-right py-2 px-4">الهاتف</th>
                    <th className="text-right py-2 px-4">البريد الإلكتروني</th>
                    <th className="text-right py-2 px-4">المصدر</th>
                    <th className="text-right py-2 px-4">التاريخ</th>
                    <th className="text-right py-2 px-4">الملاحظات</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLeads.map((lead: any, index: number) => (
                    <tr key={index} className="border-b hover:bg-gray-50">
                      <td className="py-2 px-4 font-semibold">{lead.fullName}</td>
                      <td className="py-2 px-4">
                        <a href={`tel:${lead.phone}`} className="text-blue-600 hover:underline">
                          {lead.phone}
                        </a>
                      </td>
                      <td className="py-2 px-4">
                        <a href={`mailto:${lead.email}`} className="text-blue-600 hover:underline">
                          {lead.email}
                        </a>
                      </td>
                      <td className="py-2 px-4">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${
                          lead.sourceType === 'offer'
                            ? 'bg-green-100 text-green-800'
                            : lead.sourceType === 'doctor'
                            ? 'bg-purple-100 text-purple-800'
                            : lead.sourceType === 'camp'
                            ? 'bg-orange-100 text-orange-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {lead.sourceType}
                        </span>
                      </td>
                      <td className="py-2 px-4">
                        {new Date(lead.createdAt).toLocaleDateString('ar-SA')}
                      </td>
                      <td className="py-2 px-4 text-gray-600 max-w-xs truncate">
                        {lead.notes || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-center text-gray-500 py-8">لا توجد عملاء محتملين مطابقة للبحث</p>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
