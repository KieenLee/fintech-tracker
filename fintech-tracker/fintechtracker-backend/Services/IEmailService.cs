using System.Threading.Tasks;

namespace fintechtracker_backend.Services
{
    public interface IEmailService
    {
        Task<bool> SendOtpEmailAsync(string email, string otpCode, string firstName);
        string GenerateOtpCode();
    }
}