using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace fintechtracker_backend.Models
{
    [Table("TelegramMessages")]
    public class TelegramMessage
    {
        [Key]
        public long MessageId { get; set; }

        public long TelegramUserId { get; set; }

        [Required]
        public string MessageText { get; set; } = string.Empty;

        public bool Processed { get; set; }

        public string? Response { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // NEW: Add Telegram message ID for deduplication
        public int? TelegramMessageId { get; set; }

        [ForeignKey("TelegramUserId")]
        public virtual TelegramUser? TelegramUser { get; set; }
    }
}