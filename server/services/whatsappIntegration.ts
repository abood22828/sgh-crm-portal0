import { eq, and } from "drizzle-orm";
import { getDb } from "../db";
import * as whatsappServiceModule from "./whatsappService";
import * as whatsappTemplatesModule from "./whatsappTemplates";
import * as whatsappSchedulerModule from "./whatsappScheduler";
import {
  appointments,
  campRegistrations,
  offerLeads,
  doctors,
  camps,
  offers,
  whatsappTemplates,
} from "../../drizzle/schema";

/**
 * WhatsApp Integration Service
 * ربط التسجيلات والحجوزات مع WhatsApp Cloud API باستخدام القوالب المعتمدة من Meta
 */

// ============================================
// تأكيدات الحجوزات التلقائية (باستخدام القوالب)
// ============================================

/**
 * إرسال تأكيد حجز موعد طبي تلقائياً باستخدام قالب معتمد من Meta
 */
export async function sendAppointmentConfirmation(appointmentId: number) {
  try {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // جلب بيانات الموعد
    const appointment = await db
      .select()
      .from(appointments)
      .where(eq(appointments.id, appointmentId))
      .limit(1);

    if (!appointment || appointment.length === 0) {
      throw new Error("Appointment not found");
    }

    const apt = appointment[0];

    // جلب بيانات الطبيب
    const doctor = await db
      .select()
      .from(doctors)
      .where(eq(doctors.id, apt.doctorId))
      .limit(1);

    if (!doctor || doctor.length === 0) {
      throw new Error("Doctor not found");
    }

    const doc = doctor[0];

    // جلب قالب التأكيد المعتمد من Meta
    const template = await db
      .select()
      .from(whatsappTemplates)
      .where(
        and(
          eq(whatsappTemplates.metaName, "appointment_confirmation_ar"),
          eq(whatsappTemplates.metaStatus, "APPROVED")
        )
      )
      .limit(1);

    if (!template || template.length === 0) {
      throw new Error("Template 'appointment_confirmation_ar' not found or not approved");
    }

    const tmpl = template[0];

    // تحضير المتغيرات
    const parameters = [
      apt.fullName,
      doc.name,
      doc.specialty || "عام",
      apt.appointmentDate
        ? new Date(apt.appointmentDate).toLocaleDateString("ar-YE")
        : "قريباً",
      apt.preferredTime || "حسب الحاجة",
    ];

    // إرسال الرسالة عبر القالب المعتمد
    const result = await whatsappTemplatesModule.sendTemplateMessage({
      phone: apt.phone,
      templateName: tmpl.metaName || "appointment_confirmation_ar",
      language: "ar",
      parameters: parameters.map((value) => ({
        type: "text" as const,
        value,
      })),
    });

    if (!result.success) {
      throw new Error(result.error || "Failed to send template message");
    }

    // تحديث حالة الموعد
    await db
      .update(appointments)
      .set({
        status: "confirmed",
        confirmedAt: new Date(),
      })
      .where(eq(appointments.id, appointmentId));

    return { success: true, message: "Confirmation sent successfully using approved template" };
  } catch (error) {
    console.error("[WhatsApp Integration] Error sending appointment confirmation:", error);
    throw error;
  }
}

/**
 * إرسال تأكيد تسجيل مخيم تلقائياً باستخدام قالب معتمد من Meta
 */
