using fintechtracker_backend.Data;
using fintechtracker_backend.DTOs;
using fintechtracker_backend.Models;
using Microsoft.EntityFrameworkCore;

namespace fintechtracker_backend.Repositories
{
    public class TransactionRepository : ITransactionRepository
    {
        private readonly FinTechDbContext _context;

        public TransactionRepository(FinTechDbContext context)
        {
            _context = context;
        }

        public async Task<TransactionResponseDto> GetUserTransactionsAsync(int userId, TransactionFilterDto filter)
        {
            var query = _context.Transactions
                .Include(t => t.Category)
                .Include(t => t.Account)
                .Where(t => t.UserId == userId);

            // FIXED: Apply filters using correct properties from TransactionFilterDto
            query = ApplyFilters(query, filter);

            // FIXED: Apply sorting using SortBy and SortOrder from DTO
            query = ApplySorting(query, filter);

            // Get total count before pagination
            var totalCount = await query.CountAsync();

            // Apply pagination
            var transactions = await query
                .Skip((filter.Page - 1) * filter.PageSize)
                .Take(filter.PageSize)
                .ToListAsync();

            // Map to DTOs
            var transactionDtos = transactions.Select(t => new TransactionDto
            {
                TransactionId = t.TransactionId,
                UserId = t.UserId,
                AccountId = t.AccountId,
                AccountName = t.Account.AccountName,
                CategoryId = t.CategoryId,
                CategoryName = t.Category?.CategoryName ?? "Uncategorized",
                Amount = t.Amount,
                TransactionType = t.TransactionType,
                TransactionDate = t.TransactionDate,
                Description = t.Description,
                Location = t.Location,
                CreatedAt = t.CreatedAt ?? DateTime.UtcNow,
                UpdatedAt = t.UpdatedAt ?? DateTime.UtcNow
            }).ToList();

            return new TransactionResponseDto
            {
                Transactions = transactionDtos,
                TotalCount = totalCount,
                Page = filter.Page,
                PageSize = filter.PageSize,
                TotalPages = (int)Math.Ceiling((double)totalCount / filter.PageSize)
            };
        }

        public async Task<TransactionDto?> GetTransactionByIdAsync(long transactionId, int userId)
        {
            var transaction = await _context.Transactions
                .Include(t => t.Account)
                .Include(t => t.Category)
                .Where(t => t.TransactionId == transactionId && t.Account.UserId == userId)
                .Select(t => new TransactionDto
                {
                    TransactionId = t.TransactionId,
                    UserId = t.UserId,
                    AccountId = t.AccountId,
                    AccountName = t.Account.AccountName,
                    CategoryId = t.CategoryId,
                    CategoryName = t.Category != null ? t.Category.CategoryName : null,
                    Amount = t.Amount,
                    TransactionType = t.TransactionType,
                    Description = t.Description,
                    TransactionDate = t.TransactionDate,
                    Location = t.Location,
                    CreatedAt = t.CreatedAt,
                    UpdatedAt = t.UpdatedAt
                })
                .FirstOrDefaultAsync();

            return transaction;
        }

