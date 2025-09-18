using fintechtracker_backend.Data;
using fintechtracker_backend.DTOs;
using Microsoft.EntityFrameworkCore;

namespace fintechtracker_backend.Repositories
{
    public class AccountRepository : IAccountRepository
    {
        private readonly FinTechDbContext _context;

        public AccountRepository(FinTechDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<AccountDto>> GetUserAccountsAsync(int userId)
        {
            return await _context.Accounts
                .Where(a => a.UserId == userId && a.IsActive == true)
                .OrderBy(a => a.AccountName)
                .Select(a => new AccountDto
                {
                    AccountId = a.AccountId,
                    AccountName = a.AccountName,
                    AccountType = a.AccountType,
                    CurrentBalance = a.CurrentBalance,
                    CurrencyCode = a.CurrencyCode ?? string.Empty,
                    AccountColor = a.AccountColor
                })
                .ToListAsync();
        }

        public async Task<AccountDto?> GetAccountByIdAsync(int accountId, int userId)
        {
            return await _context.Accounts
                .Where(a => a.AccountId == accountId && a.UserId == userId)
                .Select(a => new AccountDto
                {
                    AccountId = a.AccountId,
                    AccountName = a.AccountName,
                    AccountType = a.AccountType,
                    CurrentBalance = a.CurrentBalance,
                    CurrencyCode = a.CurrencyCode ?? string.Empty,
                    AccountColor = a.AccountColor
                })
                .FirstOrDefaultAsync();
        }
    }
}