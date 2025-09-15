using System;
using System.Collections.Generic;

namespace fintechtracker_backend.Models;

public partial class Category
{
    public int CategoryId { get; set; }

    public int? UserId { get; set; }

    public int? ParentCategoryId { get; set; }

    public string CategoryName { get; set; } = null!;

    public string? CategoryIcon { get; set; }

    public string? CategoryColor { get; set; }

    public string TransactionType { get; set; } = null!;

    public bool? IsDefault { get; set; }

    public bool? IsActive { get; set; }

    public DateTime? CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public virtual ICollection<Budget> Budgets { get; set; } = new List<Budget>();

    public virtual ICollection<Category> InverseParentCategory { get; set; } = new List<Category>();

    public virtual Category? ParentCategory { get; set; }

    public virtual ICollection<Transaction> Transactions { get; set; } = new List<Transaction>();

    public virtual User? User { get; set; }
}
