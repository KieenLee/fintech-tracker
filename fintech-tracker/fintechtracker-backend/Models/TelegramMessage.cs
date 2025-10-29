using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace fintechtracker_backend.Models
{
    public class TelegramMessage
    {
        [Key]
        public long MessageId { get; set; }

        [ForeignKey("TelegramUser")]
        public long TelegramUserId { get; set; }

        public string? MessageText { get; set; }

        public bool Processed { get; set; } = false;

        public string? Response { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public virtual TelegramUser? TelegramUser { get; set; }
    }
}