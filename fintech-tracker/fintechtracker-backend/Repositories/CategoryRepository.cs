using fintechtracker_backend.Data;
using fintechtracker_backend.DTOs;
using Microsoft.EntityFrameworkCore;

namespace fintechtracker_backend.Repositories
{
    public class CategoryRepository : ICategoryRepository
    {
        private readonly FinTechDbContext _context;

        public CategoryRepository(FinTechDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<CategoryDto>> GetUserCategoriesAsync(int userId)
        {
            // Lấy cả categories của user và default categories (user_id = NULL)
            return await _context.Categories
                .Where(c => (c.UserId == userId || c.UserId == null) && c.IsActive == true)
                .OrderBy(c => c.TransactionType)
                .ThenBy(c => c.CategoryName)
                .Select(c => new CategoryDto
                {
                    CategoryId = c.CategoryId,
                    CategoryName = c.CategoryName,
                    TransactionType = c.TransactionType,
                    CategoryIcon = c.CategoryIcon,
                    CategoryColor = c.CategoryColor
                })
                .ToListAsync();
        }
    }
}