namespace fintechtracker_backend.DTOs
{
    public class TelegramUserDto
    {
        public long TelegramUserId { get; set; }
        public int? UserId { get; set; }
        public long ChatId { get; set; }
        public string? FirstName { get; set; }
        public string? LastName { get; set; }
        public string? Username { get; set; }
    }
}