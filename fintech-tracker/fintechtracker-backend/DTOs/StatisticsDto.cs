namespace fintechtracker_backend.DTOs
{
    public class TransactionStatisticsDto
    {
        public int UserId { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public int TotalTransactions { get; set; }
        public decimal TotalIncome { get; set; }
        public decimal TotalExpense { get; set; }
        public decimal NetBalance { get; set; }
        public int IncomeCount { get; set; }
        public int ExpenseCount { get; set; }
        public List<CategoriesSpendingDto> CategoryBreakdown { get; set; } = new();
        public List<DailyTransactionSummaryDto> DailyBreakdown { get; set; } = new();
    }

    public class CategoriesSpendingDto
    {
        public int CategoryId { get; set; }
        public string CategoryName { get; set; } = null!;
        public string TransactionType { get; set; } = null!;
        public decimal TotalAmount { get; set; }
        public int TransactionCount { get; set; }
        public decimal Percentage { get; set; }
    }

    public class DailyTransactionSummaryDto
    {
        public DateTime Date { get; set; }
        public int TransactionCount { get; set; }
        public decimal TotalIncome { get; set; }
        public decimal TotalExpense { get; set; }
        public decimal NetBalance { get; set; }
    }
}