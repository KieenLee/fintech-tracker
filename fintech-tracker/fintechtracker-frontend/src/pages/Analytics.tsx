import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  Cell
} from "recharts";
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  ArrowUpIcon, 
  ArrowDownIcon,
  Calendar,
  PieChart,
  BarChart3
} from "lucide-react";
import { useState } from "react";

const Analytics = () => {
  const [timeRange, setTimeRange] = useState("6months");

  // Sample data for different time periods
  const data6Months = [
    { month: "Jan", income: 4500, expenses: 3200, savings: 1300 },
    { month: "Feb", income: 4200, expenses: 2800, savings: 1400 },
    { month: "Mar", income: 4800, expenses: 3500, savings: 1300 },
    { month: "Apr", income: 4600, expenses: 3100, savings: 1500 },
    { month: "May", income: 5000, expenses: 3400, savings: 1600 },
    { month: "Jun", income: 4700, expenses: 3000, savings: 1700 },
  ];

  const monthlyTrends = [
    { month: "Jan", netWorth: 15000 },
    { month: "Feb", netWorth: 16400 },
    { month: "Mar", netWorth: 17700 },
    { month: "Apr", netWorth: 19200 },
    { month: "May", netWorth: 20800 },
    { month: "Jun", netWorth: 22500 },
  ];

  const categoryData = [
    { name: "Food & Dining", value: 1200, percentage: 35, color: "hsl(var(--chart-1))" },
    { name: "Transportation", value: 800, percentage: 23, color: "hsl(var(--chart-2))" },
    { name: "Shopping", value: 600, percentage: 17, color: "hsl(var(--chart-3))" },
    { name: "Entertainment", value: 400, percentage: 12, color: "hsl(var(--chart-4))" },
    { name: "Utilities", value: 300, percentage: 9, color: "hsl(var(--chart-5))" },
    { name: "Other", value: 100, percentage: 4, color: "hsl(180 50% 50%)" },
  ];

  const totalIncome = data6Months.reduce((sum, item) => sum + item.income, 0);
  const totalExpenses = data6Months.reduce((sum, item) => sum + item.expenses, 0);
  const totalSavings = data6Months.reduce((sum, item) => sum + item.savings, 0);
  const savingsRate = ((totalSavings / totalIncome) * 100).toFixed(1);
  const avgMonthlyExpenses = (totalExpenses / data6Months.length).toFixed(0);

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
          <p className="text-muted-foreground">Detailed insights into your financial patterns</p>
        </div>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
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
            <div className="text-2xl font-bold">${totalIncome.toLocaleString()}</div>
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
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalExpenses.toLocaleString()}</div>
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
            <div className="text-2xl font-bold">{savingsRate}%</div>
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
            <CardTitle className="text-sm font-medium">Avg. Monthly Expenses</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${avgMonthlyExpenses}</div>
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
              Income vs Expenses
            </CardTitle>
            <CardDescription>Monthly comparison of income and expenses</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data6Months}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="income" fill="hsl(var(--primary))" name="Income" />
                <Bar dataKey="expenses" fill="hsl(var(--destructive))" name="Expenses" />
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
            <CardDescription>Track your financial growth over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={monthlyTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
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
            <CardTitle>Monthly Savings</CardTitle>
            <CardDescription>Track your monthly savings progress</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data6Months}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
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
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={100}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`$${value}`, "Amount"]} />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-2">
                {categoryData.map((category, index) => (
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
          <CardTitle>Financial Insights</CardTitle>
          <CardDescription>AI-powered recommendations based on your spending patterns</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="p-4 bg-success/10 rounded-lg border border-success/20">
              <h4 className="font-medium text-success mb-2">Great Progress!</h4>
              <p className="text-sm text-muted-foreground">
                Your savings rate of {savingsRate}% is above the recommended 20%. Keep up the excellent work!
              </p>
            </div>
            <div className="p-4 bg-warning/10 rounded-lg border border-warning/20">
              <h4 className="font-medium text-warning mb-2">Food Spending Alert</h4>
              <p className="text-sm text-muted-foreground">
                Your food expenses are 35% of total spending. Consider meal planning to optimize this category.
              </p>
            </div>
            <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <h4 className="font-medium text-blue-700 dark:text-blue-300 mb-2">Investment Opportunity</h4>
              <p className="text-sm text-muted-foreground">
                With consistent savings, consider diversifying into investment accounts for long-term growth.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Analytics;