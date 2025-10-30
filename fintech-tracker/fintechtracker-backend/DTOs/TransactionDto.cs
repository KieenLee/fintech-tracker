using System.Text.Json.Serialization;

namespace fintechtracker_backend.DTOs
{
    public class TransactionDto
    {
        public long TransactionId { get; set; }
        public int UserId { get; set; }
        public int AccountId { get; set; }
        public string AccountName { get; set; } = null!;
        public int? CategoryId { get; set; }
        public string? CategoryName { get; set; }
        public decimal Amount { get; set; }
        public string TransactionType { get; set; } = null!;
        public string? Description { get; set; }
        public DateTime TransactionDate { get; set; }
        public string? Location { get; set; }
        public DateTime? CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
    }

    public class CreateTransactionDto
    {
        public int AccountId { get; set; }
        public int? CategoryId { get; set; }
        public decimal Amount { get; set; }
        public string TransactionType { get; set; } = null!; // "income" or "expense"
        public string? Description { get; set; }
        public DateTime TransactionDate { get; set; }
        public string? Location { get; set; }
    }

    public class UpdateTransactionDto : CreateTransactionDto
    {
        public long TransactionId { get; set; }
    }

    public class TransactionFilterDto
    {
        public int? CategoryId { get; set; }
        public int? AccountId { get; set; }
        public DateTime? FromDate { get; set; }
        public DateTime? ToDate { get; set; }
        public string? TransactionType { get; set; }
        public decimal? MinAmount { get; set; }
        public decimal? MaxAmount { get; set; }
        public int Page { get; set; } = 1;
        public int PageSize { get; set; } = 10;
        public string? SortBy { get; set; } = "TransactionDate";
        public string? SortOrder { get; set; } = "desc";
    }

    public class TransactionResponseDto
    {
        public IEnumerable<TransactionDto> Transactions { get; set; } = null!;
        public int TotalCount { get; set; }
        public int Page { get; set; }
        public int PageSize { get; set; }
        public int TotalPages { get; set; }
    }
}