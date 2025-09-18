using fintechtracker_backend.DTOs;

namespace fintechtracker_backend.Repositories
{
    public interface IAccountRepository
    {
        Task<IEnumerable<AccountDto>> GetUserAccountsAsync(int userId);
        Task<AccountDto?> GetAccountByIdAsync(int accountId, int userId);
    }
}