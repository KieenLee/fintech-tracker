namespace fintechtracker_backend.DTOs
{
    public class UpdateProfileDto
    {
        public required string Name { get; set; }
        public required string Email { get; set; }
        public required string Currency { get; set; }
        public required string Language { get; set; }
    }

    public class NotificationSettingsDto
    {
        public bool EmailNotifications { get; set; }
        public bool BudgetAlerts { get; set; }
        public bool GoalReminders { get; set; }
        public bool WeeklyReports { get; set; }
    }

    public class PrivacySettingsDto
    {
        public bool DataSharing { get; set; }
        public bool AnalyticsTracking { get; set; }
        public bool MarketingEmails { get; set; }
    }

    public class UpdateSettingsDto
    {
        public NotificationSettingsDto? Notifications { get; set; }
        public PrivacySettingsDto? Privacy { get; set; }
    }

    public class UserSettingsResponseDto
    {
        public required string Name { get; set; }
        public required string Email { get; set; }
        public required string Currency { get; set; }
        public required string Language { get; set; }
        public required NotificationSettingsDto Notifications { get; set; }
        public required PrivacySettingsDto Privacy { get; set; }
    }
}