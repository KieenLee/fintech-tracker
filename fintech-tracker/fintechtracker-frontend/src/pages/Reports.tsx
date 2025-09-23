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

const Reports = () => {
  const [timeRange, setTimeRange] = useState("monthly");
  const { formatCurrency } = useCurrency();

  // Sample data for different time periods
  const revenueData = [
    { month: "Jan", revenue: 4500, users: 120, premium: 45 },
    { month: "Feb", revenue: 4200, users: 115, premium: 42 },
    { month: "Mar", revenue: 4800, users: 140, premium: 52 },
    { month: "Apr", revenue: 4600, users: 135, premium: 49 },
    { month: "May", revenue: 5000, users: 150, premium: 58 },
    { month: "Jun", revenue: 4700, users: 145, premium: 55 },
  ];

  const userData = [
    { day: "Mon", newUsers: 12, activeUsers: 85 },
    { day: "Tue", newUsers: 18, activeUsers: 92 },
    { day: "Wed", newUsers: 15, activeUsers: 88 },
    { day: "Thu", newUsers: 22, activeUsers: 105 },
    { day: "Fri", newUsers: 25, activeUsers: 110 },
    { day: "Sat", newUsers: 30, activeUsers: 125 },
    { day: "Sun", newUsers: 20, activeUsers: 95 },
  ];

  const subscriptionData = [
    { name: "Basic", value: 65, color: "hsl(var(--chart-1))" },
    { name: "Premium", value: 35, color: "hsl(var(--chart-2))" },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Reports & Analytics
          </h1>
          <p className="text-muted-foreground">
            Comprehensive business insights and metrics
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">Daily</SelectItem>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
              <SelectItem value="yearly">Yearly</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(27800)}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-success">+12.5%</span> from last period
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,245</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-success">+8.2%</span> from last period
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Premium Users</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">423</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-success">+15.3%</span> from last period
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Session</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12m 35s</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-success">+2.1%</span> from last period
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Revenue Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue Trend</CardTitle>
            <CardDescription>Monthly revenue and user growth</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip
                  formatter={(value, name) => [
                    name === "Revenue ($)"
                      ? formatCurrency(Number(value))
                      : value,
                    name === "Revenue ($)" ? "Revenue" : name,
                  ]}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="hsl(var(--primary))"
                  fill="hsl(var(--primary))"
                  fillOpacity={0.6}
                  name="Revenue ($)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* User Growth Chart */}
        <Card>
          <CardHeader>
            <CardTitle>User Growth</CardTitle>
            <CardDescription>New vs active users</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={userData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip
                  formatter={(value, name) => [
                    name === "Revenue ($)"
                      ? formatCurrency(Number(value))
                      : value,
                    name === "Revenue ($)" ? "Revenue" : name,
                  ]}
                />
                <Bar
                  dataKey="newUsers"
                  fill="hsl(var(--chart-1))"
                  name="New Users"
                />
                <Bar
                  dataKey="activeUsers"
                  fill="hsl(var(--chart-2))"
                  name="Active Users"
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Subscription Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Subscription Distribution</CardTitle>
            <CardDescription>Breakdown of user subscriptions</CardDescription>
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
                <Tooltip formatter={(value) => [`${value}%`, "Percentage"]} />
              </RechartsPieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Revenue vs Users */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue vs Users</CardTitle>
            <CardDescription>
              Correlation between revenue and user count
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
                  name="Revenue ($)"
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="users"
                  stroke="hsl(var(--chart-2))"
                  strokeWidth={3}
                  name="Users"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Metrics */}
      <Card>
        <CardHeader>
          <CardTitle>Detailed Metrics</CardTitle>
          <CardDescription>Comprehensive data breakdown</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left pb-3">Month</th>
                  <th className="text-right pb-3">Revenue</th>
                  <th className="text-right pb-3">New Users</th>
                  <th className="text-right pb-3">Premium Users</th>
                  <th className="text-right pb-3">Conversion Rate</th>
                  <th className="text-right pb-3">Churn Rate</th>
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