        public async Task<TransactionDto> CreateTransactionAsync(int userId, CreateTransactionDto dto)
        {
            // Validate account belongs to user
            var account = await _context.Accounts
                .FirstOrDefaultAsync(a => a.AccountId == dto.AccountId && a.UserId == userId);

            if (account == null)
                throw new ArgumentException("Account not found or doesn't belong to user");

            var transaction = new Transaction
            {
                UserId = userId,
                AccountId = dto.AccountId,
                CategoryId = dto.CategoryId,
                Amount = dto.Amount,
                TransactionType = dto.TransactionType,
                Description = dto.Description,
                TransactionDate = dto.TransactionDate,
                Location = dto.Location,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.Transactions.Add(transaction);

            // Update account balance
            if (dto.TransactionType.ToLower() == "income")
            {
                account.CurrentBalance += dto.Amount;
            }
            else if (dto.TransactionType.ToLower() == "expense")
            {
                account.CurrentBalance -= dto.Amount;
            }

            await _context.SaveChangesAsync();

            var created = await GetTransactionByIdAsync(transaction.TransactionId, userId);
            if (created == null)
                throw new InvalidOperationException("Transaction was not found after creation.");
            return created;
        }

        public async Task<TransactionDto?> UpdateTransactionAsync(long transactionId, int userId, UpdateTransactionDto dto)
        {
            var existingTransaction = await _context.Transactions
                .Include(t => t.Account)
                .FirstOrDefaultAsync(t => t.TransactionId == transactionId && t.Account.UserId == userId);

            if (existingTransaction == null)
                return null;

            // Revert old balance change
            if (existingTransaction.TransactionType.ToLower() == "income")
            {
                existingTransaction.Account.CurrentBalance -= existingTransaction.Amount;
            }
            else if (existingTransaction.TransactionType.ToLower() == "expense")
            {
                existingTransaction.Account.CurrentBalance += existingTransaction.Amount;
            }

            // Update transaction
            existingTransaction.AccountId = dto.AccountId;
            existingTransaction.CategoryId = dto.CategoryId;
            existingTransaction.Amount = dto.Amount;
            existingTransaction.TransactionType = dto.TransactionType;
            existingTransaction.Description = dto.Description;
            existingTransaction.TransactionDate = dto.TransactionDate;
            existingTransaction.Location = dto.Location;
            existingTransaction.UpdatedAt = DateTime.UtcNow;

            // Apply new balance change
            var newAccount = await _context.Accounts
                .FirstOrDefaultAsync(a => a.AccountId == dto.AccountId && a.UserId == userId);

            if (newAccount != null)
            {
                if (dto.TransactionType.ToLower() == "income")
                {
                    newAccount.CurrentBalance += dto.Amount;
                }
                else if (dto.TransactionType.ToLower() == "expense")
                {
                    newAccount.CurrentBalance -= dto.Amount;
                }
            }

            await _context.SaveChangesAsync();

            return await GetTransactionByIdAsync(transactionId, userId);
        }

        public async Task<bool> DeleteTransactionAsync(long transactionId, int userId)
        {
            var transaction = await _context.Transactions
                .Include(t => t.Account)
                .FirstOrDefaultAsync(t => t.TransactionId == transactionId && t.Account.UserId == userId);

            if (transaction == null)
                return false;

            // Revert balance change
            if (transaction.TransactionType.ToLower() == "income")
            {
                transaction.Account.CurrentBalance -= transaction.Amount;
            }
            else if (transaction.TransactionType.ToLower() == "expense")
            {
                transaction.Account.CurrentBalance += transaction.Amount;
            }

            _context.Transactions.Remove(transaction);
            await _context.SaveChangesAsync();

            return true;
        }

        public async Task<int> GetTotalCountAsync(int userId, TransactionFilterDto filter)
        {
            var query = _context.Transactions
                .Include(t => t.Account)
                .Include(t => t.Category)
                .Where(t => t.Account.UserId == userId);

            // FIXED: Apply same filters as GetUserTransactionsAsync method
            query = ApplyFilters(query, filter);

            return await query.CountAsync();
        }

        // FIXED: Helper method using correct TransactionFilterDto properties
        private IQueryable<Transaction> ApplyFilters(IQueryable<Transaction> query, TransactionFilterDto filter)
        {
            // Filter by CategoryId (int?)
            if (filter.CategoryId.HasValue)
            {
                query = query.Where(t => t.CategoryId == filter.CategoryId.Value);
            }

            // Filter by AccountId (int?)
            if (filter.AccountId.HasValue)
            {
                query = query.Where(t => t.AccountId == filter.AccountId.Value);
            }

            // Filter by FromDate
            if (filter.FromDate.HasValue)
            {
                query = query.Where(t => t.TransactionDate >= filter.FromDate.Value);
            }

            // Filter by ToDate
            if (filter.ToDate.HasValue)
            {
                query = query.Where(t => t.TransactionDate <= filter.ToDate.Value);
            }

            // Filter by TransactionType
            if (!string.IsNullOrEmpty(filter.TransactionType))
            {
                query = query.Where(t => t.TransactionType.ToLower() == filter.TransactionType.ToLower());
            }

            // Filter by MinAmount
            if (filter.MinAmount.HasValue)
            {
                query = query.Where(t => t.Amount >= filter.MinAmount.Value);
            }

            // Filter by MaxAmount
            if (filter.MaxAmount.HasValue)
            {
                query = query.Where(t => t.Amount <= filter.MaxAmount.Value);
            }

            return query;
        }

        // NEW: Helper method for sorting
        private IQueryable<Transaction> ApplySorting(IQueryable<Transaction> query, TransactionFilterDto filter)
        {
            var sortBy = filter.SortBy?.ToLower() ?? "transactiondate";
            var sortOrder = filter.SortOrder?.ToLower() ?? "desc";

            switch (sortBy)
            {
                case "amount":
                    query = sortOrder == "asc"
                        ? query.OrderBy(t => t.Amount)
                        : query.OrderByDescending(t => t.Amount);
                    break;
                case "transactiontype":
                    query = sortOrder == "asc"
                        ? query.OrderBy(t => t.TransactionType)
                        : query.OrderByDescending(t => t.TransactionType);
                    break;
                case "category":
                    query = sortOrder == "asc"
                        ? query.OrderBy(t => t.Category != null ? t.Category.CategoryName : "")
                        : query.OrderByDescending(t => t.Category != null ? t.Category.CategoryName : "");
                    break;
                case "account":
                    query = sortOrder == "asc"
                        ? query.OrderBy(t => t.Account.AccountName)
                        : query.OrderByDescending(t => t.Account.AccountName);
                    break;
                case "description":
                    query = sortOrder == "asc"
                        ? query.OrderBy(t => t.Description ?? "")
                        : query.OrderByDescending(t => t.Description ?? "");
                    break;
                default: // transactiondate
                    query = sortOrder == "asc"
                        ? query.OrderBy(t => t.TransactionDate)
                        : query.OrderByDescending(t => t.TransactionDate);
                    break;
            }

            return query;
        }
    }
}