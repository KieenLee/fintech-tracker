using fintechtracker_backend.DTOs;
using fintechtracker_backend.Models;

namespace fintechtracker_backend.Services
{
    public interface ITelegramService
    {
        Task<bool> RegisterUserAsync(long telegramUserId, int userId, long chatId,
            string firstName, string lastName, string username);

        Task<string> ProcessMessageAsync(long telegramUserId, string messageText, int? telegramMessageId = null);

        Task<bool> SendMessageAsync(long chatId, string message);

        Task<bool> CheckUserExistsAsync(long telegramUserId);

        Task<TelegramUser?> GetTelegramUserAsync(long telegramUserId);
    }
}