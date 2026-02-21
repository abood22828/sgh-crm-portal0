import PDFDocument from 'pdfkit';
import { Readable } from 'stream';

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
 * خيارات إنشاء PDF
 */
export interface PDFOptions {
  metadata: ExportMetadata;
  columns: Array<{ key: string; label: string }>;
  data: Array<Record<string, any>>;
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
 * إنشاء ترويسة PDF
 */
function addHeader(doc: PDFKit.PDFDocument, metadata: ExportMetadata) {
  // شعار المستشفى (سيتم تحميله من الملف)
  const logoPath = '/home/ubuntu/sgh-crm-portal/client/public/sgh-logo-full.png';
  
  try {
    // إضافة الشعار على اليمين
    doc.image(logoPath, doc.page.width - 200, 30, { width: 150 });
  } catch (error) {
    console.warn('Could not load logo:', error);
  }

  // معلومات الاتصال على اليسار
  doc
    .fontSize(10)
    .font('Helvetica')
    .text('8000018', 50, 40, { align: 'left' })
    .text('info@sghsanaa.net', 50, 55, { align: 'left' });

  // خط فاصل
  doc
    .moveTo(50, 100)
    .lineTo(doc.page.width - 50, 100)
    .stroke();

  // عنوان الجدول
  doc
    .fontSize(16)
    .font('Helvetica-Bold')
    .text(metadata.tableName, 50, 120, {
      align: 'center',
      width: doc.page.width - 100,
    });

  // معلومات إضافية
  let yPos = 150;
  
  if (metadata.dateRange) {
    doc
      .fontSize(10)
      .font('Helvetica')
      .text(`نطاق التاريخ: ${metadata.dateRange}`, 50, yPos, { align: 'right' });
    yPos += 20;
  }

  if (metadata.filters && Object.keys(metadata.filters).length > 0) {
    const filtersText = Object.entries(metadata.filters)
      .map(([key, value]) => `${key}: ${value}`)
      .join(' | ');
    doc.text(`الفلاتر: ${filtersText}`, 50, yPos, { align: 'right' });
    yPos += 20;
  }

  doc.text(
    `إجمالي السجلات: ${metadata.totalRecords} | السجلات المصدرة: ${metadata.exportedRecords}`,
    50,
    yPos,
    { align: 'right' }
  );

  return yPos + 30;
}

/**
 * إنشاء ذييل PDF
 */
function addFooter(doc: PDFKit.PDFDocument, metadata: ExportMetadata) {
  const pageHeight = doc.page.height;
  const footerY = pageHeight - 50;

  // خط فاصل
  doc
    .moveTo(50, footerY - 10)
    .lineTo(doc.page.width - 50, footerY - 10)
    .stroke();

  // وقت التصدير على اليسار
  doc
    .fontSize(9)
    .font('Helvetica')
    .text(metadata.exportDate, 50, footerY, { align: 'left' });

  // شعار "نرعاكم كأهالينا" في المنتصف
  doc.text('نرعاكم كأهالينا', 0, footerY, {
    align: 'center',
    width: doc.page.width,
  });

  // اسم المستخدم على اليمين
  doc.text(metadata.exportedBy, doc.page.width - 200, footerY, {
    align: 'right',
    width: 150,
  });
}

/**
 * إنشاء جدول في PDF مع دعم RTL
 */
function addTable(
  doc: PDFKit.PDFDocument,
  columns: Array<{ key: string; label: string }>,
  data: Array<Record<string, any>>,
  startY: number
) {
  const tableTop = startY;
  const tableLeft = 50;
  const tableWidth = doc.page.width - 100;
  const columnWidth = tableWidth / columns.length;
  const rowHeight = 25;

  let yPos = tableTop;

  // رسم رؤوس الأعمدة (معكوسة لـ RTL)
  doc
    .fontSize(10)
    .font('Helvetica-Bold')
    .fillColor('#2D6A4F');

  // عكس ترتيب الأعمدة لـ RTL
  const reversedColumns = [...columns].reverse();

  reversedColumns.forEach((col, index) => {
    const xPos = tableLeft + index * columnWidth;
    doc
      .rect(xPos, yPos, columnWidth, rowHeight)
      .fillAndStroke('#E8F5E9', '#2D6A4F');
    
    doc
      .fillColor('#000')
      .text(col.label, xPos + 5, yPos + 7, {
        width: columnWidth - 10,
        align: 'center',
      });
  });

  yPos += rowHeight;

  // رسم صفوف البيانات
  doc.fontSize(9).font('Helvetica');

  data.forEach((row, rowIndex) => {
    // التحقق من الحاجة لصفحة جديدة
    if (yPos > doc.page.height - 100) {
      doc.addPage();
      yPos = 50;
    }

    const fillColor = rowIndex % 2 === 0 ? '#FFFFFF' : '#F5F5F5';

    reversedColumns.forEach((col, colIndex) => {
      const xPos = tableLeft + colIndex * columnWidth;
      const cellValue = row[col.key]?.toString() || '-';

      doc
        .rect(xPos, yPos, columnWidth, rowHeight)
        .fillAndStroke(fillColor, '#CCCCCC');

      doc
        .fillColor('#000')
        .text(cellValue, xPos + 5, yPos + 7, {
          width: columnWidth - 10,
          align: 'center',
          ellipsis: true,
        });
    });

    yPos += rowHeight;
  });
}

/**
 * إنشاء PDF كـ Buffer
 */
export async function generatePDF(options: PDFOptions): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      // إنشاء مستند PDF
      const doc = new PDFDocument({
        size: 'A4',
        layout: 'landscape',
        margins: { top: 50, bottom: 50, left: 50, right: 50 },
      });

      const chunks: Buffer[] = [];

      // جمع البيانات
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // إضافة الترويسة
      const contentStartY = addHeader(doc, options.metadata);

      // إضافة الجدول
      addTable(doc, options.columns, options.data, contentStartY);

      // إضافة الذييل
      addFooter(doc, options.metadata);

      // إنهاء المستند
      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}
