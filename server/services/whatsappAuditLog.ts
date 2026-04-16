
export interface AuditLogEntry {
  id: string;
  timestamp: Date;
  type: "message_sent" | "message_received" | "error" | "status_change" | "rule_change";
  phone: string;
  message?: string;
  status: "success" | "failed" | "pending";
  details?: Record<string, unknown>;
  userId?: string;
  error?: string;
}

const auditLogs: AuditLogEntry[] = [];

export async function logMessageSent(params: {
  phone: string;
  message: string;
  messageId: string;
  type: "text" | "template" | "media" | "broadcast";
  userId?: string;
}): Promise<{ success: boolean; logId?: string; error?: string }> {
  try {
    const logId = `log_${Date.now()}`;
    const entry: AuditLogEntry = {
      id: logId,
      timestamp: new Date(),
      type: "message_sent",
      phone: params.phone,
      message: params.message.substring(0, 200),
      status: "success",
      details: {
        messageId: params.messageId,
        messageType: params.type,
      },
      userId: params.userId,
    };

    auditLogs.push(entry);

    console.log(`[WhatsApp AuditLog] Logged message sent: ${logId}`);

    return {
      success: true,
      logId,
    };
  } catch (error) {
    console.error("[WhatsApp AuditLog] Failed to log message:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function logMessageReceived(params: {
  phone: string;
  message: string;
  messageId: string;
}): Promise<{ success: boolean; logId?: string; error?: string }> {
  try {
    const logId = `log_${Date.now()}`;
    const entry: AuditLogEntry = {
      id: logId,
      timestamp: new Date(),
      type: "message_received",
      phone: params.phone,
      message: params.message.substring(0, 200),
      status: "success",
      details: {
        messageId: params.messageId,
      },
    };

    auditLogs.push(entry);

    console.log(`[WhatsApp AuditLog] Logged message received: ${logId}`);

    return {
      success: true,
      logId,
    };
  } catch (error) {
    console.error("[WhatsApp AuditLog] Failed to log received message:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function logError(params: {
  phone?: string;
  error: string;
  type: string;
  userId?: string;
}): Promise<{ success: boolean; logId?: string; error?: string }> {
  try {
    const logId = `log_${Date.now()}`;
    const entry: AuditLogEntry = {
      id: logId,
      timestamp: new Date(),
      type: "error",
      phone: params.phone || "unknown",
      status: "failed",
      error: params.error,
      details: {
        errorType: params.type,
      },
      userId: params.userId,
    };

    auditLogs.push(entry);

    console.error(`[WhatsApp AuditLog] Logged error: ${logId} - ${params.error}`);

    return {
      success: true,
      logId,
    };
  } catch (error) {
    console.error("[WhatsApp AuditLog] Failed to log error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function getAuditLogs(params?: {
  phone?: string;
  type?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
}): Promise<{
  success: boolean;
  logs?: AuditLogEntry[];
  total?: number;
  error?: string;
}> {
  try {
    let filtered = [...auditLogs];

    if (params?.phone) {
      filtered = filtered.filter((log) => log.phone === params.phone);
    }

    if (params?.type) {
      filtered = filtered.filter((log) => log.type === params.type);
    }

    if (params?.startDate) {
      filtered = filtered.filter((log) => log.timestamp >= params.startDate!);
    }

    if (params?.endDate) {
      filtered = filtered.filter((log) => log.timestamp <= params.endDate!);
    }

    const limit = params?.limit || 100;
    const logs = filtered.slice(-limit).reverse();

    return {
      success: true,
      logs,
      total: filtered.length,
    };
  } catch (error) {
    console.error("[WhatsApp AuditLog] Failed to get logs:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function getAuditStats(params?: {
  startDate?: Date;
  endDate?: Date;
}): Promise<{
  success: boolean;
  stats?: {
    totalMessages: number;
    sentMessages: number;
    receivedMessages: number;
    failedMessages: number;
    errorCount: number;
    uniquePhones: number;
  };
  error?: string;
}> {
  try {
    let filtered = [...auditLogs];

    if (params?.startDate) {
      filtered = filtered.filter((log) => log.timestamp >= params.startDate!);
    }

    if (params?.endDate) {
      filtered = filtered.filter((log) => log.timestamp <= params.endDate!);
    }

    const stats = {
      totalMessages: filtered.length,
      sentMessages: filtered.filter((log) => log.type === "message_sent").length,
      receivedMessages: filtered.filter((log) => log.type === "message_received").length,
      failedMessages: filtered.filter((log) => log.status === "failed").length,
      errorCount: filtered.filter((log) => log.type === "error").length,
      uniquePhones: new Set(filtered.map((log) => log.phone)).size,
    };

    return {
      success: true,
      stats,
    };
  } catch (error) {
    console.error("[WhatsApp AuditLog] Failed to get stats:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function exportAuditLogs(params?: {
  phone?: string;
  startDate?: Date;
  endDate?: Date;
}): Promise<{
  success: boolean;
  csv?: string;
  error?: string;
}> {
  try {
    let filtered = [...auditLogs];

    if (params?.phone) {
      filtered = filtered.filter((log) => log.phone === params.phone);
    }

    if (params?.startDate) {
      filtered = filtered.filter((log) => log.timestamp >= params.startDate!);
    }

    if (params?.endDate) {
      filtered = filtered.filter((log) => log.timestamp <= params.endDate!);
    }

    const headers = ["ID", "Timestamp", "Type", "Phone", "Status", "Message", "Error"];
    const rows = filtered.map((log) => [
      log.id,
      log.timestamp.toISOString(),
      log.type,
      log.phone,
      log.status,
      log.message || "",
      log.error || "",
    ]);

    const csv =
      [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n") +
      "\n";

    return {
      success: true,
      csv,
    };
  } catch (error) {
    console.error("[WhatsApp AuditLog] Failed to export logs:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function clearOldLogs(daysOld: number = 30): Promise<{
  success: boolean;
  deletedCount?: number;
  error?: string;
}> {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const initialLength = auditLogs.length;
    const filtered = auditLogs.filter((log) => log.timestamp > cutoffDate);

    auditLogs.length = 0;
    auditLogs.push(...filtered);

    const deletedCount = initialLength - filtered.length;

    console.log(`[WhatsApp AuditLog] Cleared ${deletedCount} old logs`);

    return {
      success: true,
      deletedCount,
    };
  } catch (error) {
    console.error("[WhatsApp AuditLog] Failed to clear old logs:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
