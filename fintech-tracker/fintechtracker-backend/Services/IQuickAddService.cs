using fintechtracker_backend.DTOs;

namespace fintechtracker_backend.Services
{
    public interface IQuickAddService
    {
        Task<QuickAddResponseDto> ProcessMessageAsync(int userId, QuickAddRequestDto request);
    }
}