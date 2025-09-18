var budget = new Budget
{
    UserId = userId,
    CategoryId = dto.CategoryId,
    Amount = dto.Amount,
    StartDate = DateOnly.FromDateTime(dto.StartDate),
    EndDate = DateOnly.FromDateTime(dto.EndDate),
    IsRecurring = dto.IsRecurring,
    NotificationThreshold = dto.NotificationThreshold,
    CreatedAt = DateTime.UtcNow,
    UpdatedAt = DateTime.UtcNow
};

budget.StartDate = DateOnly.FromDateTime(dto.StartDate);
budget.EndDate = DateOnly.FromDateTime(dto.EndDate);