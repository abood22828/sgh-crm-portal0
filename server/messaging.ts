import { getMessageSettingByType } from "./db";

/**
 * Replace variables in message template
 * Example: "Hello {name}" with {name: "John"} => "Hello John"
 */
export function replaceMessageVariables(
  template: string,
  variables: Record<string, string>
): string {
  let message = template;
  
  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`\\{${key}\\}`, "g");
    message = message.replace(regex, value || "");
  }
  
  return message;
}

/**
 * Send booking confirmation message with interactive buttons (WhatsApp API)
 * This is the first message in patient journey
 */
export async function sendBookingConfirmationInteractive(data: {
  phone: string;
  name: string;
  date: string;
  time: string;
  doctor: string;
  service: string;
  bookingId: number;
  bookingType: "appointment" | "offer" | "camp";
}) {
  // Check if message is enabled
  const setting = await getMessageSettingByType("booking_confirmation_interactive");
  if (!setting || setting.isEnabled === 0) {
    console.log("[Messaging] booking_confirmation_interactive is disabled");
    return { success: false, reason: "disabled" };
  }

  // Replace variables
  const message = replaceMessageVariables(setting.messageContent, {
    name: data.name,
    date: data.date,
    time: data.time,
    doctor: data.doctor,
    service: data.service,
  });

  // Try to send via WhatsApp Business API if configured
  const { sendBookingConfirmationWithButtons, isWhatsAppBusinessAPIConfigured } = await import("./whatsappBusinessAPI");
  
  if (isWhatsAppBusinessAPIConfigured()) {
    console.log("[Messaging] Sending via WhatsApp Business API (interactive buttons)");
    
    const bookingTypeMap = {
      appointment: "APPOINTMENT",
      offer: "OFFER",
      camp: "CAMP",
    };
    
    const result = await sendBookingConfirmationWithButtons({
      phone: data.phone,
      templateName: "booking_confirmation_interactive", // Must match template name in Meta
      variables: {
        name: data.name,
        date: data.date,
        time: data.time,
        doctor: data.doctor,
        service: data.service,
      },
      buttons: [
        {
          text: "تأكيد الحجز ✅",
          payload: `CONFIRM_${bookingTypeMap[data.bookingType]}_${data.bookingId}`,
        },
        {
          text: "إلغاء الحجز ❌",
          payload: `CANCEL_${bookingTypeMap[data.bookingType]}_${data.bookingId}`,
        },
      ],
    });
    
    return { success: result.success, message, messageId: result.messageId, error: result.error };
  } else {
    // Fallback to WhatsApp Integration (without interactive buttons)
    console.log("[Messaging] WhatsApp Business API not configured, using WhatsApp Integration");
    const { sendCustomMessage } = await import("./whatsapp");
    const success = await sendCustomMessage(data.phone, message);
    return { success, message };
  }
}

/**
 * Send booking confirmed success message (WhatsApp Integration)
 * This is sent after user clicks "confirm" button
 */
export async function sendBookingConfirmedSuccess(data: {
  phone: string;
  name: string;
  date: string;
  time: string;
  doctor: string;
}) {
  // Check if message is enabled
  const setting = await getMessageSettingByType("booking_confirmed_success");
  if (!setting || setting.isEnabled === 0) {
    console.log("[Messaging] booking_confirmed_success is disabled");
    return { success: false, reason: "disabled" };
  }

  // Replace variables
  const message = replaceMessageVariables(setting.messageContent, {
    name: data.name,
    date: data.date,
    time: data.time,
    doctor: data.doctor,
  });

  // Send via WhatsApp Integration
  const { sendCustomMessage } = await import("./whatsapp");
  const success = await sendCustomMessage(data.phone, message);

  console.log("[Messaging] Sent booking confirmed success:", {
    phone: data.phone,
    success,
  });

  return { success, message };
}

/**
 * Send patient arrival welcome message (WhatsApp Integration)
 * This is sent when patient arrives at reception
 */
export async function sendPatientArrivalWelcome(data: {
  phone: string;
  name: string;
  doctor: string;
  time: string;
}) {
  // Check if message is enabled
  const setting = await getMessageSettingByType("patient_arrival_welcome");
  if (!setting || setting.isEnabled === 0) {
    console.log("[Messaging] patient_arrival_welcome is disabled");
    return { success: false, reason: "disabled" };
  }

  // Replace variables
  const message = replaceMessageVariables(setting.messageContent, {
    name: data.name,
    doctor: data.doctor,
    time: data.time,
  });

  // Send via WhatsApp Integration
  const { sendCustomMessage } = await import("./whatsapp");
  const success = await sendCustomMessage(data.phone, message);

  console.log("[Messaging] Sent patient arrival welcome:", {
    phone: data.phone,
    success,
  });

  return { success, message };
}

/**
 * Helper to format date for messages
 */
