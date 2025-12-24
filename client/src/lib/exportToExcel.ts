import * as XLSX from 'xlsx';

export function exportToExcel(data: any[], filename: string, sheetName: string = 'Sheet1') {
  // Create a new workbook
  const wb = XLSX.utils.book_new();
  
  // Convert data to worksheet
  const ws = XLSX.utils.json_to_sheet(data);
  
  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  
  // Generate file and trigger download
  XLSX.writeFile(wb, `${filename}.xlsx`);
}

export function formatLeadsForExport(leads: any[]) {
  return leads.map(lead => ({
    'الاسم الكامل': lead.fullName,
    'رقم الهاتف': lead.phone,
    'البريد الإلكتروني': lead.email || '-',
    'الحالة': getStatusLabel(lead.status),
    'المصدر': lead.source || '-',
    'تاريخ التسجيل': new Date(lead.createdAt).toLocaleDateString('ar-SA'),
    'ملاحظات': lead.notes || '-',
  }));
}

export function formatAppointmentsForExport(appointments: any[]) {
  return appointments.map(apt => ({
    'الاسم الكامل': apt.fullName,
    'رقم الهاتف': apt.phone,
    'البريد الإلكتروني': apt.email || '-',
    'الطبيب': apt.doctorName || `طبيب #${apt.doctorId}`,
    'التخصص': apt.doctorSpecialty || '-',
    'التاريخ المفضل': apt.preferredDate || '-',
    'الوقت المفضل': apt.preferredTime || '-',
    'الحالة': getAppointmentStatusLabel(apt.status),
    'تاريخ التسجيل': new Date(apt.createdAt).toLocaleDateString('ar-SA'),
    'ملاحظات': apt.notes || '-',
  }));
}

export function formatOfferLeadsForExport(offerLeads: any[]) {
  return offerLeads.map(lead => ({
    'الاسم الكامل': lead.fullName,
    'رقم الهاتف': lead.phone,
    'البريد الإلكتروني': lead.email || '-',
    'العرض': lead.offerTitle || 'غير محدد',
    'الحالة': getStatusLabel(lead.status),
    'المصدر': lead.source || '-',
    'تاريخ التسجيل': new Date(lead.createdAt).toLocaleDateString('ar-SA'),
    'ملاحظات': lead.notes || '-',
  }));
}

export function formatCampRegistrationsForExport(registrations: any[]) {
  return registrations.map(reg => ({
    'الاسم الكامل': reg.fullName,
    'رقم الهاتف': reg.phone,
    'البريد الإلكتروني': reg.email || '-',
    'المخيم': reg.campTitle || 'غير محدد',
    'العمر': reg.age || '-',
    'الحالة الطبية': reg.medicalCondition || '-',
    'الحالة': getCampStatusLabel(reg.status),
    'المصدر': reg.source || '-',
    'تاريخ التسجيل': new Date(reg.createdAt).toLocaleDateString('ar-SA'),
    'ملاحظات': reg.notes || '-',
  }));
}

function getStatusLabel(status: string) {
  const labels: Record<string, string> = {
    new: 'جديد',
    contacted: 'تم التواصل',
    booked: 'تم الحجز',
    not_interested: 'غير مهتم',
    no_answer: 'لم يرد',
  };
  return labels[status] || status;
}

function getAppointmentStatusLabel(status: string) {
  const labels: Record<string, string> = {
    pending: 'قيد الانتظار',
    confirmed: 'مؤكد',
    cancelled: 'ملغي',
    completed: 'مكتمل',
  };
  return labels[status] || status;
}

function getCampStatusLabel(status: string) {
  const labels: Record<string, string> = {
    pending: 'قيد الانتظار',
    confirmed: 'مؤكد',
    attended: 'حضر',
    cancelled: 'ملغي',
  };
  return labels[status] || status;
}
