import { format } from "date-fns";
import { ar } from "date-fns/locale";

interface PrintReceiptProps {
  data: {
    fullName: string;
    phone: string;
    age?: number;
    registrationDate: Date;
    type: "appointment" | "camp" | "offer";
    typeName: string; // اسم الطبيب أو المخيم أو العرض
    receiptNumber?: string; // الرقم التسلسلي للسند
  };
  userName: string; // اسم المستخدم الذي طبع السند
}

// دالة لتنسيق رقم تسلسلي بسيط (SGH-2026-001)
// سيتم توليد الرقم الفعلي من السيرفر لضمان التسلسل الصحيح
function formatReceiptNumber(sequenceNumber: number): string {
  const year = new Date().getFullYear();
  const paddedNumber = String(sequenceNumber).padStart(3, '0');
  return `SGH-${year}-${paddedNumber}`;
}

// معلومات إضافية للطباعة مع رقم تسلسلي
export interface PrintWithNumberData {
  fullName: string;
  phone: string;
  email?: string;
  age?: number;
  type: "appointment" | "camp" | "offer";
  details: {
    doctorName?: string;
    specialty?: string;
    preferredDate?: string;
    preferredTime?: string;
    campName?: string;
    procedures?: string;
    offerName?: string;
  };
  bookingId: number;
}

// دالة helper للطباعة مع توليد رقم تسلسلي
// يجب استدعاء هذه الدالة من داخل React component مع استخدام mutation
export function usePrintWithNumber() {
  // This is a placeholder - actual implementation should be in the component
  // Components should call the mutation first, then call printReceipt with the result
  return {
    printWithNumber: printReceipt,
  };
}

// دالة مساعدة للطباعة
export function printReceipt(data: PrintReceiptProps["data"], userName: string) {
  // إنشاء نافذة طباعة جديدة
  const printWindow = window.open("", "_blank", "width=800,height=600");
  
  if (!printWindow) {
    alert("تعذر فتح نافذة الطباعة. الرجاء السماح بالنوافذ المنبثقة.");
    return;
  }

  // إنشاء HTML للطباعة
  const printDate = new Date();
  // استخدام الرقم التسلسلي من data إن وجد
  const displayNumber = data.receiptNumber || "قيد الإنشاء...";
  const typeLabels = {
    appointment: "موعد طبيب",
    camp: "تسجيل مخيم",
    offer: "حجز عرض",
  };

  // إنشاء محتوى سند واحد
  const singleReceiptHTML = `
    <div class="receipt">
      <div class="header">
        <img src="/sgh-logo-full.png" alt="المستشفى السعودي الألماني">
        <div class="phone">8000018</div>
      </div>
      
      <div class="receipt-number">#${displayNumber}</div>
      <div class="title">سند ${typeLabels[data.type]}</div>
      
      <div class="content">
        <div class="row">
          <span class="label">الاسم:</span>
          <span>${data.fullName}</span>
        </div>
        
        ${data.age ? `
        <div class="row">
          <span class="label">العمر:</span>
          <span>${data.age} سنة</span>
        </div>
        ` : ''}
        
        <div class="row">
          <span class="label">رقم الهاتف:</span>
          <span>${data.phone}</span>
        </div>
        
        <div class="row">
          <span class="label">تاريخ التسجيل:</span>
          <span>${format(data.registrationDate, "dd/MM/yyyy", { locale: ar })}</span>
        </div>
        
        <div class="row">
          <span class="label">نوع الحجز:</span>
          <span>${typeLabels[data.type]}</span>
        </div>
        
        <div class="row">
          <span class="label">${
            data.type === "appointment" ? "اسم الطبيب:" :
            data.type === "camp" ? "اسم المخيم:" : "اسم العرض:"
          }</span>
          <span>${data.typeName}</span>
        </div>
      </div>
      
      <div class="footer">
        <div class="slogan">نرعاكم كأهالينا</div>
        <div class="meta">
          <div>${userName}</div>
          <div>${format(printDate, "dd/MM/yyyy HH:mm", { locale: ar })}</div>
        </div>
      </div>
    </div>
    <div class="page-break"></div>
  `;

  // تكرار المحتوى 2 مرات
  const twoReceipts = singleReceiptHTML.repeat(2);

  const receiptHTML = `
    <!DOCTYPE html>
    <html lang="ar" dir="rtl">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>سند ${typeLabels[data.type]}</title>
      <style>
        @media print {
          @page {
            size: 80mm auto;
            margin: 0;
          }
          body {
            margin: 0;
            padding: 0;
          }
          .page-break {
            page-break-after: always;
          }
          .receipt-number {
            page-break-inside: avoid;
          }
        }
        
        body {
          font-family: Arial, sans-serif;
          direction: rtl;
          margin: 0;
          padding: 0;
          background-color: white;
        }
        
        .receipt {
          width: 80mm;
          max-width: 80mm;
          margin: 0 auto;
          padding: 8mm 5mm;
          box-sizing: border-box;
        }
        
        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 15px;
          border-bottom: 2px solid #00a651;
          padding-bottom: 10px;
        }
        
        .header img {
          height: 35px;
          max-width: 120px;
          object-fit: contain;
        }
        
        .header .phone {
          font-size: 18px;
          font-weight: bold;
          color: #00a651;
        }
        
        .receipt-number {
          text-align: center;
          font-size: 11px;
          font-weight: bold;
          color: #666;
          margin-bottom: 8px;
          font-family: 'Courier New', monospace;
          letter-spacing: 0.5px;
        }
        
        .title {
          text-align: center;
          font-size: 15px;
          font-weight: bold;
          margin-bottom: 12px;
          color: #333;
          border-bottom: 1px dashed #ccc;
          padding-bottom: 8px;
        }
        
        .content {
          font-size: 12px;
          line-height: 1.6;
        }
        
        .row {
          display: flex;
          margin-bottom: 6px;
          padding: 3px 0;
        }
        
        .label {
          font-weight: bold;
          min-width: 75px;
          color: #555;
        }
        
        .footer {
          margin-top: 15px;
          padding-top: 12px;
          border-top: 1px dashed #00a651;
        }
        
        .slogan {
          text-align: center;
          font-size: 13px;
          font-weight: bold;
          color: #0088cc;
          margin-bottom: 8px;
        }
        
        .meta {
          display: flex;
          justify-content: space-between;
          font-size: 9px;
          color: #666;
          padding-top: 5px;
        }
      </style>
    </head>
    <body>
      ${twoReceipts}
      
      <script>
        window.onload = function() {
          // طباعة تلقائية
          window.print();
          // إغلاق النافذة بعد الطباعة
          setTimeout(() => window.close(), 1000);
        };
      </script>
    </body>
    </html>
  `;

  printWindow.document.write(receiptHTML);
  printWindow.document.close();
}