export async function sendCampRegistrationConfirmation(campRegistrationId: number) {
  try {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // جلب بيانات التسجيل
    const registration = await db
      .select()
      .from(campRegistrations)
      .where(eq(campRegistrations.id, campRegistrationId))
      .limit(1);

    if (!registration || registration.length === 0) {
      throw new Error("Camp registration not found");
    }

    const reg = registration[0];

    // جلب بيانات المخيم
    const camp = await db
      .select()
      .from(camps)
      .where(eq(camps.id, reg.campId))
      .limit(1);

    if (!camp || camp.length === 0) {
      throw new Error("Camp not found");
    }

    const campData = camp[0];

    // جلب قالب التأكيد المعتمد من Meta
    const template = await db
      .select()
      .from(whatsappTemplates)
      .where(
        and(
          eq(whatsappTemplates.metaName, "camp_registration_confirmation_ar"),
          eq(whatsappTemplates.metaStatus, "APPROVED")
        )
      )
      .limit(1);

    if (!template || template.length === 0) {
      throw new Error("Template 'camp_registration_confirmation_ar' not found or not approved");
    }

    const tmpl = template[0];

    // تحضير المتغيرات
    const parameters = [
      reg.fullName,
      campData.name,
      campData.startDate
        ? new Date(campData.startDate).toLocaleDateString("ar-YE")
        : "قريباً",
      campData.endDate
        ? new Date(campData.endDate).toLocaleDateString("ar-YE")
        : "قريباً",
      "شارع الستين الشمالي - صنعاء",
      "عام",
    ];

    // إرسال الرسالة عبر القالب المعتمد
    const result = await whatsappTemplatesModule.sendTemplateMessage({
      phone: reg.phone,
      templateName: tmpl.metaName || "camp_registration_confirmation_ar",
      language: "ar",
      parameters: parameters.map((value) => ({
        type: "text" as const,
        value,
      })),
    });

    if (!result.success) {
      throw new Error(result.error || "Failed to send template message");
    }

    // تحديث حالة التسجيل
    await db
      .update(campRegistrations)
      .set({
        status: "confirmed",
        confirmedAt: new Date(),
      })
      .where(eq(campRegistrations.id, campRegistrationId));

    return { success: true, message: "Camp confirmation sent successfully using approved template" };
  } catch (error) {
    console.error("[WhatsApp Integration] Error sending camp confirmation:", error);
    throw error;
  }
}

/**
 * إرسال تأكيد حجز عرض تلقائياً باستخدام قالب معتمد من Meta
 */
export async function sendOfferLeadConfirmation(offerLeadId: number) {
  try {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // جلب بيانات طلب العرض
    const offerLead = await db
      .select()
      .from(offerLeads)
      .where(eq(offerLeads.id, offerLeadId))
      .limit(1);

    if (!offerLead || offerLead.length === 0) {
      throw new Error("Offer lead not found");
    }

    const lead = offerLead[0];

    // جلب بيانات العرض
    const offer = await db
      .select()
      .from(offers)
      .where(eq(offers.id, lead.offerId))
      .limit(1);

    if (!offer || offer.length === 0) {
      throw new Error("Offer not found");
    }

    const offerData = offer[0];

    // جلب قالب التأكيد المعتمد من Meta
    const template = await db
      .select()
      .from(whatsappTemplates)
      .where(
        and(
          eq(whatsappTemplates.metaName, "offer_booking_confirmation_ar"),
          eq(whatsappTemplates.metaStatus, "APPROVED")
        )
      )
      .limit(1);

    if (!template || template.length === 0) {
      throw new Error("Template 'offer_booking_confirmation_ar' not found or not approved");
    }

    const tmpl = template[0];

    // تحضير المتغيرات
    const parameters = [
      lead.fullName,
      offerData.title || "عرض خاص",
      offerData.description || "تفاصيل العرض",
      offerData.endDate
        ? new Date(offerData.endDate).toLocaleDateString("ar-YE")
        : "قريباً",
    ];

    // إرسال الرسالة عبر القالب المعتمد
    const result = await whatsappTemplatesModule.sendTemplateMessage({
      phone: lead.phone,
      templateName: tmpl.metaName || "offer_booking_confirmation_ar",
      language: "ar",
      parameters: parameters.map((value) => ({
        type: "text" as const,
        value,
      })),
    });

    if (!result.success) {
      throw new Error(result.error || "Failed to send template message");
    }

    // تحديث حالة الطلب
    await db
      .update(offerLeads)
      .set({
        status: "confirmed",
        confirmedAt: new Date(),
      })
      .where(eq(offerLeads.id, offerLeadId));

    return { success: true, message: "Offer confirmation sent successfully using approved template" };
  } catch (error) {
    console.error("[WhatsApp Integration] Error sending offer confirmation:", error);
    throw error;
  }
}

// ============================================
// التذكيرات المجدولة (باستخدام القوالب)
// ============================================

