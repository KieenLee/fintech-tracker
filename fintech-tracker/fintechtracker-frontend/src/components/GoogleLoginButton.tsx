import { useEffect, useState } from "react";
import { authService } from "@/services/authService";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

interface GoogleLoginButtonProps {
  onSuccess?: () => void;
  text?: string;
}

declare global {
  interface Window {
    google: any;
  }
}

const GoogleLoginButton = ({ onSuccess }: GoogleLoginButtonProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isGoogleReady, setIsGoogleReady] = useState(false);

  useEffect(() => {
    const initializeGoogleSignIn = () => {
      if (window.google) {
        window.google.accounts.id.initialize({
          client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
          callback: handleCredentialResponse,
        });

        // Render nút Google tự động thay vì dùng prompt()
        window.google.accounts.id.renderButton(
          document.getElementById("google-signin-btn"),
          {
            theme: "outline",
            size: "large",
            text: "signin_with",
            shape: "rectangular",
            width: "100%",
          }
        );

        setIsGoogleReady(true);
      }
    };

    // Load Google Script nếu chưa có
    if (!window.google) {
      const script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      script.onload = initializeGoogleSignIn;
      document.head.appendChild(script);
    } else {
      initializeGoogleSignIn();
    }

    // Cleanup function
    return () => {
      // Remove the rendered button when component unmounts
      const googleBtn = document.getElementById("google-signin-btn");
      if (googleBtn) {
        googleBtn.innerHTML = "";
      }
    };
  }, []);

  const handleCredentialResponse = async (response: any) => {
    try {
      const result = await authService.loginWithGoogle(response.credential);

      localStorage.setItem("token", result.token);
      localStorage.setItem("userRole", result.role);
      localStorage.setItem("userEmail", result.email);
      localStorage.setItem("userName", result.username);
      localStorage.setItem("isAuthenticated", "true");

      toast({
        title: "Login successful!",
        description: `Welcome, ${result.fullName || result.username}`,
      });

      onSuccess?.();
      navigate("/dashboard");
    } catch (error: any) {
      console.error("Google login error:", error);
      toast({
        title: "Google login failed",
        description: error.response?.data?.message || "Unknown error",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="w-full">
      {!isGoogleReady && (
        <div className="w-full h-12 bg-gray-100 animate-pulse rounded flex items-center justify-center border">
          <span className="text-sm text-gray-500">
            Loading Google Sign-In...
          </span>
        </div>
      )}
      <div id="google-signin-btn" className="w-full"></div>
    </div>
  );
};

export default GoogleLoginButton;
