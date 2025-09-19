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

const Analytics = () => {
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
        title: "Error",
        description:
          error.response?.data?.message || "Failed to load analytics data",
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

  // Thêm function để get chart title dựa trên time range
  const getChartTitle = (baseTitle: string) => {
    const timeRangeMap: { [key: string]: string } = {
      "1week": "Daily",
      "1month": "Weekly",
      "3months": "Monthly",
      "6months": "Monthly",
      "1year": "Monthly",
      "2years": "Monthly",
    };

    const period = timeRangeMap[timeRange] || "Monthly";
    return `${period} ${baseTitle}`;
  };

  // Cập nhật function để get chart config dựa trên time range
  const getChartConfig = () => {
    const configs = {
      "1week": {
        dataLabel: "Daily",
        period: "day",
        description: {
          incomeExpenses:
            "Daily comparison of income and expenses over the last 7 days",
          netWorth: "Daily financial changes over the last week",
          savings: "Daily savings progress over the last week",
        },
      },
      "1month": {
        dataLabel: "Weekly",
        period: "week",
        description: {
          incomeExpenses:
            "Weekly comparison of income and expenses over the last 4 weeks",
          netWorth: "Weekly financial changes over the last month",
          savings: "Weekly savings progress over the last month",
        },
      },
      "3months": {
        dataLabel: "Monthly",
        period: "month",
        description: {
          incomeExpenses:
            "Monthly comparison of income and expenses over the last 3 months",
          netWorth: "Monthly financial growth over the last 3 months",
          savings: "Monthly savings progress over the last 3 months",
        },
      },
      "6months": {
        dataLabel: "Monthly",
        period: "month",
        description: {
          incomeExpenses:
            "Monthly comparison of income and expenses over the last 6 months",
          netWorth: "Monthly financial growth over the last 6 months",
          savings: "Monthly savings progress over the last 6 months",
        },
      },
      "1year": {
        dataLabel: "Monthly",
        period: "month",
        description: {
          incomeExpenses:
            "Monthly comparison of income and expenses over the last year",
          netWorth: "Monthly financial growth over the last year",
          savings: "Monthly savings progress over the last year",
        },
      },
      "2years": {
        dataLabel: "Monthly",
        period: "month",
        description: {
          incomeExpenses:
            "Monthly comparison of income and expenses over the last 2 years",
          netWorth: "Monthly financial growth over the last 2 years",
          savings: "Monthly savings progress over the last 2 years",
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
        <span className="ml-2">Loading analytics...</span>
      </div>
    );
  }

  // Hiển thị thông báo nếu không có dữ liệu
  if (!analyticsData) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold mb-4">No Analytics Data</h2>
          <p className="text-muted-foreground">
            Start adding transactions to see your financial analytics
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
          <p className="text-muted-foreground">
            Detailed insights into your financial patterns
          </p>
        </div>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1week">Last Week</SelectItem>
            <SelectItem value="1month">Last Month</SelectItem>
            <SelectItem value="3months">Last 3 Months</SelectItem>
            <SelectItem value="6months">Last 6 Months</SelectItem>
            <SelectItem value="1year">Last Year</SelectItem>
            <SelectItem value="2years">Last 2 Years</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="transition-all hover:shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Income</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${analyticsData.totalIncome.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              <span className="text-success flex items-center">
                <ArrowUpIcon className="h-3 w-3 mr-1" />
                +12.5% from previous period
              </span>
            </p>
          </CardContent>
        </Card>

        <Card className="transition-all hover:shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Expenses
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
                -3.2% from previous period
              </span>
            </p>
          </CardContent>
        </Card>

        <Card className="transition-all hover:shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Savings Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analyticsData.savingsRate.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              <span className="text-success flex items-center">
                <ArrowUpIcon className="h-3 w-3 mr-1" />
                +2.1% from previous period
              </span>
            </p>
          </CardContent>
        </Card>

        <Card className="transition-all hover:shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Avg. Monthly Expenses
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
                -1.8% from previous period
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
              {chartConfig.dataLabel} Income vs Expenses
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
                  name="Income"
                />
                <Bar
                  dataKey="expenses"
                  fill="hsl(var(--destructive))"
                  name="Expenses"
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
              Net Worth Growth
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
                  name="Net Worth"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Savings Trend */}
        <Card className="transition-all hover:shadow-md">
          <CardHeader>
            <CardTitle>{chartConfig.dataLabel} Savings</CardTitle>
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
                  name="Savings"
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
              Expense Breakdown
            </CardTitle>
            <CardDescription>Where your money goes each month</CardDescription>
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
                    <Tooltip formatter={(value) => [`$${value}`, "Amount"]} />
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

      {/* Insights - Giữ nguyên như hiện tại */}
      <Card className="transition-all hover:shadow-md">
        <CardHeader>
          <CardTitle>Financial Insights</CardTitle>
          <CardDescription>
            AI-powered recommendations based on your spending patterns
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="p-4 bg-success/10 rounded-lg border border-success/20">
              <h4 className="font-medium text-success mb-2">Great Progress!</h4>
              <p className="text-sm text-muted-foreground">
                Your savings rate of {analyticsData.savingsRate.toFixed(1)}% is
                above the recommended 20%. Keep up the excellent work!
              </p>
            </div>
            <div className="p-4 bg-warning/10 rounded-lg border border-warning/20">
              <h4 className="font-medium text-warning mb-2">
                Food Spending Alert
              </h4>
              <p className="text-sm text-muted-foreground">
                Your food expenses are 35% of total spending. Consider meal
                planning to optimize this category.
              </p>
            </div>
            <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <h4 className="font-medium text-blue-700 dark:text-blue-300 mb-2">
                Investment Opportunity
              </h4>
              <p className="text-sm text-muted-foreground">
                With consistent savings, consider diversifying into investment
                accounts for long-term growth.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Analytics;
