using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace fintechtracker_backend.Models
{
    public class TelegramUser
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public long TelegramUserId { get; set; }

        [ForeignKey("User")]
        public int UserId { get; set; }

        [Required]
        public long ChatId { get; set; }

        [MaxLength(100)]
        public string? FirstName { get; set; }

        [MaxLength(100)]
        public string? LastName { get; set; }

        [MaxLength(100)]
        public string? Username { get; set; }

        public bool IsActive { get; set; } = true;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public virtual User? User { get; set; }
    }
}