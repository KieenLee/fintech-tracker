using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using fintechtracker_backend.DTOs;
using fintechtracker_backend.Repositories;
using System.Security.Claims;

namespace fintechtracker_backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class CategoryController : ControllerBase
    {
        private readonly ICategoryRepository _categoryRepository;

        public CategoryController(ICategoryRepository categoryRepository)
        {
            _categoryRepository = categoryRepository;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<CategoryDto>>> GetCategories()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!int.TryParse(userIdClaim, out int userId))
            {
                return Unauthorized(new { message = "Invalid user authentication" });
            }

            try
            {
                var categories = await _categoryRepository.GetUserCategoriesAsync(userId);
                return Ok(categories);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error retrieving categories", error = ex.Message });
            }
        }
    }
}