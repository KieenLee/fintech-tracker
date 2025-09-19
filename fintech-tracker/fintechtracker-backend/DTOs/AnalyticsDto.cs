namespace fintechtracker_backend.DTOs
{
    public class AnalyticsOverviewDto
    {
        public decimal TotalIncome { get; set; }
        public decimal TotalExpenses { get; set; }
        public decimal TotalSavings => TotalIncome - TotalExpenses;
        public decimal SavingsRate => TotalIncome > 0 ? (TotalSavings / TotalIncome) * 100 : 0;
        public decimal AvgMonthlyExpenses { get; set; }
        public List<MonthlyDataDto> MonthlyData { get; set; } = new();
        public List<CategoryBreakdownDto> CategoryBreakdown { get; set; } = new();
        public List<NetWorthDto> NetWorthTrend { get; set; } = new();
    }

    public class MonthlyDataDto
    {
        public string Month { get; set; } = string.Empty;
        public decimal Income { get; set; }
        public decimal Expenses { get; set; }
        public decimal Savings => Income - Expenses;
    }

    public class CategoryBreakdownDto
    {
        public string Name { get; set; } = string.Empty;
        public decimal Value { get; set; }
        public decimal Percentage { get; set; }
    }

    public class NetWorthDto
    {
        public string Month { get; set; } = string.Empty;
        public decimal NetWorth { get; set; }
    }

    public class AnalyticsFilterDto
    {
        public string TimeRange { get; set; } = "6months"; // 3months, 6months, 1year, 2years
    }
}