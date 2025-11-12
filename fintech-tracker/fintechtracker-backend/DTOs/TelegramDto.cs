namespace fintechtracker_backend.DTOs
{
    public class TelegramLoginDto
    {
        public long Id { get; set; } // Telegram User ID
        public string? FirstName { get; set; }
        public string? LastName { get; set; }
        public string? Username { get; set; }
        public string? PhotoUrl { get; set; }
        public long AuthDate { get; set; } // Unix timestamp
        public string Hash { get; set; } = null!; // Signature từ Telegram
    }

    public class TelegramLinkResponseDto
    {
        public bool IsLinked { get; set; }
        public string? TelegramUserId { get; set; }
        public string? TelegramUsername { get; set; }
        public string? TelegramFirstName { get; set; }
        public string? TelegramLastName { get; set; }
        public string? TelegramPhotoUrl { get; set; }
        public DateTime? LinkedAt { get; set; }
    }

    public class UnlinkTelegramDto
    {
        public string Reason { get; set; } = "User requested unlink";
    }
}