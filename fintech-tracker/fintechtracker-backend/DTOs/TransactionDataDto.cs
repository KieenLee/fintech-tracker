using System.Text.Json.Serialization;

namespace fintechtracker_backend.DTOs
{
    public class TransactionDataDto
    {
        [JsonPropertyName("amount")]
        public decimal Amount { get; set; }

        [JsonPropertyName("category")]
        public string Category { get; set; } = string.Empty;

        [JsonPropertyName("type")]
        [JsonConverter(typeof(JsonStringEnumConverter))]
        public TransactionType Type { get; set; }

        [JsonPropertyName("description")]
        public string Description { get; set; } = string.Empty;
    }

    public enum TransactionType
    {
        [JsonPropertyName("income")]
        Income,

        [JsonPropertyName("expense")]
        Expense
    }
}