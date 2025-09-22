import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Settings as SettingsIcon,
  Moon,
  Sun,
  Monitor,
  User,
  Bell,
  Shield,
  Save,
  Loader2,
  Lock,
  Eye,
  EyeOff,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  settingsService,
  type UpdateProfileRequest,
  type ChangePasswordRequest,
  type NotificationSettings,
  type PrivacySettings,
} from "@/services/settingsService";

const Settings = () => {
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [profile, setProfile] = useState({
    firstName: "",
    lastName: "",
    username: "",
    email: "",
    phoneNumber: "",
    currency: "USD",
    language: "en",
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [notifications, setNotifications] = useState<NotificationSettings>({
    emailNotifications: true,
    budgetAlerts: true,
    goalReminders: true,
    weeklyReports: false,
  });

  const [privacy, setPrivacy] = useState<PrivacySettings>({
    dataSharing: false,
    analyticsTracking: true,
    marketingEmails: false,
  });

  // Load settings khi component mount
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);
        const settings = await settingsService.getUserSettings();

        setProfile({
          firstName: settings.firstName,
          lastName: settings.lastName,
          username: settings.username,
          email: settings.email,
          phoneNumber: settings.phoneNumber,
          currency: settings.currency,
          language: settings.language,
        });

        setNotifications(settings.notifications);
        setPrivacy(settings.privacy);

        // Cập nhật localStorage để sync với sidebar
        const fullName = `${settings.firstName} ${settings.lastName}`.trim();
        localStorage.setItem("userName", fullName);
        localStorage.setItem("userEmail", settings.email);
      } catch (error: any) {
        console.error("Failed to fetch settings:", error);
        toast({
          title: "Error",
          description: "Failed to load settings. Using default values.",
          variant: "destructive",
        });

        // Fallback to localStorage values
        const savedName = localStorage.getItem("userName") || "User";
        const nameParts = savedName.split(" ");
        setProfile({
          firstName: nameParts[0] || "",
          lastName: nameParts.slice(1).join(" ") || "",
          username: "",
          email: localStorage.getItem("userEmail") || "user@example.com",
          phoneNumber: "",
          currency: "USD",
          language: "en",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, [toast]);

  const handleSaveProfile = async () => {
    try {
      setSubmitting(true);

      const updateData: UpdateProfileRequest = {
        firstName: profile.firstName,
        lastName: profile.lastName,
        username: profile.username,
        email: profile.email,
        phoneNumber: profile.phoneNumber,
        currency: profile.currency,
        language: profile.language,
      };

      await settingsService.updateProfile(updateData);

      // Cập nhật localStorage để sync với sidebar
      const fullName = `${profile.firstName} ${profile.lastName}`.trim();
      localStorage.setItem("userName", fullName);
      localStorage.setItem("userEmail", profile.email);

      // Trigger storage event để sidebar cập nhật
      window.dispatchEvent(
        new StorageEvent("storage", {
          key: "userName",
          newValue: fullName,
        })
      );

      toast({
        title: "Profile updated",
        description: "Your profile information has been saved successfully.",
      });
    } catch (error: any) {
      console.error("Failed to update profile:", error);
      toast({
        title: "Error",
        description:
          error.response?.data?.message || "Failed to update profile.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: "Error",
        description: "New password and confirm password do not match.",
        variant: "destructive",
      });
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast({
        title: "Error",
        description: "New password must be at least 6 characters long.",
        variant: "destructive",
      });
      return;
    }

    try {
      setSubmitting(true);

      const changePasswordRequest: ChangePasswordRequest = {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
        confirmPassword: passwordData.confirmPassword,
      };

      await settingsService.changePassword(changePasswordRequest);

      // Reset form
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });

      toast({
        title: "Password changed",
        description: "Your password has been updated successfully.",
      });
    } catch (error: any) {
      console.error("Failed to change password:", error);
      toast({
        title: "Error",
        description:
          error.response?.data?.message || "Failed to change password.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveNotifications = async () => {
    try {
      setSubmitting(true);
      await settingsService.updateNotifications(notifications);
      toast({
        title: "Notification preferences updated",
        description: "Your notification settings have been saved.",
      });
    } catch (error: any) {
      console.error("Failed to update notifications:", error);
      toast({
        title: "Error",
        description:
          error.response?.data?.message ||
          "Failed to save notification settings.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleSavePrivacy = async () => {
    try {
      setSubmitting(true);
      await settingsService.updatePrivacy(privacy);
      toast({
        title: "Privacy settings updated",
        description: "Your privacy preferences have been saved.",
      });
    } catch (error: any) {
      console.error("Failed to update privacy:", error);
      toast({
        title: "Error",
        description:
          error.response?.data?.message || "Failed to save privacy settings.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const themeOptions = [
    { value: "light", label: "Light", icon: Sun },
    { value: "dark", label: "Dark", icon: Moon },
    { value: "system", label: "System", icon: Monitor },
  ];

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading settings...</span>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account preferences and application settings
        </p>
      </div>

      <div className="grid gap-6">
        {/* Theme Settings */}
        <Card className="transition-all hover:shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <SettingsIcon className="h-5 w-5" />
              Appearance
            </CardTitle>
            <CardDescription>
              Customize how the application looks and feels
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Theme</Label>
              <div className="grid grid-cols-3 gap-3 mt-2">
                {themeOptions.map((option) => {
                  const Icon = option.icon;
                  return (
                    <Button
                      key={option.value}
                      variant={theme === option.value ? "default" : "outline"}
                      className="flex items-center gap-2 justify-start"
                      onClick={() => setTheme(option.value)}
                    >
                      <Icon className="h-4 w-4" />
                      {option.label}
                    </Button>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Profile Settings */}
        <Card className="transition-all hover:shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Profile Information
            </CardTitle>
            <CardDescription>Update your personal information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  value={profile.firstName}
                  onChange={(e) =>
                    setProfile({ ...profile, firstName: e.target.value })
                  }
                />
              </div>
              <div>
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  value={profile.lastName}
                  onChange={(e) =>
                    setProfile({ ...profile, lastName: e.target.value })
                  }
                />
              </div>
            </div>
            <div>
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={profile.username}
                onChange={(e) =>
                  setProfile({ ...profile, username: e.target.value })
                }
                pattern="^[a-zA-Z0-9_]+$"
                title="No special characters allowed"
              />
            </div>
            <div>
              <Label htmlFor="phoneNumber">Phone Number</Label>
              <Input
                id="phoneNumber"
                value={profile.phoneNumber}
                onChange={(e) =>
                  setProfile({ ...profile, phoneNumber: e.target.value })
                }
                pattern="^\d{9,15}$"
                title="Enter a valid phone number"
              />
            </div>
            <div>
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={profile.email}
                onChange={(e) =>
                  setProfile({ ...profile, email: e.target.value })
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="currency">Default Currency</Label>
                <Select
                  value={profile.currency}
                  onValueChange={(value) =>
                    setProfile({ ...profile, currency: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD - US Dollar</SelectItem>
                    <SelectItem value="EUR">EUR - Euro</SelectItem>
                    <SelectItem value="GBP">GBP - British Pound</SelectItem>
                    <SelectItem value="CNY">CNY - Chinese Yuan</SelectItem>
                    <SelectItem value="VND">VND - Vietnamese Dong</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="language">Language</Label>
                <Select
                  value={profile.language}
                  onValueChange={(value) =>
                    setProfile({ ...profile, language: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="vi">Vietnamese</SelectItem>
                    <SelectItem value="es">Spanish</SelectItem>
                    <SelectItem value="fr">French</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button
              onClick={handleSaveProfile}
              className="w-fit"
              disabled={submitting}
            >
              {submitting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Save Profile
            </Button>
          </CardContent>
        </Card>

        {/* Change Password */}
        <Card className="transition-all hover:shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Change Password
            </CardTitle>
            <CardDescription>Update your account password</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="currentPassword">Current Password</Label>
              <div className="relative">
                <Input
                  id="currentPassword"
                  type={showCurrentPassword ? "text" : "password"}
                  value={passwordData.currentPassword}
                  onChange={(e) =>
                    setPasswordData({
                      ...passwordData,
                      currentPassword: e.target.value,
                    })
                  }
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                >
                  {showCurrentPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="newPassword">New Password</Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showNewPassword ? "text" : "password"}
                    value={passwordData.newPassword}
                    onChange={(e) =>
                      setPasswordData({
                        ...passwordData,
                        newPassword: e.target.value,
                      })
                    }
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                  >
                    {showNewPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
              <div>
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={passwordData.confirmPassword}
                    onChange={(e) =>
                      setPasswordData({
                        ...passwordData,
                        confirmPassword: e.target.value,
                      })
                    }
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
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
            </div>
            <Button
              onClick={handleChangePassword}
              className="w-fit"
              disabled={
                submitting ||
                !passwordData.currentPassword ||
                !passwordData.newPassword ||
                !passwordData.confirmPassword
              }
            >
              {submitting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Lock className="h-4 w-4 mr-2" />
              )}
              Change Password
            </Button>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card className="transition-all hover:shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notifications
            </CardTitle>
            <CardDescription>
              Configure how you receive updates and alerts
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="email-notifications">
                    Email Notifications
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Receive updates via email
                  </p>
                </div>
                <Switch
                  id="email-notifications"
                  checked={notifications.emailNotifications}
                  onCheckedChange={(checked) =>
                    setNotifications({
                      ...notifications,
                      emailNotifications: checked,
                    })
                  }
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="budget-alerts">Budget Alerts</Label>
                  <p className="text-sm text-muted-foreground">
                    Get notified when approaching budget limits
                  </p>
                </div>
                <Switch
                  id="budget-alerts"
                  checked={notifications.budgetAlerts}
                  onCheckedChange={(checked) =>
                    setNotifications({
                      ...notifications,
                      budgetAlerts: checked,
                    })
                  }
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="goal-reminders">Goal Reminders</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive reminders about your financial goals
                  </p>
                </div>
                <Switch
                  id="goal-reminders"
                  checked={notifications.goalReminders}
                  onCheckedChange={(checked) =>
                    setNotifications({
                      ...notifications,
                      goalReminders: checked,
                    })
                  }
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="weekly-reports">Weekly Reports</Label>
                  <p className="text-sm text-muted-foreground">
                    Get weekly spending summaries
                  </p>
                </div>
                <Switch
                  id="weekly-reports"
                  checked={notifications.weeklyReports}
                  onCheckedChange={(checked) =>
                    setNotifications({
                      ...notifications,
                      weeklyReports: checked,
                    })
                  }
                />
              </div>
            </div>
            <Button
              onClick={handleSaveNotifications}
              className="w-fit"
              disabled={submitting}
            >
              {submitting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Save Notifications
            </Button>
          </CardContent>
        </Card>

        {/* Privacy Settings */}
        <Card className="transition-all hover:shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Privacy & Security
            </CardTitle>
            <CardDescription>
              Control your data and privacy preferences
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="data-sharing">Data Sharing</Label>
                  <p className="text-sm text-muted-foreground">
                    Allow anonymous data sharing for service improvement
                  </p>
                </div>
                <Switch
                  id="data-sharing"
                  checked={privacy.dataSharing}
                  onCheckedChange={(checked) =>
                    setPrivacy({ ...privacy, dataSharing: checked })
                  }
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="analytics-tracking">Analytics Tracking</Label>
                  <p className="text-sm text-muted-foreground">
                    Help improve the app with usage analytics
                  </p>
                </div>
                <Switch
                  id="analytics-tracking"
                  checked={privacy.analyticsTracking}
                  onCheckedChange={(checked) =>
                    setPrivacy({ ...privacy, analyticsTracking: checked })
                  }
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="marketing-emails">Marketing Emails</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive promotional emails and tips
                  </p>
                </div>
                <Switch
                  id="marketing-emails"
                  checked={privacy.marketingEmails}
                  onCheckedChange={(checked) =>
                    setPrivacy({ ...privacy, marketingEmails: checked })
                  }
                />
              </div>
            </div>
            <Button
              onClick={handleSavePrivacy}
              className="w-fit"
              disabled={submitting}
            >
              {submitting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Save Privacy Settings
            </Button>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="border-destructive/50">
          <CardHeader>
            <CardTitle className="text-destructive">Danger Zone</CardTitle>
            <CardDescription>
              Irreversible and destructive actions
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 border border-destructive/20 rounded-lg">
              <div>
                <h4 className="font-medium">Delete Account</h4>
                <p className="text-sm text-muted-foreground">
                  Permanently delete your account and all data
                </p>
              </div>
              <Button
                variant="destructive"
                onClick={() => {
                  toast({
                    title: "Account deletion",
                    description: "This feature is not yet implemented.",
                    variant: "destructive",
                  });
                }}
              >
                Delete Account
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Settings;
