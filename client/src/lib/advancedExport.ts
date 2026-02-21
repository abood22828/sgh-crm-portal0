import * as XLSX from 'xlsx';
import { toast } from 'sonner';
import { trpc } from './trpc';

/**
 * معلومات التصدير (Metadata)
 */
export interface ExportMetadata {
  tableName: string;
  dateRange?: string;
  filters?: Record<string, unknown>;
  totalRecords: number;
  exportedRecords: number;
  exportDate: string;
  exportedBy: string;
}

/**
 * خيارات التصدير
 */
export interface ExportOptions {
  format: 'excel' | 'csv' | 'pdf';
  metadata: ExportMetadata;
  columns: Array<{ key: string; label: string }>;
  data: Array<Record<string, any>>;
  filename?: string;
}

/**
 * تنسيق التاريخ والوقت بالعربية
 */
function formatDateTime(date: Date): string {
  return new Intl.DateTimeFormat('ar-SA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

/**
 * تصدير إلى Excel مع metadata
 */
function exportToExcel(options: ExportOptions): void {
  const { metadata, columns, data, filename } = options;

  // إنشاء workbook
  const wb = XLSX.utils.book_new();

  // إنشاء ورقة البيانات
  const wsData: any[][] = [];

  // بناء العنوان: "تسجيلات [اسم الجدول] - [كل/محدد] خلال الفترة من [نطاق التاريخ] - [فلاتر]"
  let titleParts: string[] = [`تسجيلات ${metadata.tableName}`];
  
  // إضافة نطاق التاريخ إن وجد
  if (metadata.dateRange) {
    titleParts.push(`خلال الفترة من ${metadata.dateRange}`);
  }
  
  // إضافة الفلاتر إن وجدت
  if (metadata.filters && Object.keys(metadata.filters).length > 0) {
    const filtersText = Object.entries(metadata.filters)
      .map(([key, value]) => `${key}: ${value}`)
      .join(' - ');
    titleParts.push(filtersText);
  }
  
  // دمج العنوان في صف واحد
  wsData.push([titleParts.join(' - ')]);
  wsData.push([]);

  // إضافة رؤوس الأعمدة
  wsData.push(columns.map((col) => col.label));

  // إضافة البيانات
  data.forEach((row) => {
    wsData.push(columns.map((col) => row[col.key] || ''));
  });

  // إنشاء الورقة
  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // إضافة الورقة إلى workbook
  XLSX.utils.book_append_sheet(wb, ws, 'البيانات');

  // تصدير الملف
  const finalFilename = filename || `${metadata.tableName}_${Date.now()}.xlsx`;
  XLSX.writeFile(wb, finalFilename);

  toast.success('تم التصدير إلى Excel بنجاح');
}

/**
 * تصدير إلى CSV مع metadata
 */
function exportToCSV(options: ExportOptions): void {
  const { metadata, columns, data, filename } = options;

  // إنشاء محتوى CSV (الجدول فقط بدون بيانات علوية)
  let csvContent = '';

  // إضافة رؤوس الأعمدة
  csvContent += columns.map((col) => col.label).join(',') + '\n';

  // إضافة البيانات
  data.forEach((row) => {
    csvContent += columns.map((col) => {
      const value = row[col.key] || '';
      // تنظيف القيمة من الفواصل والأسطر الجديدة
      return `"${value.toString().replace(/"/g, '""')}"`;
    }).join(',') + '\n';
  });

  // تنزيل الملف
  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename || `${metadata.tableName}_${Date.now()}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  toast.success('تم التصدير إلى CSV بنجاح');
}

/**
 * تصدير إلى PDF باستخدام خدمة الخادم
 */
async function exportToPDF(options: ExportOptions): Promise<void> {
  const { metadata, columns, data, filename } = options;

  const toastId = toast.loading('جاري إنشاء ملف PDF...');

  try {
    // تحويل filters إلى Record<string, string>
    const filters: Record<string, string> | undefined = metadata.filters
      ? Object.fromEntries(
          Object.entries(metadata.filters).map(([k, v]) => [k, String(v)])
        )
      : undefined;

    // استدعاء خدمة PDF من الخادم عبر tRPC
    const client = trpc.useUtils().client;
    const result = await client.export.generatePDF.mutate({
      metadata: { ...metadata, filters },
      columns,
      data,
    });

    if (!result.success || !result.pdf) {
      throw new Error('فشل إنشاء ملف PDF');
    }

    // تحويل base64 إلى Blob
    const binaryString = atob(result.pdf);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    const blob = new Blob([bytes], { type: 'application/pdf' });

    // تنزيل الملف
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename || `${metadata.tableName}_${Date.now()}.pdf`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success('تم التصدير إلى PDF بنجاح', { id: toastId });
  } catch (error) {
    console.error('PDF export error:', error);
    toast.error('حدث خطأ أثناء التصدير إلى PDF', { id: toastId });
    throw error;
  }
}

/**
 * دالة التصدير الرئيسية
 */
export async function exportData(options: ExportOptions): Promise<void> {
  try {
    switch (options.format) {
      case 'excel':
        exportToExcel(options);
        break;
      case 'csv':
        exportToCSV(options);
        break;
      case 'pdf':
        await exportToPDF(options);
        break;
      default:
        throw new Error('تنسيق غير مدعوم');
    }
  } catch (error) {
    console.error('Export error:', error);
    toast.error('حدث خطأ أثناء التصدير');
    throw error;
  }
}
