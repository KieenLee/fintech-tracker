import { useState, useEffect } from "react";
import { useTheme } from "@/hooks/useTheme";
import { useTranslation } from "react-i18next";
import i18n from "@/i18n";
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
  const { t, i18n: i18nInstance } = useTranslation();
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
    fetchSettings();
  }, []); // ✅ QUAN TRỌNG: Bỏ toast và t khỏi dependencies

  // ✅ SỬA LỖI: Bỏ debug useEffect hoặc thêm dependency đúng
  useEffect(() => {
    console.log("Current language:", i18nInstance.language);
    console.log("Available languages:", Object.keys(i18nInstance.store.data));
    console.log("Translation test:", t("settings.title"));
  }, [i18nInstance.language]); // ✅ CHỈ dependency i18nInstance.language

  // ✅ THÊM: Error handling riêng cho việc load settings thất bại
  const [settingsError, setSettingsError] = useState<string | null>(null);

  useEffect(() => {
    if (settingsError) {
      toast({
        title: t("common.error"),
        description: settingsError,
        variant: "destructive",
      });
    }
  }, [settingsError, toast, t]); // ✅ Riêng biệt để tránh loop

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
        title: t("settings.profile_updated"),
        description: t("settings.profile_updated_desc"),
      });
    } catch (error: any) {
      console.error("Failed to update profile:", error);
      toast({
        title: t("common.error"),
        description:
          error.response?.data?.message || t("settings.failed_to_update"),
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: t("common.error"),
        description: t("settings.password_mismatch"),
        variant: "destructive",
      });
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast({
        title: t("common.error"),
        description: t("settings.password_too_short"),
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
        title: t("settings.password_changed"),
        description: t("settings.password_changed_desc"),
      });
    } catch (error: any) {
      console.error("Failed to change password:", error);
      toast({
        title: t("common.error"),
        description:
          error.response?.data?.message ||
          t("settings.failed_to_change_password"),
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
        title: t("settings.notifications_updated"),
        description: t("settings.notifications_updated_desc"),
      });
    } catch (error: any) {
      console.error("Failed to update notifications:", error);
      toast({
        title: t("common.error"),
        description:
          error.response?.data?.message ||
          t("settings.failed_to_save_notifications"),
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
        title: t("settings.privacy_updated"),
        description: t("settings.privacy_updated_desc"),
      });
    } catch (error: any) {
      console.error("Failed to update privacy:", error);
      toast({
        title: t("common.error"),
        description:
          error.response?.data?.message || t("settings.failed_to_save_privacy"),
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleLanguageChange = (value: string) => {
    console.log("Changing language to:", value); // Debug
    setProfile({ ...profile, language: value });
    i18n.changeLanguage(value).then(() => {
      console.log("Language changed to:", value); // Debug
    });
    localStorage.setItem("language", value);
  };

  const themeOptions = [
    { value: "light", label: "Light", icon: Sun },
    { value: "dark", label: "Dark", icon: Moon },
    { value: "system", label: "System", icon: Monitor },
  ];

  const fetchSettings = async () => {
    try {
      setLoading(true);
      setSettingsError(null);

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

      // Đổi ngôn ngữ giao diện theo profile
      i18n.changeLanguage(settings.language);
      localStorage.setItem("language", settings.language);

      // Cập nhật localStorage để sync với sidebar
      const fullName = `${settings.firstName} ${settings.lastName}`.trim();
      localStorage.setItem("userName", fullName);
      localStorage.setItem("userEmail", settings.email);
    } catch (error: any) {
      console.error("Failed to fetch settings:", error);
      setSettingsError(t("settings.failed_to_load_settings"));

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

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">{t("settings.loading_settings")}</span>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          {t("settings.title")}
        </h1>
        <p className="text-muted-foreground">{t("settings.subtitle")}</p>
      </div>

      <div className="grid gap-6">
        {/* Theme Settings */}
        <Card className="transition-all hover:shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <SettingsIcon className="h-5 w-5" />
              {t("settings.appearance")}
            </CardTitle>
            <CardDescription>{t("settings.appearance_desc")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>{t("settings.theme")}</Label>
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
                      {t(`settings.${option.label.toLowerCase()}`)}
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
              {t("settings.profile_information")}
            </CardTitle>
            <CardDescription>{t("settings.profile_desc")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">{t("settings.first_name")}</Label>
                <Input
                  id="firstName"
                  value={profile.firstName}
                  onChange={(e) =>
                    setProfile({ ...profile, firstName: e.target.value })
                  }
                />
              </div>
              <div>
                <Label htmlFor="lastName">{t("settings.last_name")}</Label>
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
              <Label htmlFor="username">{t("auth.username")}</Label>
              <Input
                id="username"
                value={profile.username}
                onChange={(e) =>
                  setProfile({ ...profile, username: e.target.value })
                }
                pattern="^[a-zA-Z0-9_]+$"
                title={t("settings.username_pattern")}
              />
            </div>
            <div>
              <Label htmlFor="phoneNumber">{t("settings.phone_number")}</Label>
              <Input
                id="phoneNumber"
                value={profile.phoneNumber}
                onChange={(e) =>
                  setProfile({ ...profile, phoneNumber: e.target.value })
                }
              />
            </div>
            <div>
              <Label htmlFor="email">{t("settings.email_address")}</Label>
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
                <Label htmlFor="currency">{t("settings.currency")}</Label>
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
                    <SelectItem value="USD">
                      {t("settings.currency_usd")}
                    </SelectItem>
                    <SelectItem value="EUR">
                      {t("settings.currency_eur")}
                    </SelectItem>
                    <SelectItem value="GBP">
                      {t("settings.currency_gbp")}
                    </SelectItem>
                    <SelectItem value="CNY">
                      {t("settings.currency_cny")}
                    </SelectItem>
                    <SelectItem value="VND">
                      {t("settings.currency_vnd")}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="language">{t("settings.language")}</Label>
                <Select
                  value={profile.language}
                  onValueChange={handleLanguageChange}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">{t("settings.english")}</SelectItem>
                    <SelectItem value="vi">
                      {t("settings.vietnamese")}
                    </SelectItem>
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
              {t("settings.save_profile")}
            </Button>
          </CardContent>
        </Card>

        {/* Change Password */}
        <Card className="transition-all hover:shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              {t("settings.change_password")}
            </CardTitle>
            <CardDescription>
              {t("settings.change_password_desc")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="currentPassword">
                {t("settings.current_password")}
              </Label>
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
                <Label htmlFor="newPassword">
                  {t("settings.new_password")}
                </Label>
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
                <Label htmlFor="confirmPassword">
                  {t("settings.confirm_password")}
                </Label>
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
              {t("settings.change_password_btn")}
            </Button>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card className="transition-all hover:shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              {t("settings.notifications")}
            </CardTitle>
            <CardDescription>
              {t("settings.notifications_desc")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="email-notifications">
                    {t("settings.email_notifications")}
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    {t("settings.email_notifications_desc")}
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
                  <Label htmlFor="budget-alerts">
                    {t("settings.budget_alerts")}
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    {t("settings.budget_alerts_desc")}
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
                  <Label htmlFor="goal-reminders">
                    {t("settings.goal_reminders")}
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    {t("settings.goal_reminders_desc")}
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
                  <Label htmlFor="weekly-reports">
                    {t("settings.weekly_reports")}
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    {t("settings.weekly_reports_desc")}
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
              {t("settings.save_notifications")}
            </Button>
          </CardContent>
        </Card>

        {/* Privacy Settings */}
        <Card className="transition-all hover:shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              {t("settings.privacy_security")}
            </CardTitle>
            <CardDescription>{t("settings.privacy_desc")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="data-sharing">
                    {t("settings.data_sharing")}
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    {t("settings.data_sharing_desc")}
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
                  <Label htmlFor="analytics-tracking">
                    {t("settings.analytics_tracking")}
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    {t("settings.analytics_tracking_desc")}
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
                  <Label htmlFor="marketing-emails">
                    {t("settings.marketing_emails")}
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    {t("settings.marketing_emails_desc")}
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
              {t("settings.save_privacy")}
            </Button>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="border-destructive/50">
          <CardHeader>
            <CardTitle className="text-destructive">
              {t("settings.danger_zone")}
            </CardTitle>
            <CardDescription>{t("settings.danger_desc")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 border border-destructive/20 rounded-lg">
              <div>
                <h4 className="font-medium">{t("settings.delete_account")}</h4>
                <p className="text-sm text-muted-foreground">
                  {t("settings.delete_account_desc")}
                </p>
              </div>
              <Button
                variant="destructive"
                onClick={() => {
                  toast({
                    title: t("settings.account_deletion"),
                    description: t("settings.account_deletion_not_implemented"),
                    variant: "destructive",
                  });
                }}
              >
                {t("settings.delete_account")}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Settings;
