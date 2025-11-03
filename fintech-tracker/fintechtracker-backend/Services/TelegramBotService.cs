using Telegram.Bot;
using Telegram.Bot.Polling;
using Telegram.Bot.Types;
using Telegram.Bot.Types.Enums;
using Telegram.Bot.Exceptions;

namespace fintechtracker_backend.Services
{
    public class TelegramBotService : BackgroundService
    {
        private readonly ITelegramBotClient _botClient;
        private readonly IServiceProvider _serviceProvider;
        private readonly ILogger<TelegramBotService> _logger;
        private CancellationTokenSource? _receivingCts;

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
                // Step 1: Delete webhook ONCE
                _logger.LogInformation("Deleting webhook...");
                await _botClient.DeleteWebhookAsync(
                    dropPendingUpdates: true,
                    cancellationToken: stoppingToken
                );

                // Step 2: Wait for deletion to complete
                await Task.Delay(3000, stoppingToken);

                // Step 3: Verify webhook is gone
                var webhookInfo = await _botClient.GetWebhookInfoAsync(stoppingToken);
                if (!string.IsNullOrEmpty(webhookInfo.Url))
                {
                    _logger.LogError("Failed to delete webhook: {Url}. Another instance may be running.", webhookInfo.Url);
                    return;
                }

                _logger.LogInformation("Webhook deleted successfully. Starting long polling...");

                // Step 4: Create linked cancellation token
                _receivingCts = CancellationTokenSource.CreateLinkedTokenSource(stoppingToken);

                var receiverOptions = new ReceiverOptions
                {
                    AllowedUpdates = new[] { UpdateType.Message },
                    ThrowPendingUpdates = true,
                    Limit = 100
                }; 

                // Step 5: Start polling
                await _botClient.ReceiveAsync(
                    updateHandler: new DefaultUpdateHandler(HandleUpdateAsync, HandlePollingErrorAsync),
                    receiverOptions: receiverOptions,
                    cancellationToken: _receivingCts.Token
                );
            }
            catch (OperationCanceledException)
            {
                _logger.LogInformation("Bot service was cancelled gracefully");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Fatal error in bot service");
            }
        }

        private async Task HandleUpdateAsync(
            ITelegramBotClient botClient,
            Update update,
            CancellationToken cancellationToken)
        {
            try
            {
                if (update.Message is not { } message || message.Text is not { } messageText)
                    return;

                var from = message.From;
                if (from is null) return;

                var messageId = message.MessageId;
                var chatId = message.Chat.Id;
                var telegramUserId = from.Id;

                _logger.LogInformation("Processing message {MessageId} from {UserId}: {Text}",
                    messageId, telegramUserId, messageText);

                using var scope = _serviceProvider.CreateScope();
                var telegramService = scope.ServiceProvider.GetRequiredService<ITelegramService>();

                string response;

                if (messageText.StartsWith("/"))
                {
                    response = await HandleCommandAsync(messageText, telegramUserId, from, telegramService);
                }
                else
                {
                    // Pass messageId for deduplication
                    response = await telegramService.ProcessMessageAsync(telegramUserId, messageText, messageId);
                }

                // Send response with reply to original message (prevents duplicates)
                await botClient.SendTextMessageAsync(
                    chatId: chatId,
                    text: response,
                    replyToMessageId: messageId,
                    cancellationToken: cancellationToken
                );

                _logger.LogInformation("Response sent for message {MessageId}", messageId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error handling update");
            }
        }

        private Task HandlePollingErrorAsync(
            ITelegramBotClient botClient,
            Exception exception,
            CancellationToken cancellationToken)
        {
            var errorMessage = exception switch
            {
                ApiRequestException { Message: var msg } when msg.Contains("Conflict") =>
                    "CONFLICT ERROR: Another bot instance is running. Stopping this instance.",
                ApiRequestException apiEx =>
                    $"Telegram API Error: {apiEx.ErrorCode} - {apiEx.Message}",
                _ => $"Polling Error: {exception.Message}"
            };

            _logger.LogError(exception, "{ErrorMessage}", errorMessage);

            // CRITICAL: Stop polling immediately on Conflict
            if (exception is ApiRequestException { Message: var conflictMsg } && conflictMsg.Contains("Conflict"))
            {
                _logger.LogCritical("Conflict detected. Cancelling polling to prevent duplicate instances.");
                _receivingCts?.Cancel();
            }

            return Task.CompletedTask;
        }

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

        public override async Task StopAsync(CancellationToken cancellationToken)
        {
            _logger.LogInformation("Stopping Telegram bot service...");

            // Cancel the receiving token to stop polling
            _receivingCts?.Cancel();

            await base.StopAsync(cancellationToken);

            _receivingCts?.Dispose();
        }
    }
}