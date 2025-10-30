using Telegram.Bot;
using Telegram.Bot.Polling;
using Telegram.Bot.Types;
using Telegram.Bot.Types.Enums;
using fintechtracker_backend.Services;

namespace fintechtracker_backend.Services
{
    public class TelegramBotService : BackgroundService
    {
        private readonly ITelegramBotClient _botClient;
        private readonly IServiceProvider _serviceProvider;
        private readonly ILogger<TelegramBotService> _logger;

        public TelegramBotService(
            ITelegramBotClient botClient,
            IServiceProvider serviceProvider,
            ILogger<TelegramBotService> logger)
        {
            _botClient = botClient;
            _serviceProvider = serviceProvider;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            try
            {
                // XÓA WEBHOOK TRƯỚC KHI DÙNG LONG POLLING
                _logger.LogInformation("Deleting existing webhook...");
                await _botClient.DeleteWebhookAsync(cancellationToken: stoppingToken);

                var receiverOptions = new ReceiverOptions
                {
                    AllowedUpdates = new[] { UpdateType.Message, UpdateType.CallbackQuery },
                    ThrowPendingUpdates = true // Bỏ qua messages cũ
                };

                _logger.LogInformation("Starting Telegram bot long polling...");

                await _botClient.ReceiveAsync(
                    HandleUpdateAsync,
                    HandleErrorAsync,
                    receiverOptions,
                    stoppingToken
                );
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Fatal error starting Telegram bot");
            }
        }

        private async Task HandleUpdateAsync(
            ITelegramBotClient botClient,
            Update update,
            CancellationToken cancellationToken)
        {
            if (update.Message is not { From: { } from, Text: { } messageText } message)
                return;

            var chatId = message.Chat.Id;
            var telegramUserId = from.Id;

            _logger.LogInformation("Received message from {UserId}: {Text}", telegramUserId, messageText);

            using var scope = _serviceProvider.CreateScope();
            var telegramService = scope.ServiceProvider.GetRequiredService<ITelegramService>();

            string response;

            try
            {
                // Handle commands
                if (messageText.StartsWith("/"))
                {
                    response = await HandleCommandAsync(messageText, telegramUserId, message.From, telegramService);
                }
                else
                {
                    response = await telegramService.ProcessMessageAsync(telegramUserId, messageText);
                }

                await botClient.SendTextMessageAsync(chatId, response, cancellationToken: cancellationToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing message from {UserId}", telegramUserId);
                await botClient.SendTextMessageAsync(
                    chatId,
                    "❌ Đã xảy ra lỗi khi xử lý tin nhắn. Vui lòng thử lại sau.",
                    cancellationToken: cancellationToken
                );
            }
        }

        private async Task<string> HandleCommandAsync(
            string command,
            long telegramUserId,
            User user,
            ITelegramService telegramService)
        {
            var parts = command.Split(' ', StringSplitOptions.RemoveEmptyEntries);
            var cmd = parts[0].ToLower();

            return cmd switch
            {
                "/start" => "🎉 Chào mừng đến với FinTech Tracker!\n\n" +
                           "📝 Để bắt đầu ghi chép thu chi, vui lòng liên kết tài khoản:\n" +
                           "/link <token>\n\n" +
                           "💡 Bạn có thể lấy token từ trang web.",

                "/link" => await HandleLinkCommandAsync(parts, telegramUserId, user, telegramService),

                "/stats" => "📊 Tính năng thống kê đang được phát triển...",

                "/help" => "📖 **Hướng dẫn sử dụng Bot**\n\n" +
                          "🔹 /start - Bắt đầu sử dụng bot\n" +
                          "🔹 /link <token> - Liên kết tài khoản\n" +
                          "🔹 /stats - Xem thống kê chi tiêu\n" +
                          "🔹 /help - Xem hướng dẫn\n\n" +
                          "💬 Gửi tin nhắn để ghi chép thu chi:\n" +
                          "Ví dụ: 'Mua cà phê 25000'",

                _ => "❓ Lệnh không hợp lệ. Sử dụng /help để xem hướng dẫn."
            };
        }

        private async Task<string> HandleLinkCommandAsync(
            string[] parts,
            long telegramUserId,
            User user,
            ITelegramService telegramService)
        {
            if (parts.Length < 2)
            {
                return "❌ Vui lòng cung cấp token:\n/link <token>\n\n" +
                       "💡 Bạn có thể lấy token từ trang Settings trên web.";
            }

            var token = parts[1];
            var userId = 1; // Replace with actual validation logic

            var success = await telegramService.RegisterUserAsync(
                telegramUserId,
                userId,
                user.Id,
                user.FirstName ?? "",
                user.LastName ?? "",
                user.Username ?? ""
            );

            return success
                ? "✅ Liên kết tài khoản thành công!\n\n" +
                  "🎉 Bây giờ bạn có thể gửi tin nhắn để ghi chép thu chi.\n" +
                  "Ví dụ: 'Mua cà phê 25000'"
                : "❌ Liên kết thất bại.\n\n" +
                  "Lý do có thể:\n" +
                  "• Token không hợp lệ\n" +
                  "• Tài khoản đã được liên kết\n\n" +
                  "Vui lòng lấy token mới từ trang web.";
        }

        private Task HandleErrorAsync(
            ITelegramBotClient botClient,
            Exception exception,
            CancellationToken cancellationToken)
        {
            var errorMessage = exception switch
            {
                Telegram.Bot.Exceptions.ApiRequestException apiEx =>
                    $"Telegram API Error: {apiEx.Message}",
                _ => $"Error: {exception.Message}"
            };

            _logger.LogError(exception, "Error in Telegram bot: {ErrorMessage}", errorMessage);
            return Task.CompletedTask;
        }
    }
}