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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, Edit, Trash2, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import {
  userService,
  UserListDto,
  UserStatsDto,
  CreateUserDto,
  UpdateUserDto,
} from "@/services/userService";
import { formatCurrencyAmount } from "../../Utils/currencyUtils";

const Users = () => {
  const [users, setUsers] = useState<UserListDto[]>([]);
  const [stats, setStats] = useState<UserStatsDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserListDto | null>(null);
  const [formData, setFormData] = useState<CreateUserDto>({
    username: "",
    email: "",
    role: "customer",
    firstName: "",
    lastName: "",
    phone: "",
    subscription: "basic",
    password: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const { t } = useTranslation();
  const currency = localStorage.getItem("userCurrency") || "USD";

  const formatCurrency = (amount: number) => {
    return formatCurrencyAmount(amount, currency);
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      loadUsers();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [usersResponse, statsResponse] = await Promise.all([
        userService.getUsers(),
        userService.getUserStats(),
      ]);

      setUsers(usersResponse.users);
      setStats(statsResponse);
    } catch (error: any) {
      console.error("Error loading data:", error);
      toast.error("Failed to load users data");
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const response = await userService.getUsers({
        search: searchTerm || undefined,
      });
      setUsers(response.users);
    } catch (error: any) {
      console.error("Error loading users:", error);
      toast.error("Failed to load users");
    }
  };

  const handleEdit = (user: UserListDto) => {
    setEditingUser(user);
    setFormData({
      username: user.username,
      email: user.email,
      role: user.role,
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      phone: "",
      subscription: user.subscription,
      password: "",
    });
    setIsDialogOpen(true);
  };

  const handleAdd = () => {
    setEditingUser(null);
    setFormData({
      username: "",
      email: "",
      role: "customer",
      firstName: "",
      lastName: "",
      phone: "",
      subscription: "basic",
      password: "",
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (user: UserListDto) => {
    if (window.confirm(`Are you sure you want to delete ${user.username}?`)) {
      try {
        await userService.deleteUser(user.userId);
        toast.success("User deleted successfully");
        loadUsers();
        loadData();
      } catch (error: any) {
        console.error("Error deleting user:", error);
        toast.error("Failed to delete user");
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (editingUser) {
        const updateData: UpdateUserDto = {
          username: formData.username,
          email: formData.email,
          role: formData.role,
          firstName: formData.firstName || undefined,
          lastName: formData.lastName || undefined,
          phone: formData.phone || undefined,
          subscription: formData.subscription,
          isActive: true,
        };

        await userService.updateUser(editingUser.userId, updateData);
        toast.success("User updated successfully");
      } else {
        if (!formData.password) {
          toast.error("Password is required for new users");
          return;
        }

        await userService.createUser(formData);
        toast.success("User created successfully");
      }

      setIsDialogOpen(false);
      setEditingUser(null);
      loadUsers();
      loadData();
    } catch (error: any) {
      console.error("Error saving user:", error);
      toast.error(
        editingUser ? "Failed to update user" : "Failed to create user"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof CreateUserDto, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">{t("common.loading")}</span>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {t("users.title")}
          </h1>
          <p className="text-muted-foreground">{t("users.subtitle")}</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleAdd}>
              <Plus className="h-4 w-4 mr-2" />
              {t("users.add_user")}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>
                  {editingUser ? t("users.edit_user") : t("users.add_new_user")}
                </DialogTitle>
                <DialogDescription>
                  {editingUser
                    ? t("users.edit_user_desc")
                    : t("users.create_user_desc")}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <Label htmlFor="username">{t("auth.username")}</Label>
                  <Input
                    id="username"
                    value={formData.username}
                    onChange={(e) =>
                      handleInputChange("username", e.target.value)
                    }
                    placeholder={t("users.name_placeholder")}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="email">{t("auth.email")}</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    placeholder={t("users.email_placeholder")}
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">{t("users.first_name")}</Label>
                    <Input
                      id="firstName"
                      value={formData.firstName}
                      onChange={(e) =>
                        handleInputChange("firstName", e.target.value)
                      }
                      placeholder="First name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName">{t("users.last_name")}</Label>
                    <Input
                      id="lastName"
                      value={formData.lastName}
                      onChange={(e) =>
                        handleInputChange("lastName", e.target.value)
                      }
                      placeholder="Last name"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="phone">{t("users.phone")}</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                    placeholder="Phone number"
                  />
                </div>
                <div>
                  <Label htmlFor="role">{t("users.role")}</Label>
                  <Select
                    value={formData.role}
                    onValueChange={(value) => handleInputChange("role", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t("users.select_role")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="customer">
                        {t("sidebar.customer")}
                      </SelectItem>
                      <SelectItem value="admin">
                        {t("sidebar.administrator")}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="subscription">
                    {t("users.subscription")}
                  </Label>
                  <Select
                    value={formData.subscription}
                    onValueChange={(value) =>
                      handleInputChange("subscription", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue
                        placeholder={t("users.select_subscription")}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="basic">{t("common.basic")}</SelectItem>
                      <SelectItem value="premium">
                        {t("common.premium")}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {!editingUser && (
                  <div>
                    <Label htmlFor="password">{t("auth.password")}</Label>
                    <Input
                      id="password"
                      type="password"
                      value={formData.password}
                      onChange={(e) =>
                        handleInputChange("password", e.target.value)
                      }
                      placeholder="Password"
                      required={!editingUser}
                    />
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  {t("common.cancel")}
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting && (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  )}
                  {editingUser
                    ? t("users.update_user")
                    : t("users.create_user")}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("dashboard.total_users")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalUsers ?? 0}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">{stats?.totalUsersGrowth}</span>{" "}
              {t("users.growth_from_last_month")}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("reports.metrics.premium_users")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.premiumUsers ?? 0}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">
                {stats?.premiumUsersGrowth}
              </span>{" "}
              {t("users.premium_growth_from_last_month")}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("users.revenue")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(stats?.totalRevenue ?? 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">{stats?.revenueGrowth}</span>{" "}
              {t("users.revenue_growth_from_last_month")}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("users.avg_retention")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.avgRetention ?? 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">{stats?.retentionGrowth}</span>{" "}
              {t("users.retention_growth_from_last_month")}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <Card>
        <CardHeader>
          <CardTitle>{t("sidebar.users")}</CardTitle>
          <CardDescription>{t("users.manage_user_base")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t("users.search_users")}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("users.user")}</TableHead>
                <TableHead>{t("users.role")}</TableHead>
                <TableHead>{t("users.subscription")}</TableHead>
                <TableHead>{t("users.join_date")}</TableHead>
                <TableHead>{t("users.last_active")}</TableHead>
                <TableHead>{t("users.total_spent")}</TableHead>
                <TableHead className="text-right">
                  {t("common.actions")}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.userId}>
                  <TableCell>
                    <div className="font-medium">
                      {user.firstName || user.lastName
                        ? `${user.firstName || ""} ${
                            user.lastName || ""
                          }`.trim()
                        : user.username}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {user.email}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        user.role === "admin" ? "destructive" : "default"
                      }
                    >
                      {user.role === "admin"
                        ? t("sidebar.administrator")
                        : t("sidebar.customer")}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        user.subscription === "premium"
                          ? "default"
                          : "secondary"
                      }
                    >
                      {user.subscription === "premium"
                        ? t("common.premium")
                        : t("common.basic")}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(user.joinDate).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    {user.lastActive
                      ? new Date(user.lastActive).toLocaleDateString()
                      : "Never"}
                  </TableCell>
                  <TableCell>{formatCurrency(user.totalSpent)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(user)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(user)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default Users;
