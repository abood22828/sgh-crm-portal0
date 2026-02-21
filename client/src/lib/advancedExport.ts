import * as XLSX from 'xlsx';
import html2pdf from 'html2pdf.js';
import { APP_LOGO } from '@/const';
import { toast } from 'sonner';

/**
 * معلومات التصدير (Metadata)
 */
export interface ExportMetadata {
  tableName: string;
  dateRange?: string;
  filters?: Record<string, string>;
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

  // إضافة metadata في الأعلى
  wsData.push(['اسم الجدول:', metadata.tableName]);
  if (metadata.dateRange) {
    wsData.push(['نطاق التاريخ:', metadata.dateRange]);
  }
  if (metadata.filters && Object.keys(metadata.filters).length > 0) {
    wsData.push(['الفلاتر المستخدمة:', '']);
    Object.entries(metadata.filters).forEach(([key, value]) => {
      wsData.push(['', `${key}: ${value}`]);
    });
  }
  wsData.push(['إجمالي السجلات:', metadata.totalRecords.toString()]);
  wsData.push(['السجلات المصدرة:', metadata.exportedRecords.toString()]);
  wsData.push(['تاريخ التصدير:', metadata.exportDate]);
  wsData.push(['تم التصدير بواسطة:', metadata.exportedBy]);
  wsData.push([]); // سطر فارغ

  // إضافة رؤوس الأعمدة
  wsData.push(columns.map(col => col.label));

  // إضافة البيانات
  data.forEach(row => {
    wsData.push(columns.map(col => row[col.key] ?? '-'));
  });

  // إنشاء worksheet
  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // تنسيق العرض
  const colWidths = columns.map(col => ({ wch: 20 }));
  ws['!cols'] = colWidths;

  // إضافة الورقة إلى workbook
  XLSX.utils.book_append_sheet(wb, ws, 'البيانات');

  // حفظ الملف
  const finalFilename = filename || `${metadata.tableName}-${Date.now()}.xlsx`;
  XLSX.writeFile(wb, finalFilename);
}

/**
 * تصدير إلى CSV مع metadata
 */
