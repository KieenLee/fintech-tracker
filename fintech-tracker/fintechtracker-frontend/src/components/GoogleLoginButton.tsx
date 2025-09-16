import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import axios from "axios";
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

const GoogleLoginButton = ({
  onSuccess,
  text = "Sign in with Google",
}: GoogleLoginButtonProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isGoogleReady, setIsGoogleReady] = useState(false);

  useEffect(() => {
    const initializeGoogleSignIn = () => {
      if (window.google) {
        window.google.accounts.id.initialize({
          client_id:
            "789824760534-iphs1mrilc61qfjfta3268da718uglf4.apps.googleusercontent.com",
          callback: handleCredentialResponse,
        });
        setIsGoogleReady(true);
      }
    };

    // Kiểm tra nếu script đã load
    if (window.google) {
      initializeGoogleSignIn();
    } else {
      // Đợi script load xong
      const script = document.querySelector(
        'script[src="https://accounts.google.com/gsi/client"]'
      );
      if (script) {
        script.addEventListener("load", initializeGoogleSignIn);
      }

      // Fallback: kiểm tra định kỳ
      const checkGoogle = setInterval(() => {
        if (window.google) {
          clearInterval(checkGoogle);
          initializeGoogleSignIn();
        }
      }, 100);

      return () => {
        clearInterval(checkGoogle);
        const script = document.querySelector(
          'script[src="https://accounts.google.com/gsi/client"]'
        );
        if (script) {
          script.removeEventListener("load", initializeGoogleSignIn);
        }
      };
    }
  }, []);

  const handleCredentialResponse = async (response: any) => {
    try {
      const result = await axios.post("http://localhost:5013/api/auth/google", {
        idToken: response.credential,
      });

      // Lưu token
      localStorage.setItem("token", result.data.token);
      localStorage.setItem("userRole", result.data.role);
      localStorage.setItem("userEmail", result.data.email);
      localStorage.setItem("userName", result.data.username);

      toast({
        title: "Login successful!",
        description: `Welcome, ${result.data.fullName || result.data.username}`,
      });

      onSuccess?.();
      navigate("/dashboard");
    } catch (error: any) {
      toast({
        title: "Google login failed",
        description: error.response?.data?.message || "Unknown error",
        variant: "destructive",
      });
    }
  };

  const handleGoogleLogin = () => {
    if (!isGoogleReady || !window.google) {
      toast({
        title: "Google login unavailable",
        description:
          "Google Sign-In is not ready yet. Please try again in a moment.",
        variant: "destructive",
      });
      return;
    }

    try {
      window.google.accounts.id.prompt();
    } catch (error) {
      console.error("Google login error:", error);
      toast({
        title: "Google login error",
        description: "Failed to open Google Sign-In. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Button
      type="button"
      variant="outline"
      className="w-full"
      onClick={handleGoogleLogin}
      disabled={!isGoogleReady}
    >
      <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
        <path
          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          fill="#4285F4"
        />
        <path
          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          fill="#34A853"
        />
        <path
          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          fill="#FBBC05"
        />
        <path
          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          fill="#EA4335"
        />
      </svg>
      {isGoogleReady ? text : "Loading Google..."}
    </Button>
  );
};

export default GoogleLoginButton;
