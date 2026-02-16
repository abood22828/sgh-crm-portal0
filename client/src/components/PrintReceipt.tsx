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
  };
  userName: string; // اسم المستخدم الذي طبع السند
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
  const typeLabels = {
    appointment: "موعد طبيب",
    camp: "تسجيل مخيم",
    offer: "حجز عرض",
  };

  // إنشاء محتوى سند واحد
  const singleReceiptHTML = `
    <div class="receipt">
      <div class="header">
        <img src="/SGHHospitalColorAR.png" alt="المستشفى السعودي الألماني">
        <div class="phone">8000018</div>
      </div>
      
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

  // تكرار المحتوى 4 مرات
  const fourReceipts = singleReceiptHTML.repeat(4);

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
          margin: 0 auto;
          padding: 10mm;
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
          height: 40px;
          object-fit: contain;
        }
        
        .header .phone {
          font-size: 18px;
          font-weight: bold;
          color: #00a651;
        }
        
        .title {
          text-align: center;
          font-size: 16px;
          font-weight: bold;
          margin-bottom: 15px;
          color: #333;
        }
        
        .content {
          font-size: 13px;
          line-height: 1.8;
        }
        
        .row {
          display: flex;
          margin-bottom: 8px;
        }
        
        .label {
          font-weight: bold;
          min-width: 80px;
        }
        
        .footer {
          margin-top: 20px;
          padding-top: 15px;
          border-top: 2px solid #00a651;
        }
        
        .slogan {
          text-align: center;
          font-size: 14px;
          font-weight: bold;
          color: #0088cc;
          margin-bottom: 10px;
        }
        
        .meta {
          display: flex;
          justify-content: space-between;
          font-size: 10px;
          color: #666;
        }
      </style>
    </head>
    <body>
      ${fourReceipts}
      
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