export function formatDateForMessage(date: Date): string {
  return new Intl.DateTimeFormat("ar-SA", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}

/**
 * Helper to format time for messages
 */
export function formatTimeForMessage(date: Date): string {
  return new Intl.DateTimeFormat("ar-SA", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(date);
}

/**
 * ============================================
 * OFFER LEADS MESSAGING FUNCTIONS
 * ============================================
 */

/**
 * Send offer booking confirmation message with interactive buttons (WhatsApp API)
 */
export async function sendOfferBookingConfirmationInteractive(data: {
  phone: string;
  name: string;
  service: string;
  date: string;
  time: string;
  bookingId: number;
}) {
  const setting = await getMessageSettingByType("offer_booking_confirmation_interactive");
  if (!setting || setting.isEnabled === 0) {
    console.log("[Messaging] offer_booking_confirmation_interactive is disabled");
    return { success: false, reason: "disabled" };
  }

  const message = replaceMessageVariables(setting.messageContent, {
    name: data.name,
    service: data.service,
    date: data.date,
    time: data.time,
  });

  console.log("[Messaging] Sending offer booking confirmation (interactive):", {
    phone: data.phone,
    message,
    bookingId: data.bookingId,
  });

  // TODO: Implement WhatsApp Business API call with interactive buttons
  return { success: true, message };
}

/**
 * Send offer booking confirmed success message (WhatsApp Integration)
 */
export async function sendOfferBookingConfirmedSuccess(data: {
  phone: string;
  name: string;
  service: string;
  date: string;
  time: string;
}) {
  const setting = await getMessageSettingByType("offer_booking_confirmed_success");
  if (!setting || setting.isEnabled === 0) {
    console.log("[Messaging] offer_booking_confirmed_success is disabled");
    return { success: false, reason: "disabled" };
  }

  const message = replaceMessageVariables(setting.messageContent, {
    name: data.name,
    service: data.service,
    date: data.date,
    time: data.time,
  });

  const { sendCustomMessage } = await import("./whatsapp");
  const success = await sendCustomMessage(data.phone, message);

  console.log("[Messaging] Sent offer booking confirmed success:", {
    phone: data.phone,
    success,
  });

  return { success, message };
}

/**
 * Send offer patient arrival welcome message (WhatsApp Integration)
 */
export async function sendOfferPatientArrivalWelcome(data: {
  phone: string;
  name: string;
  service: string;
}) {
  const setting = await getMessageSettingByType("offer_patient_arrival_welcome");
  if (!setting || setting.isEnabled === 0) {
    console.log("[Messaging] offer_patient_arrival_welcome is disabled");
    return { success: false, reason: "disabled" };
  }

  const message = replaceMessageVariables(setting.messageContent, {
    name: data.name,
    service: data.service,
  });

  const { sendCustomMessage } = await import("./whatsapp");
  const success = await sendCustomMessage(data.phone, message);

  console.log("[Messaging] Sent offer patient arrival welcome:", {
    phone: data.phone,
    success,
  });

  return { success, message };
}

/**
 * ============================================
 * CAMP REGISTRATIONS MESSAGING FUNCTIONS
 * ============================================
 */

/**
 * Send camp registration confirmation message with interactive buttons (WhatsApp API)
 */
export async function sendCampRegistrationConfirmationInteractive(data: {
  phone: string;
  name: string;
  campName: string;
  date: string;
  time: string;
  location: string;
  bookingId: number;
}) {
  const setting = await getMessageSettingByType("camp_registration_confirmation_interactive");
  if (!setting || setting.isEnabled === 0) {
    console.log("[Messaging] camp_registration_confirmation_interactive is disabled");
    return { success: false, reason: "disabled" };
  }

  const message = replaceMessageVariables(setting.messageContent, {
    name: data.name,
    camp_name: data.campName,
    date: data.date,
    time: data.time,
    location: data.location,
  });

  console.log("[Messaging] Sending camp registration confirmation (interactive):", {
    phone: data.phone,
    message,
    bookingId: data.bookingId,
  });

  // TODO: Implement WhatsApp Business API call with interactive buttons
  return { success: true, message };
}

/**
 * Send camp registration confirmed success message (WhatsApp Integration)
 */
export async function sendCampRegistrationConfirmedSuccess(data: {
  phone: string;
  name: string;
  campName: string;
  date: string;
  time: string;
  location: string;
}) {
  const setting = await getMessageSettingByType("camp_registration_confirmed_success");
  if (!setting || setting.isEnabled === 0) {
    console.log("[Messaging] camp_registration_confirmed_success is disabled");
    return { success: false, reason: "disabled" };
  }

  const message = replaceMessageVariables(setting.messageContent, {
    name: data.name,
    camp_name: data.campName,
    date: data.date,
    time: data.time,
    location: data.location,
  });

  const { sendCustomMessage } = await import("./whatsapp");
  const success = await sendCustomMessage(data.phone, message);

  console.log("[Messaging] Sent camp registration confirmed success:", {
    phone: data.phone,
    success,
  });

  return { success, message };
}

/**
 * Send camp patient arrival welcome message (WhatsApp Integration)
 */
export async function sendCampPatientArrivalWelcome(data: {
  phone: string;
  name: string;
  campName: string;
}) {
  const setting = await getMessageSettingByType("camp_patient_arrival_welcome");
  if (!setting || setting.isEnabled === 0) {
    console.log("[Messaging] camp_patient_arrival_welcome is disabled");
    return { success: false, reason: "disabled" };
  }

  const message = replaceMessageVariables(setting.messageContent, {
    name: data.name,
    camp_name: data.campName,
  });

  const { sendCustomMessage } = await import("./whatsapp");
  const success = await sendCustomMessage(data.phone, message);

  console.log("[Messaging] Sent camp patient arrival welcome:", {
    phone: data.phone,
    success,
  });

  return { success, message };
}
