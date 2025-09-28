using fintechtracker_backend.DTOs;

namespace fintechtracker_backend.Services
{
    public interface ITelegramService
    {
        Task<TelegramProcessResult> ProcessMessageAsync(TelegramMessageDto message);
        Task<bool> SendMessageAsync(long chatId, string text);
        Task<bool> SetWebhookAsync(string webhookUrl);
    }
}