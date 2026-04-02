import crypto from "crypto";

export interface BlockedNumber {
  phone: string;
  reason: "opt_out" | "spam" | "manual" | "invalid";
  blockedAt: Date;
  blockedBy?: string;
}

export interface OptOutRequest {
  phone: string;
  requestedAt: Date;
  status: "pending" | "approved" | "rejected";
  reason?: string;
}

const blockedNumbers: Map<string, BlockedNumber> = new Map();
const optOutRequests: Map<string, OptOutRequest> = new Map();

export async function isPhoneBlocked(phone: string): Promise<boolean> {
  try {
    return blockedNumbers.has(phone);
  } catch (error) {
    console.error("[WhatsApp Security] Failed to check if phone is blocked:", error);
    return false;
  }
}

export async function blockPhone(params: {
  phone: string;
  reason: "opt_out" | "spam" | "manual" | "invalid";
  blockedBy?: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const blocked: BlockedNumber = {
      phone: params.phone,
      reason: params.reason,
      blockedAt: new Date(),
      blockedBy: params.blockedBy,
    };

    blockedNumbers.set(params.phone, blocked);

    console.log(`[WhatsApp Security] Blocked phone ${params.phone} (${params.reason})`);

    return { success: true };
  } catch (error) {
    console.error("[WhatsApp Security] Failed to block phone:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function unblockPhone(phone: string): Promise<{ success: boolean; error?: string }> {
  try {
    if (!blockedNumbers.has(phone)) {
      return { success: false, error: "Phone not blocked" };
    }

    blockedNumbers.delete(phone);

    console.log(`[WhatsApp Security] Unblocked phone ${phone}`);

    return { success: true };
  } catch (error) {
    console.error("[WhatsApp Security] Failed to unblock phone:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function getBlockedPhones(): Promise<{
  success: boolean;
  phones?: BlockedNumber[];
  error?: string;
}> {
  try {
    const phones = Array.from(blockedNumbers.values());

    return {
      success: true,
      phones,
    };
  } catch (error) {
    console.error("[WhatsApp Security] Failed to get blocked phones:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function handleOptOutRequest(params: {
  phone: string;
  reason?: string;
}): Promise<{ success: boolean; requestId?: string; error?: string }> {
  try {
    const requestId = `optout_${Date.now()}`;

    const request: OptOutRequest = {
      phone: params.phone,
      requestedAt: new Date(),
      status: "pending",
      reason: params.reason,
    };

    optOutRequests.set(requestId, request);

    // Auto-approve and block the phone
    await blockPhone({
      phone: params.phone,
      reason: "opt_out",
    });

    console.log(`[WhatsApp Security] Processed opt-out request for ${params.phone}`);

    return {
      success: true,
      requestId,
    };
  } catch (error) {
    console.error("[WhatsApp Security] Failed to handle opt-out request:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function getOptOutRequests(): Promise<{
  success: boolean;
  requests?: OptOutRequest[];
  error?: string;
}> {
  try {
    const requests = Array.from(optOutRequests.values());

    return {
      success: true,
      requests,
    };
  } catch (error) {
    console.error("[WhatsApp Security] Failed to get opt-out requests:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export function encryptSensitiveData(data: string, encryptionKey?: string): string {
  try {
    const key = encryptionKey || process.env.ENCRYPTION_KEY || "default-key-change-in-production";
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv("aes-256-cbc", Buffer.from(key.padEnd(32, "0")), iv);

    let encrypted = cipher.update(data, "utf-8", "hex");
    encrypted += cipher.final("hex");

    return iv.toString("hex") + ":" + encrypted;
  } catch (error) {
    console.error("[WhatsApp Security] Failed to encrypt data:", error);
    return data;
  }
}

export function decryptSensitiveData(encryptedData: string, encryptionKey?: string): string {
  try {
    const key = encryptionKey || process.env.ENCRYPTION_KEY || "default-key-change-in-production";
    const parts = encryptedData.split(":");
    const iv = Buffer.from(parts[0], "hex");
    const decipher = crypto.createDecipheriv("aes-256-cbc", Buffer.from(key.padEnd(32, "0")), iv);

    let decrypted = decipher.update(parts[1], "hex", "utf-8");
    decrypted += decipher.final("utf-8");

    return decrypted;
  } catch (error) {
    console.error("[WhatsApp Security] Failed to decrypt data:", error);
    return encryptedData;
  }
}

export async function validateMetaCompliance(message: string): Promise<{
  success: boolean;
  compliant: boolean;
  issues?: string[];
}> {
  try {
    const issues: string[] = [];

    // Check for prohibited content
    const prohibitedPatterns = [
      /viagra|cialis|pharmacy/i,
      /lottery|prize|winner/i,
      /click here|download now/i,
    ];

    for (const pattern of prohibitedPatterns) {
      if (pattern.test(message)) {
        issues.push(`Message contains prohibited content: ${pattern}`);
      }
    }

    // Check message length
    if (message.length > 4096) {
      issues.push("Message exceeds maximum length of 4096 characters");
    }

    // Check for excessive URLs
    const urlCount = (message.match(/https?:\/\//g) || []).length;
    if (urlCount > 3) {
      issues.push("Message contains too many URLs");
    }

    return {
      success: true,
      compliant: issues.length === 0,
      issues: issues.length > 0 ? issues : undefined,
    };
  } catch (error) {
    console.error("[WhatsApp Security] Failed to validate Meta compliance:", error);
    return {
      success: false,
      compliant: false,
      issues: ["Compliance check failed"],
    };
  }
}

export async function getSecurityStats(): Promise<{
  success: boolean;
  stats?: {
    blockedPhones: number;
    optOutRequests: number;
    pendingOptOuts: number;
    approvedOptOuts: number;
  };
  error?: string;
}> {
  try {
    const stats = {
      blockedPhones: blockedNumbers.size,
      optOutRequests: optOutRequests.size,
      pendingOptOuts: Array.from(optOutRequests.values()).filter(
        (r) => r.status === "pending"
      ).length,
      approvedOptOuts: Array.from(optOutRequests.values()).filter(
        (r) => r.status === "approved"
      ).length,
    };

    return {
      success: true,
      stats,
    };
  } catch (error) {
    console.error("[WhatsApp Security] Failed to get security stats:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
