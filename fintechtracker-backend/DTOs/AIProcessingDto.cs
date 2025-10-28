using System.Text.Json.Serialization;

namespace fintechtracker_backend.DTOs
{
    // DTO for AI transaction extraction result
    public class TransactionExtractionDto
    {
        [JsonPropertyName("amount")]
        public decimal Amount { get; set; }

        [JsonPropertyName("transaction_type")]
        public string TransactionType { get; set; } = null!; // "expense" or "income"

        [JsonPropertyName("category")]
        public string? Category { get; set; }

        [JsonPropertyName("description")]
        public string? Description { get; set; }

        [JsonPropertyName("account")]
        public string? Account { get; set; }

        [JsonPropertyName("date")]
        public DateTime? Date { get; set; }

        [JsonPropertyName("confidence")]
        public double Confidence { get; set; } = 0.0;

        [JsonPropertyName("is_valid")]
        public bool IsValid { get; set; } = false;

        [JsonPropertyName("error_message")]
        public string? ErrorMessage { get; set; }
    }

    // DTO for AI classification request
    public class AIClassificationRequestDto
    {
        public string MessageText { get; set; } = null!;
        public int UserId { get; set; }
        public long TelegramUserId { get; set; }
        public List<string>? AvailableCategories { get; set; }
        public List<string>? AvailableAccounts { get; set; }
    }

    // DTO for AI response
    public class AIClassificationResponseDto
    {
        public TransactionExtractionDto? TransactionData { get; set; }
        public string ResponseMessage { get; set; } = null!;
        public bool Success { get; set; }
        public string? ActionType { get; set; } // "create_transaction", "query_data", "help", etc.
    }

    // DTO for OpenAI/Gemini API request
    public class AIApiRequestDto
    {
        public string Model { get; set; } = "gpt-4";
        public List<AIMessageDto> Messages { get; set; } = new();
        public double Temperature { get; set; } = 0.7;
        public int MaxTokens { get; set; } = 500;
    }

    // DTO for AI message structure
    public class AIMessageDto
    {
        public string Role { get; set; } = null!; // "system", "user", "assistant"
        public string Content { get; set; } = null!;
    }

    // DTO for OpenAI response
    public class AIApiResponseDto
    {
        public string Id { get; set; } = null!;
        public string Object { get; set; } = null!;
        public long Created { get; set; }
        public List<AIChoiceDto> Choices { get; set; } = new();
        public AIUsageDto? Usage { get; set; }
    }

    public class AIChoiceDto
    {
        public int Index { get; set; }
        public AIMessageDto Message { get; set; } = null!;
        public string? FinishReason { get; set; }
    }

    public class AIUsageDto
    {
        public int PromptTokens { get; set; }
        public int CompletionTokens { get; set; }
        public int TotalTokens { get; set; }
    }

    // DTO for transaction creation from Telegram
    public class TelegramTransactionCreateDto
    {
        public decimal Amount { get; set; }
        public string TransactionType { get; set; } = null!;
        public int? CategoryId { get; set; }
        public int AccountId { get; set; }
        public string? Description { get; set; }
        public DateTime TransactionDate { get; set; }
        public string Source { get; set; } = "telegram";
    }
}