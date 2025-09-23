import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
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
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Loader2 } from "lucide-react";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Edit2,
  Camera,
  Trophy,
  Target,
  TrendingUp,
  Award,
  Star,
  Crown,
  CreditCard,
  Trash2,
  Upload,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { profileService, ProfileResponse } from "@/services/profileService";

const iconMap = {
  Target,
  TrendingUp,
  Trophy,
  Award,
  Star,
  User,
  Mail,
};

const Profile = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState<ProfileResponse | null>(null);
  const userRole = localStorage.getItem("userRole") || "customer";
  const userSubscription = localStorage.getItem("userSubscription") || "basic";

  const [editForm, setEditForm] = useState({
    username: "",
    email: "",
    firstName: "",
    lastName: "",
    phone: "",
    address: "",
    dateOfBirth: "",
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const data = await profileService.getProfile();
      setProfileData(data);

      // Cập nhật form với dữ liệu từ API
      setEditForm({
        username: data.username,
        email: data.email,
        firstName: data.firstName || "",
        lastName: data.lastName || "",
        phone: data.phone || "",
        address: data.address || "",
        dateOfBirth: data.dateOfBirth || "",
      });

      // Cập nhật localStorage để sync với sidebar
      const fullName =
        `${data.firstName || ""} ${data.lastName || ""}`.trim() ||
        data.username;
      localStorage.setItem("userName", fullName);
      localStorage.setItem("userEmail", data.email);
    } catch (error: any) {
      console.error("Failed to load profile:", error);
      toast({
        title: t("common.error"),
        description:
          error.response?.data?.message || t("profile.failed_to_load"),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSubmitting(true);
      await profileService.updateProfile(editForm);

      // Refresh data
      await fetchProfile();

      setIsEditing(false);
      toast({
        title: t("profile.profile_updated"),
        description: t("profile.profile_updated_desc"),
      });

      // Trigger storage event để sidebar cập nhật
      window.dispatchEvent(
        new StorageEvent("storage", {
          key: "userName",
          newValue:
            `${editForm.firstName} ${editForm.lastName}`.trim() ||
            editForm.username,
        })
      );
    } catch (error: any) {
      console.error("Failed to update profile:", error);
      toast({
        title: t("common.error"),
        description:
          error.response?.data?.message || t("profile.failed_to_update"),
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (profileData) {
      setEditForm({
        username: profileData.username,
        email: profileData.email,
        firstName: profileData.firstName || "",
        lastName: profileData.lastName || "",
        phone: profileData.phone || "",
        address: profileData.address || "",
        dateOfBirth: profileData.dateOfBirth || "",
      });
    }
    setIsEditing(false);
  };

  const handleAvatarUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: t("profile.invalid_file_type"),
        description: t("profile.invalid_file_desc"),
        variant: "destructive",
      });
      return;
    }

    // Validate file size (5MB)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: t("profile.file_too_large"),
        description: t("profile.file_too_large_desc"),
        variant: "destructive",
      });
      return;
    }

    try {
      setUploadingAvatar(true);
      const result = await profileService.uploadAvatar(file);

      // Refresh profile data to get new avatar URL
      await fetchProfile();

      toast({
        title: t("profile.avatar_updated"),
        description: t("profile.avatar_updated_desc"),
      });
    } catch (error: any) {
      console.error("Failed to upload avatar:", error);

      // **FIX: Better error handling**
      let errorMessage = t("profile.upload_failed");
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.status === 500) {
        errorMessage = t("profile.server_error");
      }

      toast({
        title: t("profile.upload_failed"),
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setUploadingAvatar(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleDeleteAvatar = async () => {
    try {
      setUploadingAvatar(true);
      await profileService.deleteAvatar();

      // Refresh profile data
      await fetchProfile();

      toast({
        title: t("profile.avatar_removed"),
        description: t("profile.avatar_removed_desc"),
      });
    } catch (error: any) {
      console.error("Failed to delete avatar:", error);
      toast({
        title: t("profile.delete_failed"),
        description:
          error.response?.data?.message || t("profile.delete_failed"),
        variant: "destructive",
      });
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleUpgrade = () => {
    navigate("/upgrade");
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case "Bronze":
        return "text-amber-600";
      case "Silver":
        return "text-gray-500";
      case "Gold":
        return "text-yellow-500";
      case "Platinum":
        return "text-purple-500";
      case "Diamond":
        return "text-blue-500";
      default:
        return "text-primary";
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return t("profile.not_set");
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">{t("profile.loading_profile")}</span>
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className="p-6">
        <div className="text-center">
          <h2 className="text-xl font-semibold">
            {t("profile.failed_load_profile")}
          </h2>
          <Button onClick={fetchProfile} className="mt-4">
            {t("common.try_again")}
          </Button>
        </div>
      </div>
    );
  }

  const displayName =
    `${profileData.firstName || ""} ${profileData.lastName || ""}`.trim() ||
    profileData.username;

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          {t("profile.title")}
        </h1>
        <p className="text-muted-foreground">{t("profile.subtitle")}</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Profile Information */}
        <div className="md:col-span-2 space-y-6">
          <Card className="transition-all hover:shadow-md">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  {t("profile.personal_information")}
                </CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    isEditing ? handleCancel() : setIsEditing(true)
                  }
                  disabled={submitting}
                >
                  <Edit2 className="h-4 w-4 mr-2" />
                  {isEditing ? t("common.cancel") : t("common.edit")}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Avatar Section */}
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <Avatar className="h-20 w-20">
                    <AvatarImage
                      src={
                        profileData.avatarUrl
                          ? `http://localhost:5013${profileData.avatarUrl}`
                          : "/placeholder.svg"
                      }
                      alt={displayName}
                    />
                    <AvatarFallback className="text-lg">
                      {displayName
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  {isEditing && (
                    <div className="absolute -bottom-2 -right-2 flex gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 w-8 rounded-full p-0"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploadingAvatar}
                      >
                        {uploadingAvatar ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Camera className="h-4 w-4" />
                        )}
                      </Button>
                      {profileData.avatarUrl && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 w-8 rounded-full p-0 text-destructive hover:text-destructive"
                          onClick={handleDeleteAvatar}
                          disabled={uploadingAvatar}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-semibold">{displayName}</h3>
                  <p className="text-muted-foreground">
                    {t("profile.member_since", { date: profileData.joinDate })}
                  </p>
                  <div className="flex gap-2 mt-1">
                    <Badge variant="secondary">
                      {userRole === "admin"
                        ? t("profile.administrator")
                        : t("profile.customer")}
                    </Badge>
                    {userSubscription === "premium" ? (
                      <Badge className="bg-primary text-primary-foreground">
                        <Crown className="h-3 w-3 mr-1" />
                        {t("common.premium")}
                      </Badge>
                    ) : (
                      <Badge variant="outline">{t("profile.basic_plan")}</Badge>
                    )}
                  </div>
                </div>
              </div>

              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/gif"
                onChange={handleAvatarUpload}
                className="hidden"
              />

              {/* Profile Fields */}
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="firstName">{t("profile.first_name")}</Label>
                  {isEditing ? (
                    <Input
                      id="firstName"
                      value={editForm.firstName}
                      onChange={(e) =>
                        setEditForm({ ...editForm, firstName: e.target.value })
                      }
                    />
                  ) : (
                    <div className="flex items-center gap-2 mt-1">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span>
                        {profileData.firstName || t("profile.not_set")}
                      </span>
                    </div>
                  )}
                </div>

                <div>
                  <Label htmlFor="lastName">{t("profile.last_name")}</Label>
                  {isEditing ? (
                    <Input
                      id="lastName"
                      value={editForm.lastName}
                      onChange={(e) =>
                        setEditForm({ ...editForm, lastName: e.target.value })
                      }
                    />
                  ) : (
                    <div className="flex items-center gap-2 mt-1">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span>
                        {profileData.lastName || t("profile.not_set")}
                      </span>
                    </div>
                  )}
                </div>

                <div>
                  <Label htmlFor="username">{t("auth.username")}</Label>
                  {isEditing ? (
                    <Input
                      id="username"
                      value={editForm.username}
                      onChange={(e) =>
                        setEditForm({ ...editForm, username: e.target.value })
                      }
                    />
                  ) : (
                    <div className="flex items-center gap-2 mt-1">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span>{profileData.username}</span>
                    </div>
                  )}
                </div>

                <div>
                  <Label htmlFor="email">{t("profile.email_address")}</Label>
                  {isEditing ? (
                    <Input
                      id="email"
                      type="email"
                      value={editForm.email}
                      onChange={(e) =>
                        setEditForm({ ...editForm, email: e.target.value })
                      }
                    />
                  ) : (
                    <div className="flex items-center gap-2 mt-1">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span>{profileData.email}</span>
                    </div>
                  )}
                </div>

                <div>
                  <Label htmlFor="phone">{t("profile.phone_number")}</Label>
                  {isEditing ? (
                    <Input
                      id="phone"
                      value={editForm.phone}
                      onChange={(e) =>
                        setEditForm({ ...editForm, phone: e.target.value })
                      }
                    />
                  ) : (
                    <div className="flex items-center gap-2 mt-1">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>{profileData.phone || t("profile.not_set")}</span>
                    </div>
                  )}
                </div>

                <div>
                  <Label htmlFor="dateOfBirth">
                    {t("profile.date_of_birth")}
                  </Label>
                  {isEditing ? (
                    <Input
                      id="dateOfBirth"
                      type="date"
                      value={editForm.dateOfBirth}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          dateOfBirth: e.target.value,
                        })
                      }
                    />
                  ) : (
                    <div className="flex items-center gap-2 mt-1">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>{formatDate(profileData.dateOfBirth)}</span>
                    </div>
                  )}
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="address">{t("profile.address")}</Label>
                  {isEditing ? (
                    <Textarea
                      id="address"
                      value={editForm.address}
                      onChange={(e) =>
                        setEditForm({ ...editForm, address: e.target.value })
                      }
                      rows={3}
                    />
                  ) : (
                    <div className="flex items-center gap-2 mt-1">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>{profileData.address || t("profile.not_set")}</span>
                    </div>
                  )}
                </div>
              </div>

              {isEditing && (
                <div className="flex gap-2">
                  <Button onClick={handleSave} disabled={submitting}>
                    {submitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        {t("profile.saving")}
                      </>
                    ) : (
                      t("profile.save_changes")
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleCancel}
                    disabled={submitting}
                  >
                    {t("common.cancel")}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Achievements */}
          <Card className="transition-all hover:shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5" />
                {t("profile.achievements")}
              </CardTitle>
              <CardDescription>{t("profile.milestones")}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {profileData.achievements.map((achievement) => {
                  const IconComponent =
                    iconMap[achievement.icon as keyof typeof iconMap] || Star;
                  return (
                    <div
                      key={achievement.id}
                      className={`flex items-center gap-4 p-4 rounded-lg border transition-colors ${
                        achievement.earned
                          ? "bg-success/10 border-success/20"
                          : "bg-muted/50 border-muted"
                      }`}
                    >
                      <div
                        className={`p-2 rounded-full ${
                          achievement.earned
                            ? "bg-success text-success-foreground"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        <IconComponent className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium">{achievement.title}</h4>
                        <p className="text-sm text-muted-foreground">
                          {achievement.description}
                        </p>
                        {achievement.earned && achievement.date && (
                          <div className="flex items-center gap-1 mt-1">
                            <Calendar className="h-3 w-3" />
                            <span className="text-xs text-muted-foreground">
                              {t("profile.earned_on", {
                                date: new Date(
                                  achievement.date
                                ).toLocaleDateString(),
                              })}
                            </span>
                          </div>
                        )}
                        {!achievement.earned && achievement.progress > 0 && (
                          <div className="mt-2">
                            <Progress
                              value={achievement.progress}
                              className="h-2"
                            />
                            <span className="text-xs text-muted-foreground">
                              {t("profile.complete_progress", {
                                progress: Math.round(achievement.progress),
                              })}
                            </span>
                          </div>
                        )}
                      </div>
                      {achievement.earned && (
                        <Badge
                          variant="secondary"
                          className="bg-success/20 text-success"
                        >
                          {t("profile.earned")}
                        </Badge>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Statistics Sidebar */}
        <div className="space-y-6">
          <Card className="transition-all hover:shadow-md">
            <CardHeader>
              <CardTitle>{t("profile.quick_stats")}</CardTitle>
              <CardDescription>{t("profile.activity_glance")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">
                  {t("profile.total_transactions")}
                </span>
                <div className="text-right">
                  <div className="font-bold">
                    {profileData.stats.totalTransactions.toLocaleString()}
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">
                  {t("profile.budgets_created")}
                </span>
                <div className="text-right">
                  <div className="font-bold">
                    {profileData.stats.budgetsCreated}
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">
                  {t("profile.goals_achieved")}
                </span>
                <div className="text-right">
                  <div className="font-bold">
                    {profileData.stats.goalsAchieved}
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">
                  {t("profile.days_active")}
                </span>
                <div className="text-right">
                  <div className="font-bold">
                    {profileData.stats.daysActive}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="transition-all hover:shadow-md">
            <CardHeader>
              <CardTitle>{t("profile.account_level")}</CardTitle>
              <CardDescription>
                {t("profile.progress_next_tier")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-center">
                  <div
                    className={`text-2xl font-bold ${getLevelColor(
                      profileData.accountLevel.currentLevel
                    )}`}
                  >
                    {profileData.accountLevel.currentLevel}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {t("profile.current_level")}
                  </div>
                </div>
                <Progress
                  value={profileData.accountLevel.progress}
                  className="h-3"
                />
                <div className="text-center text-sm text-muted-foreground">
                  {t("profile.to_next_level", {
                    progress: profileData.accountLevel.progress,
                    nextLevel: profileData.accountLevel.nextLevel,
                  })}
                </div>
                <div className="text-xs text-muted-foreground text-center">
                  {t("profile.points_earned", {
                    points: profileData.accountLevel.points,
                  })}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Subscription Card - Demo */}
          <Card className="transition-all hover:shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {userSubscription === "premium" ? (
                  <>
                    <Crown className="h-5 w-5 text-primary" />
                    {t("profile.premium_subscription")}
                  </>
                ) : (
                  <>
                    <CreditCard className="h-5 w-5" />
                    {t("profile.subscription_plan")}
                  </>
                )}
              </CardTitle>
              <CardDescription>
                {userSubscription === "premium"
                  ? t("profile.premium_access")
                  : t("profile.upgrade_unlock")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {userSubscription === "premium" ? (
                  <>
                    <div className="text-center">
                      <Badge className="bg-primary text-primary-foreground text-lg px-4 py-2">
                        <Crown className="h-4 w-4 mr-1" />
                        {t("profile.premium_active")}
                      </Badge>
                      <p className="text-sm text-muted-foreground mt-2">
                        {t("profile.next_billing", { date: "June 15, 2024" })}
                      </p>
                    </div>
                    <Button variant="outline" className="w-full">
                      {t("profile.manage_subscription")}
                    </Button>
                  </>
                ) : (
                  <>
                    <div className="text-center">
                      <Badge variant="outline" className="text-lg px-4 py-2">
                        {t("profile.basic_plan")}
                      </Badge>
                      <p className="text-sm text-muted-foreground mt-2">
                        {t("profile.limited_features")}
                      </p>
                    </div>
                    <Button className="w-full" onClick={handleUpgrade}>
                      <Crown className="h-4 w-4 mr-2" />
                      {t("profile.upgrade_to_premium")}
                    </Button>
                    <p className="text-xs text-muted-foreground text-center">
                      {t("profile.unlock_features")}
                    </p>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Profile;
