namespace fintechtracker_backend.DTOs
{
    // Existing Budget DTOs
    public class BudgetDto
    {
        public int BudgetId { get; set; }
        public int UserId { get; set; }
        public int CategoryId { get; set; }
        public string CategoryName { get; set; } = null!;
        public decimal Amount { get; set; }
        public decimal SpentAmount { get; set; }
        public decimal RemainingAmount => Amount - SpentAmount;
        public decimal ProgressPercentage => Amount > 0 ? (SpentAmount / Amount) * 100 : 0;
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public bool IsRecurring { get; set; }
        public decimal NotificationThreshold { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }

    public class CreateBudgetDto
    {
        public int CategoryId { get; set; }
        public decimal Amount { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public bool IsRecurring { get; set; } = false;
        public decimal NotificationThreshold { get; set; } = 90.00m;
    }

    public class UpdateBudgetDto : CreateBudgetDto
    {
        public int BudgetId { get; set; }
    }

    public class BudgetResponseDto
    {
        public List<BudgetDto> Budgets { get; set; } = new();
        public int TotalCount { get; set; }
        public decimal TotalBudgetAmount { get; set; }
        public decimal TotalSpentAmount { get; set; }
        public decimal OverallProgressPercentage { get; set; }
    }

    public class BudgetFilterDto
    {
        public int? CategoryId { get; set; }
        public DateTime? StartDate { get; set; }
        public DateTime? EndDate { get; set; }
        public bool? IsActive { get; set; }
    }

    // Budget Integration DTOs
    public class BudgetWarningDto
    {
        public int BudgetId { get; set; }
        public string CategoryName { get; set; } = null!;
        public decimal BudgetAmount { get; set; }
        public decimal CurrentSpent { get; set; }
        public decimal NewSpent { get; set; }
        public decimal ProgressPercentage { get; set; }
        public string WarningLevel { get; set; } = null!; // "Warning", "Critical", "Exceeded"
        public string Message { get; set; } = null!;
    }

    public class BudgetAlertDto
    {
        public int BudgetId { get; set; }
        public string CategoryName { get; set; } = null!;
        public decimal BudgetAmount { get; set; }
        public decimal SpentAmount { get; set; }
        public decimal ProgressPercentage { get; set; }
        public string AlertType { get; set; } = null!; // "Threshold", "Exceeded"
        public DateTime AlertDate { get; set; }
    }
}