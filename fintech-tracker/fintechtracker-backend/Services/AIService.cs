using fintechtracker_backend.DTOs;
using System.Text.Json;
using System.Net.Http;
using System.Text;

namespace fintechtracker_backend.Services
{
    public class AIService : IAIService
    {
        private readonly IConfiguration _configuration;
        private readonly ILogger<AIService> _logger;
        private readonly HttpClient _httpClient;
        private readonly string _apiKey;
        private readonly string _model;

        public AIService(
            IConfiguration configuration,
            ILogger<AIService> logger,
            IHttpClientFactory httpClientFactory)
        {
            _configuration = configuration;
            _logger = logger;
            _httpClient = httpClientFactory.CreateClient();
            _apiKey = _configuration["AI:ApiKey"] ?? throw new InvalidOperationException("AI:ApiKey is not configured");
            _model = _configuration["AI:Model"] ?? "gemini-2.0-flash-exp"; // Default model
        }

        public async Task<TransactionType> ClassifyTransactionAsync(string messageText)
        {
            var prompt = $@"Classify this Vietnamese financial transaction as 'income' or 'expense':
'{messageText}'

Respond with ONLY one word: income or expense";

            var response = await CallGeminiAsync(prompt);

            return response.ToLower().Contains("income")
                ? TransactionType.Income
                : TransactionType.Expense;
        }

        public async Task<TransactionDataDto> ExtractTransactionDataAsync(string messageText)
        {
            var prompt = $@"You are a financial transaction parser API. Convert Vietnamese text into structured JSON.

**Input:** ""{messageText}""

**Output REQUIRED:** Return ONLY a valid JSON object, no explanations, no markdown code blocks.

**Extraction Rules:**

1. `type`:
   * If text contains words like ""lương"", ""được cho"", ""thưởng"", ""bán được"", ""thu nhập"", ""lợi nhuận"" → 'income'
   * If text contains words like ""mua"", ""trả tiền"", ""chi"", ""tốn"", ""cà phê"", ""ăn"", ""xăng"" → 'expense'
   * Default: 'expense'

2. `category`:
   * Classify into ONE of these categories (MUST BE IN ENGLISH):
   * Expense categories: 'Food & Dining', 'Transportation', 'Shopping', 'Entertainment', 'Bills & Utilities', 'Healthcare', 'Education', 'Travel', 'Other'
   * Income categories: 'Salary', 'Freelancing', 'Business', 'Investment', 'Gift', 'Other'
   * If unsure, use 'Other'

3. `amount`:
   * Extract number and convert to INTEGER
   * Examples: ""20k"" → 20000, ""10tr"" → 10000000, ""150.000"" → 150000, ""1.5 triệu"" → 1500000

4. `description`:
   * Keep original user text exactly as provided

**EXAMPLE:**
* Input: ""Sáng nay đi ăn phở hết 50k""
* Output:
{{
  ""type"": ""expense"",
  ""category"": ""Food & Dining"",
  ""amount"": 50000,
  ""description"": ""Sáng nay đi ăn phở hết 50k""
}}

**CRITICAL:** Your response must contain ONLY the JSON object and nothing else.";

            var response = await CallGeminiAsync(prompt);

            try
            {
                _logger.LogInformation("AI Response: {Response}", response);

                // Clean response (remove markdown code blocks if present)
                var cleanedResponse = response.Trim();
                if (cleanedResponse.StartsWith("```json"))
                {
                    cleanedResponse = cleanedResponse.Substring(7);
                }
                if (cleanedResponse.StartsWith("```"))
                {
                    cleanedResponse = cleanedResponse.Substring(3);
                }
                if (cleanedResponse.EndsWith("```"))
                {
                    cleanedResponse = cleanedResponse.Substring(0, cleanedResponse.Length - 3);
                }
                cleanedResponse = cleanedResponse.Trim();

                var data = JsonSerializer.Deserialize<TransactionDataDto>(cleanedResponse, new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                });

                if (data == null)
                {
                    _logger.LogError("AI response deserialized to null: {Response}", response);
                    throw new InvalidOperationException("Failed to parse AI response: deserialized object is null.");
                }

                // VALIDATION: Ensure all required fields are present
                if (data.Amount <= 0)
                {
                    _logger.LogWarning("AI returned invalid amount: {Amount}, using default 0", data.Amount);
                }

                if (string.IsNullOrEmpty(data.Category))
                {
                    _logger.LogWarning("AI returned empty category, using 'Other'");
                    data.Category = "Other";
                }

                _logger.LogInformation("Parsed transaction: Type={Type}, Amount={Amount}, Category={Category}",
                    data.Type, data.Amount, data.Category);

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

            return await CallGeminiAsync(prompt);
        }

        private async Task<string> CallGeminiAsync(string prompt)
        {
            try
            {
                var apiUrl = $"https://generativelanguage.googleapis.com/v1beta/models/{_model}:generateContent?key={_apiKey}";

                var requestBody = new
                {
                    contents = new[]
                    {
                        new
                        {
                            parts = new[]
                            {
                                new { text = prompt }
                            }
                        }
                    },
                    generationConfig = new
                    {
                        temperature = _configuration.GetValue<double>("AI:Temperature", 0.7),
                        maxOutputTokens = _configuration.GetValue<int>("AI:MaxTokens", 1000)
                    }
                };

                var jsonContent = JsonSerializer.Serialize(requestBody);
                var content = new StringContent(jsonContent, Encoding.UTF8, "application/json");

                _logger.LogInformation("Calling Gemini API with model: {Model}", _model);

                var response = await _httpClient.PostAsync(apiUrl, content);
                var responseContent = await response.Content.ReadAsStringAsync();

                if (!response.IsSuccessStatusCode)
                {
                    _logger.LogError("Gemini API error: {StatusCode} - {Response}",
                        response.StatusCode, responseContent);
                    throw new HttpRequestException($"Gemini API returned {response.StatusCode}: {responseContent}");
                }

                _logger.LogDebug("Gemini API raw response: {Response}", responseContent);

                var jsonResponse = JsonSerializer.Deserialize<JsonElement>(responseContent);

                // Extract text from Gemini response structure
                var text = jsonResponse
                    .GetProperty("candidates")[0]
                    .GetProperty("content")
                    .GetProperty("parts")[0]
                    .GetProperty("text")
                    .GetString();

                if (string.IsNullOrEmpty(text))
                {
                    _logger.LogError("Gemini returned empty text");
                    throw new InvalidOperationException("Gemini API returned empty response");
                }

                _logger.LogInformation("Gemini response extracted successfully");
                return text;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error calling Gemini API");
                throw;
            }
        }
    }
}