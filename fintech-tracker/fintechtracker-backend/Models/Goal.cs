using System;
using System.Collections.Generic;

namespace fintechtracker_backend.Models;

public partial class Goal
{
    public int GoalId { get; set; }

    public int UserId { get; set; }

    public string GoalName { get; set; } = null!;

    public decimal TargetAmount { get; set; }

    public decimal CurrentAmount { get; set; }

    public DateOnly TargetDate { get; set; }

    public string? Description { get; set; }

    public string? GoalColor { get; set; }

    public bool? IsActive { get; set; }

    public DateTime? CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public virtual User User { get; set; } = null!;
}
