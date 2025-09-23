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
import { useState } from "react";
import { useCurrency } from "@/contexts/CurrencyContext";
import {
  DollarSign,
  TrendingUp,
  Users,
  CreditCard,
  Calendar,
  Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";

const Reports = () => {
  const [timeRange, setTimeRange] = useState("monthly");
  const { formatCurrency } = useCurrency();
  const { t } = useTranslation();

  // Sample data for different time periods
  const revenueData = [
    { month: t("reports.months.jan"), revenue: 4500, users: 120, premium: 45 },
    { month: t("reports.months.feb"), revenue: 4200, users: 115, premium: 42 },
    { month: t("reports.months.mar"), revenue: 4800, users: 140, premium: 52 },
    { month: t("reports.months.apr"), revenue: 4600, users: 135, premium: 49 },
    { month: t("reports.months.may"), revenue: 5000, users: 150, premium: 58 },
    { month: t("reports.months.jun"), revenue: 4700, users: 145, premium: 55 },
  ];

  const userData = [
    { day: t("reports.days.mon"), newUsers: 12, activeUsers: 85 },
    { day: t("reports.days.tue"), newUsers: 18, activeUsers: 92 },
    { day: t("reports.days.wed"), newUsers: 15, activeUsers: 88 },
    { day: t("reports.days.thu"), newUsers: 22, activeUsers: 105 },
    { day: t("reports.days.fri"), newUsers: 25, activeUsers: 110 },
    { day: t("reports.days.sat"), newUsers: 30, activeUsers: 125 },
    { day: t("reports.days.sun"), newUsers: 20, activeUsers: 95 },
  ];

  const subscriptionData = [
    { name: t("common.basic"), value: 65, color: "hsl(var(--chart-1))" },
    { name: t("common.premium"), value: 35, color: "hsl(var(--chart-2))" },
  ];

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
              <SelectItem value="daily">{t("analytics.daily")}</SelectItem>
              <SelectItem value="weekly">{t("analytics.weekly")}</SelectItem>
              <SelectItem value="monthly">{t("analytics.monthly")}</SelectItem>
              <SelectItem value="yearly">
                {t("reports.time_periods.yearly")}
              </SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
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
            <div className="text-2xl font-bold">{formatCurrency(27800)}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-success">+12.5%</span>{" "}
              {t("reports.metrics.from_last_period")}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("dashboard.total_users")}
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,245</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-success">+8.2%</span>{" "}
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
            <div className="text-2xl font-bold">423</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-success">+15.3%</span>{" "}
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
            <div className="text-2xl font-bold">12m 35s</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-success">+2.1%</span>{" "}
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
              <AreaChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip
                  formatter={(value, name) => [
                    name === t("reports.charts.revenue_label")
                      ? formatCurrency(Number(value))
                      : value,
                    name === t("reports.charts.revenue_label")
                      ? t("reports.charts.revenue")
                      : name,
                  ]}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="hsl(var(--primary))"
                  fill="hsl(var(--primary))"
                  fillOpacity={0.6}
                  name={t("reports.charts.revenue_label")}
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
              <BarChart data={userData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip
                  formatter={(value, name) => [
                    name === t("reports.charts.revenue_label")
                      ? formatCurrency(Number(value))
                      : value,
                    name === t("reports.charts.revenue_label")
                      ? t("reports.charts.revenue")
                      : name,
                  ]}
                />
                <Bar
                  dataKey="newUsers"
                  fill="hsl(var(--chart-1))"
                  name={t("reports.charts.new_users")}
                />
                <Bar
                  dataKey="activeUsers"
                  fill="hsl(var(--chart-2))"
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
                  data={subscriptionData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={120}
                  paddingAngle={5}
                  dataKey="value"
                  nameKey="name"
                >
                  {subscriptionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) => [
                    `${value}%`,
                    t("reports.charts.percentage"),
                  ]}
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
              <LineChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="revenue"
                  stroke="hsl(var(--primary))"
                  strokeWidth={3}
                  name={t("reports.charts.revenue_label")}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="users"
                  stroke="hsl(var(--chart-2))"
                  strokeWidth={3}
                  name={t("reports.charts.users")}
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
                {revenueData.map((data, index) => (
                  <tr key={index} className="border-b">
                    <td className="py-3">{data.month}</td>
                    <td className="text-right py-3">
                      {formatCurrency(data.revenue)}
                    </td>
                    <td className="text-right py-3">{data.users}</td>
                    <td className="text-right py-3">{data.premium}</td>
                    <td className="text-right py-3">3.2%</td>
                    <td className="text-right py-3">1.8%</td>
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
