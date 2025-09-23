import { useState, useEffect } from "react";
import { useTheme } from "@/hooks/useTheme";
import {
  BarChart3,
  CreditCard,
  DollarSign,
  Home,
  PieChart,
  Settings,
  Target,
  TrendingUp,
  Users,
  Wallet,
  LogOut,
  User,
  Moon,
  Sun,
  Monitor,
  Crown,
  MessageCircle,
  LayoutDashboard,
  PiggyBank,
} from "lucide-react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { profileService, ProfileResponse } from "@/services/profileService";
import { useTranslation } from "react-i18next";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();
  const { t } = useTranslation();
  const currentPath = location.pathname;

  // State cho thông tin user từ API
  const [profile, setProfile] = useState<ProfileResponse | null>(null);

  useEffect(() => {
    // Gọi API lấy profile khi sidebar mount
    const fetchProfile = async () => {
      try {
        const data = await profileService.getProfile();
        setProfile(data);
      } catch (error) {
        // Có thể fallback về localStorage nếu muốn
        setProfile(null);
      }
    };
    fetchProfile();
  }, []);

  // Tạo displayName từ profile API
  const displayName = profile
    ? `${profile.firstName || ""} ${profile.lastName || ""}`.trim() ||
      profile.username
    : localStorage.getItem("userName") || t("sidebar.default_user");

  const userEmail =
    profile?.email || localStorage.getItem("userEmail") || "user@example.com";

  const userRole =
    profile?.role || localStorage.getItem("userRole") || "customer";

  const userSubscription = localStorage.getItem("userSubscription") || "basic";

  // ✅ FIX: Localize navigation items
  const customerItems = [
    {
      title: t("navigation.dashboard"),
      url: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      title: t("navigation.quick_add"),
      url: "/quick-add",
      icon: MessageCircle,
    },
    {
      title: t("navigation.transactions"),
      url: "/transactions",
      icon: CreditCard,
    },
    {
      title: t("navigation.budget"),
      url: "/budget",
      icon: PiggyBank,
    },
    {
      title: t("navigation.analytics"),
      url: "/analytics",
      icon: BarChart3,
    },
    {
      title: t("navigation.goals"),
      url: "/goals",
      icon: Target,
    },
    {
      title: t("navigation.settings"),
      url: "/settings",
      icon: Settings,
    },
  ];

  const adminItems = [
    {
      title: t("navigation.dashboard"),
      url: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      title: t("navigation.quick_add"),
      url: "/quick-add",
      icon: MessageCircle,
    },
    {
      title: t("sidebar.users"),
      url: "/users",
      icon: Users,
    },
    {
      title: t("navigation.analytics"),
      url: "/analytics",
      icon: BarChart3,
    },
    {
      title: t("sidebar.reports"),
      url: "/reports",
      icon: PieChart,
    },
    {
      title: t("navigation.settings"),
      url: "/settings",
      icon: Settings,
    },
  ];

  const items = userRole === "admin" ? adminItems : customerItems;

  const isActive = (path: string) => currentPath === path;
  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    isActive
      ? "bg-sidebar-accent text-sidebar-accent-foreground"
      : "hover:bg-sidebar-accent/50";

  // ✅ FIX: Localize user role display
  const getUserRoleDisplay = (role: string) => {
    return role === "admin"
      ? t("sidebar.administrator")
      : t("sidebar.customer");
  };

  const handleLogout = () => {
    localStorage.removeItem("userRole");
    localStorage.removeItem("isAuthenticated");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("userName");
    localStorage.removeItem("userSubscription");

    // Cập nhật state
    setProfile(null);

    // ✅ FIX: Localize toast messages
    toast({
      title: t("sidebar.logged_out"),
      description: t("sidebar.logged_out_desc"),
    });

    navigate("/");
  };

  return (
    <Sidebar className={collapsed ? "w-14" : "w-64"} collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-2 px-4 py-2">
          <Wallet className="h-8 w-8 text-sidebar-primary" />
          {!collapsed && (
            <div className="flex flex-col">
              <span className="font-bold text-sidebar-foreground">
                {t("sidebar.app_name")}
              </span>
              <span className="text-xs text-sidebar-foreground/70 capitalize">
                {getUserRoleDisplay(userRole)}
              </span>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>{t("sidebar.navigation")}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} className={getNavCls}>
                      <item.icon className="h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}

              {/* ✅ FIX: Localize upgrade button */}
              {userRole !== "admin" && (
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    className={
                      currentPath === "/upgrade"
                        ? "bg-sidebar-accent text-sidebar-accent-foreground"
                        : "hover:bg-sidebar-accent/50"
                    }
                  >
                    <NavLink to="/upgrade">
                      <Crown className="h-4 w-4" />
                      {!collapsed && (
                        <span className="flex items-center justify-between w-full">
                          <span>{t("navigation.upgrade")}</span>
                          {userSubscription === "basic" && (
                            <span className="bg-primary text-primary-foreground text-xs px-1.5 py-0.5 rounded">
                              {t("sidebar.pro_badge")}
                            </span>
                          )}
                        </span>
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        {/* ✅ FIX: Profile link - no text changes needed, already using displayName variable */}
        <SidebarMenuItem className="px-2">
          <SidebarMenuButton
            asChild
            className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent"
          >
            <NavLink to="/profile" className="flex items-center">
              <User className="h-4 w-4" />
              {!collapsed && (
                <div className="flex flex-col flex-1 overflow-hidden ml-2">
                  <div className="text-sm font-medium text-sidebar-foreground truncate">
                    {displayName}
                  </div>
                  <div className="text-xs text-sidebar-foreground/70 truncate">
                    {userEmail}
                  </div>
                </div>
              )}
            </NavLink>
          </SidebarMenuButton>
        </SidebarMenuItem>

        <div className="px-2 pb-2 space-y-1">
          {!collapsed && (
            <>
              {/* ✅ FIX: Localize theme dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent"
                  >
                    {theme === "dark" ? (
                      <Moon className="h-4 w-4" />
                    ) : theme === "light" ? (
                      <Sun className="h-4 w-4" />
                    ) : (
                      <Monitor className="h-4 w-4" />
                    )}
                    <span className="ml-2">{t("sidebar.theme")}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setTheme("light")}>
                    <Sun className="h-4 w-4 mr-2" />
                    {t("sidebar.light")}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTheme("dark")}>
                    <Moon className="h-4 w-4 mr-2" />
                    {t("sidebar.dark")}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTheme("system")}>
                    <Monitor className="h-4 w-4 mr-2" />
                    {t("sidebar.system")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent"
              >
                <LogOut className="h-4 w-4" />
                <span className="ml-2">{t("sidebar.logout")}</span>
              </Button>
            </>
          )}
          {collapsed && (
            <>
              {/* ✅ FIX: Localize collapsed theme dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent"
                    title={t("sidebar.theme")}
                  >
                    {theme === "dark" ? (
                      <Moon className="h-4 w-4" />
                    ) : theme === "light" ? (
                      <Sun className="h-4 w-4" />
                    ) : (
                      <Monitor className="h-4 w-4" />
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setTheme("light")}>
                    <Sun className="h-4 w-4 mr-2" />
                    {t("sidebar.light")}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTheme("dark")}>
                    <Moon className="h-4 w-4 mr-2" />
                    {t("sidebar.dark")}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTheme("system")}>
                    <Monitor className="h-4 w-4 mr-2" />
                    {t("sidebar.system")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent"
                title={t("sidebar.logout")}
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
