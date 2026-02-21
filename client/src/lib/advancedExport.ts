import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
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
 * تحميل الشعار كـ base64
 */
async function loadLogoAsBase64(): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0);
        const dataURL = canvas.toDataURL('image/png');
        resolve(dataURL);
      } else {
        reject(new Error('Failed to get canvas context'));
      }
    };
    img.onerror = () => reject(new Error('Failed to load logo'));
    img.src = '/sgh-logo-full.png';
  });
}

/**
 * تصدير إلى PDF مع ترويسة وذييل احترافية
 */
async function exportToPDF(options: ExportOptions): Promise<void> {
  const { metadata, columns, data, filename } = options;

  // تحميل الشعار
  let logoBase64: string | null = null;
  try {
    logoBase64 = await loadLogoAsBase64();
  } catch (error) {
    console.warn('Failed to load logo, proceeding without it:', error);
  }

  // إنشاء مستند PDF
  const doc = new jsPDF({
    orientation: columns.length > 6 ? 'landscape' : 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  // إضافة دعم الخط العربي
  doc.setLanguage('ar');
  doc.setFont('helvetica');

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;

  // دالة لرسم الترويسة
  const drawHeader = () => {
    // شعار المستشفى على اليمين
    const logoWidth = 50;
    const logoHeight = 15;
    const logoX = pageWidth - margin - logoWidth;
    const logoY = margin;

    if (logoBase64) {
      try {
        doc.addImage(logoBase64, 'PNG', logoX, logoY, logoWidth, logoHeight);
      } catch (error) {
        console.warn('Failed to add logo to PDF:', error);
        // رسم مربع placeholder في حالة الفشل
        doc.setDrawColor(0, 128, 96);
        doc.setLineWidth(0.5);
        doc.rect(logoX, logoY, logoWidth, logoHeight);
      }
    } else {
      // رسم مربع placeholder إذا لم يتم تحميل الشعار
      doc.setDrawColor(0, 128, 96);
      doc.setLineWidth(0.5);
      doc.rect(logoX, logoY, logoWidth, logoHeight);
    }

    // الرقم المجاني والإيميل على اليسار
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    const contactX = margin;
    const contactY = margin + 5;
    doc.text('8000018 :الرقم المجاني', contactX, contactY, { align: 'left' });
    doc.text('info@sghsanaa.net', contactX, contactY + 5, { align: 'left' });

    // خط فاصل
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.3);
    doc.line(margin, margin + 20, pageWidth - margin, margin + 20);
  };

  // دالة لرسم الذييل
  const drawFooter = (pageNumber: number) => {
    const footerY = pageHeight - margin + 5;

    // خط فاصل
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.3);
    doc.line(margin, footerY - 5, pageWidth - margin, footerY - 5);

    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);

    // وقت التصدير على اليسار
    doc.text(metadata.exportDate, margin, footerY, { align: 'left' });

    // "نرعاكم كأهالينا" في المنتصف
    doc.text('نرعاكم كأهالينا', pageWidth / 2, footerY, { align: 'center' });

    // اسم المستخدم على اليمين
    doc.text(metadata.exportedBy, pageWidth - margin, footerY, { align: 'right' });

    // رقم الصفحة
    doc.text(
      `صفحة ${pageNumber}`,
      pageWidth / 2,
      footerY + 5,
      { align: 'center' }
    );
  };

  // رسم الترويسة في الصفحة الأولى
  drawHeader();

  // إضافة metadata
  let currentY = margin + 25;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(metadata.tableName, pageWidth / 2, currentY, { align: 'center' });
  currentY += 8;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  
  if (metadata.dateRange) {
    doc.text(`نطاق التاريخ: ${metadata.dateRange}`, margin, currentY, { align: 'left' });
    currentY += 5;
  }

  if (metadata.filters && Object.keys(metadata.filters).length > 0) {
    doc.text('الفلاتر المستخدمة:', margin, currentY, { align: 'left' });
    currentY += 5;
    Object.entries(metadata.filters).forEach(([key, value]) => {
      doc.text(`  • ${key}: ${value}`, margin + 5, currentY, { align: 'left' });
      currentY += 4;
    });
  }

  doc.text(`إجمالي السجلات: ${metadata.totalRecords}`, margin, currentY, { align: 'left' });
  currentY += 5;
  doc.text(`السجلات المصدرة: ${metadata.exportedRecords}`, margin, currentY, { align: 'left' });
  currentY += 10;

  // إنشاء الجدول
  const tableColumns = columns.map(col => col.label);
  const tableRows = data.map(row => columns.map(col => String(row[col.key] ?? '-')));

  autoTable(doc, {
    head: [tableColumns],
    body: tableRows,
    startY: currentY,
    margin: { top: margin + 25, left: margin, right: margin, bottom: margin + 15 },
    styles: {
      font: 'helvetica',
      fontSize: 8,
      cellPadding: 3,
      halign: 'right',
      valign: 'middle',
    },
    headStyles: {
      fillColor: [0, 128, 96], // لون أخضر
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'center',
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245],
    },
    didDrawPage: (data) => {
      // رسم الترويسة والذييل في كل صفحة
      if (data.pageNumber > 1) {
        drawHeader();
      }
      drawFooter(data.pageNumber);
    },
  });

  // حفظ الملف
  const finalFilename = filename || `${metadata.tableName}-${Date.now()}.pdf`;
  doc.save(finalFilename);
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
