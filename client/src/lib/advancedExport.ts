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
 * يستخدم dynamic import لتأجيل تحميل xlsx (277KB) حتى الحاجة الفعلية
 */
async function exportToExcel(options: ExportOptions): Promise<void> {
  const { metadata, columns, data, filename } = options;

  // Dynamic import - يُحمَّل فقط عند الضغط على زر التصدير
  const XLSX = await import('xlsx');

  // إنشاء workbook
  const wb = XLSX.utils.book_new();

  // إنشاء ورقة البيانات
  const wsData: any[][] = [];

  // بناء العنوان
  let titleParts: string[] = [`تسجيلات ${metadata.tableName}`];
  
  if (metadata.dateRange) {
    titleParts.push(`خلال الفترة من ${metadata.dateRange}`);
  }
  
  if (metadata.filters && Object.keys(metadata.filters).length > 0) {
    const filtersText = Object.entries(metadata.filters)
      .map(([key, value]) => `${key}: ${value}`)
      .join(' - ');
    titleParts.push(filtersText);
  }
  
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
 * تصدير إلى CSV مع metadata (لا يحتاج مكتبات خارجية)
 */
function exportToCSV(options: ExportOptions): void {
  const { metadata, columns, data, filename } = options;

  let csvContent = '';

  // إضافة رؤوس الأعمدة
  csvContent += columns.map((col) => col.label).join(',') + '\n';

  // إضافة البيانات
  data.forEach((row) => {
    csvContent += columns.map((col) => {
      const value = row[col.key] || '';
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
 * تصدير إلى PDF باستخدام خدمة الخادم (لا يحتاج jspdf على الواجهة)
 */
async function exportToPDF(options: ExportOptions): Promise<void> {
  const { metadata, columns, data, filename } = options;

  const toastId = toast.loading('جاري إنشاء ملف PDF...');

  try {
    const filters: Record<string, string> | undefined = metadata.filters
      ? Object.fromEntries(
          Object.entries(metadata.filters).map(([k, v]) => [k, String(v)])
        )
      : undefined;

    const client = trpc.useUtils().client;
    const result = await client.export.generatePDF.mutate({
      metadata: { ...metadata, filters },
      columns,
      data,
    });

    if (!result.success || !result.pdf) {
      throw new Error('فشل إنشاء ملف PDF');
    }

    const binaryString = atob(result.pdf);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    const blob = new Blob([bytes], { type: 'application/pdf' });

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
 * طباعة الجدول مع ترويسة وذييل احترافية وترقيم الصفحات
 * (لا تحتاج مكتبات خارجية - تستخدم window.print)
 */
export function printTable(options: ExportOptions): void {
  const { metadata, columns, data } = options;

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    toast.error('فشل فتح نافذة الطباعة. يرجى السماح بالنوافذ المنبثقة.');
    return;
  }

  let filterText = '';
  if (metadata.dateRange) {
    filterText += `خلال الفترة من ${metadata.dateRange}`;
  }
  if (metadata.filters && Object.keys(metadata.filters).length > 0) {
    const filtersStr = Object.entries(metadata.filters)
      .map(([key, value]) => `${key}: ${value}`)
      .join(' - ');
    if (filterText) {
      filterText += ' - ' + filtersStr;
    } else {
      filterText = filtersStr;
    }
  }

  const columnCount = columns.length;
  const orientation = columnCount <= 5 ? 'portrait' : 'landscape';
  const fontSize = columnCount <= 5 ? '11pt' : columnCount <= 8 ? '10pt' : '9pt';
  const tableFontSize = columnCount <= 5 ? '10pt' : columnCount <= 8 ? '9pt' : '8pt';

  const htmlContent = `
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>طباعة ${metadata.tableName}</title>
      <style>
        @page {
          size: A4 ${orientation};
          margin: 20mm 15mm;
        }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: 'Arial', 'Tahoma', sans-serif;
          direction: rtl;
          text-align: right;
          font-size: ${fontSize};
          line-height: 1.4;
          color: #000;
        }
        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-bottom: 15px;
          border-bottom: 2px solid #0066cc;
          margin-bottom: 20px;
        }
        .header-right { flex: 1; }
        .header-right img { height: 60px; width: auto; }
        .header-left { flex: 1; text-align: left; font-size: 10pt; color: #333; }
        .header-left p { margin: 3px 0; }
        .report-title { text-align: center; margin: 20px 0; }
        .report-title h1 { font-size: 18pt; font-weight: bold; color: #0066cc; margin-bottom: 8px; }
        .report-title p { font-size: 11pt; color: #555; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; font-size: ${tableFontSize}; }
        thead { background-color: #0066cc; color: white; }
        th, td { border: 1px solid #ddd; padding: 8px 10px; text-align: right; }
        th { font-weight: bold; }
        tbody tr:nth-child(even) { background-color: #f9f9f9; }
        .page-footer {
          position: fixed;
          bottom: 0; left: 0; right: 0;
          height: 50px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 10px 15mm;
          border-top: 1px solid #ddd;
          background-color: white;
          font-size: 9pt;
          color: #666;
        }
        .footer-center { text-align: center; font-weight: bold; color: #0066cc; }
        @media print {
          .page-footer { position: fixed; bottom: 0; }
          body { margin-bottom: 60px; }
          thead { display: table-header-group; }
          tr { page-break-inside: avoid; }
        }
      </style>
    </head>
    <body>
      <div class="page-header">
        <div class="header-right">
          <img src="/sgh-logo-full.png" alt="المستشفى السعودي الألماني">
        </div>
        <div class="header-left">
          <p><strong>الرقم المجاني:</strong> 8000018</p>
          <p><strong>البريد الإلكتروني:</strong> info@sghsanaa.net</p>
        </div>
      </div>
      <div class="report-title">
        <h1>تسجيلات ${metadata.tableName}</h1>
        ${filterText ? `<p>${filterText}</p>` : ''}
      </div>
      <table>
        <thead>
          <tr>${columns.map(col => `<th>${col.label}</th>`).join('')}</tr>
        </thead>
        <tbody>
          ${data.map(row => `
            <tr>${columns.map(col => `<td>${row[col.key] || ''}</td>`).join('')}</tr>
          `).join('')}
        </tbody>
      </table>
      <div class="page-footer">
        <div class="footer-left"><p>وقت الطباعة: ${formatDateTime(new Date())}</p></div>
        <div class="footer-center"><p>نرعاكم كأهالينا</p></div>
        <div class="footer-right"><p>المستخدم: ${metadata.exportedBy}</p></div>
      </div>
      <script>
        window.onload = function() { window.print(); };
        window.onafterprint = function() { window.close(); };
      </script>
    </body>
    </html>
  `;

  printWindow.document.write(htmlContent);
  printWindow.document.close();

  toast.success('تم فتح نافذة الطباعة');
}

/**
 * دالة التصدير الرئيسية
 */
export async function exportData(options: ExportOptions): Promise<void> {
  try {
    switch (options.format) {
      case 'excel':
        await exportToExcel(options);
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
