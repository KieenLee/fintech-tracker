import { useState, useEffect } from "react";
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
  LineChart,
  Line,
  Area,
  AreaChart,
} from "recharts";
import { Button } from "@/components/ui/button";
import {
  DollarSign,
  TrendingUp,
  Users,
  CreditCard,
  Calendar,
  Download,
  Loader2,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { reportService, ReportDashboardDto } from "@/services/reportService";
import { formatCurrencyAmount } from "../../utils/currencyUtils";

const Reports = () => {
  const [timeRange, setTimeRange] = useState("monthly");
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState<ReportDashboardDto | null>(null);
  const [exporting, setExporting] = useState(false);

  const { t } = useTranslation();
  const currency = localStorage.getItem("userCurrency") || "USD";

  const formatCurrency = (amount: number) => {
    return formatCurrencyAmount(amount, currency);
  };

  useEffect(() => {
    loadReportData();
  }, []);

  useEffect(() => {
    if (reportData) {
      loadReportData();
    }
  }, [timeRange]);

  const loadReportData = async () => {
    try {
      setLoading(true);
      const data = await reportService.getDashboard(timeRange);
      setReportData(data);
    } catch (error: any) {
      console.error("Error loading report data:", error);
      toast.error(t("reports.load_failed"));
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      setExporting(true);
      const blob = await reportService.exportReport(timeRange, "csv");

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.style.display = "none";
      a.href = url;
      a.download = `reports-${timeRange}-${new Date().getTime()}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success(t("reports.export_success"));
    } catch (error: any) {
      console.error("Error exporting report:", error);
      toast.error(t("reports.export_failed"));
    } finally {
      setExporting(false);
    }
  };

  // Chart colors consistent with project theme
  const chartColors = {
    primary: "hsl(var(--primary))",
    chart1: "#8884d8",
    chart2: "#82ca9d",
    chart3: "#ffc658",
    chart4: "#ff7300",
  };

  // Prepare subscription data for pie chart
  const subscriptionChartData =
    reportData?.subscriptionData.map((item, index) => ({
      ...item,
      color: index === 0 ? chartColors.chart1 : chartColors.chart2,
    })) || [];

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">{t("reports.loading")}</span>
      </div>
    );
  }

  if (!reportData) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold mb-4">
            {t("reports.load_failed")}
          </h2>
          <Button onClick={loadReportData}>{t("common.try_again")}</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {t("reports.title")}
          </h1>
          <p className="text-muted-foreground">{t("reports.subtitle")}</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">
                {t("reports.time_periods.daily")}
              </SelectItem>
              <SelectItem value="weekly">
                {t("reports.time_periods.weekly")}
              </SelectItem>
              <SelectItem value="monthly">
                {t("reports.time_periods.monthly")}
              </SelectItem>
              <SelectItem value="yearly">
                {t("reports.time_periods.yearly")}
              </SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={handleExport} disabled={exporting}>
            {exporting ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Download className="h-4 w-4 mr-2" />
            )}
            {t("common.export")}
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("reports.metrics.total_revenue")}
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(reportData.metrics.totalRevenue)}
            </div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">
                {reportData.metrics.revenueGrowth}
              </span>{" "}
              {t("reports.metrics.from_last_period")}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("reports.metrics.total_users")}
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {reportData.metrics.totalUsers}
            </div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">
                {reportData.metrics.usersGrowth}
              </span>{" "}
              {t("reports.metrics.from_last_period")}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("reports.metrics.premium_users")}
            </CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {reportData.metrics.premiumUsers}
            </div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">
                {reportData.metrics.premiumGrowth}
              </span>{" "}
              {t("reports.metrics.from_last_period")}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("reports.metrics.avg_session")}
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {reportData.metrics.avgSessionTime}
            </div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">
                {reportData.metrics.sessionGrowth}
              </span>{" "}
              {t("reports.metrics.from_last_period")}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Revenue Chart */}
        <Card>
          <CardHeader>
            <CardTitle>{t("reports.charts.revenue_trend")}</CardTitle>
            <CardDescription>
              {t("reports.charts.revenue_trend_desc")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={reportData.revenueData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip
                  formatter={(value, name) => [
                    name === "revenue" ? formatCurrency(Number(value)) : value,
                    name === "revenue" ? t("reports.charts.revenue") : name,
                  ]}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke={chartColors.primary}
                  fill={chartColors.primary}
                  fillOpacity={0.6}
                  name="revenue"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* User Growth Chart */}
        <Card>
          <CardHeader>
            <CardTitle>{t("reports.charts.user_growth")}</CardTitle>
            <CardDescription>
              {t("reports.charts.user_growth_desc")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={reportData.userGrowthData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Bar
                  dataKey="newUsers"
                  fill={chartColors.chart1}
                  name={t("reports.charts.new_users")}
                />
                <Bar
                  dataKey="activeUsers"
                  fill={chartColors.chart2}
                  name={t("reports.charts.active_users")}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Subscription Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>
              {t("reports.charts.subscription_distribution")}
            </CardTitle>
            <CardDescription>
              {t("reports.charts.subscription_distribution_desc")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <RechartsPieChart>
                <Pie
                  data={subscriptionChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={120}
                  paddingAngle={5}
                  dataKey="value"
                  nameKey="name"
                >
                  {subscriptionChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) => [`${value}`, t("reports.charts.users")]}
                />
              </RechartsPieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Revenue vs Users */}
        <Card>
          <CardHeader>
            <CardTitle>{t("reports.charts.revenue_vs_users")}</CardTitle>
            <CardDescription>
              {t("reports.charts.revenue_vs_users_desc")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={reportData.revenueData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip
                  formatter={(value, name) => [
                    name === "revenue" ? formatCurrency(Number(value)) : value,
                    name === "revenue"
                      ? t("reports.charts.revenue")
                      : t("reports.charts.users"),
                  ]}
                />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="revenue"
                  stroke={chartColors.primary}
                  strokeWidth={3}
                  name="revenue"
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="users"
                  stroke={chartColors.chart2}
                  strokeWidth={3}
                  name="users"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Metrics */}
      <Card>
        <CardHeader>
          <CardTitle>{t("reports.detailed_metrics.title")}</CardTitle>
          <CardDescription>
            {t("reports.detailed_metrics.description")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left pb-3">
                    {t("reports.detailed_metrics.month")}
                  </th>
                  <th className="text-right pb-3">
                    {t("reports.detailed_metrics.revenue")}
                  </th>
                  <th className="text-right pb-3">
                    {t("reports.detailed_metrics.new_users")}
                  </th>
                  <th className="text-right pb-3">
                    {t("reports.detailed_metrics.premium_users")}
                  </th>
                  <th className="text-right pb-3">
                    {t("reports.detailed_metrics.conversion_rate")}
                  </th>
                  <th className="text-right pb-3">
                    {t("reports.detailed_metrics.churn_rate")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {reportData.detailedMetrics.map((data, index) => (
                  <tr key={index} className="border-b">
                    <td className="py-3">{data.month}</td>
                    <td className="text-right py-3">
                      {formatCurrency(data.revenue)}
                    </td>
                    <td className="text-right py-3">{data.newUsers}</td>
                    <td className="text-right py-3">{data.premiumUsers}</td>
                    <td className="text-right py-3">{data.conversionRate}</td>
                    <td className="text-right py-3">{data.churnRate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Reports;
