import { useState, useEffect } from "react";
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
  const { toast } = useToast();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
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
        title: "Error",
        description:
          error.response?.data?.message || "Failed to load profile data",
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
        title: "Profile updated",
        description: "Your profile information has been saved successfully.",
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
        title: "Error",
        description:
          error.response?.data?.message || "Failed to update profile",
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
      });
    }
    setIsEditing(false);
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

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading profile...</span>
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className="p-6">
        <div className="text-center">
          <h2 className="text-xl font-semibold">Failed to load profile</h2>
          <Button onClick={fetchProfile} className="mt-4">
            Try Again
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
        <h1 className="text-3xl font-bold tracking-tight">Profile</h1>
        <p className="text-muted-foreground">
          Manage your personal information and track your achievements
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Profile Information */}
        <div className="md:col-span-2 space-y-6">
          <Card className="transition-all hover:shadow-md">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Personal Information
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
                  {isEditing ? "Cancel" : "Edit"}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Avatar Section */}
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <Avatar className="h-20 w-20">
                    <AvatarImage
                      src={profileData.avatarUrl || "/placeholder.svg"}
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
                    <Button
                      size="sm"
                      variant="outline"
                      className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full p-0"
                    >
                      <Camera className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-semibold">{displayName}</h3>
                  <p className="text-muted-foreground">
                    Member since {profileData.joinDate}
                  </p>
                  <div className="flex gap-2 mt-1">
                    <Badge variant="secondary">
                      {userRole === "admin" ? "Administrator" : "Customer"}
                    </Badge>
                    {userSubscription === "premium" ? (
                      <Badge className="bg-primary text-primary-foreground">
                        <Crown className="h-3 w-3 mr-1" />
                        Premium
                      </Badge>
                    ) : (
                      <Badge variant="outline">Basic Plan</Badge>
                    )}
                  </div>
                </div>
              </div>

              {/* Profile Fields */}
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="firstName">First Name</Label>
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
                      <span>{profileData.firstName || "Not set"}</span>
                    </div>
                  )}
                </div>

                <div>
                  <Label htmlFor="lastName">Last Name</Label>
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
                      <span>{profileData.lastName || "Not set"}</span>
                    </div>
                  )}
                </div>

                <div>
                  <Label htmlFor="username">Username</Label>
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
                  <Label htmlFor="email">Email Address</Label>
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

                <div className="md:col-span-2">
                  <Label htmlFor="phone">Phone Number</Label>
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
                      <span>{profileData.phone || "Not set"}</span>
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
                        Saving...
                      </>
                    ) : (
                      "Save Changes"
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleCancel}
                    disabled={submitting}
                  >
                    Cancel
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
                Achievements
              </CardTitle>
              <CardDescription>
                Your financial milestones and accomplishments
              </CardDescription>
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
                              Earned on{" "}
                              {new Date(achievement.date).toLocaleDateString()}
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
                              {Math.round(achievement.progress)}% complete
                            </span>
                          </div>
                        )}
                      </div>
                      {achievement.earned && (
                        <Badge
                          variant="secondary"
                          className="bg-success/20 text-success"
                        >
                          Earned
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
              <CardTitle>Quick Stats</CardTitle>
              <CardDescription>Your activity at a glance</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Total Transactions</span>
                <div className="text-right">
                  <div className="font-bold">
                    {profileData.stats.totalTransactions.toLocaleString()}
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Budgets Created</span>
                <div className="text-right">
                  <div className="font-bold">
                    {profileData.stats.budgetsCreated}
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Goals Achieved</span>
                <div className="text-right">
                  <div className="font-bold">
                    {profileData.stats.goalsAchieved}
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Days Active</span>
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
              <CardTitle>Account Level</CardTitle>
              <CardDescription>Progress to next tier</CardDescription>
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
                    Current Level
                  </div>
                </div>
                <Progress
                  value={profileData.accountLevel.progress}
                  className="h-3"
                />
                <div className="text-center text-sm text-muted-foreground">
                  {profileData.accountLevel.progress}% to{" "}
                  {profileData.accountLevel.nextLevel} Level
                </div>
                <div className="text-xs text-muted-foreground text-center">
                  {profileData.accountLevel.points} points earned
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
                    Premium Subscription
                  </>
                ) : (
                  <>
                    <CreditCard className="h-5 w-5" />
                    Subscription Plan
                  </>
                )}
              </CardTitle>
              <CardDescription>
                {userSubscription === "premium"
                  ? "You have access to all premium features"
                  : "Upgrade to unlock more features"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {userSubscription === "premium" ? (
                  <>
                    <div className="text-center">
                      <Badge className="bg-primary text-primary-foreground text-lg px-4 py-2">
                        <Crown className="h-4 w-4 mr-1" />
                        Premium Active
                      </Badge>
                      <p className="text-sm text-muted-foreground mt-2">
                        Next billing date: June 15, 2024
                      </p>
                    </div>
                    <Button variant="outline" className="w-full">
                      Manage Subscription
                    </Button>
                  </>
                ) : (
                  <>
                    <div className="text-center">
                      <Badge variant="outline" className="text-lg px-4 py-2">
                        Basic Plan
                      </Badge>
                      <p className="text-sm text-muted-foreground mt-2">
                        Limited features available
                      </p>
                    </div>
                    <Button className="w-full" onClick={handleUpgrade}>
                      <Crown className="h-4 w-4 mr-2" />
                      Upgrade to Premium
                    </Button>
                    <p className="text-xs text-muted-foreground text-center">
                      Unlock unlimited transactions, advanced analytics, and
                      investment tracking
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
