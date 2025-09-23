using System.ComponentModel.DataAnnotations;

namespace fintechtracker_backend.DTOs
{
    public class SendOtpDto
    {
        public string? Email { get; set; }
        public string? FirstName { get; set; }
        public string? LastName { get; set; }
        public string? Username { get; set; }
        public string? Password { get; set; }
    }

    public class VerifyOtpDto
    {
        public string? Email { get; set; }
        public string? OtpCode { get; set; }
    }

    public class OtpVerificationData
    {
        public string? OtpCode { get; set; }
        public RegisterDto? UserData { get; set; }
        public DateTime ExpiresAt { get; set; }
        public int AttemptCount { get; set; }
    }
}