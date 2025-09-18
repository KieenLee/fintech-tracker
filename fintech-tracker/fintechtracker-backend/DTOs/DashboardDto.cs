namespace fintechtracker_backend.DTOs
{
    public class DashboardSummaryDto
    {
        public decimal NetBalance { get; set; }
        public decimal TotalIncome { get; set; }
        public decimal TotalExpense { get; set; }
        public int TransactionCount { get; set; }
        public List<TopExpenseCategoryDto> TopExpenseCategories { get; set; } = new();
    }

    public class AccountSummaryDto
    {
        public int AccountId { get; set; }
        public string AccountName { get; set; } = string.Empty;
        public string AccountType { get; set; } = string.Empty;
        public decimal CurrentBalance { get; set; }
    }

    public class CategoryExpenseDto
    {
        public int CategoryId { get; set; }
        public string CategoryName { get; set; } = string.Empty;
        public decimal TotalAmount { get; set; }
        public decimal Percentage { get; set; }
    }

    public class RecentTransactionDto
    {
        public long TransactionId { get; set; }
        public string Description { get; set; } = string.Empty;
        public decimal Amount { get; set; }
        public string TransactionType { get; set; } = string.Empty;
        public string CategoryName { get; set; } = string.Empty;
        public string AccountName { get; set; } = string.Empty;
        public DateTime TransactionDate { get; set; }
    }

    public class MonthlyTrendDto
    {
        public string Month { get; set; } = null!;  // Format: "2024-01", "2024-02"
        public decimal Income { get; set; }
        public decimal Expense { get; set; }
        public decimal NetIncome { get; set; }
    }

    public class DashboardOverviewDto
    {
        public FinancialSummaryDto FinancialSummary { get; set; } = new();
        public List<CategorySpendingDto> TopCategories { get; set; } = new();
        public List<BudgetProgressDto> BudgetProgress { get; set; } = new();
        public List<BudgetAlertDto> BudgetAlerts { get; set; } = new();
        public DashboardStatsDto Stats { get; set; } = new();
    }

    public class FinancialSummaryDto
    {
        public decimal TotalBalance { get; set; }
        public decimal MonthlyIncome { get; set; }
        public decimal MonthlyExpense { get; set; }
        public decimal MonthlySavings => MonthlyIncome - MonthlyExpense;
        public decimal MonthlyBudget { get; set; }
        public decimal BudgetUsed { get; set; }
        public decimal BudgetRemaining => MonthlyBudget - BudgetUsed;
        public decimal BudgetProgress => MonthlyBudget > 0 ? (BudgetUsed / MonthlyBudget) * 100 : 0;
    }

    public class BudgetProgressDto
    {
        public int BudgetId { get; set; }
        public string CategoryName { get; set; } = null!;
        public decimal BudgetAmount { get; set; }
        public decimal SpentAmount { get; set; }
        public decimal ProgressPercentage { get; set; }
        public string Status { get; set; } = null!; // "Good", "Warning", "Critical", "Exceeded"
        public string StatusColor { get; set; } = null!;
    }

    public class CategorySpendingDto
    {
        public string CategoryName { get; set; } = null!;
        public decimal Amount { get; set; }
        public decimal Percentage { get; set; }
        public bool HasBudget { get; set; }
        public decimal? BudgetAmount { get; set; }
        public decimal? BudgetProgress { get; set; }
        public string? BudgetStatus { get; set; }
    }

    public class DashboardStatsDto
    {
        public int TotalTransactions { get; set; }
        public int ActiveBudgets { get; set; }
        public int OverBudgetCount { get; set; }
        public int AccountsCount { get; set; }
        public decimal AverageDailySpending { get; set; }
    }

    public class TopExpenseCategoryDto
    {
        public string CategoryName { get; set; } = null!;
        public decimal TotalAmount { get; set; }
        public decimal Percentage { get; set; }
    }
}