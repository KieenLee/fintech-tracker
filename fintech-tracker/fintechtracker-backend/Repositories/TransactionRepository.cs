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
                .Include(t => t.Account)
                .Include(t => t.Category)
                .Where(t => t.Account.UserId == userId);

            // Apply filters
            if (!string.IsNullOrEmpty(filter.SearchTerm))
            {
                query = query.Where(t => t.Description != null && t.Description.Contains(filter.SearchTerm));
            }

            if (!string.IsNullOrEmpty(filter.Category) && filter.Category != "all")
            {
                query = query.Where(t => t.Category != null &&
                    t.Category.CategoryName.ToLower() == filter.Category.ToLower());
            }

            if (!string.IsNullOrEmpty(filter.Account) && filter.Account != "all")
            {
                query = query.Where(t => t.Account.AccountName.ToLower().Contains(filter.Account.ToLower()));
            }

            if (filter.FromDate.HasValue)
            {
                query = query.Where(t => t.TransactionDate >= filter.FromDate.Value);
            }

            if (filter.ToDate.HasValue)
            {
                query = query.Where(t => t.TransactionDate <= filter.ToDate.Value);
            }

            if (!string.IsNullOrEmpty(filter.TransactionType) && filter.TransactionType != "all")
            {
                query = query.Where(t => t.TransactionType.ToLower() == filter.TransactionType.ToLower());
            }

            var transactions = await query
                .OrderByDescending(t => t.TransactionDate)
                .Skip((filter.Page - 1) * filter.PageSize)
                .Take(filter.PageSize)
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
                .ToListAsync();

            var totalCount = await GetTotalCountAsync(userId, filter);

            // Build and return response DTO (populate commonly expected paging fields)
            return new TransactionResponseDto
            {
                Transactions = transactions,
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

            // Apply same filters as GetUserTransactionsAsync
            if (!string.IsNullOrEmpty(filter.SearchTerm))
            {
                query = query.Where(t => t.Description != null && t.Description.Contains(filter.SearchTerm));
            }

            if (!string.IsNullOrEmpty(filter.Category) && filter.Category != "all")
            {
                query = query.Where(t => t.Category != null &&
                    t.Category.CategoryName.ToLower() == filter.Category.ToLower());
            }

            if (!string.IsNullOrEmpty(filter.Account) && filter.Account != "all")
            {
                query = query.Where(t => t.Account.AccountName.ToLower().Contains(filter.Account.ToLower()));
            }

            if (filter.FromDate.HasValue)
            {
                query = query.Where(t => t.TransactionDate >= filter.FromDate.Value);
            }

            if (filter.ToDate.HasValue)
            {
                query = query.Where(t => t.TransactionDate <= filter.ToDate.Value);
            }

            if (!string.IsNullOrEmpty(filter.TransactionType) && filter.TransactionType != "all")
            {
                query = query.Where(t => t.TransactionType.ToLower() == filter.TransactionType.ToLower());
            }

            return await query.CountAsync();
        }
    }
}