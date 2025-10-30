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
        private readonly int _maxRetries = 3;

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
            var retryCount = 0;

            while (!stoppingToken.IsCancellationRequested && retryCount < _maxRetries)
            {
                try
                {
                    // Delete webhook before starting long polling
                    _logger.LogInformation("Attempt {Attempt}/{Max}: Deleting existing webhook...",
                        retryCount + 1, _maxRetries);

                    await _botClient.DeleteWebhookAsync(
                        dropPendingUpdates: true,
                        cancellationToken: stoppingToken
                    );

                    _logger.LogInformation("Webhook deleted successfully");

                    // Wait to ensure webhook is fully deleted
                    await Task.Delay(2000, stoppingToken);

                    // Verify webhook is deleted
                    var webhookInfo = await _botClient.GetWebhookInfoAsync(stoppingToken);
                    if (!string.IsNullOrEmpty(webhookInfo.Url))
                    {
                        _logger.LogWarning("Webhook still active: {Url}", webhookInfo.Url);
                        throw new InvalidOperationException("Webhook deletion failed");
                    }

                    var receiverOptions = new ReceiverOptions
                    {
                        AllowedUpdates = new[] { UpdateType.Message, UpdateType.CallbackQuery },
                        ThrowPendingUpdates = true,
                        Limit = 100
                    };

                    _logger.LogInformation("Starting Telegram bot long polling...");

                    await _botClient.ReceiveAsync(
                        HandleUpdateAsync,
                        HandleErrorAsync,
                        receiverOptions,
                        stoppingToken
                    );

                    break; // Success - exit retry loop
                }
                catch (Telegram.Bot.Exceptions.ApiRequestException ex) when (ex.Message.Contains("Conflict"))
                {
                    retryCount++;
                    _logger.LogWarning(ex,
                        "Conflict detected. Attempt {Attempt}/{Max}. Waiting before retry...",
                        retryCount, _maxRetries);

                    if (retryCount < _maxRetries)
                    {
                        // Exponential backoff: 5s, 10s, 20s
                        var delaySeconds = 5 * (int)Math.Pow(2, retryCount - 1);
                        await Task.Delay(TimeSpan.FromSeconds(delaySeconds), stoppingToken);
                    }
                    else
                    {
                        _logger.LogError("Max retries reached. Could not start bot. " +
                            "Please ensure no other bot instances are running.");
                    }
                }
                catch (OperationCanceledException)
                {
                    _logger.LogInformation("Telegram bot service is stopping...");
                    break;
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Fatal error in Telegram bot service");
                    break;
                }
            }
        }

        public override async Task StopAsync(CancellationToken cancellationToken)
        {
            _logger.LogInformation("Stopping Telegram bot service gracefully...");
            await base.StopAsync(cancellationToken);
        }

        private async Task HandleUpdateAsync(
            ITelegramBotClient botClient,
            Update update,
            CancellationToken cancellationToken)
        {
            if (update.Message is not { } message || message.Text is not { } messageText)
                return;

            var from = message.From;
            if (from is null)
                return;

            var chatId = message.Chat.Id;
            var telegramUserId = from.Id;

            _logger.LogInformation("Received message from {UserId}: {Text}",
                telegramUserId, messageText);

            using var scope = _serviceProvider.CreateScope();
            var telegramService = scope.ServiceProvider
                .GetRequiredService<ITelegramService>();

            string response;

            try
            {
                if (messageText.StartsWith("/"))
                {
                    response = await HandleCommandAsync(messageText, telegramUserId,
                        from, telegramService);
                }
                else
                {
                    response = await telegramService.ProcessMessageAsync(
                        telegramUserId, messageText);
                }

                await botClient.SendTextMessageAsync(chatId, response,
                    cancellationToken: cancellationToken);
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

        // Fix HandleCommandAsync - Remove async since no await is used
        private Task<string> HandleCommandAsync(
            string command,
            long telegramUserId,
            User user,
            ITelegramService telegramService)
        {
            var parts = command.Split(' ', StringSplitOptions.RemoveEmptyEntries);
            var cmd = parts[0].ToLower();

            var response = cmd switch
            {
                "/start" => "🎉 Chào mừng đến với FinTech Tracker!\n\n" +
                           "📝 Gửi tin nhắn để ghi chép thu chi:\n" +
                           "Ví dụ: 'Mua cà phê 25000'\n\n" +
                           "💡 Dùng /help để xem hướng dẫn.",

                "/help" => "📖 **Hướng dẫn sử dụng Bot**\n\n" +
                          "🔹 /start - Bắt đầu sử dụng bot\n" +
                          "🔹 /help - Xem hướng dẫn\n\n" +
                          "💬 Gửi tin nhắn để ghi chép thu chi:\n" +
                          "Ví dụ: 'Mua cà phê 25000', 'Đổ xăng 150k'",

                _ => "❓ Lệnh không hợp lệ. Sử dụng /help để xem hướng dẫn."
            };

            return Task.FromResult(response);
        }

        // Fix HandleErrorAsync - Remove async and return statement
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