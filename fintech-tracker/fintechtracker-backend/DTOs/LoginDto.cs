using System.ComponentModel.DataAnnotations;

namespace fintechtracker_backend.DTOs
{
    public class LoginDto
    {
        [EmailAddress]
        public string? Email { get; set; } = null!;
        public string? Username { get; set; } = null!;
        [Required]
        public string Password { get; set; } = null!;
    }

    public class LoginResponseDto
    {
        public int UserId { get; set; }
        public string Username { get; set; } = null!;
        public string Email { get; set; } = null!;
        public string Role { get; set; } = null!;
        public string? Token { get; set; }
        public string? FullName { get; set; }
    }
}