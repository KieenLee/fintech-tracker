namespace fintechtracker_backend.DTOs
{
    // Request từ frontend gửi lên
    public class QuickAddRequestDto
    {
        public string Message { get; set; } = null!;
        public string Language { get; set; } = "en"; // en, vi
    }

    // Response trả về cho frontend
    public class QuickAddResponseDto
    {
        public string Response { get; set; } = null!;
        public string Type { get; set; } = null!; // "query" hoặc "transaction"
        public TransactionParsedDto? Transaction { get; set; }
    }

    // Transaction đã được AI parse
    public class TransactionParsedDto
    {
        public int AccountId { get; set; }
        public int? CategoryId { get; set; }
        public decimal Amount { get; set; }
        public string TransactionType { get; set; } = null!; // "income" hoặc "expense"
        public string? Description { get; set; }
        public DateTime TransactionDate { get; set; }
    }

    // Format prompt cho AI
    public class AIPromptContext
    {
        public int UserId { get; set; }
        public string UserMessage { get; set; } = null!;
        public string Language { get; set; } = "en";
        public List<TransactionDto>? RecentTransactions { get; set; }
        public List<AccountDto>? UserAccounts { get; set; }
        public List<CategoryDto>? UserCategories { get; set; }
    }
}