import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import AddTransactionDialog from "@/components/AddTransactionDialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useCurrency } from "@/contexts/CurrencyContext";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  CreditCard,
  DollarSign,
  PieChart,
  TrendingUp,
  Wallet,
  Target,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Cell,
  Pie,
} from "recharts";
import { dashboardService } from "@/services/dashboardService";
import { budgetService } from "@/services/budgetService";
import { DashboardSummary, MonthlyTrend } from "@/types/dashboard";
import { useTranslation } from "react-i18next";

const Dashboard = () => {
  const { t } = useTranslation();
  const userRole = localStorage.getItem("userRole") || "customer";
  const userName = localStorage.getItem("userName") || "User";
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [dashboardData, setDashboardData] = useState<DashboardSummary | null>(
    null
  );
  const [monthlyTrendData, setMonthlyTrendData] = useState<MonthlyTrend[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { formatCurrency } = useCurrency();
  const [budgets, setBudgets] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  useEffect(() => {
    const fetchBudgets = async () => {
      try {
        const data = await budgetService.getBudgets();
        setBudgets(data.budgets);
      } catch (error) {
        console.error("Budget fetch error:", error);
        toast({
          title: t("common.error"),
          description: t("dashboard.budget_load_failed"),
          variant: "destructive",
        });
      }
    };
    fetchBudgets();
  }, [toast, t]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [summaryData, trendData] = await Promise.all([
        dashboardService.getDashboardSummary(),
        dashboardService.getMonthlyTrend(),
      ]);

      setDashboardData(summaryData);
      setMonthlyTrendData(trendData);
    } catch (error: any) {
      console.error("Dashboard error:", error);
      toast({
        title: t("common.error"),
        description:
          error.response?.data?.message || t("dashboard.load_failed"),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Chuyển đổi dữ liệu từ API sang format cho charts
  const expenseCategories =
    dashboardData?.topExpenseCategories.map((cat, index) => ({
      name: cat.categoryName,
      value: cat.totalAmount,
      color: `hsl(${index * 72}, 70%, 50%)`, // Tạo màu động
    })) || [];

  // Chuyển đổi monthly trend data cho Bar chart
  const monthlyExpenses = monthlyTrendData.map((trend) => ({
    month: trend.month,
    amount: trend.expense,
  }));

  const budgetData =
    dashboardData?.topExpenseCategories.map((cat) => {
      const userBudget = budgets.find(
        (b) => b.categoryName === cat.categoryName
      );
      return {
        category: cat.categoryName,
        spent: cat.totalAmount,
        budget: userBudget ? userBudget.amount : 0,
        percentage:
          userBudget && userBudget.amount > 0
            ? Math.round((cat.totalAmount / userBudget.amount) * 100)
            : 0,
      };
    }) || [];

  // const formatCurrency = (amount: number) => {
  //   return new Intl.NumberFormat("vi-VN", {
  //     style: "currency",
  //     currency: "VND",
  //   }).format(amount);
  // };

  // Loading state
  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="h-64 bg-gray-200 rounded"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  // Nếu không có dữ liệu, hiển thị thông báo
  if (!dashboardData) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold mb-4">{t("dashboard.no_data")}</h2>
          <p className="text-muted-foreground mb-6">
            {t("dashboard.start_adding")}
          </p>
          <div className="space-x-4">
            <Button onClick={() => setIsAddDialogOpen(true)}>
              {t("dashboard.add_transaction")}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (userRole === "admin") {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {t("dashboard.admin_dashboard")}
            </h1>
            <p className="text-muted-foreground">
              {t("dashboard.welcome_back", { name: userName })}
            </p>
          </div>
        </div>

        {/* Admin Stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {t("dashboard.total_users")}
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">1,234</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-success">+12%</span>{" "}
                {t("dashboard.from_last_month")}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {t("dashboard.active_sessions")}
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">892</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-success">+8%</span>{" "}
                {t("dashboard.from_last_week")}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {t("dashboard.total_transactions")}
              </CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {dashboardData.transactionCount}
              </div>
              <p className="text-xs text-muted-foreground">
                <span className="text-success">+19%</span>{" "}
                {t("dashboard.from_last_month")}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {t("dashboard.system_health")}
              </CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">99.9%</div>
              <p className="text-xs text-muted-foreground">
                {t("dashboard.uptime_this_month")}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Admin Charts */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>{t("dashboard.monthly_expenses")}</CardTitle>
              <CardDescription>
                {t("dashboard.monthly_expense_trends")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {monthlyExpenses.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={monthlyExpenses}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip
                      formatter={(value) => formatCurrency(Number(value))}
                    />
                    <Bar dataKey="amount" fill="hsl(var(--primary))" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  {t("dashboard.no_expense_data")}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("dashboard.expense_categories")}</CardTitle>
              <CardDescription>
                {t("dashboard.expense_distribution")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {expenseCategories.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsPieChart>
                    <Pie
                      data={expenseCategories}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={120}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {expenseCategories.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value) => formatCurrency(Number(value))}
                    />
                  </RechartsPieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  {t("dashboard.no_category_data")}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {t("dashboard.title")}
          </h1>
          <p className="text-muted-foreground">{t("dashboard.subtitle")}</p>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          {t("dashboard.add_transaction")}
        </Button>
      </div>

      {/* Financial Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("dashboard.total_balance")}
            </CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(dashboardData.netBalance)}
            </div>
            <p className="text-xs text-muted-foreground">
              {t("dashboard.net_balance_desc")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("dashboard.monthly_income")}
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(dashboardData.totalIncome)}
            </div>
            <p className="text-xs text-muted-foreground">
              {t("dashboard.last_30_days_income")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("dashboard.monthly_expenses")}
            </CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(dashboardData.totalExpense)}
            </div>
            <p className="text-xs text-muted-foreground">
              {t("dashboard.last_30_days_expenses")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("dashboard.total_transactions")}
            </CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dashboardData.transactionCount}
            </div>
            <p className="text-xs text-muted-foreground">
              {t("dashboard.last_30_days")}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Budget Overview */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t("dashboard.monthly_expenses")}</CardTitle>
            <CardDescription>
              {t("dashboard.spending_last_6_months")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {monthlyExpenses.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={monthlyExpenses}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip
                    formatter={(value) => formatCurrency(Number(value))}
                  />
                  <Bar dataKey="amount" fill="hsl(var(--primary))" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                {t("dashboard.no_expense_data_6_months")}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("dashboard.expense_categories")}</CardTitle>
            <CardDescription>
              {t("dashboard.current_spending_breakdown")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {expenseCategories.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <RechartsPieChart>
                  <Pie
                    data={expenseCategories}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={120}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {expenseCategories.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => formatCurrency(Number(value))}
                  />
                </RechartsPieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                {t("dashboard.no_expense_categories")}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Budget Overview */}
      {budgetData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{t("dashboard.budget_overview")}</CardTitle>
            <CardDescription>
              {t("dashboard.track_spending_budgets")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {budgetData.map((item) => (
                <div key={item.category} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">{item.category}</span>
                    <span className="text-sm text-muted-foreground">
                      {formatCurrency(item.spent)} /{" "}
                      {formatCurrency(item.budget)}
                    </span>
                  </div>
                  <Progress
                    value={Math.min(item.percentage, 100)}
                    className="h-2"
                    style={{
                      background:
                        item.percentage > 100
                          ? "hsl(var(--destructive))"
                          : undefined,
                    }}
                  />
                  <div className="text-xs text-muted-foreground">
                    {item.percentage > 100 ? (
                      <span className="text-destructive">
                        {t("dashboard.over_budget_by")}{" "}
                        {formatCurrency(item.spent - item.budget)}
                      </span>
                    ) : (
                      <span>
                        {formatCurrency(item.budget - item.spent)}{" "}
                        {t("dashboard.remaining")}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <AddTransactionDialog
        isOpen={isAddDialogOpen}
        onClose={() => setIsAddDialogOpen(false)}
        onSave={() => {
          setIsAddDialogOpen(false);
          fetchDashboardData();
        }}
      />
    </div>
  );
};

export default Dashboard;
