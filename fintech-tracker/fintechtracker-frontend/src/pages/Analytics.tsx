import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Area,
  AreaChart,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ArrowUpIcon,
  ArrowDownIcon,
  Calendar,
  PieChart,
  BarChart3,
  Loader2,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import {
  analyticsService,
  AnalyticsOverview,
} from "@/services/analyticsService";
import { useTranslation } from "react-i18next";

const Analytics = () => {
  const { t } = useTranslation();
  const [timeRange, setTimeRange] = useState("6months");
  const [analyticsData, setAnalyticsData] = useState<AnalyticsOverview | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchAnalyticsData();
  }, [timeRange]);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      const data = await analyticsService.getAnalyticsOverview({ timeRange });
      setAnalyticsData(data);
    } catch (error: any) {
      console.error("Analytics error:", error);
      toast({
        title: t("common.error"),
        description:
          error.response?.data?.message || t("analytics.load_failed"),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Định nghĩa màu sắc cho pie chart
  const chartColors = [
    "hsl(var(--chart-1))",
    "hsl(var(--chart-2))",
    "hsl(var(--chart-3))",
    "hsl(var(--chart-4))",
    "hsl(var(--chart-5))",
    "hsl(180 50% 50%)",
  ];

  // Chuẩn bị dữ liệu cho category breakdown với màu sắc
  const categoryDataWithColors =
    analyticsData?.categoryBreakdown.map((cat, index) => ({
      name: cat.name,
      value: cat.value,
      percentage: Math.round(cat.percentage),
      color: chartColors[index % chartColors.length],
    })) || [];

  // Cập nhật function để get chart config dựa trên time range với localization
  const getChartConfig = () => {
    const configs = {
      "1week": {
        dataLabel: t("analytics.daily"),
        period: "day",
        description: {
          incomeExpenses: t("analytics.daily_income_expenses_desc"),
          netWorth: t("analytics.daily_net_worth_desc"),
          savings: t("analytics.daily_savings_desc"),
        },
      },
      "1month": {
        dataLabel: t("analytics.weekly"),
        period: "week",
        description: {
          incomeExpenses: t("analytics.weekly_income_expenses_desc"),
          netWorth: t("analytics.weekly_net_worth_desc"),
          savings: t("analytics.weekly_savings_desc"),
        },
      },
      "3months": {
        dataLabel: t("analytics.monthly"),
        period: "month",
        description: {
          incomeExpenses: t("analytics.monthly_income_expenses_3m_desc"),
          netWorth: t("analytics.monthly_net_worth_3m_desc"),
          savings: t("analytics.monthly_savings_3m_desc"),
        },
      },
      "6months": {
        dataLabel: t("analytics.monthly"),
        period: "month",
        description: {
          incomeExpenses: t("analytics.monthly_income_expenses_6m_desc"),
          netWorth: t("analytics.monthly_net_worth_6m_desc"),
          savings: t("analytics.monthly_savings_6m_desc"),
        },
      },
      "1year": {
        dataLabel: t("analytics.monthly"),
        period: "month",
        description: {
          incomeExpenses: t("analytics.monthly_income_expenses_1y_desc"),
          netWorth: t("analytics.monthly_net_worth_1y_desc"),
          savings: t("analytics.monthly_savings_1y_desc"),
        },
      },
      "2years": {
        dataLabel: t("analytics.monthly"),
        period: "month",
        description: {
          incomeExpenses: t("analytics.monthly_income_expenses_2y_desc"),
          netWorth: t("analytics.monthly_net_worth_2y_desc"),
          savings: t("analytics.monthly_savings_2y_desc"),
        },
      },
    };

    return configs[timeRange as keyof typeof configs] || configs["6months"];
  };

  const chartConfig = getChartConfig();

  // Hiển thị loading
  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">{t("analytics.loading_analytics")}</span>
      </div>
    );
  }

  // Hiển thị thông báo nếu không có dữ liệu
  if (!analyticsData) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold mb-4">{t("analytics.no_data")}</h2>
          <p className="text-muted-foreground">{t("analytics.no_data_desc")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {t("analytics.title")}
          </h1>
          <p className="text-muted-foreground">{t("analytics.subtitle")}</p>
        </div>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1week">{t("analytics.last_week")}</SelectItem>
            <SelectItem value="1month">{t("analytics.last_month")}</SelectItem>
            <SelectItem value="3months">
              {t("analytics.last_3_months")}
            </SelectItem>
            <SelectItem value="6months">
              {t("analytics.last_6_months")}
            </SelectItem>
            <SelectItem value="1year">{t("analytics.last_year")}</SelectItem>
            <SelectItem value="2years">
              {t("analytics.last_2_years")}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="transition-all hover:shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("analytics.total_income")}
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${analyticsData.totalIncome.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              <span className="text-success flex items-center">
                <ArrowUpIcon className="h-3 w-3 mr-1" />
                {t("analytics.income_change")}
              </span>
            </p>
          </CardContent>
        </Card>

        <Card className="transition-all hover:shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("analytics.total_expenses")}
            </CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${analyticsData.totalExpenses.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              <span className="text-success flex items-center">
                <ArrowDownIcon className="h-3 w-3 mr-1" />
                {t("analytics.expense_change")}
              </span>
            </p>
          </CardContent>
        </Card>

        <Card className="transition-all hover:shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("analytics.savings_rate")}
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analyticsData.savingsRate.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              <span className="text-success flex items-center">
                <ArrowUpIcon className="h-3 w-3 mr-1" />
                {t("analytics.savings_change")}
              </span>
            </p>
          </CardContent>
        </Card>

        <Card className="transition-all hover:shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("analytics.avg_monthly_expenses")}
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${analyticsData.avgMonthlyExpenses.toFixed(0)}
            </div>
            <p className="text-xs text-muted-foreground">
              <span className="text-success flex items-center">
                <ArrowDownIcon className="h-3 w-3 mr-1" />
                {t("analytics.avg_expense_change")}
              </span>
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Income vs Expenses */}
        <Card className="transition-all hover:shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              {chartConfig.dataLabel} {t("analytics.income_vs_expenses")}
            </CardTitle>
            <CardDescription>
              {chartConfig.description.incomeExpenses}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analyticsData.monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} interval={0} />
                <YAxis />
                <Tooltip />
                <Bar
                  dataKey="income"
                  fill="hsl(var(--primary))"
                  name={t("analytics.income")}
                />
                <Bar
                  dataKey="expenses"
                  fill="hsl(var(--destructive))"
                  name={t("analytics.expenses")}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Net Worth Trend */}
        <Card className="transition-all hover:shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              {t("analytics.net_worth_growth")}
            </CardTitle>
            <CardDescription>
              {chartConfig.description.netWorth}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={analyticsData.netWorthTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} interval={0} />
                <YAxis />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="netWorth"
                  stroke="hsl(var(--primary))"
                  fill="hsl(var(--primary))"
                  fillOpacity={0.6}
                  name={t("analytics.net_worth")}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Savings Trend */}
        <Card className="transition-all hover:shadow-md">
          <CardHeader>
            <CardTitle>
              {chartConfig.dataLabel} {t("analytics.savings")}
            </CardTitle>
            <CardDescription>{chartConfig.description.savings}</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={analyticsData.monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} interval={0} />
                <YAxis />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="savings"
                  stroke="hsl(var(--primary))"
                  strokeWidth={3}
                  name={t("analytics.savings")}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Expense Categories */}
        <Card className="transition-all hover:shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              {t("analytics.expense_breakdown")}
            </CardTitle>
            <CardDescription>{t("analytics.where_money_goes")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col lg:flex-row items-center gap-4">
              <div className="flex-1">
                <ResponsiveContainer width="100%" height={200}>
                  <RechartsPieChart>
                    <Pie
                      data={categoryDataWithColors}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={100}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {categoryDataWithColors.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value) => [
                        `$${value}`,
                        t("analytics.amount"),
                      ]}
                    />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-2">
                {categoryDataWithColors.map((category, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: category.color }}
                    />
                    <span className="flex-1">{category.name}</span>
                    <Badge variant="secondary">{category.percentage}%</Badge>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Insights */}
      <Card className="transition-all hover:shadow-md">
        <CardHeader>
          <CardTitle>{t("analytics.financial_insights")}</CardTitle>
          <CardDescription>{t("analytics.ai_recommendations")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="p-4 bg-success/10 rounded-lg border border-success/20">
              <h4 className="font-medium text-success mb-2">
                {t("analytics.great_progress")}
              </h4>
              <p className="text-sm text-muted-foreground">
                {t("analytics.savings_rate_message", {
                  rate: analyticsData.savingsRate.toFixed(1),
                })}
              </p>
            </div>
            <div className="p-4 bg-warning/10 rounded-lg border border-warning/20">
              <h4 className="font-medium text-warning mb-2">
                {t("analytics.food_spending_alert")}
              </h4>
              <p className="text-sm text-muted-foreground">
                {t("analytics.food_spending_message")}
              </p>
            </div>
            <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <h4 className="font-medium text-blue-700 dark:text-blue-300 mb-2">
                {t("analytics.investment_opportunity")}
              </h4>
              <p className="text-sm text-muted-foreground">
                {t("analytics.investment_message")}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Analytics;
