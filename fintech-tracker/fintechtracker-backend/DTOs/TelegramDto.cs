namespace fintechtracker_backend.DTOs
{
    public class TelegramUpdateDto
    {
        public int UpdateId { get; set; }
        public TelegramMessageDto? Message { get; set; }
    }

    public class TelegramMessageDto
    {
        public int MessageId { get; set; }
        public TelegramUserDto From { get; set; } = null!;
        public TelegramChatDto Chat { get; set; } = null!;
        public string? Text { get; set; }
        public DateTime Date { get; set; }
    }

    public class TelegramUserDto
    {
        public long Id { get; set; }
        public bool IsBot { get; set; }
        public string FirstName { get; set; } = null!;
        public string? LastName { get; set; }
        public string? Username { get; set; }
    }

    public class TelegramChatDto
    {
        public long Id { get; set; }
        public string Type { get; set; } = null!;
    }

    public class TelegramProcessResult
    {
        public bool ShouldRespond { get; set; }
        public string ResponseMessage { get; set; } = string.Empty;
        public long? TransactionId { get; set; }
    }

    public class MessageParseResult
    {
        public bool IsValid { get; set; }
        public decimal Amount { get; set; }
        public string Description { get; set; } = string.Empty;
        public string TransactionType { get; set; } = string.Empty;
        public string CategoryName { get; set; } = string.Empty;
        public string ErrorMessage { get; set; } = string.Empty;
    }

    public class SetWebhookRequest
    {
        public string Url { get; set; } = null!;
    }
}