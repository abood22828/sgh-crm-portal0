/**
 * WhatsApp API integration
 * Sends WhatsApp messages to customers using WhatsApp Business Cloud API
 * 
 * This file provides backward-compatible functions used by other modules
 * (appointments, leads, etc.) while using the new Cloud API module internally.
 */

import { sendWhatsAppTextMessage, formatPhoneNumber } from './whatsappCloudAPI';

interface WhatsAppMessage {
  to: string;
  message: string;
}

/**
 * Send WhatsApp message using WhatsApp Business Cloud API
 */
export async function sendWhatsAppMessage(params: WhatsAppMessage): Promise<boolean> {
  try {
    const formattedPhone = formatPhoneNumber(params.to);
    const result = await sendWhatsAppTextMessage(formattedPhone, params.message);
    
    if (result.success) {
      console.log(`[WhatsApp] Message sent successfully to ${formattedPhone}. ID: ${result.messageId}`);
      return true;
    } else {
      console.error(`[WhatsApp] Failed to send to ${formattedPhone}: ${result.error}`);
      return false;
    }
  } catch (error) {
    console.error('[WhatsApp] Failed to send message:', error);
    return false;
  }
}

/**
 * Send welcome message to new lead
 */
export async function sendWelcomeMessage(lead: {
  phone: string;
  fullName: string;
  campaignName: string;
  welcomeMessage?: string;
}): Promise<boolean> {
  const defaultMessage = `مرحباً ${lead.fullName}،

شكراً لتسجيلك في ${lead.campaignName} بالمستشفى السعودي الألماني - صنعاء.

سنتواصل معك قريباً لتحديد موعدك وتقديم الخدمة المطلوبة.

للاستفسارات العاجلة، يمكنك التواصل معنا على الرقم المجاني: 8000018

نرعاكم كأهالينا 💚`;

  const message = lead.welcomeMessage || defaultMessage;
  
  return sendWhatsAppMessage({
    to: lead.phone,
    message,
  });
}

/**
 * Send booking confirmation message
 */
export async function sendBookingConfirmation(lead: {
  phone: string;
  fullName: string;
  appointmentDate?: string;
  appointmentTime?: string;
}): Promise<boolean> {
  const message = `عزيزي/عزيزتي ${lead.fullName}،

تم تأكيد حجزك بنجاح! ✅

${lead.appointmentDate && lead.appointmentTime ? `
📅 التاريخ: ${lead.appointmentDate}
🕐 الوقت: ${lead.appointmentTime}
` : ''}

📍 الموقع: المستشفى السعودي الألماني - صنعاء
شارع الستين الشمالي (بين جولة عمران وجولة الجمنة)

يرجى الحضور قبل الموعد بـ 15 دقيقة.

للاستفسارات: 8000018

نرعاكم كأهالينا 💚
المستشفى السعودي الألماني`;

  return sendWhatsAppMessage({
    to: lead.phone,
    message,
  });
}

/**
 * Send custom message
 */
export async function sendCustomMessage(phone: string, message: string): Promise<boolean> {
  return sendWhatsAppMessage({
    to: phone,
    message,
  });
}
