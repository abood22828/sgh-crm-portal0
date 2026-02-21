import * as XLSX from 'xlsx';
import html2pdf from 'html2pdf.js';
import { APP_LOGO } from '@/const';

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
          padding: 20px;
          font-size: 12px;
        }
        
        .header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 20px;
          padding-bottom: 15px;
          border-bottom: 2px solid #e0e0e0;
        }
        
        .header-right {
          flex: 1;
        }
        
        .header-right img {
          max-width: 200px;
          height: auto;
        }
        
        .header-left {
          text-align: left;
          font-size: 11px;
          color: #333;
        }
        
        .header-left div {
          margin-bottom: 3px;
        }
        
        .metadata {
          background-color: #f8f9fa;
          padding: 15px;
          border-radius: 5px;
          margin-bottom: 20px;
        }
        
        .metadata-title {
          font-size: 16px;
          font-weight: bold;
          text-align: center;
          margin-bottom: 12px;
          color: #008060;
        }
        
        .metadata-row {
          margin-bottom: 6px;
          font-size: 11px;
        }
        
        .metadata-label {
          font-weight: bold;
          color: #555;
        }
        
        .filters {
          margin-right: 20px;
          margin-top: 5px;
        }
        
        .filter-item {
          margin-bottom: 3px;
          color: #666;
        }
        
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 15px;
          font-size: 10px;
        }
        
        thead {
          background-color: #008060;
          color: white;
        }
        
        th {
          padding: 10px 8px;
          text-align: center;
          font-weight: bold;
          border: 1px solid #ddd;
        }
        
        td {
          padding: 8px;
          text-align: right;
          border: 1px solid #ddd;
        }
        
        tbody tr:nth-child(even) {
          background-color: #f5f5f5;
        }
        
        tbody tr:hover {
          background-color: #e8f5f1;
        }
        
        .footer {
          margin-top: 30px;
          padding-top: 15px;
          border-top: 2px solid #e0e0e0;
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 10px;
          color: #666;
        }
        
        .footer-center {
          font-weight: bold;
          color: #008060;
          font-size: 11px;
        }
        
        @media print {
          body {
            padding: 15px;
          }
          
          .header, .footer {
            page-break-inside: avoid;
          }
          
          table {
            page-break-inside: auto;
          }
          
          tr {
            page-break-inside: avoid;
            page-break-after: auto;
          }
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
              ${columns.map(col => `<td>${row[col.key] ?? '-'}</td>`).join('')}
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
  tempDiv.style.position = 'absolute';
  tempDiv.style.left = '-9999px';
  tempDiv.style.top = '0';
  document.body.appendChild(tempDiv);

  // خيارات html2pdf
  const opt = {
    margin: [10, 10, 10, 10] as [number, number, number, number],
    filename: filename || `${metadata.tableName}-${Date.now()}.pdf`,
    image: { type: 'jpeg' as const, quality: 0.98 },
    html2canvas: { 
      scale: 2,
      useCORS: true,
      letterRendering: true,
      logging: false
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
    // تحويل HTML إلى PDF
    await html2pdf().set(opt).from(tempDiv).save();
  } finally {
    // إزالة العنصر المؤقت
    document.body.removeChild(tempDiv);
  }
}

/**
 * الدالة الرئيسية للتصدير المتقدم
 */
export async function advancedExport(options: ExportOptions): Promise<void> {
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
        throw new Error(`Unsupported format: ${options.format}`);
    }
  } catch (error) {
    console.error('Export error:', error);
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
