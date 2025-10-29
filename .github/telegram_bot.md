{
"project": {
"name": "Telegram Bot Integration for FinTech Backend",
"description": "Integration plan for connecting Telegram bot with financial transaction management system",
"backend_url": "https://api.fttk.io.vn",
"ai_model": "gemini-2-flash"
},
"phases": [
{
"phase": 1,
"name": "Database & Models Preparation",
"tasks": [
{
"task_id": "1.1",
"name": "Create TelegramUsers Table",
"type": "database_migration",
"description": "Create new migration for TelegramUsers table to link Telegram accounts with system users",
"table": {
"name": "TelegramUsers",
"columns": [
{
"name": "telegram_user_id",
"type": "bigint",
"constraints": ["unique", "not_null"],
"description": "Telegram user identifier"
},
{
"name": "user_id",
"type": "int",
"constraints": ["foreign_key"],
"references": "Users.Id",
"description": "Reference to internal user"
},
{
"name": "chat_id",
"type": "bigint",
"constraints": ["not_null"],
"description": "Telegram chat identifier"
},
{
"name": "first_name",
"type": "nvarchar(100)",
"constraints": ["nullable"]
},
{
"name": "last_name",
"type": "nvarchar(100)",
"constraints": ["nullable"]
},
{
"name": "username",
"type": "nvarchar(100)",
"constraints": ["nullable"]
},
{
"name": "is_active",
"type": "bit",
"default": true
},
{
"name": "created_at",
"type": "datetime2",
"default": "GETUTCDATE()"
}
]
}
},
{
"task_id": "1.2",
"name": "Create TelegramMessages Table",
"type": "database_migration",
"optional": true,
"description": "Store message history for logging and debugging",
"table": {
"name": "TelegramMessages",
"columns": [
{
"name": "message_id",
"type": "bigint",
"constraints": ["primary_key"]
},
{
"name": "telegram_user_id",
"type": "bigint",
"constraints": ["foreign_key"],
"references": "TelegramUsers.telegram_user_id"
},
{
"name": "message_text",
"type": "nvarchar(max)"
},
{
"name": "processed",
"type": "bit",
"default": false
},
{
"name": "response",
"type": "nvarchar(max)",
"constraints": ["nullable"]
},
{
"name": "created_at",
"type": "datetime2",
"default": "GETUTCDATE()"
}
]
}
},
{
"task_id": "1.3",
"name": "Update User Model",
"type": "model_update",
"description": "Add navigation property to User entity",
"changes": [
{
"entity": "User",
"add_property": {
"name": "TelegramUser",
"type": "TelegramUser",
"relationship": "one_to_one"
}
}
]
}
]
},
{
"phase": 2,
"name": "Telegram Service Layer",
"tasks": [
{
"task_id": "2.1",
"name": "Create ITelegramService Interface",
"type": "interface_definition",
"location": "Services/Interfaces/ITelegramService.cs",
"methods": [
{
"name": "RegisterUserAsync",
"parameters": [
{"name": "telegramUserId", "type": "long"},
{"name": "userId", "type": "int"},
{"name": "chatId", "type": "long"},
{"name": "firstName", "type": "string"},
{"name": "lastName", "type": "string"},
{"name": "username", "type": "string"}
],
"returns": "Task<bool>",
"description": "Register telegram user with system user"
},
{
"name": "ProcessMessageAsync",
"parameters": [
{"name": "telegramUserId", "type": "long"},
{"name": "messageText", "type": "string"}
],
"returns": "Task<string>",
"description": "Process incoming Telegram message and return response"
},
{
"name": "SendMessageAsync",
"parameters": [
{"name": "chatId", "type": "long"},
{"name": "message", "type": "string"}
],
"returns": "Task<bool>",
"description": "Send message back to Telegram"
},
{
"name": "CheckUserExistsAsync",
"parameters": [
{"name": "telegramUserId", "type": "long"}
],
"returns": "Task<bool>",
"description": "Check if telegram user is linked with system user"
}
]
},
{
"task_id": "2.2",
"name": "Implement TelegramService",
"type": "service_implementation",
"location": "Services/TelegramService.cs",
"dependencies": [
"FinTechDbContext",
"ITransactionService",
"IOpenAIService"
],
"logic_flow": [
"Parse incoming message",
"Call AI service for classification",
"Create transaction or query data",
"Generate and return response"
]
},
{
"task_id": "2.3",
"name": "Create TelegramBotService",
"type": "background_service",
"location": "Services/TelegramBotService.cs",
"description": "Background service for long polling Telegram updates",
"implements": "IHostedService",
"required_package": "Telegram.Bot",
"responsibilities": [
"Setup long polling connection to Telegram",
"Receive incoming messages",
"Delegate processing to ITelegramService",
"Handle bot commands"
]
}
]
},
{
"phase": 3,
"name": "AI/NLP Processing Service",
"tasks": [
{
"task_id": "3.1",
"name": "Create IOpenAIService Interface",
"type": "interface_definition",
"location": "Services/Interfaces/IOpenAIService.cs",
"methods": [
{
"name": "ClassifyTransactionAsync",
"parameters": [
{"name": "messageText", "type": "string"}
],
"returns": "Task<TransactionType>",
"description": "Classify if message is income or expense"
},
{
"name": "ExtractTransactionDataAsync",
"parameters": [
{"name": "messageText", "type": "string"}
],
"returns": "Task<TransactionData>",
"description": "Extract amount, category, and description from text"
},
{
"name": "GenerateResponseAsync",
"parameters": [
{"name": "queryData", "type": "object"}
],
"returns": "Task<string>",
"description": "Generate natural language response based on data"
}
]
},
{
"task_id": "3.2",
"name": "Implement AI Service",
"type": "service_implementation",
"location": "Services/OpenAIService.cs",
"ai_provider": "Google Gemini 2 Flash",
"alternative": "OpenAI GPT",
"prompt_engineering": {
"transaction_analysis": {
"purpose": "Extract structured data from natural language",
"input_format": "Vietnamese text describing transaction",
"output_format": {
"amount": "decimal",
"category": "string",
"type": "enum[income, expense]",
"description": "string"
},
"example_prompts": [
"Analyze this transaction: 'Mua cà phê 20k'",
"Extract financial data from: 'Thu nhập freelance 5 triệu'"
]
}
}
}
]
},
{
"phase": 4,
"name": "Telegram Controller & Webhook",
"tasks": [
{
"task_id": "4.1",
"name": "Create TelegramController",
"type": "api_controller",
"location": "Controllers/TelegramController.cs",
"base_route": "/api/telegram",
"endpoints": [
{
"method": "POST",
"route": "/webhook",
"description": "Receive webhook from Telegram",
"request_body": "Telegram Update object",
"authentication": "Telegram signature validation",
"response": "200 OK"
},
{
"method": "POST",
"route": "/register",
"description": "Link telegram_user_id with system user via OTP/token",
"request_body": {
"telegram_user_id": "long",
"token": "string"
},
"response": {
"success": "boolean",
"message": "string"
}
},
{
"method": "GET",
"route": "/status/{telegramUserId}",
"description": "Check if telegram user is linked",
"response": {
"is_linked": "boolean",
"user_id": "int?"
}
}
]
},
{
"task_id": "4.2",
"name": "Setup Telegram Webhook",
"type": "configuration",
"webhook_url": "https://api.fttk.io.vn/api/telegram/webhook",
"security": [
"Validate Telegram signature",
"HTTPS required",
"Rate limiting"
]
}
]
},
{
"phase": 5,
"name": "Message Processing Flow",
"flow": {
"steps": [
{
"step": 1,
"name": "Receive Message",
"action": "Telegram sends message to webhook",
"input": "Telegram Update object"
},
{
"step": 2,
"name": "User Verification",
"action": "Check if telegram_user_id exists in database",
"branches": [
{
"condition": "User exists",
"next_step": 3
},
{
"condition": "User not found",
"action": "Send registration link",
"end": true
}
]
},
{
"step": 3,
"name": "AI Processing",
"action": "Send message to OpenAI/Gemini for analysis",
"service": "IOpenAIService"
},
{
"step": 4,
"name": "Data Extraction",
"action": "Extract structured transaction data",
"output": {
"transaction_type": "income|expense",
"amount": "decimal",
"category": "string (AI suggested)",
"description": "string"
}
},
{
"step": 5,
"name": "Save Transaction",
"action": "Insert into Transactions table",
"service": "ITransactionService"
},
{
"step": 6,
"name": "Send Response",
"action": "Reply to user on Telegram",
"success_message": "✅ Ghi nhận chi tiêu '{description} - {amount}đ' (Danh mục: {category})",
"error_message": "❌ Không thể xử lý. Vui lòng thử lại."
}
]
}
},
{
"phase": 6,
"name": "Configuration & Deployment",
"tasks": [
{
"task_id": "6.1",
"name": "Configure appsettings.json",
"type": "configuration",
"settings": {
"Telegram": {
"BotToken": "YOUR_BOT_TOKEN",
"WebhookUrl": "https://api.fttk.io.vn/api/telegram/webhook",
"AllowedUpdates": ["message", "callback_query"]
},
"OpenAI": {
"ApiKey": "YOUR_KEY",
"Model": "gemini-2-flash",
"MaxTokens": 1000,
"Temperature": 0.7
}
}
},
{
"task_id": "6.2",
"name": "Register Services",
"type": "dependency_injection",
"location": "Program.cs",
"registrations": [
"builder.Services.AddSingleton<ITelegramService, TelegramService>()",
"builder.Services.AddSingleton<IOpenAIService, OpenAIService>()",
"builder.Services.AddHostedService<TelegramBotService>()"
]
},
{
"task_id": "6.3",
"name": "Deploy to Azure",
"type": "deployment",
"steps": [
"Update Azure App Service",
"Set environment variables for API keys",
"Configure HTTPS endpoint",
"Test webhook connection",
"Monitor logs"
]
}
]
},
{
"phase": 7,
"name": "Additional Features",
"tasks": [
{
"task_id": "7.1",
"name": "Bot Commands",
"type": "feature",
"commands": [
{
"command": "/start",
"description": "Welcome message and registration guide",
"response": "Chào mừng! Để bắt đầu, vui lòng liên kết tài khoản..."
},
{
"command": "/link <token>",
"description": "Link Telegram account with system user",
"parameters": ["token: string"]
},
{
"command": "/stats",
"description": "View quick statistics (today, week, month)",
"response_format": "Expense summary with categories"
},
{
"command": "/budget",
"description": "Check budget status",
"response_format": "Budget vs actual spending"
}
]
},
{
"task_id": "7.2",
"name": "Notification Service",
"type": "feature",
"notifications": [
{
"type": "budget_alert",
"trigger": "Budget threshold exceeded",
"message": "⚠️ Cảnh báo: Chi tiêu đã vượt {percentage}% ngân sách"
},
{
"type": "weekly_report",
"schedule": "Every Sunday 20:00",
"message": "📊 Báo cáo tuần: Tổng chi {amount}đ"
},
{
"type": "monthly_report",
"schedule": "Last day of month 20:00",
"message": "📈 Báo cáo tháng: Chi tiết thu chi"
}
]
}
]
}
],
"dependencies": {
"nuget_packages": [
{
"name": "Telegram.Bot",
"version": "19.0.0",
"purpose": "Telegram Bot API client"
},
{
"name": "OpenAI",
"version": "1.11.0",
"purpose": "OpenAI API integration (alternative)",
"optional": true
},
{
"name": "Google.Cloud.AIPlatform.V1",
"version": "2.x.x",
"purpose": "Google Gemini API integration (primary)"
}
]
},
"security_considerations": [
{
"area": "Input Validation",
"requirement": "Validate all input from Telegram",
"implementation": "Use data annotations and sanitization"
},
{
"area": "Webhook Security",
"requirement": "Check Telegram signature on webhook requests",
"implementation": "Validate X-Telegram-Bot-Api-Secret-Token header"
},
{
"area": "Rate Limiting",
"requirement": "Limit requests per user to prevent spam",
"implementation": "Implement rate limiting middleware (e.g., 10 req/min per user)"
},
{
"area": "Error Handling",
"requirement": "Log all errors with context",
"implementation": "Use structured logging (Serilog), implement fallback responses"
},
{
"area": "Privacy",
"requirement": "Do not store sensitive data in logs",
"implementation": "Mask financial amounts and personal info in logs"
}
],
"testing_strategy": {
"environments": [
{
"name": "Development",
"bot_name": "TestFinTechBot",
"purpose": "Local testing with test database"
},
{
"name": "Staging",
"bot_name": "StagingFinTechBot",
"purpose": "Pre-production testing"
},
{
"name": "Production",
"bot_name": "FinTechBot",
"purpose": "Live environment"
}
],
"test_cases": [
{
"scenario": "User registration",
"steps": ["Send /start", "Receive registration link", "Link account"]
},
{
"scenario": "Transaction creation",
"input": "Mua cà phê 25000",
"expected_output": "✅ Ghi nhận chi tiêu 'Cà phê - 25,000đ' (Danh mục: Ăn uống)"
},
{
"scenario": "Statistics query",
"input": "/stats",
"expected_output": "Summary of expenses by category"
},
{
"scenario": "Error handling",
"input": "Invalid message format",
"expected_output": "❌ Không thể xử lý. Vui lòng thử lại."
}
]
},
"monitoring": {
"metrics": [
"Messages processed per minute",
"AI processing latency",
"Transaction creation success rate",
"Webhook response time",
"Active users count"
],
"alerts": [
{
"condition": "Webhook failures > 5% in 5 minutes",
"action": "Send alert to DevOps"
},
{
"condition": "AI API response time > 3 seconds",
"action": "Log warning"
}
]
}
}
