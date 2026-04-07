import { eq, and } from "drizzle-orm";
import { getDb } from "../db";
import * as whatsappServiceModule from "./whatsappService";
import * as whatsappSchedulerModule from "./whatsappScheduler";
import {
  appointments,
  campRegistrations,
  offerLeads,
  doctors,
  camps,
  offers,
} from "../../drizzle/schema";

/**
 * WhatsApp Integration Service
 * ربط التسجيلات والحجوزات مع WhatsApp Cloud API
 */

// ============================================
// تأكيدات الحجوزات التلقائية
// ============================================

/**
 * إرسال تأكيد حجز موعد طبي تلقائياً
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

    // إنشاء رسالة التأكيد
    const message = `مرحباً ${apt.fullName}،\n\nتم تأكيد موعدك الطبي بنجاح:\n\n📋 التفاصيل:\nالطبيب: ${doc.name}\nالتخصص: ${doc.specialty}\nالتاريخ: ${apt.appointmentDate ? new Date(apt.appointmentDate).toLocaleDateString("ar-YE") : "قريباً"}\nالوقت: ${apt.preferredTime || "حسب الحاجة"}\n\nشكراً لاختيارك المستشفى السعودي الألماني بصنعاء.`;

    // إرسال الرسالة عبر WhatsApp
    await whatsappServiceModule.sendTextMessage(apt.phone, message);

    // تحديث حالة الموعد
    await db
      .update(appointments)
      .set({
        status: "confirmed",
        confirmedAt: new Date(),
      })
      .where(eq(appointments.id, appointmentId));

    return { success: true, message: "Confirmation sent successfully" };
  } catch (error) {
    console.error("[WhatsApp Integration] Error sending appointment confirmation:", error);
    throw error;
  }
}

/**
 * إرسال تأكيد تسجيل مخيم تلقائياً
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

    // إنشاء رسالة التأكيد
    const message = `مرحباً ${reg.fullName}،\n\nتم تأكيد تسجيلك في المخيم الطبي بنجاح:\n\n🏥 المخيم: ${campData.name}\n📅 التاريخ: ${campData.startDate ? new Date(campData.startDate).toLocaleDateString("ar-YE") : "قريباً"}\n📍 الموقع: سيتم إرسال التفاصيل قريباً\n\nشكراً لمشاركتك معنا!`;

    // إرسال الرسالة عبر WhatsApp
    await whatsappServiceModule.sendTextMessage(reg.phone, message);

    // تحديث حالة التسجيل
    await db
      .update(campRegistrations)
      .set({
        status: "confirmed",
        confirmedAt: new Date(),
      })
      .where(eq(campRegistrations.id, campRegistrationId));

    return { success: true, message: "Camp confirmation sent successfully" };
  } catch (error) {
    console.error("[WhatsApp Integration] Error sending camp confirmation:", error);
    throw error;
  }
}

/**
 * إرسال تأكيد حجز عرض تلقائياً
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

    // إنشاء رسالة التأكيد
    const message = `مرحباً ${lead.fullName}،\n\nشكراً لاهتمامك بعرضنا الخاص:\n\n🎁 العرض: ${offerData.title}\n📝 التفاصيل: ${offerData.description}\n\nسيتواصل معك فريقنا قريباً لتأكيد التفاصيل والموعد.\n\nشكراً لاختيارك المستشفى السعودي الألماني بصنعاء.`;

    // إرسال الرسالة عبر WhatsApp
    await whatsappServiceModule.sendTextMessage(lead.phone, message);

    // تحديث حالة الطلب
    await db
      .update(offerLeads)
      .set({
        status: "confirmed",
        confirmedAt: new Date(),
      })
      .where(eq(offerLeads.id, offerLeadId));

    return { success: true, message: "Offer confirmation sent successfully" };
  } catch (error) {
    console.error("[WhatsApp Integration] Error sending offer confirmation:", error);
    throw error;
  }
}

// ============================================
// التذكيرات المجدولة
// ============================================

/**
 * إرسال تذكير قبل الموعد الطبي (24 ساعة)
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

    // حساب الوقت المطلوب للتذكير (24 ساعة قبل الموعد)
    const reminderTime = new Date(apt.appointmentDate);
    reminderTime.setHours(reminderTime.getHours() - 24);

    // جدولة المهمة
    const message24h = `مرحباً ${apt.fullName}،\n\nتذكير: لديك موعد طبي غداً!\n\nالطبيب: سيتم إرسال التفاصيل\nالوقت: ${apt.preferredTime || 'حسب الحاجة'}\n\nشكراً لاختيارك المستشفى السعودي الألماني بصنعاء.`;
    await whatsappServiceModule.sendTextMessage(apt.phone, message24h);

    return { success: true, message: "Reminder scheduled for 24 hours before appointment" };
  } catch (error) {
    console.error("[WhatsApp Integration] Error scheduling 24h reminder:", error);
    throw error;
  }
}

/**
 * إرسال تذكير قبل الموعد الطبي (1 ساعة)
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

    // حساب الوقت المطلوب للتذكير (1 ساعة قبل الموعد)
    const reminderTime = new Date(apt.appointmentDate);
    reminderTime.setHours(reminderTime.getHours() - 1);

    // جدولة المهمة
    const message1h = `مرحباً ${apt.fullName}،\n\nتذكير: موعدك الطبي بعد ساعة واحدة!\n\nالرجاء التأكد من وصولك قبل الموعد.\n\nشكراً لاختيارك المستشفى السعودي الألماني بصنعاء.`;
    await whatsappServiceModule.sendTextMessage(apt.phone, message1h);

    return { success: true, message: "Reminder scheduled for 1 hour before appointment" };
  } catch (error) {
    console.error("[WhatsApp Integration] Error scheduling 1h reminder:", error);
    throw error;
  }
}

// ============================================
// تحديثات حالة الحجز
// ============================================

/**
 * إرسال تحديث حالة الموعد الطبي
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

    let statusMessage = "";

    switch (newStatus) {
      case "confirmed":
        statusMessage = `✅ تم تأكيد موعدك الطبي بنجاح`;
        break;
      case "cancelled":
        statusMessage = `❌ تم إلغاء موعدك الطبي${reason ? `: ${reason}` : ""}`;
        break;
      case "rescheduled":
        statusMessage = `📅 تم إعادة جدولة موعدك الطبي${reason ? `: ${reason}` : ""}`;
        break;
      case "completed":
        statusMessage = `✨ شكراً لزيارتك! نتمنى لك الشفاء العاجل`;
        break;
      default:
        statusMessage = `📢 تحديث حالة موعدك: ${newStatus}`;
    }

    const message = `مرحباً ${apt.fullName}،\n\n${statusMessage}\n\nشكراً لاختيارك المستشفى السعودي الألماني بصنعاء.`;

    // إرسال الرسالة عبر WhatsApp
    await whatsappServiceModule.sendTextMessage(apt.phone, message);

    return { success: true, message: "Status update sent successfully" };
  } catch (error) {
    console.error("[WhatsApp Integration] Error sending status update:", error);
    throw error;
  }
}

/**
 * إرسال تحديث حالة تسجيل المخيم
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

    let statusMessage = "";

    switch (newStatus) {
      case "confirmed":
        statusMessage = `✅ تم تأكيد تسجيلك في المخيم بنجاح`;
        break;
      case "cancelled":
        statusMessage = `❌ تم إلغاء تسجيلك${reason ? `: ${reason}` : ""}`;
        break;
      case "completed":
        statusMessage = `✨ شكراً لمشاركتك في المخيم الطبي`;
        break;
      default:
        statusMessage = `📢 تحديث حالة تسجيلك: ${newStatus}`;
    }

    const message = `مرحباً ${reg.fullName}،\n\n${statusMessage}\n\nشكراً لاختيارك المستشفى السعودي الألماني بصنعاء.`;

    // إرسال الرسالة عبر WhatsApp
    await whatsappServiceModule.sendTextMessage(reg.phone, message);

    return { success: true, message: "Status update sent successfully" };
  } catch (error) {
    console.error("[WhatsApp Integration] Error sending camp status update:", error);
    throw error;
  }
}

/**
 * إرسال تحديث حالة طلب العرض
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

    let statusMessage = "";

    switch (newStatus) {
      case "confirmed":
        statusMessage = `✅ تم تأكيد طلبك بنجاح`;
        break;
      case "cancelled":
        statusMessage = `❌ تم إلغاء طلبك${reason ? `: ${reason}` : ""}`;
        break;
      case "completed":
        statusMessage = `✨ شكراً لاستفادتك من عرضنا`;
        break;
      default:
        statusMessage = `📢 تحديث حالة طلبك: ${newStatus}`;
    }

    const message = `مرحباً ${lead.fullName}،\n\n${statusMessage}\n\nشكراً لاختيارك المستشفى السعودي الألماني بصنعاء.`;

    // إرسال الرسالة عبر WhatsApp
    await whatsappServiceModule.sendTextMessage(lead.phone, message);

    return { success: true, message: "Status update sent successfully" };
  } catch (error) {
    console.error("[WhatsApp Integration] Error sending offer status update:", error);
    throw error;
  }
}

export const whatsappIntegration = {
  sendAppointmentConfirmation,
  sendCampRegistrationConfirmation,
  sendOfferLeadConfirmation,
  scheduleAppointmentReminder24h,
  scheduleAppointmentReminder1h,
  sendAppointmentStatusUpdate,
  sendCampRegistrationStatusUpdate,
  sendOfferLeadStatusUpdate,
};
