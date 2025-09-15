using System;
using System.Collections.Generic;

namespace fintechtracker_backend.Models;

public partial class Transaction
{
    public long TransactionId { get; set; }

    public int UserId { get; set; }

    public int AccountId { get; set; }

    public int? CategoryId { get; set; }

    public decimal Amount { get; set; }

    public string TransactionType { get; set; } = null!;

    public string? Description { get; set; }

    public DateTime TransactionDate { get; set; }

    public string? Location { get; set; }

    public decimal? Latitude { get; set; }

    public decimal? Longitude { get; set; }

    public string? ReceiptImageUrl { get; set; }

    public bool? IsRecurring { get; set; }

    public DateTime? CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public virtual Account Account { get; set; } = null!;

    public virtual Category? Category { get; set; }

    public virtual User User { get; set; } = null!;
}