/**
 * إرسال تذكير قبل الموعد الطبي (24 ساعة) باستخدام قالب معتمد من Meta
 */
export async function scheduleAppointmentReminder24h(appointmentId: number) {
  try {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const appointment = await db
      .select()
      .from(appointments)
      .where(eq(appointments.id, appointmentId))
      .limit(1);

    if (!appointment || appointment.length === 0) {
      throw new Error("Appointment not found");
    }

    const apt = appointment[0];

    if (!apt.appointmentDate) {
      throw new Error("Appointment date not set");
    }

    // جلب بيانات الطبيب
    const doctor = await db
      .select()
      .from(doctors)
      .where(eq(doctors.id, apt.doctorId))
      .limit(1);

    if (!doctor || doctor.length === 0) {
      throw new Error("Doctor not found");
    }

    const doc = doctor[0];

    // جلب قالب التذكير المعتمد من Meta
    const template = await db
      .select()
      .from(whatsappTemplates)
      .where(
        and(
          eq(whatsappTemplates.metaName, "appointment_reminder_24h_ar"),
          eq(whatsappTemplates.metaStatus, "APPROVED")
        )
      )
      .limit(1);

    if (!template || template.length === 0) {
      throw new Error("Template 'appointment_reminder_24h_ar' not found or not approved");
    }

    const tmpl = template[0];

    // تحضير المتغيرات
    const parameters = [
      apt.fullName,
      doc.name,
      apt.preferredTime || "حسب الحاجة",
    ];

    // إرسال الرسالة عبر القالب المعتمد
    const result = await whatsappTemplatesModule.sendTemplateMessage({
      phone: apt.phone,
      templateName: tmpl.metaName || "appointment_reminder_24h_ar",
      language: "ar",
      parameters: parameters.map((value) => ({
        type: "text" as const,
        value,
      })),
    });

    if (!result.success) {
      throw new Error(result.error || "Failed to send template message");
    }

    return { success: true, message: "24h reminder scheduled successfully using approved template" };
  } catch (error) {
    console.error("[WhatsApp Integration] Error scheduling 24h reminder:", error);
    throw error;
  }
}

/**
 * إرسال تذكير قبل الموعد الطبي (1 ساعة) باستخدام قالب معتمد من Meta
 */
export async function scheduleAppointmentReminder1h(appointmentId: number) {
  try {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const appointment = await db
      .select()
      .from(appointments)
      .where(eq(appointments.id, appointmentId))
      .limit(1);

    if (!appointment || appointment.length === 0) {
      throw new Error("Appointment not found");
    }

    const apt = appointment[0];

    if (!apt.appointmentDate) {
      throw new Error("Appointment date not set");
    }

    // جلب قالب التذكير المعتمد من Meta
    const template = await db
      .select()
      .from(whatsappTemplates)
      .where(
        and(
          eq(whatsappTemplates.metaName, "appointment_reminder_1h_ar"),
          eq(whatsappTemplates.metaStatus, "APPROVED")
        )
      )
      .limit(1);

    if (!template || template.length === 0) {
      throw new Error("Template 'appointment_reminder_1h_ar' not found or not approved");
    }

    const tmpl = template[0];

    // تحضير المتغيرات
    const parameters = [
      apt.fullName,
      "8000018", // رقم المستشفى المجاني
    ];

    // إرسال الرسالة عبر القالب المعتمد
    const result = await whatsappTemplatesModule.sendTemplateMessage({
      phone: apt.phone,
      templateName: tmpl.metaName || "appointment_reminder_1h_ar",
      language: "ar",
      parameters: parameters.map((value) => ({
        type: "text" as const,
        value,
      })),
    });

    if (!result.success) {
      throw new Error(result.error || "Failed to send template message");
    }

    return { success: true, message: "1h reminder scheduled successfully using approved template" };
  } catch (error) {
    console.error("[WhatsApp Integration] Error scheduling 1h reminder:", error);
    throw error;
  }
}

// ============================================
// تحديثات حالة الحجز (باستخدام القوالب)
// ============================================

