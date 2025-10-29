using Telegram.Bot;
using Telegram.Bot.Polling;
using Telegram.Bot.Types;
using Telegram.Bot.Types.Enums;
using fintechtracker_backend.Services.Interfaces;

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
            var receiverOptions = new ReceiverOptions
            {
                AllowedUpdates = new[] { UpdateType.Message, UpdateType.CallbackQuery }
            };

            _logger.LogInformation("Starting Telegram bot polling...");

            await _botClient.ReceiveAsync(
                HandleUpdateAsync,
                HandleErrorAsync,
                receiverOptions,
                stoppingToken
            );
        }

        private async Task HandleUpdateAsync(
            ITelegramBotClient botClient,
            Update update,
            CancellationToken cancellationToken)
        {
            if (update.Message is not { } message || message.Text is not { } messageText || message.From is null)
                return;

            var chatId = message.Chat.Id;
            var telegramUserId = message.From.Id;

            _logger.LogInformation("Received message from {UserId}: {Text}", telegramUserId, messageText);

            using var scope = _serviceProvider.CreateScope();
            var telegramService = scope.ServiceProvider.GetRequiredService<ITelegramService>();

            string response;

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

        private async Task<string> HandleCommandAsync(
            string command,
            long telegramUserId,
            User user,
            ITelegramService telegramService)
        {
            var parts = command.Split(' ');
            var cmd = parts[0].ToLower();

            return cmd switch
            {
                "/start" => "🎉 Chào mừng đến với FinTech Tracker!\n\n" +
                           "Để bắt đầu, vui lòng liên kết tài khoản của bạn bằng lệnh:\n" +
                           "/link <token>\n\n" +
                           "Bạn có thể lấy token từ trang web.",

                "/link" => await HandleLinkCommandAsync(parts, telegramUserId, user, telegramService),

                "/stats" => "📊 Tính năng thống kê đang được phát triển...",

                "/help" => "📖 Hướng dẫn sử dụng:\n" +
                          "/start - Bắt đầu\n" +
                          "/link <token> - Liên kết tài khoản\n" +
                          "/stats - Xem thống kê\n" +
                          "/help - Hướng dẫn",

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
                return "❌ Vui lòng cung cấp token: /link <token>";
            }

            var token = parts[1];

            // TODO: Validate token and get userId from your authentication service
            // For now, this is a placeholder
            var userId = 1; // Replace with actual user validation

            var success = await telegramService.RegisterUserAsync(
                telegramUserId,
                userId,
                user.Id,
                user.FirstName ?? string.Empty,
                user.LastName ?? string.Empty,
                user.Username ?? string.Empty
            );

            return success
                ? "✅ Liên kết tài khoản thành công! Bạn có thể bắt đầu ghi chép thu chi."
                : "❌ Liên kết thất bại. Token không hợp lệ hoặc tài khoản đã được liên kết.";
        }

        private Task HandleErrorAsync(
            ITelegramBotClient botClient,
            Exception exception,
            CancellationToken cancellationToken)
        {
            _logger.LogError(exception, "Error in Telegram bot");
            return Task.CompletedTask;
        }
    }
}