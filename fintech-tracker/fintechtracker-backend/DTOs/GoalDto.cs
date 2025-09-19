namespace fintechtracker_backend.DTOs
{
    public class GoalDto
    {
        public int GoalId { get; set; }
        public string GoalName { get; set; } = null!;
        public decimal TargetAmount { get; set; }
        public decimal CurrentAmount { get; set; }
        public DateOnly TargetDate { get; set; }
        public string? Description { get; set; }
        public string Priority { get; set; } = "Medium"; // High, Medium, Low
        public bool IsActive { get; set; } = true;
        public DateTime? CreatedAt { get; set; }

        // Calculated fields
        public decimal ProgressPercentage => TargetAmount > 0 ? (CurrentAmount / TargetAmount) * 100 : 0;
        public decimal RemainingAmount => TargetAmount - CurrentAmount;
        public int DaysRemaining => (TargetDate.ToDateTime(TimeOnly.MinValue) - DateTime.Now).Days;
        public bool IsCompleted => CurrentAmount >= TargetAmount;
    }

    public class CreateGoalDto
    {
        public string GoalName { get; set; } = null!;
        public decimal TargetAmount { get; set; }
        public decimal CurrentAmount { get; set; } = 0;
        public DateOnly TargetDate { get; set; }
        public string? Description { get; set; }
        public string Priority { get; set; } = "Medium";
    }

    public class UpdateGoalDto
    {
        public string GoalName { get; set; } = null!;
        public decimal TargetAmount { get; set; }
        public decimal CurrentAmount { get; set; }
        public DateOnly TargetDate { get; set; }
        public string? Description { get; set; }
        public string Priority { get; set; } = "Medium";
    }

    public class AddMoneyToGoalDto
    {
        public decimal Amount { get; set; }
    }
}