/**
 * إرسال تحديث حالة الموعد الطبي باستخدام قالب معتمد من Meta
 */
export async function sendAppointmentStatusUpdate(
  appointmentId: number,
  newStatus: string,
  reason?: string
) {
  try {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const appointment = await db
      .select()
      .from(appointments)
      .where(eq(appointments.id, appointmentId))
      .limit(1);

    if (!appointment || appointment.length === 0) {
      throw new Error("Appointment not found");
    }

    const apt = appointment[0];

    // جلب بيانات الطبيب
    const doctor = await db
      .select()
      .from(doctors)
      .where(eq(doctors.id, apt.doctorId))
      .limit(1);

    if (!doctor || doctor.length === 0) {
      throw new Error("Doctor not found");
    }

    const doc = doctor[0];

    // تحديد القالب بناءً على الحالة الجديدة
    let templateName = "";
    let parameters: string[] = [];

    switch (newStatus) {
      case "confirmed":
        templateName = "appointment_status_confirmed_ar";
        parameters = [
          apt.fullName,
          apt.appointmentDate
            ? new Date(apt.appointmentDate).toLocaleDateString("ar-YE")
            : "قريباً",
          apt.preferredTime || "حسب الحاجة",
          doc.name,
        ];
        break;

      case "cancelled":
        templateName = "appointment_status_cancelled_ar";
        parameters = [
          apt.fullName,
          apt.appointmentDate
            ? new Date(apt.appointmentDate).toLocaleDateString("ar-YE")
            : "قريباً",
          reason || "لم يتم تحديد السبب",
          "8000018",
        ];
        break;

      case "rescheduled":
        templateName = "appointment_status_rescheduled_ar";
        parameters = [
          apt.fullName,
          apt.appointmentDate
            ? new Date(apt.appointmentDate).toLocaleDateString("ar-YE")
            : "قريباً",
          apt.preferredTime || "حسب الحاجة",
          doc.name,
        ];
        break;

      case "completed":
        templateName = "appointment_status_completed_ar";
        parameters = [apt.fullName, "8000018"];
        break;

      default:
        throw new Error(`Unsupported status: ${newStatus}`);
    }

    // جلب القالب المعتمد من Meta
    const template = await db
      .select()
      .from(whatsappTemplates)
      .where(
        and(
          eq(whatsappTemplates.metaName, templateName),
          eq(whatsappTemplates.metaStatus, "APPROVED")
        )
      )
      .limit(1);

    if (!template || template.length === 0) {
      throw new Error(`Template '${templateName}' not found or not approved`);
    }

    const tmpl = template[0];

    // إرسال الرسالة عبر القالب المعتمد
    const result = await whatsappTemplatesModule.sendTemplateMessage({
      phone: apt.phone,
      templateName: tmpl.metaName || templateName,
      language: "ar",
      parameters: parameters.map((value) => ({
        type: "text" as const,
        value,
      })),
    });

    if (!result.success) {
      throw new Error(result.error || "Failed to send template message");
    }

    return { success: true, message: "Status update sent successfully using approved template" };
  } catch (error) {
    console.error("[WhatsApp Integration] Error sending status update:", error);
    throw error;
  }
}

/**
 * إرسال تحديث حالة تسجيل المخيم باستخدام قالب معتمد من Meta
 */
