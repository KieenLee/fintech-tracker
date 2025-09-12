import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Wallet, ArrowLeft, Mail } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

const VerifyOTP = () => {
  const [otp, setOtp] = useState("");
  const [timeLeft, setTimeLeft] = useState(120); // 2 minutes in seconds
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [email, setEmail] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Check if user came from registration
    const pendingRegistration = localStorage.getItem("pendingRegistration");
    if (!pendingRegistration) {
      navigate("/register");
      return;
    }
    
    const userData = JSON.parse(pendingRegistration);
    setEmail(userData.email);
  }, [navigate]);

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
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
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

    // Simulate OTP verification
    setTimeout(() => {
      const pendingRegistration = localStorage.getItem("pendingRegistration");
      if (pendingRegistration) {
        const userData = JSON.parse(pendingRegistration);
        
        // Complete registration
        localStorage.setItem("userRole", "customer");
        localStorage.setItem("isAuthenticated", "true");
        localStorage.setItem("userEmail", userData.email);
        localStorage.setItem("userName", `${userData.firstName} ${userData.lastName}`);
        localStorage.removeItem("pendingRegistration");
        
        toast({
          title: "Email verified!",
          description: "Welcome to FinanceTracker",
        });
        
        navigate("/dashboard");
      }
      setIsVerifying(false);
    }, 1500);
  };

  const handleResend = async () => {
    if (timeLeft > 0) return;
    
    setIsResending(true);
    setTimeLeft(120); // Reset timer
    setOtp(""); // Clear current OTP

    // Simulate resending OTP
    setTimeout(() => {
      toast({
        title: "Code resent!",
        description: `A new verification code has been sent to ${email}`,
      });
      setIsResending(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/5 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center space-x-2 text-2xl font-bold text-foreground">
            <Wallet className="h-8 w-8 text-primary" />
            <span>FinanceTracker</span>
          </Link>
        </div>

        <Card className="border-border/50 shadow-lg">
          <CardHeader className="space-y-1 text-center">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-primary/10 rounded-full">
                <Mail className="h-8 w-8 text-primary" />
              </div>
            </div>
            <CardTitle className="text-2xl">Verify your email</CardTitle>
            <CardDescription>
              We've sent a 6-digit verification code to
              <br />
              <span className="font-medium text-foreground">{email}</span>
            </CardDescription>
          </CardHeader>
          
          <form onSubmit={handleVerify}>
            <CardContent className="space-y-6">
              <div className="flex justify-center">
                <InputOTP
                  maxLength={6}
                  value={otp}
                  onChange={(value) => setOtp(value)}
                  disabled={isVerifying}
                >
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>
              </div>

              <div className="text-center space-y-2">
                <p className="text-sm text-muted-foreground">
                  Code expires in:{" "}
                  <span className={`font-mono font-medium ${timeLeft <= 30 ? 'text-destructive' : 'text-foreground'}`}>
                    {formatTime(timeLeft)}
                  </span>
                </p>
                
                <Button
                  type="button"
                  variant="link"
                  className="p-0 h-auto text-sm"
                  onClick={handleResend}
                  disabled={timeLeft > 0 || isResending}
                >
                  {isResending ? "Sending..." : "Resend code"}
                </Button>
              </div>

              <Button 
                type="submit" 
                className="w-full" 
                disabled={isVerifying || otp.length !== 6}
              >
                {isVerifying ? "Verifying..." : "Verify email"}
              </Button>

              <div className="flex items-center justify-center">
                <Link 
                  to="/register" 
                  className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to registration
                </Link>
              </div>
            </CardContent>
          </form>
        </Card>

        {/* Help text */}
        <Card className="mt-4 border-dashed">
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground space-y-2">
              <p className="font-medium">Didn't receive the code?</p>
              <ul className="space-y-1 text-xs">
                <li>• Check your spam/junk folder</li>
                <li>• Make sure you entered the correct email</li>
                <li>• Wait for the timer to expire and resend</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default VerifyOTP;