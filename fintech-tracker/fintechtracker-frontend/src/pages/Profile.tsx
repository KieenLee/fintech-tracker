import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
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
  CreditCard
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

const Profile = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [isEditing, setIsEditing] = useState(false);
  const userRole = localStorage.getItem("userRole") || "customer";
  const userSubscription = localStorage.getItem("userSubscription") || "basic";
  
  const [profile, setProfile] = useState({
    name: localStorage.getItem("userName") || "John Doe",
    email: localStorage.getItem("userEmail") || "john@example.com",
    phone: "+1 (555) 123-4567",
    location: "New York, NY",
    bio: "Passionate about personal finance and building wealth through smart investments and budgeting.",
    joinDate: "January 2023",
    avatar: "/placeholder.svg"
  });

  const achievements = [
    { 
      id: 1, 
      title: "First Budget Created", 
      description: "Created your first budget category",
      icon: Target,
      earned: true,
      date: "2024-01-15"
    },
    { 
      id: 2, 
      title: "Savings Streak", 
      description: "Saved money for 3 consecutive months",
      icon: TrendingUp,
      earned: true,
      date: "2024-03-20"
    },
    { 
      id: 3, 
      title: "Goal Achiever", 
      description: "Completed your first financial goal",
      icon: Trophy,
      earned: true,
      date: "2024-05-10"
    },
    { 
      id: 4, 
      title: "Budget Master", 
      description: "Stayed under budget for 6 months",
      icon: Award,
      earned: false,
      progress: 83
    },
    { 
      id: 5, 
      title: "Investment Pioneer", 
      description: "Made your first investment",
      icon: Star,
      earned: false,
      progress: 0
    }
  ];

  const stats = [
    { label: "Total Transactions", value: "1,247", change: "+12%" },
    { label: "Budgets Created", value: "8", change: "+2" },
    { label: "Goals Achieved", value: "3", change: "+1" },
    { label: "Days Active", value: "156", change: "+30" }
  ];

  const handleSave = () => {
    localStorage.setItem("userName", profile.name);
    localStorage.setItem("userEmail", profile.email);
    setIsEditing(false);
    toast({
      title: "Profile updated",
      description: "Your profile information has been saved successfully.",
    });
  };

  const handleCancel = () => {
    setProfile({
      ...profile,
      name: localStorage.getItem("userName") || "John Doe",
      email: localStorage.getItem("userEmail") || "john@example.com"
    });
    setIsEditing(false);
  };

  const handleUpgrade = () => {
    navigate("/upgrade");
  };

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Profile</h1>
        <p className="text-muted-foreground">Manage your personal information and track your achievements</p>
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
                  onClick={() => isEditing ? handleCancel() : setIsEditing(true)}
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
                    <AvatarImage src={profile.avatar} alt={profile.name} />
                    <AvatarFallback className="text-lg">
                      {profile.name.split(' ').map(n => n[0]).join('')}
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
                  <h3 className="text-lg font-semibold">{profile.name}</h3>
                  <p className="text-muted-foreground">Member since {profile.joinDate}</p>
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
                      <Badge variant="outline">
                        Basic Plan
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              {/* Profile Fields */}
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="name">Full Name</Label>
                  {isEditing ? (
                    <Input
                      id="name"
                      value={profile.name}
                      onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                    />
                  ) : (
                    <div className="flex items-center gap-2 mt-1">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span>{profile.name}</span>
                    </div>
                  )}
                </div>

                <div>
                  <Label htmlFor="email">Email Address</Label>
                  {isEditing ? (
                    <Input
                      id="email"
                      type="email"
                      value={profile.email}
                      onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                    />
                  ) : (
                    <div className="flex items-center gap-2 mt-1">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span>{profile.email}</span>
                    </div>
                  )}
                </div>

                <div>
                  <Label htmlFor="phone">Phone Number</Label>
                  {isEditing ? (
                    <Input
                      id="phone"
                      value={profile.phone}
                      onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                    />
                  ) : (
                    <div className="flex items-center gap-2 mt-1">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>{profile.phone}</span>
                    </div>
                  )}
                </div>

                <div>
                  <Label htmlFor="location">Location</Label>
                  {isEditing ? (
                    <Input
                      id="location"
                      value={profile.location}
                      onChange={(e) => setProfile({ ...profile, location: e.target.value })}
                    />
                  ) : (
                    <div className="flex items-center gap-2 mt-1">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>{profile.location}</span>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="bio">Bio</Label>
                {isEditing ? (
                  <Textarea
                    id="bio"
                    value={profile.bio}
                    onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                    className="mt-1"
                  />
                ) : (
                  <p className="mt-1 text-sm text-muted-foreground">{profile.bio}</p>
                )}
              </div>

              {isEditing && (
                <div className="flex gap-2">
                  <Button onClick={handleSave}>Save Changes</Button>
                  <Button variant="outline" onClick={handleCancel}>Cancel</Button>
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
              <CardDescription>Your financial milestones and accomplishments</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {achievements.map((achievement) => {
                  const Icon = achievement.icon;
                  return (
                    <div 
                      key={achievement.id} 
                      className={`flex items-center gap-4 p-4 rounded-lg border transition-colors ${
                        achievement.earned 
                          ? 'bg-success/10 border-success/20' 
                          : 'bg-muted/50 border-muted'
                      }`}
                    >
                      <div className={`p-2 rounded-full ${
                        achievement.earned 
                          ? 'bg-success text-success-foreground' 
                          : 'bg-muted text-muted-foreground'
                      }`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium">{achievement.title}</h4>
                        <p className="text-sm text-muted-foreground">{achievement.description}</p>
                        {achievement.earned && (
                          <div className="flex items-center gap-1 mt-1">
                            <Calendar className="h-3 w-3" />
                            <span className="text-xs text-muted-foreground">
                              Earned on {new Date(achievement.date).toLocaleDateString()}
                            </span>
                          </div>
                        )}
                        {!achievement.earned && achievement.progress > 0 && (
                          <div className="mt-2">
                            <Progress value={achievement.progress} className="h-2" />
                            <span className="text-xs text-muted-foreground">
                              {achievement.progress}% complete
                            </span>
                          </div>
                        )}
                      </div>
                      {achievement.earned && (
                        <Badge variant="secondary" className="bg-success/20 text-success">
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
              {stats.map((stat, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm font-medium">{stat.label}</span>
                  <div className="text-right">
                    <div className="font-bold">{stat.value}</div>
                    <div className="text-xs text-success">{stat.change}</div>
                  </div>
                </div>
              ))}
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
                  <div className="text-2xl font-bold text-primary">Gold</div>
                  <div className="text-sm text-muted-foreground">Current Level</div>
                </div>
                <Progress value={75} className="h-3" />
                <div className="text-center text-sm text-muted-foreground">
                  75% to Platinum Level
                </div>
                <div className="text-xs text-muted-foreground">
                  Complete 2 more goals to reach Platinum and unlock exclusive features!
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Subscription Card */}
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
                      Unlock unlimited transactions, advanced analytics, and investment tracking
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