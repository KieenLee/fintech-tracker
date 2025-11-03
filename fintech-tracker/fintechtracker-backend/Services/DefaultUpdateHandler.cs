using Telegram.Bot;
using Telegram.Bot.Polling;
using Telegram.Bot.Types;

namespace fintechtracker_backend.Services
{
    public class DefaultUpdateHandler : IUpdateHandler
    {
        private readonly Func<ITelegramBotClient, Update, CancellationToken, Task> _handleUpdateAsync;
        private readonly Func<ITelegramBotClient, Exception, CancellationToken, Task> _handlePollingErrorAsync;

        public DefaultUpdateHandler(
            Func<ITelegramBotClient, Update, CancellationToken, Task> handleUpdateAsync,
            Func<ITelegramBotClient, Exception, CancellationToken, Task> handlePollingErrorAsync)
        {
            _handleUpdateAsync = handleUpdateAsync;
            _handlePollingErrorAsync = handlePollingErrorAsync;
        }

        public Task HandleUpdateAsync(ITelegramBotClient botClient, Update update, CancellationToken cancellationToken)
            => _handleUpdateAsync(botClient, update, cancellationToken);

        public Task HandlePollingErrorAsync(ITelegramBotClient botClient, Exception exception, CancellationToken cancellationToken)
            => _handlePollingErrorAsync(botClient, exception, cancellationToken);
    }
}