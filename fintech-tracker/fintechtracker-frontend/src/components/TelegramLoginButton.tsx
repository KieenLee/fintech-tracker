import { useEffect, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import {
  settingsService,
  type TelegramLoginData,
} from "@/services/settingsService";

interface TelegramLoginButtonProps {
  botUsername: string; // VD: "FinTechTrackerBot"
  onSuccess: () => void;
}

declare global {
  interface Window {
    TelegramLoginWidget?: {
      dataOnauth: (user: TelegramLoginData) => void;
    };
  }
}

export const TelegramLoginButton: React.FC<TelegramLoginButtonProps> = ({
  botUsername,
  onSuccess,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Define callback function
    window.TelegramLoginWidget = {
      dataOnauth: async (user: TelegramLoginData) => {
        try {
          console.log("Telegram auth data received:", user);

          // Send to backend
          await settingsService.linkTelegram(user);

          toast({
            title: "✅ Liên kết thành công!",
            description: "Tài khoản Telegram đã được liên kết với hệ thống.",
          });

          onSuccess();
        } catch (error: any) {
          console.error("Failed to link Telegram:", error);
          toast({
            title: "❌ Lỗi liên kết",
            description:
              error.response?.data?.message ||
              "Không thể liên kết tài khoản Telegram.",
            variant: "destructive",
          });
        }
      },
    };

    // Load Telegram Widget script
    if (
      containerRef.current &&
      !document.getElementById("telegram-login-script")
    ) {
      const script = document.createElement("script");
      script.id = "telegram-login-script";
      script.src = "https://telegram.org/js/telegram-widget.js?22";
      script.setAttribute("data-telegram-login", botUsername);
      script.setAttribute("data-size", "large");
      script.setAttribute("data-radius", "8");
      script.setAttribute(
        "data-onauth",
        "TelegramLoginWidget.dataOnauth(user)"
      );
      script.setAttribute("data-request-access", "write");
      script.async = true;

      containerRef.current.appendChild(script);
    }

    return () => {
      // Cleanup
      delete window.TelegramLoginWidget;
    };
  }, [botUsername, onSuccess, toast]);

  return <div ref={containerRef} className="flex justify-center" />;
};
