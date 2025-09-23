import { useState } from "react";
import axios from "axios";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Eye, EyeOff, Wallet } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

const Register = () => {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    accountType: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState({
    email: "",
    username: "",
  });
  const navigate = useNavigate();
  const { toast } = useToast();

  const checkEmailAvailability = async (email: string) => {
    if (!email || !email.includes("@")) return;

    try {
      await axios.post("http://localhost:5013/api/auth/check-email", { email });
      setValidationErrors((prev) => ({ ...prev, email: "" }));
    } catch (error: any) {
      if (error.response?.status === 409) {
        setValidationErrors((prev) => ({
          ...prev,
          email: "This email is already registered",
        }));
      }
    }
  };

  const checkUsernameAvailability = async (username: string) => {
    if (!username || username.length < 3) return;

    try {
      await axios.post("http://localhost:5013/api/auth/check-username", {
        username,
      });
      setValidationErrors((prev) => ({ ...prev, username: "" }));
    } catch (error: any) {
      if (error.response?.status === 409) {
        setValidationErrors((prev) => ({
          ...prev,
          username: "This username is already taken",
        }));
      }
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    if (field === "email" || field === "username") {
      setValidationErrors((prev) => ({ ...prev, [field]: "" }));
    }

    if (field === "email") {
      setTimeout(() => checkEmailAvailability(value), 1000);
    }
    if (field === "username") {
      setTimeout(() => checkUsernameAvailability(value), 1000);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Password mismatch",
        description: "Passwords do not match",
        variant: "destructive",
      });
      return;
    }

    if (!acceptTerms) {
      toast({
        title: "Terms required",
        description: "Please accept the terms and conditions",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await axios.post(
        "http://localhost:5013/api/auth/register",
        {
          username: formData.username,
          email: formData.email,
          password: formData.password,
          firstName: formData.firstName,
          lastName: formData.lastName,
        }
      );

      localStorage.setItem(
        "pendingRegistration",
        JSON.stringify({
          email: formData.email,
          firstName: formData.firstName,
          lastName: formData.lastName,
          username: formData.username,
        })
      );

      toast({
        title: "Verification code sent!",
        description: `Please check your email (${formData.email}) for the verification code.`,
      });

      navigate(`/verify-otp?email=${encodeURIComponent(formData.email)}`);
    } catch (error: any) {
      let errorMessage = "Registration failed";

      if (error.response?.status === 409) {
        errorMessage =
          error.response?.data?.message || "Email or username already exists";
      } else if (error.response?.status === 400) {
        errorMessage =
          error.response?.data?.message || "Please check your input data";
      } else if (error.response?.status === 500) {
        errorMessage = "Server error. Please try again later.";
      } else {
        errorMessage =
          error.response?.data?.message ||
          "Network error. Please check your connection.";
      }

      toast({
        title: "Registration failed",
        description: errorMessage,
        variant: "destructive",
      });

      if (error.response?.data?.message?.includes("Email already exists")) {
        setTimeout(() => {
          toast({
            title: "Email exists",
            description:
              "This email is already registered. Try logging in instead.",
            action: (
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate("/login")}
              >
                Go to Login
              </Button>
            ),
          });
        }, 2000);
      }
    }

    setIsLoading(false);
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
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center">
              Create your account
            </CardTitle>
            <CardDescription className="text-center">
              Start your journey to financial freedom
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    type="text"
                    value={formData.firstName}
                    onChange={(e) =>
                      handleInputChange("firstName", e.target.value)
                    }
                    required
                    placeholder="John"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    type="text"
                    value={formData.lastName}
                    onChange={(e) =>
                      handleInputChange("lastName", e.target.value)
                    }
                    required
                    placeholder="Doe"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  type="text"
                  value={formData.username}
                  onChange={(e) =>
                    handleInputChange("username", e.target.value)
                  }
                  required
                  placeholder="johndoe"
                  className={
                    validationErrors.username ? "border-destructive" : ""
                  }
                />
                {validationErrors.username && (
                  <p className="text-sm text-destructive">
                    {validationErrors.username}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  required
                  placeholder="john@example.com"
                  className={validationErrors.email ? "border-destructive" : ""}
                />
                {validationErrors.email && (
                  <p className="text-sm text-destructive">
                    {validationErrors.email}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) =>
                      handleInputChange("password", e.target.value)
                    }
                    required
                    placeholder="Create a strong password"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={formData.confirmPassword}
                    onChange={(e) =>
                      handleInputChange("confirmPassword", e.target.value)
                    }
                    required
                    placeholder="Confirm your password"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="accountType">Account Type</Label>
                <Select
                  onValueChange={(value) =>
                    handleInputChange("accountType", value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select account type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="personal">Personal</SelectItem>
                    <SelectItem value="business">Business</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="terms"
                  checked={acceptTerms}
                  onCheckedChange={(checked) =>
                    setAcceptTerms(checked as boolean)
                  }
                />
                <Label htmlFor="terms" className="text-sm">
                  I agree to the{" "}
                  <Link to="/terms" className="text-primary hover:underline">
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link to="/privacy" className="text-primary hover:underline">
                    Privacy Policy
                  </Link>
                </Label>
              </div>
            </CardContent>

            <CardFooter className="flex flex-col space-y-4">
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Sending verification code..." : "Create Account"}
              </Button>

              <div className="text-center text-sm">
                Already have an account?{" "}
                <Link to="/login" className="text-primary hover:underline">
                  Sign in
                </Link>
              </div>

              <Separator />

              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => {
                  /* Google auth logic */
                }}
              >
                Continue with Google
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default Register;