function exportToCSV(options: ExportOptions): void {
  const { metadata, columns, data, filename } = options;

  const csvRows: string[] = [];

  // إضافة metadata
  csvRows.push(`اسم الجدول:,${metadata.tableName}`);
  if (metadata.dateRange) {
    csvRows.push(`نطاق التاريخ:,${metadata.dateRange}`);
  }
  if (metadata.filters && Object.keys(metadata.filters).length > 0) {
    csvRows.push('الفلاتر المستخدمة:,');
    Object.entries(metadata.filters).forEach(([key, value]) => {
      csvRows.push(`,${key}: ${value}`);
    });
  }
  csvRows.push(`إجمالي السجلات:,${metadata.totalRecords}`);
  csvRows.push(`السجلات المصدرة:,${metadata.exportedRecords}`);
  csvRows.push(`تاريخ التصدير:,${metadata.exportDate}`);
  csvRows.push(`تم التصدير بواسطة:,${metadata.exportedBy}`);
  csvRows.push(''); // سطر فارغ

  // إضافة رؤوس الأعمدة
  csvRows.push(columns.map(col => `"${col.label}"`).join(','));

  // إضافة البيانات
  data.forEach(row => {
    const rowData = columns.map(col => {
      const value = row[col.key] ?? '-';
      return `"${String(value).replace(/"/g, '""')}"`;
    });
    csvRows.push(rowData.join(','));
  });

  // إنشاء blob وتنزيل
  const csvContent = '\uFEFF' + csvRows.join('\n'); // BOM for UTF-8
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  const finalFilename = filename || `${metadata.tableName}-${Date.now()}.csv`;
  
  link.setAttribute('href', url);
  link.setAttribute('download', finalFilename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * تصدير إلى PDF مع ترويسة وذييل احترافية ودعم كامل للعربية
 */
async function exportToPDF(options: ExportOptions): Promise<void> {
  const { metadata, columns, data, filename } = options;

  // التحقق من حجم البيانات
  if (data.length > 1000) {
    toast.warning('تنبيه: عدد السجلات كبير جداً. قد يستغرق التصدير بعض الوقت...');
  }

  // إنشاء HTML للـ PDF
  const htmlContent = `
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head>
      <meta charset="UTF-8">
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: 'Arial', 'Helvetica', sans-serif;
          direction: rtl;
          padding: 15px;
          font-size: 10px;
          background: white;
        }
        
        .header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 15px;
          padding-bottom: 10px;
          border-bottom: 1px solid #e0e0e0;
        }
        
        .header-right {
          flex: 1;
        }
        
        .header-right img {
          max-width: 150px;
          height: auto;
        }
        
        .header-left {
          text-align: left;
          font-size: 9px;
          color: #333;
        }
        
        .header-left div {
          margin-bottom: 2px;
        }
        
        .metadata {
          background-color: #f8f9fa;
          padding: 10px;
          border-radius: 3px;
          margin-bottom: 15px;
        }
        
        .metadata-title {
          font-size: 13px;
          font-weight: bold;
          text-align: center;
          margin-bottom: 8px;
          color: #008060;
        }
        
        .metadata-row {
          margin-bottom: 4px;
          font-size: 9px;
        }
        
        .metadata-label {
          font-weight: bold;
          color: #555;
        }
        
        .filters {
          margin-right: 15px;
          margin-top: 3px;
        }
        
        .filter-item {
          margin-bottom: 2px;
          color: #666;
        }
        
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 10px;
          font-size: 8px;
        }
        
        thead {
          background-color: #008060;
          color: white;
        }
        
        th {
          padding: 6px 4px;
          text-align: center;
          font-weight: bold;
          border: 1px solid #ddd;
          font-size: 8px;
        }
        
        td {
          padding: 5px 3px;
          text-align: right;
          border: 1px solid #ddd;
          font-size: 7px;
        }
        
        tbody tr:nth-child(even) {
          background-color: #f9f9f9;
        }
        
        .footer {
          margin-top: 20px;
          padding-top: 10px;
          border-top: 1px solid #e0e0e0;
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 8px;
          color: #666;
        }
        
        .footer-center {
          font-weight: bold;
          color: #008060;
          font-size: 9px;
        }
      </style>
    </head>
    <body>
      <!-- الترويسة -->
      <div class="header">
        <div class="header-right">
          <img src="/sgh-logo-full.png" alt="شعار المستشفى" />
        </div>
        <div class="header-left">
          <div><strong>الرقم المجاني:</strong> 8000018</div>
          <div><strong>البريد الإلكتروني:</strong> info@sghsanaa.net</div>
        </div>
      </div>
      
      <!-- معلومات التقرير -->
      <div class="metadata">
        <div class="metadata-title">${metadata.tableName}</div>
        ${metadata.dateRange ? `<div class="metadata-row"><span class="metadata-label">نطاق التاريخ:</span> ${metadata.dateRange}</div>` : ''}
        ${metadata.filters && Object.keys(metadata.filters).length > 0 ? `
          <div class="metadata-row">
            <span class="metadata-label">الفلاتر المستخدمة:</span>
            <div class="filters">
              ${Object.entries(metadata.filters).map(([key, value]) => `
                <div class="filter-item">• ${key}: ${value}</div>
              `).join('')}
            </div>
          </div>
        ` : ''}
        <div class="metadata-row"><span class="metadata-label">إجمالي السجلات:</span> ${metadata.totalRecords}</div>
        <div class="metadata-row"><span class="metadata-label">السجلات المصدرة:</span> ${metadata.exportedRecords}</div>
      </div>
      
      <!-- الجدول -->
      <table>
        <thead>
          <tr>
            ${columns.map(col => `<th>${col.label}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
          ${data.map(row => `
            <tr>
              ${columns.map(col => `<td>${String(row[col.key] ?? '-').substring(0, 100)}</td>`).join('')}
            </tr>
          `).join('')}
        </tbody>
      </table>
      
      <!-- الذييل -->
      <div class="footer">
        <div class="footer-left">${metadata.exportDate}</div>
        <div class="footer-center">نرعاكم كأهالينا</div>
        <div class="footer-right">${metadata.exportedBy}</div>
      </div>
    </body>
    </html>
  `;

  // إنشاء عنصر مؤقت
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = htmlContent;
  tempDiv.style.position = 'fixed';
  tempDiv.style.left = '-99999px';
  tempDiv.style.top = '0';
  tempDiv.style.width = '210mm'; // A4 width
  tempDiv.style.background = 'white';
  document.body.appendChild(tempDiv);

  // خيارات html2pdf محسّنة
  const opt = {
    margin: [10, 10, 10, 10] as [number, number, number, number],
    filename: filename || `${metadata.tableName}-${Date.now()}.pdf`,
    image: { type: 'jpeg' as const, quality: 0.95 },
    html2canvas: { 
      scale: 1.5, // تقليل scale لتحسين الأداء
      useCORS: true,
      letterRendering: true,
      logging: false,
      windowWidth: 794, // A4 width in pixels at 96 DPI
      windowHeight: 1123 // A4 height in pixels at 96 DPI
    },
    jsPDF: { 
      unit: 'mm', 
      format: 'a4' as const,
      orientation: (columns.length > 6 ? 'landscape' : 'portrait') as 'landscape' | 'portrait',
      compress: true
    },
    pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
  };

  try {
    // تحويل HTML إلى PDF مع timeout
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('انتهت مهلة التصدير')), 60000); // 60 seconds timeout
    });

    const exportPromise = html2pdf().set(opt).from(tempDiv).save();

    await Promise.race([exportPromise, timeoutPromise]);
    
    toast.success('تم تصدير PDF بنجاح');
  } catch (error) {
    console.error('PDF export error:', error);
    toast.error('حدث خطأ أثناء التصدير. يرجى المحاولة مرة أخرى أو تقليل عدد السجلات.');
    throw error;
  } finally {
    // إزالة العنصر المؤقت
    if (document.body.contains(tempDiv)) {
      document.body.removeChild(tempDiv);
    }
  }
}

/**
 * الدالة الرئيسية للتصدير المتقدم
 */
export async function advancedExport(options: ExportOptions): Promise<void> {
  try {
    // عرض رسالة loading
    const loadingToast = toast.loading(
      options.format === 'pdf' 
        ? 'جاري تصدير PDF... قد يستغرق بعض الوقت'
        : `جاري التصدير إلى ${options.format.toUpperCase()}...`
    );

    switch (options.format) {
      case 'excel':
        exportToExcel(options);
        toast.success('تم تصدير Excel بنجاح', { id: loadingToast });
        break;
      case 'csv':
        exportToCSV(options);
        toast.success('تم تصدير CSV بنجاح', { id: loadingToast });
        break;
      case 'pdf':
        await exportToPDF(options);
        toast.dismiss(loadingToast);
        break;
      default:
        toast.error(`تنسيق غير مدعوم: ${options.format}`, { id: loadingToast });
        throw new Error(`Unsupported format: ${options.format}`);
    }
  } catch (error) {
    console.error('Export error:', error);
    toast.error('حدث خطأ أثناء التصدير');
    throw error;
  }
}

/**
 * دالة مساعدة لتحضير البيانات للتصدير
 */
export function prepareExportData<T extends Record<string, any>>(
  allData: T[],
  filteredData: T[],
  visibleColumns: Record<string, boolean>,
  columnDefinitions: Array<{ key: string; label: string }>,
  tableName: string,
  dateRange?: string,
  filters?: Record<string, string>,
  userName?: string
): Omit<ExportOptions, 'format' | 'filename'> {
  // فلترة الأعمدة المرئية فقط
  const selectedColumns = columnDefinitions.filter(col => visibleColumns[col.key]);

  // تحضير البيانات المفلترة
  const exportData = filteredData.map(row => {
    const filteredRow: Record<string, any> = {};
    selectedColumns.forEach(col => {
      filteredRow[col.key] = row[col.key];
    });
    return filteredRow;
  });

  // تحضير metadata
  const metadata: ExportMetadata = {
    tableName,
    dateRange,
    filters,
    totalRecords: allData.length,
    exportedRecords: filteredData.length,
    exportDate: formatDateTime(new Date()),
    exportedBy: userName || 'مستخدم',
  };

  return {
    metadata,
    columns: selectedColumns,
    data: exportData,
  };
}
