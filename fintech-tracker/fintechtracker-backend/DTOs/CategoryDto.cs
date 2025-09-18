namespace fintechtracker_backend.DTOs
{
    public class CategoryDto
    {
        public int CategoryId { get; set; }
        public string CategoryName { get; set; } = null!;
        public string TransactionType { get; set; } = null!;
        public string? CategoryIcon { get; set; }
        public string? CategoryColor { get; set; }
    }
}