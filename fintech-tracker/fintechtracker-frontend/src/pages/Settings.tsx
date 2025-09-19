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
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  settingsService,
  type UpdateProfileRequest,
  type NotificationSettings,
  type PrivacySettings,
} from "@/services/settingsService";

const Settings = () => {
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [profile, setProfile] = useState({
    name: "",
    email: "",
    currency: "USD",
    language: "en",
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
          name: settings.name,
          email: settings.email,
          currency: settings.currency,
          language: settings.language,
        });

        setNotifications(settings.notifications);
        setPrivacy(settings.privacy);

        // Cập nhật localStorage để sync với sidebar
        localStorage.setItem("userName", settings.name);
        localStorage.setItem("userEmail", settings.email);
      } catch (error: any) {
        console.error("Failed to fetch settings:", error);
        toast({
          title: "Error",
          description: "Failed to load settings. Using default values.",
          variant: "destructive",
        });

        // Fallback to localStorage values
        setProfile({
          name: localStorage.getItem("userName") || "User",
          email: localStorage.getItem("userEmail") || "user@example.com",
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
        name: profile.name,
        email: profile.email,
        currency: profile.currency,
        language: profile.language,
      };

      await settingsService.updateProfile(updateData);

      // Cập nhật localStorage để sync với sidebar
      localStorage.setItem("userName", profile.name);
      localStorage.setItem("userEmail", profile.email);

      // Trigger storage event để sidebar cập nhật
      window.dispatchEvent(
        new StorageEvent("storage", {
          key: "userName",
          newValue: profile.name,
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
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  value={profile.name}
                  onChange={(e) =>
                    setProfile({ ...profile, name: e.target.value })
                  }
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
                    <SelectItem value="JPY">JPY - Japanese Yen</SelectItem>
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
