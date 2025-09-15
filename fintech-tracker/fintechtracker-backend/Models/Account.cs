using System;
using System.Collections.Generic;

namespace fintechtracker_backend.Models;

public partial class Account
{
    public int AccountId { get; set; }

    public int UserId { get; set; }

    public string AccountName { get; set; } = null!;

    public string AccountType { get; set; } = null!;

    public decimal CurrentBalance { get; set; }

    public string? CurrencyCode { get; set; }

    public string? AccountColor { get; set; }

    public bool? IsActive { get; set; }

    public DateTime? CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public virtual ICollection<Transaction> Transactions { get; set; } = new List<Transaction>();

    public virtual User User { get; set; } = null!;
}
