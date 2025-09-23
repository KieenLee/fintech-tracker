using fintechtracker_backend.DTOs;
using System.Threading.Tasks;

namespace fintechtracker_backend.Services
{
    public interface IOtpService
    {
        Task<bool> GenerateAndCacheOtpAsync(string email, RegisterDto userData);
        Task<bool> VerifyOtpAsync(string email, string otpCode);
        Task<RegisterDto?> GetPendingRegistrationAsync(string email);
        Task<bool> IsRateLimitExceededAsync(string email);
    }
}