export async function sendCampRegistrationStatusUpdate(
  campRegistrationId: number,
  newStatus: string,
  reason?: string
) {
  try {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const registration = await db
      .select()
      .from(campRegistrations)
      .where(eq(campRegistrations.id, campRegistrationId))
      .limit(1);

    if (!registration || registration.length === 0) {
      throw new Error("Camp registration not found");
    }

    const reg = registration[0];

    // جلب بيانات المخيم
    const camp = await db
      .select()
      .from(camps)
      .where(eq(camps.id, reg.campId))
      .limit(1);

    if (!camp || camp.length === 0) {
      throw new Error("Camp not found");
    }

    const campData = camp[0];

    // تحديد القالب بناءً على الحالة الجديدة
    let templateName = "";
    let parameters: string[] = [];

    switch (newStatus) {
      case "confirmed":
        templateName = "camp_registration_confirmed_ar";
        parameters = [
          reg.fullName,
          campData.name,
          campData.startDate
            ? new Date(campData.startDate).toLocaleDateString("ar-YE")
            : "قريباً",
        ];
        break;

      case "cancelled":
        templateName = "camp_cancellation_ar";
        parameters = [
          reg.fullName,
          campData.name,
          reason || "لم يتم تحديد السبب",
          "8000018",
        ];
        break;

      default:
        throw new Error(`Unsupported status: ${newStatus}`);
    }

    // جلب القالب المعتمد من Meta
    const template = await db
      .select()
      .from(whatsappTemplates)
      .where(
        and(
          eq(whatsappTemplates.metaName, templateName),
          eq(whatsappTemplates.metaStatus, "APPROVED")
        )
      )
      .limit(1);

    if (!template || template.length === 0) {
      throw new Error(`Template '${templateName}' not found or not approved`);
    }

    const tmpl = template[0];

    // إرسال الرسالة عبر القالب المعتمد
    const result = await whatsappTemplatesModule.sendTemplateMessage({
      phone: reg.phone,
      templateName: tmpl.metaName || templateName,
      language: "ar",
      parameters: parameters.map((value) => ({
        type: "text" as const,
        value,
      })),
    });

    if (!result.success) {
      throw new Error(result.error || "Failed to send template message");
    }

    return { success: true, message: "Camp status update sent successfully using approved template" };
  } catch (error) {
    console.error("[WhatsApp Integration] Error sending camp status update:", error);
    throw error;
  }
}

/**
 * إرسال تحديث حالة طلب العرض باستخدام قالب معتمد من Meta
 */
export async function sendOfferLeadStatusUpdate(
  offerLeadId: number,
  newStatus: string,
  reason?: string
) {
  try {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const offerLead = await db
      .select()
      .from(offerLeads)
      .where(eq(offerLeads.id, offerLeadId))
      .limit(1);

    if (!offerLead || offerLead.length === 0) {
      throw new Error("Offer lead not found");
    }

    const lead = offerLead[0];

    // جلب بيانات العرض
    const offer = await db
      .select()
      .from(offers)
      .where(eq(offers.id, lead.offerId))
      .limit(1);

    if (!offer || offer.length === 0) {
      throw new Error("Offer not found");
    }

    const offerData = offer[0];

    // تحديد القالب بناءً على الحالة الجديدة
    let templateName = "";
    let parameters: string[] = [];

    switch (newStatus) {
      case "confirmed":
        templateName = "offer_booking_confirmed_ar";
        parameters = [
          lead.fullName,
          offerData.title || "عرض خاص",
          "تم تأكيد حجزك",
        ];
        break;

      case "cancelled":
        templateName = "offer_cancellation_ar";
        parameters = [
          lead.fullName,
          offerData.title || "عرض خاص",
          offerData.endDate
            ? new Date(offerData.endDate).toLocaleDateString("ar-YE")
            : "قريباً",
          "8000018",
        ];
        break;

      default:
        throw new Error(`Unsupported status: ${newStatus}`);
    }

    // جلب القالب المعتمد من Meta
    const template = await db
      .select()
      .from(whatsappTemplates)
      .where(
        and(
          eq(whatsappTemplates.metaName, templateName),
          eq(whatsappTemplates.metaStatus, "APPROVED")
        )
      )
      .limit(1);

    if (!template || template.length === 0) {
      throw new Error(`Template '${templateName}' not found or not approved`);
    }

    const tmpl = template[0];

    // إرسال الرسالة عبر القالب المعتمد
    const result = await whatsappTemplatesModule.sendTemplateMessage({
      phone: lead.phone,
      templateName: tmpl.metaName || templateName,
      language: "ar",
      parameters: parameters.map((value) => ({
        type: "text" as const,
        value,
      })),
    });

    if (!result.success) {
      throw new Error(result.error || "Failed to send template message");
    }

    return { success: true, message: "Offer status update sent successfully using approved template" };
  } catch (error) {
    console.error("[WhatsApp Integration] Error sending offer status update:", error);
    throw error;
  }
}
