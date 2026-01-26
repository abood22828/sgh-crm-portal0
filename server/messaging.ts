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

  // TODO: Implement WhatsApp Business API call with interactive buttons
  // For now, we'll use the regular WhatsApp Integration
  console.log("[Messaging] Sending booking confirmation (interactive):", {
    phone: data.phone,
    message,
    bookingId: data.bookingId,
    bookingType: data.bookingType,
  });

  // Placeholder: In production, call WhatsApp Business API
  // const result = await sendWhatsAppBusinessAPIMessage({
  //   phone: data.phone,
  //   message,
  //   buttons: [
  //     { id: `confirm_${data.bookingType}_${data.bookingId}`, title: "تأكيد الحجز ✅" },
  //     { id: `cancel_${data.bookingType}_${data.bookingId}`, title: "إلغاء الحجز ❌" },
  //   ],
  // });

  return { success: true, message };
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
