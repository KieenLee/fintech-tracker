using Google.Cloud.AIPlatform.V1;
using fintechtracker_backend.Services.Interfaces;
using fintechtracker_backend.DTOs;
using System.Text.Json;

namespace fintechtracker_backend.Services
{
    public class AIService : IAIService
    {
        private readonly IConfiguration _configuration;
        private readonly ILogger<AIService> _logger;
        private readonly string _apiKey;

        public AIService(IConfiguration configuration, ILogger<AIService> logger)
        {
            _configuration = configuration;
            _logger = logger;
            _apiKey = _configuration["AI:ApiKey"];
        }

        public async Task<TransactionType> ClassifyTransactionAsync(string messageText)
        {
            var prompt = $@"Classify this Vietnamese financial transaction as 'income' or 'expense':
'{messageText}'

Respond with ONLY one word: income or expense";

            var response = await CallAIAsync(prompt);

            return response.ToLower().Contains("income")
                ? TransactionType.Income
                : TransactionType.Expense;
        }

        public async Task<TransactionDataDto> ExtractTransactionDataAsync(string messageText)
        {
            var prompt = $@"Extract transaction details from this Vietnamese text:
'{messageText}'

Return ONLY a JSON object with this exact structure:
{{
  ""amount"": <number>,
  ""category"": ""<category name>"",
  ""type"": ""income"" or ""expense"",
  ""description"": ""<description>""
}}";

            var response = await CallAIAsync(prompt);

            try
            {
                var data = JsonSerializer.Deserialize<TransactionDataDto>(response);
                return data;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to parse AI response: {Response}", response);
                throw;
            }
        }

        public async Task<string> GenerateResponseAsync(object queryData)
        {
            var jsonData = JsonSerializer.Serialize(queryData);
            var prompt = $@"Generate a friendly Vietnamese response for this financial data:
{jsonData}

Keep it concise and use emojis appropriately.";

            return await CallAIAsync(prompt);
        }

        private async Task<string> CallAIAsync(string prompt)
        {
            // TODO: Implement actual Gemini API call
            // This is a placeholder - replace with actual Gemini API integration
            await Task.Delay(100);
            return "{}";
        }
    }
}