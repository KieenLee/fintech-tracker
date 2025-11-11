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
            _model = _configuration["AI:Model"] ?? "gemini-2.0-flash";
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

        public async Task<QuickAddResponseDto> ProcessQuickAddMessageAsync(AIPromptContext context)
        {
            var prompt = BuildQuickAddPrompt(context);
            var response = await CallGeminiAsync(prompt);

            try
            {
                _logger.LogInformation("QuickAdd AI Response: {Response}", response);

                // Clean response
                var cleanedResponse = response.Trim();
                if (cleanedResponse.StartsWith("```json"))
                    cleanedResponse = cleanedResponse.Substring(7);
                if (cleanedResponse.StartsWith("```"))
                    cleanedResponse = cleanedResponse.Substring(3);
                if (cleanedResponse.EndsWith("```"))
                    cleanedResponse = cleanedResponse.Substring(0, cleanedResponse.Length - 3);
                cleanedResponse = cleanedResponse.Trim();

                var result = JsonSerializer.Deserialize<QuickAddResponseDto>(cleanedResponse, new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                });

                if (result == null)
                {
                    _logger.LogWarning("Failed to parse QuickAdd response, returning fallback");
                    return new QuickAddResponseDto
                    {
                        Type = "query",
                        Response = context.Language == "vi"
                            ? "Xin lỗi, tôi không hiểu câu hỏi của bạn. Vui lòng thử lại."
                            : "Sorry, I don't understand your question. Please try again."
                    };
                }

                return result;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing QuickAdd message: {Message}", context.UserMessage);
                return new QuickAddResponseDto
                {
                    Type = "query",
                    Response = context.Language == "vi"
                        ? "Đã xảy ra lỗi khi xử lý. Vui lòng thử lại."
                        : "An error occurred. Please try again."
                };
            }
        }

        private string BuildQuickAddPrompt(AIPromptContext context)
        {
            var accountsList = context.UserAccounts != null && context.UserAccounts.Any()
                ? string.Join("\n   ", context.UserAccounts.Select(a => $"- {a.AccountName} (ID: {a.AccountId}, Balance: {a.CurrentBalance:N0}, Type: {a.AccountType})"))
                : "No accounts";

            var categoriesList = context.UserCategories != null && context.UserCategories.Any()
                ? string.Join("\n   ", context.UserCategories.Select(c => $"- {c.CategoryName} (ID: {c.CategoryId}, Type: {c.TransactionType})"))
                : "No categories";

            var recentTransactionsSummary = "";
            if (context.RecentTransactions != null && context.RecentTransactions.Any())
            {
                var totalIncome = context.RecentTransactions
                    .Where(t => t.TransactionType == "income")
                    .Sum(t => t.Amount);
                var totalExpense = context.RecentTransactions
                    .Where(t => t.TransactionType == "expense")
                    .Sum(t => t.Amount);
                var transactionCount = context.RecentTransactions.Count;

                recentTransactionsSummary = $@"
   - Total transactions: {transactionCount}
   - Total income: {totalIncome:N0}
   - Total expense: {totalExpense:N0}
   - Net balance: {(totalIncome - totalExpense):N0}";
            }
            else
            {
                recentTransactionsSummary = "No recent transactions";
            }

            var defaultAccountId = context.UserAccounts?.FirstOrDefault(a => a.AccountId == 1)?.AccountId
                                  ?? context.UserAccounts?.FirstOrDefault()?.AccountId
                                  ?? 1;

            var today = DateTime.Now.ToString("yyyy-MM-dd");
            var thisWeekStart = DateTime.Now.AddDays(-(int)DateTime.Now.DayOfWeek).ToString("yyyy-MM-dd");
            var thisMonthStart = new DateTime(DateTime.Now.Year, DateTime.Now.Month, 1).ToString("yyyy-MM-dd");

            return $@"You are a personal finance assistant AI for User ID {context.UserId}. 
Respond in {context.Language} language.
Today's date: {today}

**USER'S FINANCIAL DATA (CONFIDENTIAL - FOR USER {context.UserId} ONLY):**

**Accounts:**
   {accountsList}

**Categories:**
   {categoriesList}

**Recent Transactions Summary (Last {context.RecentTransactions?.Count ?? 0} transactions):**
   {recentTransactionsSummary}

---

**YOUR CAPABILITIES:**

### 1️⃣ FINANCIAL STATISTICS & QUERIES
You can answer questions about:
- **Time-based spending/income**: ""How much did I spend this week/month/year?""
- **Account balances**: ""What's my current balance?"", ""Balance in each account?""
- **Category analysis**: ""Which category did I spend most on?"", ""Food expenses this month?""
- **Transaction counts**: ""How many transactions this week?""
- **Comparisons**: ""Did I spend more this month or last month?""
- **Trends**: ""Am I spending too much?"", ""Evaluate my finances""

**Time Period Keywords:**
- ""today"" / ""hôm nay"" → {today}
- ""this week"" / ""tuần này"" → from {thisWeekStart} to {today}
- ""this month"" / ""tháng này"" → from {thisMonthStart} to {today}
- ""last week"" / ""tuần trước"" → calculate from context
- ""last month"" / ""tháng trước"" → calculate from context

**CRITICAL SECURITY RULE:**
- You can ONLY access and show data for User ID {context.UserId}
- NEVER show data from other users
- If asked about other users, respond: ""I can only show your personal financial data""

**Response Format for Queries:**
{{
  ""type"": ""query"",
  ""response"": ""Your detailed analysis in {context.Language} with numbers, comparisons, and insights""
}}

**Example Query Responses:**
- ""Tuần này bạn đã chi 450,000đ, bao gồm: Ăn uống 200k, Di chuyển 150k, Giải trí 100k. Cao hơn 20% so với tuần trước.""
- ""You spent $1,234 this month. Top categories: Food ($450), Transport ($300). You're 15% over budget.""

---

### 2️⃣ TRANSACTION CREATION
When user describes a transaction:

**Examples:**
- ""I spent $50 on lunch""
- ""Received $1000 salary""
- ""Chi 200k tiền cafe""
- ""Nạp 500k vào ví Momo""

**Parsing Rules:**
1. **amount**: Extract number
   - ""50k"" → 50000
   - ""1.5tr"" / ""1.5 triệu"" → 1500000
   - ""$50"" → 50

2. **transactionType**:
   - ""income"" if: received, earned, salary, thu, nhận, lương, được
   - ""expense"" otherwise

3. **categoryId**: Match from available categories:
{string.Join("\n   ", context.UserCategories?.Select(c => $"- {c.CategoryName} ({c.TransactionType}): keywords like {GetCategoryKeywords(c.CategoryName)}") ?? new List<string>())}
   - If no match: use null

4. **accountId**: 
   - Default: {defaultAccountId} (Primary cash account)
   - If user mentions account name, match from: {string.Join(", ", context.UserAccounts?.Select(a => a.AccountName) ?? new List<string>())}

5. **description**: Keep original user text

6. **transactionDate**: ""{today}"" (unless user specifies date)

**Response Format for Transactions:**
{{
  ""type"": ""transaction"",
  ""response"": ""Confirmation message in {context.Language}"",
  ""transaction"": {{
    ""accountId"": {defaultAccountId},
    ""categoryId"": number or null,
    ""amount"": number,
    ""transactionType"": ""income"" or ""expense"",
    ""description"": ""original text"",
    ""transactionDate"": ""{today}""
  }}
}}

**Example Transaction Responses:**
- ""Đã ghi nhận: Chi 50,000đ cho Ăn uống vào tài khoản Tiền mặt""
- ""Transaction recorded: $50 expense for Food & Dining in Cash account""

---

**OUTPUT REQUIREMENTS:**
1. Return ONLY valid JSON (no markdown blocks)
2. Choose type: ""query"" or ""transaction""
3. Provide helpful, accurate responses
4. Use user's preferred language ({context.Language})
5. Include numbers with thousand separators for readability
6. Keep responses concise but informative

---

**USER'S MESSAGE:** 
{context.UserMessage}

**YOUR RESPONSE (JSON only):**";
        }

        private string GetCategoryKeywords(string categoryName)
        {
            var keywords = new Dictionary<string, string>
            {
                ["Food & Dining"] = "food, lunch, dinner, cafe, restaurant, ăn, uống, phở, cơm",
                ["Transportation"] = "taxi, bus, grab, xăng, xe, gas, transport, đi lại",
                ["Shopping"] = "buy, shop, mua, quần áo, clothes, shopping",
                ["Entertainment"] = "movie, game, fun, vui chơi, giải trí",
                ["Bills & Utilities"] = "bill, electric, water, internet, điện, nước",
                ["Healthcare"] = "doctor, medicine, hospital, thuốc, bệnh viện",
                ["Education"] = "school, course, học, study, sách",
                ["Salary"] = "salary, lương, wage, income",
                ["Freelancing"] = "freelance, project, contract",
                ["Investment"] = "stock, dividend, invest, cổ phiếu",
                ["Gift"] = "gift, bonus, thưởng, quà"
            };

            return keywords.ContainsKey(categoryName) ? keywords[categoryName] : "other";
        }

        private async Task<string> CallGeminiAsync(string prompt)
        {
            try
            {
                var url = $"https://generativelanguage.googleapis.com/v1beta/models/{_model}:generateContent?key={_apiKey}";

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
                        temperature = 0.2,
                        maxOutputTokens = 2048,
                        topP = 0.8,
                        topK = 40
                    }
                };

                var json = JsonSerializer.Serialize(requestBody);
                var content = new StringContent(json, Encoding.UTF8, "application/json");

                _logger.LogInformation("Calling Gemini API with model: {Model}", _model);

                var response = await _httpClient.PostAsync(url, content);
                var responseText = await response.Content.ReadAsStringAsync();

                // Log full response for debugging
                _logger.LogInformation("Gemini API Raw Response: {Response}", responseText);

                if (!response.IsSuccessStatusCode)
                {
                    _logger.LogError("Gemini API error: {StatusCode} - {Response}", response.StatusCode, responseText);
                    throw new HttpRequestException($"Gemini API returned {response.StatusCode}: {responseText}");
                }

                var jsonResponse = JsonDocument.Parse(responseText);
                var root = jsonResponse.RootElement;

                // ===== DEFENSIVE CHECKS =====

                // Check if error exists in response
                if (root.TryGetProperty("error", out var errorElement))
                {
                    var errorMessage = errorElement.TryGetProperty("message", out var msgElement)
                        ? msgElement.GetString()
                        : "Unknown error";
                    _logger.LogError("Gemini API returned error: {Error}", errorMessage);
                    throw new HttpRequestException($"Gemini API error: {errorMessage}");
                }

                // Check if candidates exist
                if (!root.TryGetProperty("candidates", out var candidatesElement))
                {
                    _logger.LogError("No 'candidates' property in Gemini response");
                    throw new InvalidOperationException("Invalid Gemini API response: missing 'candidates'");
                }

                if (candidatesElement.GetArrayLength() == 0)
                {
                    _logger.LogError("Gemini API returned empty candidates array");
                    throw new InvalidOperationException("Gemini API returned no candidates");
                }

                var candidate = candidatesElement[0];

                // Check if content exists
                if (!candidate.TryGetProperty("content", out var contentElement))
                {
                    _logger.LogError("No 'content' property in candidate");
                    throw new InvalidOperationException("Invalid Gemini API response: missing 'content'");
                }

                // Check if parts exist
                if (!contentElement.TryGetProperty("parts", out var partsElement))
                {
                    _logger.LogError("No 'parts' property in content");
                    throw new InvalidOperationException("Invalid Gemini API response: missing 'parts'");
                }

                if (partsElement.GetArrayLength() == 0)
                {
                    _logger.LogError("Gemini API returned empty parts array");
                    throw new InvalidOperationException("Gemini API returned no parts");
                }

                // Get text from first part
                var part = partsElement[0];
                if (!part.TryGetProperty("text", out var textElement))
                {
                    _logger.LogError("No 'text' property in part");
                    throw new InvalidOperationException("Invalid Gemini API response: missing 'text'");
                }

                var text = textElement.GetString();

                if (string.IsNullOrWhiteSpace(text))
                {
                    _logger.LogWarning("Gemini API returned empty text");
                    return "No response generated";
                }

                _logger.LogInformation("Gemini API returned text: {Text}", text.Substring(0, Math.Min(100, text.Length)));

                return text;
            }
            catch (JsonException ex)
            {
                _logger.LogError(ex, "Failed to parse Gemini API response");
                throw new InvalidOperationException("Failed to parse Gemini API response", ex);
            }
            catch (HttpRequestException ex)
            {
                _logger.LogError(ex, "HTTP error calling Gemini API");
                throw;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unexpected error calling Gemini API");
                throw;
            }
        }
    }
}