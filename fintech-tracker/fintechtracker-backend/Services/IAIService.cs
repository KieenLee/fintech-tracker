using fintechtracker_backend.DTOs;

namespace fintechtracker_backend.Services.Interfaces
{
    public interface IAIService
    {
        Task<TransactionType> ClassifyTransactionAsync(string messageText);

        Task<TransactionDataDto> ExtractTransactionDataAsync(string messageText);

        Task<string> GenerateResponseAsync(object queryData);
    }
}