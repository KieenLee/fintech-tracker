import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
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
  MessageCircle
} from "lucide-react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

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

const customerItems = [
  { title: "Dashboard", url: "/dashboard", icon: Home },
  { title: "Quick Add", url: "/quick-add", icon: MessageCircle },
  { title: "Transactions", url: "/transactions", icon: CreditCard },
  { title: "Budgets", url: "/budgets", icon: Target },
  { title: "Analytics", url: "/analytics", icon: BarChart3 },
  { title: "Goals", url: "/goals", icon: TrendingUp },
  { title: "Settings", url: "/settings", icon: Settings },
];

const adminItems = [
  { title: "Dashboard", url: "/dashboard", icon: Home },
  { title: "Quick Add", url: "/quick-add", icon: MessageCircle },
  { title: "Users", url: "/users", icon: Users },
  { title: "Analytics", url: "/analytics", icon: BarChart3 },
  { title: "Reports", url: "/reports", icon: PieChart },
  { title: "Settings", url: "/settings", icon: Settings },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();
  const currentPath = location.pathname;
  
  // State cho thông tin người dùng
  const [userRole, setUserRole] = useState(localStorage.getItem("userRole") || "customer");
  const [userName, setUserName] = useState(localStorage.getItem("userName") || "User");
  const [userEmail, setUserEmail] = useState(localStorage.getItem("userEmail") || "user@example.com");
  const [userSubscription, setUserSubscription] = useState(localStorage.getItem("userSubscription") || "basic");
  
  const items = userRole === "admin" ? adminItems : customerItems;

  // Theo dõi sự thay đổi trong localStorage
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "userRole") {
        setUserRole(localStorage.getItem("userRole") || "customer");
      } else if (e.key === "userName") {
        setUserName(localStorage.getItem("userName") || "User");
      } else if (e.key === "userEmail") {
        setUserEmail(localStorage.getItem("userEmail") || "user@example.com");
      } else if (e.key === "userSubscription") {
        setUserSubscription(localStorage.getItem("userSubscription") || "basic");
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  const isActive = (path: string) => currentPath === path;
  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    isActive ? "bg-sidebar-accent text-sidebar-accent-foreground" : "hover:bg-sidebar-accent/50";

  const handleLogout = () => {
    localStorage.removeItem("userRole");
    localStorage.removeItem("isAuthenticated");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("userName");
    localStorage.removeItem("userSubscription");
    
    // Cập nhật state
    setUserRole("customer");
    setUserName("User");
    setUserEmail("user@example.com");
    setUserSubscription("basic");
    
    toast({
      title: "Logged out",
      description: "You have been successfully logged out",
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
              <span className="font-bold text-sidebar-foreground">FinanceTracker</span>
              <span className="text-xs text-sidebar-foreground/70 capitalize">{userRole}</span>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
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
              
              {/* Upgrade button for customers */}
              {userRole !== "admin" && (
                <SidebarMenuItem>
                  <SidebarMenuButton 
                    asChild 
                    className={currentPath === "/upgrade" ? "bg-sidebar-accent text-sidebar-accent-foreground" : "hover:bg-sidebar-accent/50"}
                  >
                    <NavLink to="/upgrade">
                      <Crown className="h-4 w-4" />
                      {!collapsed && (
                        <span className="flex items-center justify-between w-full">
                          <span>Upgrade</span>
                          {userSubscription === "basic" && (
                            <span className="bg-primary text-primary-foreground text-xs px-1.5 py-0.5 rounded">
                              Pro
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
        {/* Profile link at the bottom */}
        <SidebarMenuItem className="px-2">
          <SidebarMenuButton 
            asChild 
            className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent"
          >
            <NavLink to="/profile" className="flex items-center">
              <User className="h-4 w-4" />
              {!collapsed && (
                <div className="flex flex-col flex-1 overflow-hidden ml-2">
                  <div className="text-sm font-medium text-sidebar-foreground truncate">{userName}</div>
                  <div className="text-xs text-sidebar-foreground/70 truncate">{userEmail}</div>
                </div>
              )}
            </NavLink>
          </SidebarMenuButton>
        </SidebarMenuItem>
        
        <div className="px-2 pb-2 space-y-1">
          {!collapsed && (
            <>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent"
                  >
                    {theme === 'dark' ? <Moon className="h-4 w-4" /> : 
                     theme === 'light' ? <Sun className="h-4 w-4" /> : 
                     <Monitor className="h-4 w-4" />}
                    <span className="ml-2">Theme</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setTheme('light')}>
                    <Sun className="h-4 w-4 mr-2" />
                    Light
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTheme('dark')}>
                    <Moon className="h-4 w-4 mr-2" />
                    Dark
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTheme('system')}>
                    <Monitor className="h-4 w-4 mr-2" />
                    System
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
                <span className="ml-2">Logout</span>
              </Button>
            </>
          )}
          {collapsed && (
            <>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent"
                  >
                    {theme === 'dark' ? <Moon className="h-4 w-4" /> : 
                     theme === 'light' ? <Sun className="h-4 w-4" /> : 
                     <Monitor className="h-4 w-4" />}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setTheme('light')}>
                    <Sun className="h-4 w-4 mr-2" />
                    Light
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTheme('dark')}>
                    <Moon className="h-4 w-4 mr-2" />
                    Dark
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTheme('system')}>
                    <Monitor className="h-4 w-4 mr-2" />
                    System
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
              </Button>
            </>
          )}
        </div>
      </SidebarFooter>

    </Sidebar>
  );
}