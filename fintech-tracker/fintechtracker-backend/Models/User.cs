using System;
using System.Collections.Generic;

namespace fintechtracker_backend.Models;

public partial class User
{
    public int UserId { get; set; }
    public string Username { get; set; } = null!;
    public string Email { get; set; } = null!;
    public string PasswordHash { get; set; } = null!;
    public string Role { get; set; } = null!;
    public string? TelegramUserId { get; set; }
    public string? TelegramUsername { get; set; }
    public string? TelegramFirstName { get; set; }
    public string? TelegramLastName { get; set; }
    public string? TelegramPhotoUrl { get; set; }
    public DateTime? TelegramLinkedAt { get; set; }
    public bool? IsActive { get; set; }
    public DateTime? CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public virtual ICollection<Account> Accounts { get; set; } = new List<Account>();
    public virtual ICollection<Budget> Budgets { get; set; } = new List<Budget>();
    public virtual ICollection<Category> Categories { get; set; } = new List<Category>();
    public virtual ICollection<Goal> Goals { get; set; } = new List<Goal>();
    public virtual ICollection<Log> Logs { get; set; } = new List<Log>();
    public virtual ICollection<Notification> Notifications { get; set; } = new List<Notification>();
    public virtual ICollection<Transaction> Transactions { get; set; } = new List<Transaction>();
    public virtual Userprofile? Userprofile { get; set; }
}
