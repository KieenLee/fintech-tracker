namespace fintechtracker_backend.DTOs
{
    // DTO for incoming Telegram message webhook
    public class TelegramWebhookDto
    {
        public long UpdateId { get; set; }
        public TelegramMessageDto? Message { get; set; }
    }

    // DTO for Telegram message details
    public class TelegramMessageDto
    {
        public long MessageId { get; set; }
        public TelegramUserDto From { get; set; } = null!;
        public TelegramChatDto Chat { get; set; } = null!;
        public string? Text { get; set; }
        public long Date { get; set; }
    }

    // DTO for Telegram user info
    public class TelegramUserDto
    {
        public long Id { get; set; }
        public bool IsBot { get; set; }
        public string FirstName { get; set; } = null!;
        public string? LastName { get; set; }
        public string? Username { get; set; }
        public string? LanguageCode { get; set; }
    }

    // DTO for Telegram chat info
    public class TelegramChatDto
    {
        public long Id { get; set; }
        public string Type { get; set; } = null!; // "private", "group", etc.
        public string? FirstName { get; set; }
        public string? LastName { get; set; }
        public string? Username { get; set; }
    }

    // DTO for Telegram API response
    public class TelegramResponseDto
    {
        public bool Ok { get; set; }
        public object? Result { get; set; }
        public string? Description { get; set; }
    }

    // DTO for sending Telegram message
    public class SendTelegramMessageDto
    {
        public long ChatId { get; set; }
        public string Text { get; set; } = null!;
        public string? ParseMode { get; set; } // "Markdown" or "HTML"
        public bool? DisableNotification { get; set; }
    }

    // DTO for Telegram user registration/linking
    public class LinkTelegramAccountDto
    {
        public long TelegramUserId { get; set; }
        public string LinkToken { get; set; } = null!;
    }

    // DTO for checking Telegram user status
    public class TelegramUserStatusDto
    {
        public bool IsLinked { get; set; }
        public int? UserId { get; set; }
        public string? Username { get; set; }
        public string? Email { get; set; }
        public string Message { get; set; } = null!;
    }
}