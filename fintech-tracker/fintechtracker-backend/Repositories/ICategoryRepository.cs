using fintechtracker_backend.DTOs;

namespace fintechtracker_backend.Repositories
{
    public interface ICategoryRepository
    {
        Task<IEnumerable<CategoryDto>> GetUserCategoriesAsync(int userId);
    }
}