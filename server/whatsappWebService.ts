import pkg from "whatsapp-web.js";
const { Client, LocalAuth } = pkg;
import type { Message } from "whatsapp-web.js";
import QRCode from "qrcode";
import qrcode from "qrcode-terminal";
import { 
  createWhatsAppConversation, 
  createWhatsAppMessage, 
  getWhatsAppConversationByPhone,
  updateWhatsAppConversation 
} from "./db";

/**
 * WhatsApp Web Service
 * Manages WhatsApp Web connection using whatsapp-web.js
 * This is a temporary solution until WhatsApp Business API is integrated
 */

class WhatsAppWebService {
  private client: InstanceType<typeof Client> | null = null;
  private qrCode: string | null = null;
  private isReady: boolean = false;
  private isConnecting: boolean = false;

  constructor() {
    console.log("[WhatsApp] Service initialized");
  }

  /**
   * Initialize WhatsApp client
   */
  async initialize() {
    if (this.client) {
      console.log("[WhatsApp] Client already exists");
      return;
    }

    if (this.isConnecting) {
      console.log("[WhatsApp] Already connecting...");
      return;
    }

    this.isConnecting = true;
    console.log("[WhatsApp] Initializing client...");

    try {
      this.client = new Client({
        authStrategy: new LocalAuth({
          dataPath: "./.wwebjs_auth",
        }),
        puppeteer: {
          headless: true,
          args: [
            "--no-sandbox",
            "--disable-setuid-sandbox",
            "--disable-dev-shm-usage",
            "--disable-accelerated-2d-canvas",
            "--no-first-run",
            "--no-zygote",
            "--disable-gpu",
          ],
        },
        webVersionCache: {
          type: "remote",
          remotePath: "https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.2412.54.html",
        },
      });

      // QR Code event
      this.client.on("qr", async (qr: string) => {
        console.log("[WhatsApp] QR Code received");
        
        // Generate QR code as data URL for frontend
        try {
          this.qrCode = await QRCode.toDataURL(qr);
          console.log("[WhatsApp] QR Code generated successfully");
        } catch (err) {
          console.error("[WhatsApp] Error generating QR code:", err);
        }

        // Also print to terminal for debugging
        qrcode.generate(qr, { small: true });
      });

      // Ready event
      this.client.on("ready", () => {
        console.log("[WhatsApp] Client is ready!");
        this.isReady = true;
        this.isConnecting = false;
        this.qrCode = null;
      });

      // Authenticated event
      this.client.on("authenticated", () => {
        console.log("[WhatsApp] Client authenticated");
      });

      // Auth failure event
      this.client.on("auth_failure", (msg: any) => {
        console.error("[WhatsApp] Authentication failed:", msg);
        this.isConnecting = false;
        this.qrCode = null;
      });

      // Disconnected event
      this.client.on("disconnected", (reason: any) => {
        console.log("[WhatsApp] Client disconnected:", reason);
        this.isReady = false;
        this.isConnecting = false;
        this.qrCode = null;
      });

      // Message received event
      this.client.on("message", async (message: Message) => {
        await this.handleIncomingMessage(message);
      });

      // Initialize the client
      await this.client.initialize();
    } catch (error) {
      console.error("[WhatsApp] Error initializing client:", error);
      this.isConnecting = false;
      this.client = null;
      throw error;
    }
  }

  /**
   * Handle incoming messages
   */
  private async handleIncomingMessage(message: Message) {
    try {
      console.log("[WhatsApp] Received message:", message.body);

      const contact = await message.getContact();
      const phoneNumber = contact.number;
      const customerName = contact.pushname || contact.name || null;

      // Get or create conversation
      let conversation = await getWhatsAppConversationByPhone(phoneNumber);
      
      if (!conversation) {
        const result = await createWhatsAppConversation({
          phoneNumber,
          customerName,
          lastMessage: message.body.substring(0, 100),
          lastMessageAt: new Date(),
          unreadCount: 1,
          isImportant: 0,
          isArchived: 0,
        });
        // Get the created conversation
        conversation = await getWhatsAppConversationByPhone(phoneNumber);
        if (!conversation) {
          throw new Error("Failed to create conversation");
        }
      } else {
        // Update conversation
        await updateWhatsAppConversation(conversation.id, {
          lastMessage: message.body.substring(0, 100),
          lastMessageAt: new Date(),
          unreadCount: conversation.unreadCount + 1,
        });
      }

      // Save message to database
      await createWhatsAppMessage({
        conversationId: conversation.id,
        direction: "inbound",
        content: message.body,
        messageType: "text",
        status: "delivered",
        sentAt: new Date(),
      });

      console.log("[WhatsApp] Message saved to database");
    } catch (error) {
      console.error("[WhatsApp] Error handling incoming message:", error);
    }
  }

  /**
   * Send a message
   */
  async sendMessage(phoneNumber: string, message: string): Promise<boolean> {
    if (!this.isReady || !this.client) {
      throw new Error("WhatsApp client is not ready");
    }

    try {
      // Format phone number (remove spaces, dashes, etc.)
      const formattedNumber = phoneNumber.replace(/[^\d]/g, "");
      
      // Add country code if not present (assuming Yemen +967)
      const chatId = formattedNumber.startsWith("967") 
        ? `${formattedNumber}@c.us`
        : `967${formattedNumber}@c.us`;

      await this.client.sendMessage(chatId, message);
      console.log(`[WhatsApp] Message sent to ${phoneNumber}`);
      return true;
    } catch (error) {
      console.error("[WhatsApp] Error sending message:", error);
      throw error;
    }
  }

  /**
   * Get current status
   */
  getStatus() {
    return {
      isReady: this.isReady,
      isConnecting: this.isConnecting,
      hasQRCode: !!this.qrCode,
    };
  }

  /**
   * Get QR code
   */
  getQRCode(): string | null {
    return this.qrCode;
  }

  /**
   * Disconnect client
   */
  async disconnect() {
    if (this.client) {
      await this.client.destroy();
      this.client = null;
      this.isReady = false;
      this.isConnecting = false;
      this.qrCode = null;
      console.log("[WhatsApp] Client disconnected");
    }
  }

  /**
   * Check if client is ready
   */
  isClientReady(): boolean {
    return this.isReady;
  }
}

// Singleton instance
const whatsappWebService = new WhatsAppWebService();

export default whatsappWebService;
