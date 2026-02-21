import * as XLSX from 'xlsx';
import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';
import { toast } from 'sonner';

// تسجيل الخطوط
(pdfMake as any).vfs = (pdfFonts as any).pdfMake.vfs;

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
 * تصدير إلى PDF مع ترويسة وذييل احترافية ودعم كامل للعربية باستخدام pdfmake
 */
async function exportToPDF(options: ExportOptions): Promise<void> {
  const { metadata, columns, data, filename } = options;

  // التحقق من حجم البيانات
  if (data.length > 1000) {
    toast.warning('تنبيه: عدد السجلات كبير جداً. قد يستغرق التصدير بعض الوقت...');
  }

  try {
    // تحضير صفوف الجدول
    const tableBody: any[][] = [];
    
    // رؤوس الأعمدة (معكوسة لـ RTL)
    const headers = columns.map(col => ({
      text: col.label,
      style: 'tableHeader',
      alignment: 'center' as const
    })).reverse();
    tableBody.push(headers);

    // صفوف البيانات (معكوسة لـ RTL)
    data.forEach(row => {
      const rowData = columns.map(col => ({
        text: String(row[col.key] ?? '-').substring(0, 100),
        style: 'tableCell'
      })).reverse();
      tableBody.push(rowData);
    });

    // تحضير معلومات الفلاتر
    const filtersContent: any[] = [];
    if (metadata.filters && Object.keys(metadata.filters).length > 0) {
      Object.entries(metadata.filters).forEach(([key, value]) => {
        filtersContent.push({
          text: `• ${key}: ${value}`,
          style: 'filterItem'
        });
      });
    }

    // تعريف المستند
    const docDefinition: any = {
      pageSize: 'A4',
      pageOrientation: columns.length > 6 ? 'landscape' : 'portrait',
      pageMargins: [40, 100, 40, 80],
      
      // الترويسة
      header: (currentPage: number, pageCount: number) => {
        return {
          margin: [40, 20, 40, 0],
          columns: [
            {
              width: '*',
              stack: [
                {
                  text: 'المستشفى السعودي الألماني - صنعاء',
                  style: 'hospitalName',
                  alignment: 'right'
                },
                {
                  text: 'نرعاكم كأهالينا',
                  style: 'slogan',
                  alignment: 'right',
                  margin: [0, 2, 0, 0]
                }
              ]
            },
            {
              width: 'auto',
              stack: [
                {
                  text: 'الرقم المجاني: 8000018',
                  style: 'contactInfo',
                  alignment: 'left'
                },
                {
                  text: 'info@sghsanaa.net',
                  style: 'contactInfo',
                  alignment: 'left',
                  margin: [0, 2, 0, 0]
                }
              ]
            }
          ]
        };
      },

      // الذييل
      footer: (currentPage: number, pageCount: number) => {
        return {
          margin: [40, 10, 40, 20],
          columns: [
            {
              text: metadata.exportDate,
              style: 'footerText',
              alignment: 'right'
            },
            {
              text: 'نرعاكم كأهالينا',
              style: 'footerCenter',
              alignment: 'center'
            },
            {
              text: metadata.exportedBy,
              style: 'footerText',
              alignment: 'left'
            }
          ]
        };
      },

      // المحتوى
      content: [
        // عنوان التقرير
        {
          text: metadata.tableName,
          style: 'title',
          alignment: 'center',
          margin: [0, 0, 0, 15]
        },

        // معلومات التقرير
        {
          canvas: [
            {
              type: 'rect',
              x: 0,
              y: 0,
              w: columns.length > 6 ? 750 : 515,
              h: metadata.filters && Object.keys(metadata.filters).length > 0 
                ? 80 + (Object.keys(metadata.filters).length * 12)
                : 65,
              r: 3,
              color: '#f8f9fa'
            }
          ],
          margin: [0, 0, 0, 10]
        },
        {
          stack: [
            ...(metadata.dateRange ? [{
              text: `نطاق التاريخ: ${metadata.dateRange}`,
              style: 'metadataText',
              margin: [-515, -75, 0, 3]
            }] : [{ text: '', margin: [-515, -75, 0, 0] }]),
            ...(filtersContent.length > 0 ? [
              {
                text: 'الفلاتر المستخدمة:',
                style: 'metadataLabel',
                margin: [0, 3, 0, 2]
              },
              ...filtersContent
            ] : []),
            {
              text: `إجمالي السجلات: ${metadata.totalRecords}`,
              style: 'metadataText',
              margin: [0, 3, 0, 2]
            },
            {
              text: `السجلات المصدرة: ${metadata.exportedRecords}`,
              style: 'metadataText',
              margin: [0, 2, 0, 5]
            }
          ],
          margin: [0, 0, 0, 15]
        },

        // الجدول
        {
          table: {
            headerRows: 1,
            widths: Array(columns.length).fill('*'),
            body: tableBody
          },
          layout: {
            fillColor: (rowIndex: number) => {
              return rowIndex === 0 ? '#008060' : (rowIndex % 2 === 0 ? '#f9f9f9' : null);
            },
            hLineWidth: () => 0.5,
            vLineWidth: () => 0.5,
            hLineColor: () => '#ddd',
            vLineColor: () => '#ddd'
          }
        }
      ],

      // الأنماط
      styles: {
        hospitalName: {
          fontSize: 14,
          bold: true,
          color: '#008060'
        },
        slogan: {
          fontSize: 9,
          color: '#666',
          italics: true
        },
        contactInfo: {
          fontSize: 8,
          color: '#333'
        },
        title: {
          fontSize: 16,
          bold: true,
          color: '#008060'
        },
        metadataLabel: {
          fontSize: 9,
          bold: true,
          color: '#555'
        },
        metadataText: {
          fontSize: 9,
          color: '#333'
        },
        filterItem: {
          fontSize: 8,
          color: '#666',
          margin: [10, 0, 0, 0]
        },
        tableHeader: {
          fontSize: 9,
          bold: true,
          color: 'white',
          fillColor: '#008060',
          alignment: 'center'
        },
        tableCell: {
          fontSize: 8,
          alignment: 'right'
        },
        footerText: {
          fontSize: 8,
          color: '#666'
        },
        footerCenter: {
          fontSize: 9,
          bold: true,
          color: '#008060'
        }
      },

      // الخط الافتراضي (يدعم العربية)
      defaultStyle: {
        font: 'Roboto',
        fontSize: 10
      }
    };

    // إنشاء وتنزيل PDF
    const finalFilename = filename || `${metadata.tableName}-${Date.now()}.pdf`;
    pdfMake.createPdf(docDefinition).download(finalFilename);
    
    toast.success('تم تصدير PDF بنجاح');
  } catch (error) {
    console.error('PDF export error:', error);
    toast.error('حدث خطأ أثناء التصدير. يرجى المحاولة مرة أخرى.');
    throw error;
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
        ? 'جاري تصدير PDF...'
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
