namespace fintechtracker_backend.DTOs
{
    public class ProfileResponseDto
    {
        public int UserId { get; set; }
        public string Username { get; set; } = null!;
        public string Email { get; set; } = null!;
        public string? FirstName { get; set; }
        public string? LastName { get; set; }
        public string? Phone { get; set; }
        public string? AvatarUrl { get; set; }
        public string? JoinDate { get; set; }
        public string Role { get; set; } = null!;
        public QuickStatsDto Stats { get; set; } = null!;
        public AccountLevelDto AccountLevel { get; set; } = null!;
        public List<AchievementDto> Achievements { get; set; } = new();
    }

    public class UpdateProfilesDto
    {
        public string Username { get; set; } = null!;
        public string Email { get; set; } = null!;
        public string? FirstName { get; set; }
        public string? LastName { get; set; }
        public string? Phone { get; set; }
    }

    public class QuickStatsDto
    {
        public int TotalTransactions { get; set; }
        public int BudgetsCreated { get; set; }
        public int GoalsAchieved { get; set; }
        public int DaysActive { get; set; }
    }

    public class AccountLevelDto
    {
        public string CurrentLevel { get; set; } = null!;
        public int Progress { get; set; }
        public string NextLevel { get; set; } = null!;
        public int Points { get; set; }
    }

    public class AchievementDto
    {
        public int Id { get; set; }
        public string Title { get; set; } = null!;
        public string Description { get; set; } = null!;
        public string Icon { get; set; } = null!;
        public bool Earned { get; set; }
        public DateTime? Date { get; set; }
        public double Progress { get; set; }
    }
}