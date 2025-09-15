using System.ComponentModel.DataAnnotations;

namespace fintechtracker_backend.DTOs
{
    public class RegisterDto
    {
        [Required]
        public string Username { get; set; } = null!;
        [Required]
        [EmailAddress]
        public string Email { get; set; } = null!;
        [Required]
        public string Password { get; set; } = null!;
        [Required]
        public string FirstName { get; set; } = null!;
        [Required]
        public string LastName { get; set; } = null!;
    }

    public class RegisterResponseDto
    {
        public string Message { get; set; } = "";
    }
}