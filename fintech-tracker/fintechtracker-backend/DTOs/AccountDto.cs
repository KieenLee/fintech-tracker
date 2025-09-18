namespace fintechtracker_backend.DTOs
{
    public class AccountDto
    {
        public int AccountId { get; set; }
        public int UserId { get; set; }
        public string AccountName { get; set; } = null!;
        public string AccountType { get; set; } = null!;
        public decimal CurrentBalance { get; set; }
        public string CurrencyCode { get; set; } = null!;
        public string? AccountColor { get; set; }
        public string? Description { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }
}