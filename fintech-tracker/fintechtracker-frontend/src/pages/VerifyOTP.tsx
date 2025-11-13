import { useState, useEffect } from "react";
import { authService } from "@/services/authService";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Wallet, Mail, ArrowLeft, RefreshCw } from "lucide-react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

const VerifyOTP = () => {
  const [otp, setOtp] = useState("");
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes in seconds
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    // Get email from URL params or localStorage
    const emailFromUrl = searchParams.get("email");
    const pendingRegistration = localStorage.getItem("pendingRegistration");

    if (!pendingRegistration && !emailFromUrl) {
      toast({
        title: "Session expired",
        description: "Please register again",
        variant: "destructive",
      });
      navigate("/register");
      return;
    }

    if (pendingRegistration) {
      const userData = JSON.parse(pendingRegistration);
      setEmail(userData.email);
      setFirstName(userData.firstName);
    } else if (emailFromUrl) {
      setEmail(emailFromUrl);
    }
  }, [navigate, searchParams, toast]);

  useEffect(() => {
    // Countdown timer
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [timeLeft]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  const handleOtpChange = (value: string) => {
    // Only allow digits and limit to 6 characters
    const cleanValue = value.replace(/\D/g, "").slice(0, 6);
    setOtp(cleanValue);
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();

    if (otp.length !== 6) {
      toast({
        title: "Invalid OTP",
        description: "Please enter the complete 6-digit code",
        variant: "destructive",
      });
      return;
    }

    setIsVerifying(true);

    try {
      await authService.verifyOtp({
        email: email,
        otp: otp,
      });

      localStorage.removeItem("pendingRegistration");
      toast({
        title: "Email verified successfully!",
        description: "Your account has been created. You can now sign in.",
      });
      navigate("/login");
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message || "Verification failed";
      toast({
        title: "Verification failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    if (timeLeft > 0) {
      toast({
        title: "Please wait",
        description: `You can resend the code in ${formatTime(timeLeft)}`,
        variant: "destructive",
      });
      return;
    }

    setIsResending(true);

    try {
      await authService.resendOtp({ email: email });

      setTimeLeft(300);
      setOtp("");
      toast({
        title: "Code resent!",
        description: `A new verification code has been sent to ${email}`,
      });
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message || "Failed to resend code";
      toast({
        title: "Resend failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsResending(false);
    }
  };

  const handleBackToRegister = () => {
    localStorage.removeItem("pendingRegistration");
    navigate("/register");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/5 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link
            to="/"
            className="inline-flex items-center space-x-2 text-2xl font-bold text-foreground"
          >
            <Wallet className="h-8 w-8 text-primary" />
            <span>FinanceTracker</span>
          </Link>
        </div>

        <Card className="border-border/50 shadow-lg">
          <CardHeader className="space-y-1 text-center">
            <div className="mx-auto mb-4 p-3 bg-primary/10 rounded-full w-fit">
              <Mail className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">Verify your email</CardTitle>
            <CardDescription>
              {firstName ? `Hi ${firstName}! ` : ""}
              We've sent a verification code to
              <div className="font-medium text-foreground mt-1">{email}</div>
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleVerify}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="otp" className="text-center block">
                  Enter 6-digit verification code
                </Label>
                <Input
                  id="otp"
                  type="text"
                  value={otp}
                  onChange={(e) => handleOtpChange(e.target.value)}
                  placeholder="123456"
                  className="text-center text-2xl tracking-widest font-mono"
                  maxLength={6}
                  autoComplete="one-time-code"
                  autoFocus
                />
              </div>

              {timeLeft > 0 ? (
                <div className="text-center text-sm text-muted-foreground">
                  Code expires in{" "}
                  <span className="font-medium text-primary">
                    {formatTime(timeLeft)}
                  </span>
                </div>
              ) : (
                <div className="text-center text-sm text-destructive">
                  Code has expired. Please request a new one.
                </div>
              )}
            </CardContent>

            <CardFooter className="flex flex-col space-y-4">
              <Button
                type="submit"
                className="w-full"
                disabled={isVerifying || otp.length !== 6}
              >
                {isVerifying ? "Verifying..." : "Verify Email"}
              </Button>

              <div className="flex flex-col space-y-2 w-full">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={handleResend}
                  disabled={isResending || timeLeft > 0}
                >
                  {isResending ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Resending...
                    </>
                  ) : (
                    "Resend Code"
                  )}
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  className="w-full"
                  onClick={handleBackToRegister}
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Registration
                </Button>
              </div>

              <div className="text-center text-sm text-muted-foreground">
                Didn't receive the email? Check your spam folder or{" "}
                <button
                  type="button"
                  className="text-primary hover:underline"
                  onClick={handleResend}
                  disabled={timeLeft > 0}
                >
                  try again
                </button>
              </div>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default VerifyOTP;
