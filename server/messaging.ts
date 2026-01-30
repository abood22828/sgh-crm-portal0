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
  const { isWhatsAppBusinessAPIConfigured } = await import("./whatsappBusinessAPI");
  
  if (isWhatsAppBusinessAPIConfigured()) {
    console.log("[Messaging] Adding to WhatsApp Queue (interactive buttons)");
    
    const bookingTypeMap = {
      appointment: "APPOINTMENT",
      offer: "OFFER",
      camp: "CAMP",
    };
    
    const { queueWhatsAppMessage } = await import("./queues/whatsappQueue");
    
    const jobId = await queueWhatsAppMessage({
      to: data.phone,
      templateName: "booking_confirmation_interactive",
      language: "ar",
      components: [
        {
          type: "body",
          parameters: [
            { type: "text", text: data.name },
            { type: "text", text: data.date },
            { type: "text", text: data.time },
            { type: "text", text: data.doctor },
            { type: "text", text: data.service },
          ],
        },
        {
          type: "button",
          sub_type: "quick_reply",
          index: 0,
          parameters: [{ type: "payload", payload: `CONFIRM_${bookingTypeMap[data.bookingType]}_${data.bookingId}` }],
        },
        {
          type: "button",
          sub_type: "quick_reply",
          index: 1,
          parameters: [{ type: "payload", payload: `CANCEL_${bookingTypeMap[data.bookingType]}_${data.bookingId}` }],
        },
      ],
      category: "utility",
      metadata: {
        bookingId: data.bookingId,
        bookingType: data.bookingType,
        patientName: data.name,
      },
    });
    
    return { success: true, message, jobId };
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

  const { isWhatsAppBusinessAPIConfigured } = await import("./whatsappBusinessAPI");
  
  if (isWhatsAppBusinessAPIConfigured()) {
    console.log("[Messaging] Adding offer booking confirmation to WhatsApp Queue");
    
    const { queueWhatsAppMessage } = await import("./queues/whatsappQueue");
    
    const jobId = await queueWhatsAppMessage({
      to: data.phone,
      templateName: "offer_booking_confirmation_interactive",
      language: "ar",
      components: [
        {
          type: "body",
          parameters: [
            { type: "text", text: data.name },
            { type: "text", text: data.service },
            { type: "text", text: data.date },
            { type: "text", text: data.time },
          ],
        },
        {
          type: "button",
          sub_type: "quick_reply",
          index: 0,
          parameters: [{ type: "payload", payload: `CONFIRM_OFFER_${data.bookingId}` }],
        },
        {
          type: "button",
          sub_type: "quick_reply",
          index: 1,
          parameters: [{ type: "payload", payload: `CANCEL_OFFER_${data.bookingId}` }],
        },
      ],
      category: "utility",
      metadata: {
        bookingId: data.bookingId,
        bookingType: "offer",
        patientName: data.name,
      },
    });
    
    return { success: true, message, jobId };
  } else {
    console.log("[Messaging] WhatsApp Business API not configured, using WhatsApp Integration");
    const { sendCustomMessage } = await import("./whatsapp");
    const success = await sendCustomMessage(data.phone, message);
    return { success, message };
  }
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

  const { isWhatsAppBusinessAPIConfigured } = await import("./whatsappBusinessAPI");
  
  if (isWhatsAppBusinessAPIConfigured()) {
    console.log("[Messaging] Adding camp registration confirmation to WhatsApp Queue");
    
    const { queueWhatsAppMessage } = await import("./queues/whatsappQueue");
    
    const jobId = await queueWhatsAppMessage({
      to: data.phone,
      templateName: "camp_registration_confirmation_interactive",
      language: "ar",
      components: [
        {
          type: "body",
          parameters: [
            { type: "text", text: data.name },
            { type: "text", text: data.campName },
            { type: "text", text: data.date },
            { type: "text", text: data.time },
            { type: "text", text: data.location },
          ],
        },
        {
          type: "button",
          sub_type: "quick_reply",
          index: 0,
          parameters: [{ type: "payload", payload: `CONFIRM_CAMP_${data.bookingId}` }],
        },
        {
          type: "button",
          sub_type: "quick_reply",
          index: 1,
          parameters: [{ type: "payload", payload: `CANCEL_CAMP_${data.bookingId}` }],
        },
      ],
      category: "utility",
      metadata: {
        bookingId: data.bookingId,
        bookingType: "camp",
        patientName: data.name,
      },
    });
    
    return { success: true, message, jobId };
  } else {
    console.log("[Messaging] WhatsApp Business API not configured, using WhatsApp Integration");
    const { sendCustomMessage } = await import("./whatsapp");
    const success = await sendCustomMessage(data.phone, message);
    return { success, message };
  }
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
