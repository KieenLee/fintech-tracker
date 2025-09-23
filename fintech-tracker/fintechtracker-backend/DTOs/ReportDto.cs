namespace fintechtracker_backend.DTOs
{
    public class ReportMetricsDto
    {
        public decimal TotalRevenue { get; set; }
        public int TotalUsers { get; set; }
        public int PremiumUsers { get; set; }
        public string AvgSessionTime { get; set; } = "12m 35s";
        public string RevenueGrowth { get; set; } = "+0%";
        public string UsersGrowth { get; set; } = "+0%";
        public string PremiumGrowth { get; set; } = "+0%";
        public string SessionGrowth { get; set; } = "+0%";
    }

    public class RevenueDataDto
    {
        public string Month { get; set; } = null!;
        public decimal Revenue { get; set; }
        public int Users { get; set; }
        public int Premium { get; set; }
    }

    public class UserGrowthDataDto
    {
        public string Day { get; set; } = null!;
        public int NewUsers { get; set; }
        public int ActiveUsers { get; set; }
    }

    public class SubscriptionDistributionDto
    {
        public string Name { get; set; } = null!;
        public int Value { get; set; }
    }

    public class DetailedMetricDto
    {
        public string Month { get; set; } = null!;
        public decimal Revenue { get; set; }
        public int NewUsers { get; set; }
        public int PremiumUsers { get; set; }
        public string ConversionRate { get; set; } = "0%";
        public string ChurnRate { get; set; } = "0%";
    }

    public class ReportFilterDto
    {
        public string TimeRange { get; set; } = "monthly";
    }

    public class ReportDashboardDto
    {
        public ReportMetricsDto Metrics { get; set; } = new();
        public List<RevenueDataDto> RevenueData { get; set; } = new();
        public List<UserGrowthDataDto> UserGrowthData { get; set; } = new();
        public List<SubscriptionDistributionDto> SubscriptionData { get; set; } = new();
        public List<DetailedMetricDto> DetailedMetrics { get; set; } = new();
    }
}