import { useEffect, useRef, useCallback, useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

const SOUND_ENABLED_KEY = "sgh-notification-sound-enabled";
const POLLING_INTERVAL = 15_000; // 15 seconds for faster detection

/**
 * Generate a notification beep sound using Web Audio API
 * Two-tone ascending chime (pleasant, not jarring)
 */
function playNotificationSound() {
  try {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    // First tone (lower)
    const osc1 = audioCtx.createOscillator();
    const gain1 = audioCtx.createGain();
    osc1.connect(gain1);
    gain1.connect(audioCtx.destination);
    osc1.frequency.value = 587.33; // D5
    osc1.type = "sine";
    gain1.gain.setValueAtTime(0, audioCtx.currentTime);
    gain1.gain.linearRampToValueAtTime(0.3, audioCtx.currentTime + 0.05);
    gain1.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.25);
    osc1.start(audioCtx.currentTime);
    osc1.stop(audioCtx.currentTime + 0.25);

    // Second tone (higher) - starts slightly after first
    const osc2 = audioCtx.createOscillator();
    const gain2 = audioCtx.createGain();
    osc2.connect(gain2);
    gain2.connect(audioCtx.destination);
    osc2.frequency.value = 880; // A5
    osc2.type = "sine";
    gain2.gain.setValueAtTime(0, audioCtx.currentTime + 0.15);
    gain2.gain.linearRampToValueAtTime(0.3, audioCtx.currentTime + 0.2);
    gain2.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.5);
    osc2.start(audioCtx.currentTime + 0.15);
    osc2.stop(audioCtx.currentTime + 0.5);

    // Third tone (highest) - pleasant chime ending
    const osc3 = audioCtx.createOscillator();
    const gain3 = audioCtx.createGain();
    osc3.connect(gain3);
    gain3.connect(audioCtx.destination);
    osc3.frequency.value = 1174.66; // D6
    osc3.type = "sine";
    gain3.gain.setValueAtTime(0, audioCtx.currentTime + 0.3);
    gain3.gain.linearRampToValueAtTime(0.2, audioCtx.currentTime + 0.35);
    gain3.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.7);
    osc3.start(audioCtx.currentTime + 0.3);
    osc3.stop(audioCtx.currentTime + 0.7);

    // Close audio context after sound finishes
    setTimeout(() => audioCtx.close(), 1000);
    
    return true;
  } catch (error) {
    console.warn("[NotificationSound] Failed to play sound:", error);
    return false;
  }
}

/**
 * Hook to monitor WhatsApp unread messages and play notification sound
 * when new messages arrive
 */
export function useNotificationSound() {
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem(SOUND_ENABLED_KEY);
      return stored !== null ? stored === "true" : true; // enabled by default
    } catch {
      return true;
    }
  });

  const prevWhatsappCountRef = useRef<number | null>(null);
  const isFirstLoadRef = useRef(true);
  const hasUserInteractedRef = useRef(false);

  // Track user interaction for audio autoplay policy
  useEffect(() => {
    const handleInteraction = () => {
      hasUserInteractedRef.current = true;
    };
    
    window.addEventListener("click", handleInteraction, { once: true });
    window.addEventListener("keydown", handleInteraction, { once: true });
    window.addEventListener("touchstart", handleInteraction, { once: true });
    
    return () => {
      window.removeEventListener("click", handleInteraction);
      window.removeEventListener("keydown", handleInteraction);
      window.removeEventListener("touchstart", handleInteraction);
    };
  }, []);

  // Fetch sidebar badges with faster polling for notification detection
  const { data: badgeCounts } = trpc.sidebarBadges.useQuery(undefined, {
    refetchInterval: POLLING_INTERVAL,
    refetchOnWindowFocus: true,
  });

  // Save sound preference to localStorage
  const toggleSound = useCallback(() => {
    setSoundEnabled((prev) => {
      const newValue = !prev;
      try {
        localStorage.setItem(SOUND_ENABLED_KEY, String(newValue));
      } catch {
        // ignore localStorage errors
      }
      if (newValue) {
        // Play a test sound when enabling
        playNotificationSound();
        toast.success("تم تفعيل صوت التنبيه", {
          description: "سيتم تنبيهك عند وصول رسالة واتساب جديدة",
          duration: 3000,
        });
      } else {
        toast.info("تم إيقاف صوت التنبيه", {
          duration: 3000,
        });
      }
      return newValue;
    });
  }, []);

  // Monitor WhatsApp unread count changes
  useEffect(() => {
    if (!badgeCounts) return;

    const currentWhatsappCount = badgeCounts.whatsapp || 0;

    // Skip first load - just store the initial value
    if (isFirstLoadRef.current) {
      prevWhatsappCountRef.current = currentWhatsappCount;
      isFirstLoadRef.current = false;
      return;
    }

    const prevCount = prevWhatsappCountRef.current ?? 0;

    // New messages detected (count increased)
    if (currentWhatsappCount > prevCount && soundEnabled && hasUserInteractedRef.current) {
      const newMessages = currentWhatsappCount - prevCount;
      
      // Play notification sound
      playNotificationSound();

      // Show toast notification
      toast("رسالة واتساب جديدة", {
        description: newMessages === 1
          ? "لديك رسالة واتساب جديدة غير مقروءة"
          : `لديك ${newMessages} رسائل واتساب جديدة غير مقروءة`,
        duration: 5000,
        action: {
          label: "عرض",
          onClick: () => {
            window.location.href = "/dashboard/whatsapp";
          },
        },
        icon: "💬",
      });
    }

    // Update previous count
    prevWhatsappCountRef.current = currentWhatsappCount;
  }, [badgeCounts, soundEnabled]);

  return {
    soundEnabled,
    toggleSound,
    whatsappUnread: badgeCounts?.whatsapp || 0,
  };
}

// Export for testing
export { playNotificationSound, SOUND_ENABLED_KEY, POLLING_INTERVAL };
